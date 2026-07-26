const express = require('express');
const { authenticate, requireCustomer } = require('./middleware');


//source of truth for ticket pricing until/unless this moves into the DB.
const TICKET_PRICES = {
  Adult: 12.5,
  Senior: 9.5,
  Child: 8.5,
};


const TICKET_TYPES = Object.keys(TICKET_PRICES);

function validateTicketCounts(ticketCounts) {
  if (!ticketCounts || typeof ticketCounts !== 'object') {
    return { error: 'Ticket counts are required.' };
  }

  const counts = {};
  let totalTickets = 0;

  for (const type of TICKET_TYPES) {
    const raw = ticketCounts[type];
    const n = raw === undefined ? 0 : Number(raw);
    if (!Number.isInteger(n) || n < 0) {
      return { error: `Invalid ticket count for type "${type}".` };
    }
    counts[type] = n;
    totalTickets += n;
  }
  //case for negative or zero tickets
  if (totalTickets <= 0) {
    return { error: 'At least one ticket must be selected.' };
  }

  return { counts, totalTickets };
}

function computeLineItems(counts) {
  const lineItems = [];
  let totalBeforeTax = 0;

  for (const [type, count] of Object.entries(counts)) {
    if (count <= 0) continue;
    const pricePerTicket = TICKET_PRICES[type];
    const subtotal = Number((pricePerTicket * count).toFixed(2));
    totalBeforeTax += subtotal;
    lineItems.push({
      ticketType: type,
      quantity: count,
      pricePerTicket,
      subtotal,
    });
  }

  return {
    lineItems,
    totalBeforeTax: Number(totalBeforeTax.toFixed(2)),
  };
}

module.exports = function createCheckoutRoutes(pool) {
  const router = express.Router();
  router.use(authenticate, requireCustomer);

  // Frontend part: call this when the user clicks "Proceed to Checkout."
  // ticketCounts keys must be exactly "Adult" / "Senior" / "Child" with this
  router.post('/summary', async (req, res) => {
    const { showId, seatIds, ticketCounts } = req.body;

    if (!showId) {
      return res.status(400).json({ error: 'showId is required.' });
    }
    if (!Array.isArray(seatIds) || seatIds.length === 0) {
      return res.status(400).json({ error: 'At least one seat must be selected.' });
    }

    const ticketCheck = validateTicketCounts(ticketCounts);
    if (ticketCheck.error) {
      return res.status(400).json({ error: ticketCheck.error });
    }

    if (seatIds.length !== ticketCheck.totalTickets) {
      return res.status(400).json({
        error: `Selected seat count (${seatIds.length}) must match total ticket count (${ticketCheck.totalTickets}).`,
      });
    }

    try {
      const showResult = await pool.query(
        `SELECT s.show_id, s.showroom_id, s.show_date, s.show_time,
                r.showroom_name, m.title AS movie_title
           FROM shows s
           LEFT JOIN showrooms r ON r.showroom_id = s.showroom_id
           LEFT JOIN movies m ON m.movie_id = s.movie_id
          WHERE s.show_id = $1`,
        [showId]
      );
      if (showResult.rows.length === 0) {
        return res.status(404).json({ error: 'Show not found.' });
      }
      const show = showResult.rows[0];

      const seatResult = await pool.query(
        `SELECT seat_id, row_number, seat_number
           FROM seats
          WHERE showroom_id = $1 AND seat_id = ANY($2::int[])`,
        [show.showroom_id, seatIds]
      );
      if (seatResult.rows.length !== seatIds.length) {
        return res.status(400).json({
          error: 'One or more selected seats do not belong to this showroom.',
        });
      }

      const bookedResult = await pool.query(
        `SELECT seat_id FROM tickets
          WHERE show_id = $1 AND seat_id = ANY($2::int[])`,
        [showId, seatIds]
      );
      if (bookedResult.rows.length > 0) {
        return res.status(409).json({
          error: 'One or more selected seats have already been booked.',
          bookedSeatIds: bookedResult.rows.map((r) => r.seat_id),
        });
      }

      const seats = seatResult.rows.map((seat) => ({
        seatId: seat.seat_id,
        row: seat.row_number,
        number: seat.seat_number,
        label: `${seat.row_number}${seat.seat_number}`,
      }));

      const { lineItems, totalBeforeTax } = computeLineItems(ticketCheck.counts);

      // this endpoint does not write to bookings/tickets and does NOT take payment. It only
      // returns what the Order Summary page displays. Wire up the real
      // booking creation + payment separately, using this data as input for it!
      res.json({
        movieTitle: show.movie_title,
        showDate: show.show_date,
        showTime: show.show_time,
        showroomName: show.showroom_name,
        seats,
        ticketBreakdown: lineItems,
        totalBeforeTax,
        readyForPaymentMockup: true,
      });
    } catch (error) {
      console.error('Checkout summary error:', error);
      res.status(500).json({ error: 'Could not build order summary.' });
    }
  });

  // frontend part: call this to pre-fill the "confirm your email" step.
  router.get('/email', async (req, res) => {
    try {
      const result = await pool.query(
        'SELECT email FROM users WHERE user_id = $1',
        [req.user.userId]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'User not found.' });
      }
      res.json({ email: result.rows[0].email });
    } catch (error) {
      console.error('Get checkout email error:', error);
      res.status(500).json({ error: 'Could not retrieve email.' });
    }
  });

  // call this after the user confirms/edits their email on the
  // checkout page. Does not touch the user's account email.
  router.put('/email', async (req, res) => {
    const { email } = req.body;
    const trimmed = String(email || '').trim();
    const basicEmailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!trimmed || !basicEmailPattern.test(trimmed)) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }

    res.json({
      message: 'Email confirmed for this checkout session.',
      email: trimmed,
    });
  });

  return router;
};