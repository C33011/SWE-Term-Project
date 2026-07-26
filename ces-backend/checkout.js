const express = require('express');
const { authenticate, requireCustomer } = require('./middleware');

// confirm once
const TICKET_PRICES = {
  Adult: 12.50,
  Senior: 9.50,
  Child: 8.50,
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
    const count = raw === undefined ? 0 : Number(raw);
    if (!Number.isInteger(count) || count < 0) {
      return { error: `Invalid ticket count for type "${type}".` };
    }
    counts[type] = count;
    totalTickets += count;
  }

  if (totalTickets <= 0) {
    return { error: 'At least one ticket must be selected.' };
  }

  return { counts, totalTickets };
}

function computeLineItems(counts) {
  const lineItems = [];
  let totalCents = 0;

  for (const [type, count] of Object.entries(counts)) {
    if (count <= 0) continue;

    const pricePerTicket = TICKET_PRICES[type];
    const priceCents = Math.round(pricePerTicket * 100);
    const subtotalCents = priceCents * count;
    totalCents += subtotalCents;

    lineItems.push({
      ticketType: type,
      quantity: count,
      pricePerTicket,
      subtotal: subtotalCents / 100,
    });
  }

  return {
    lineItems,
    totalBeforeTax: totalCents / 100,
  };
}

module.exports = function createCheckoutRoutes(pool) {
  const router = express.Router();

  // guest choose b4 login
  router.get('/prices', (req, res) => {
    res.json({ prices: TICKET_PRICES });
  });

  // beyond this needs auth.
  router.use(authenticate, requireCustomer);

  router.post('/summary', async (req, res) => {
    const { showId, seatIds, ticketCounts } = req.body;
    const normalizedShowId = Number(showId);

    if (!Number.isInteger(normalizedShowId) || normalizedShowId <= 0) {
      return res.status(400).json({ error: 'A valid showId is required.' });
    }

    if (!Array.isArray(seatIds) || seatIds.length === 0) {
      return res.status(400).json({ error: 'At least one seat must be selected.' });
    }

    const normalizedSeatIds = seatIds.map(Number);
    if (normalizedSeatIds.some((id) => !Number.isInteger(id) || id <= 0)) {
      return res.status(400).json({ error: 'One or more selected seat IDs are invalid.' });
    }

    if (new Set(normalizedSeatIds).size !== normalizedSeatIds.length) {
      return res.status(400).json({ error: 'The same seat cannot be selected more than once.' });
    }

    const ticketCheck = validateTicketCounts(ticketCounts);
    if (ticketCheck.error) {
      return res.status(400).json({ error: ticketCheck.error });
    }

    if (normalizedSeatIds.length !== ticketCheck.totalTickets) {
      return res.status(400).json({
        error: `Selected seat count (${normalizedSeatIds.length}) must match total ticket count (${ticketCheck.totalTickets}).`,
      });
    }

    try {
      const showResult = await pool.query(
        `SELECT s.show_id, s.showroom_id, s.show_date, s.show_time,
                (s.show_date + s.show_time) AS start_at,
                r.showroom_name, m.title AS movie_title
           FROM shows s
           JOIN showrooms r ON r.showroom_id = s.showroom_id
           JOIN movies m ON m.movie_id = s.movie_id
          WHERE s.show_id = $1`,
        [normalizedShowId]
      );

      if (showResult.rows.length === 0) {
        return res.status(404).json({ error: 'Show not found.' });
      }

      const show = showResult.rows[0];
      if (new Date(show.start_at).getTime() < Date.now()) {
        return res.status(409).json({ error: 'This showtime has already started or passed.' });
      }

      const seatResult = await pool.query(
        `SELECT seat_id, row_number, seat_number
           FROM seats
          WHERE showroom_id = $1 AND seat_id = ANY($2::int[])
          ORDER BY row_number, seat_number`,
        [show.showroom_id, normalizedSeatIds]
      );

      if (seatResult.rows.length !== normalizedSeatIds.length) {
        return res.status(400).json({
          error: 'One or more selected seats do not belong to this showroom.',
        });
      }

      const bookedResult = await pool.query(
        `SELECT seat_id
           FROM tickets
          WHERE show_id = $1 AND seat_id = ANY($2::int[])`,
        [normalizedShowId, normalizedSeatIds]
      );

      if (bookedResult.rows.length > 0) {
        return res.status(409).json({
          error: 'One or more selected seats have already been booked.',
          bookedSeatIds: bookedResult.rows.map((row) => row.seat_id),
        });
      }

      const seats = seatResult.rows.map((seat) => ({
        seatId: seat.seat_id,
        row: seat.row_number,
        number: seat.seat_number,
        label: `${seat.row_number}${seat.seat_number}`,
      }));

      const { lineItems, totalBeforeTax } = computeLineItems(ticketCheck.counts);

      res.json({
        showId: show.show_id,
        movieTitle: show.movie_title,
        showDate: show.show_date,
        showTime: show.show_time,
        showroomName: show.showroom_name,
        seats,
        ticketBreakdown: lineItems,
        totalTickets: ticketCheck.totalTickets,
        totalBeforeTax,
        readyForPaymentMockup: true,
      });
    } catch (error) {
      console.error('Checkout summary error:', error);
      res.status(500).json({ error: 'Could not build order summary.' });
    }
  });

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

  // Confirm this in test runs pls
  router.put('/email', async (req, res) => {
    const trimmed = String(req.body.email || '').trim();
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
