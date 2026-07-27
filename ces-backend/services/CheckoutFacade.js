const crypto = require('crypto');
const {
  validateTicketCounts,
  computeLineItems,
  normalizeSeatIds,
  assignTicketTypesToSeats,
  isValidEmail,
} = require('./checkoutCore');
const { PaymentProcessorFactory } = require('./payment/PaymentProcessorFactory');
const { sendOrderConfirmationEmail } = require('../email');

function createConfirmationNumber() {
  return `CES-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
}

function mapOrderHeader(row) {
  return {
    bookingId: row.booking_id,
    confirmationNumber: row.confirmation_number,
    status: row.status,
    bookingDate: row.booking_date,
    createdAt: row.created_at,
    totalAmount: Number(row.total_amount),
    paymentReference: row.payment_reference,
    paymentMethod: row.payment_method,
    paymentStatus: row.payment_status,
    cardLastFour: row.card_last_four,
    confirmationEmail: row.confirmation_email,
    movieTitle: row.movie_title,
    showDate: row.show_date,
    showTime: row.show_time,
    showroomName: row.showroom_name,
  };
}

class CheckoutFacade {
  constructor(pool) {
    this.pool = pool;
  }

  async placeOrder({ userId, showId, seatIds, ticketCounts, confirmationEmail, payment, lockSessionId }) {
    const normalizedShowId = Number(showId);
    if (!Number.isInteger(normalizedShowId) || normalizedShowId <= 0) {
      throw Object.assign(new Error('A valid showtime is required.'), { status: 400 });
    }

    const seatCheck = normalizeSeatIds(seatIds);
    if (seatCheck.error) throw Object.assign(new Error(seatCheck.error), { status: 400 });

    const ticketCheck = validateTicketCounts(ticketCounts);
    if (ticketCheck.error) throw Object.assign(new Error(ticketCheck.error), { status: 400 });
    if (seatCheck.seatIds.length !== ticketCheck.totalTickets) {
      throw Object.assign(new Error('The number of selected seats must match the number of tickets.'), { status: 400 });
    }

    const normalizedEmail = String(confirmationEmail || '').trim();
    if (!isValidEmail(normalizedEmail)) {
      throw Object.assign(new Error('Please enter a valid confirmation email address.'), { status: 400 });
    }

    const pricing = computeLineItems(ticketCheck.counts);
    const client = await this.pool.connect();
    let committedOrder = null;

    try {
      await client.query('BEGIN');
      await client.query('DELETE FROM seat_locks WHERE expires_at <= CURRENT_TIMESTAMP');

      const showResult = await client.query(
        `SELECT s.show_id, s.showroom_id, s.show_date, s.show_time,
                r.showroom_name, m.title AS movie_title
           FROM shows s
           JOIN movies m ON m.movie_id = s.movie_id
           JOIN showrooms r ON r.showroom_id = s.showroom_id
          WHERE s.show_id = $1
            AND (s.show_date + s.show_time) > CURRENT_TIMESTAMP
          FOR UPDATE OF s`,
        [normalizedShowId]
      );
      if (showResult.rows.length === 0) {
        throw Object.assign(new Error('This showtime does not exist or has already passed.'), { status: 409 });
      }
      const show = showResult.rows[0];

      const seatResult = await client.query(
        `SELECT seat_id, row_number, seat_number
           FROM seats
          WHERE showroom_id = $1
            AND seat_id = ANY($2::int[])
          ORDER BY row_number, seat_number
          FOR UPDATE`,
        [show.showroom_id, seatCheck.seatIds]
      );
      if (seatResult.rows.length !== seatCheck.seatIds.length) {
        throw Object.assign(new Error('One or more selected seats do not belong to this showroom.'), { status: 400 });
      }

      const bookedResult = await client.query(
        `SELECT seat_id FROM tickets
          WHERE show_id = $1 AND seat_id = ANY($2::int[])`,
        [normalizedShowId, seatCheck.seatIds]
      );
      if (bookedResult.rows.length > 0) {
        throw Object.assign(new Error('One or more selected seats were just booked by another customer.'), {
          status: 409,
          bookedSeatIds: bookedResult.rows.map((row) => row.seat_id),
        });
      }

      const lockResult = await client.query(
        `SELECT seat_id, session_id
           FROM seat_locks
          WHERE show_id = $1
            AND seat_id = ANY($2::int[])
            AND expires_at > CURRENT_TIMESTAMP`,
        [normalizedShowId, seatCheck.seatIds]
      );
      const conflictingLocks = lockResult.rows.filter(
        (row) => !lockSessionId || row.session_id !== String(lockSessionId)
      );
      if (conflictingLocks.length > 0) {
        throw Object.assign(new Error('One or more selected seats are being held by another customer.'), {
          status: 409,
          lockedSeatIds: conflictingLocks.map((row) => row.seat_id),
        });
      }

      const processor = PaymentProcessorFactory.create(payment?.type, client);
      const paymentResult = await processor.process({
        userId,
        amountCents: pricing.totalCents,
        cardId: payment?.cardId,
        paymentDetails: payment,
      });

      if (!paymentResult.approved) {
        throw Object.assign(new Error('Payment was declined.'), { status: 402 });
      }

      const confirmationNumber = createConfirmationNumber();
      const bookingResult = await client.query(
        `INSERT INTO bookings
           (user_id, total_amount, payment_reference, confirmation_email,
            confirmation_number, status, payment_method, payment_status,
            card_last_four)
         VALUES ($1, $2, $3, $4, $5, 'Confirmed', $6, 'Approved', $7)
         RETURNING booking_id, booking_date, created_at`,
        [
          userId,
          pricing.totalBeforeTax,
          paymentResult.paymentReference,
          normalizedEmail,
          confirmationNumber,
          paymentResult.paymentMethod,
          paymentResult.cardLastFour,
        ]
      );
      const booking = bookingResult.rows[0];

      const normalizedSeats = seatResult.rows.map((row) => ({
        seatId: row.seat_id,
        row: row.row_number,
        number: row.seat_number,
        label: `${row.row_number}${row.seat_number}`,
      }));
      const ticketAssignments = assignTicketTypesToSeats(normalizedSeats, ticketCheck.counts);

      for (const ticket of ticketAssignments) {
        await client.query(
          `INSERT INTO tickets
             (booking_id, show_id, seat_id, ticket_type, price)
           VALUES ($1, $2, $3, $4, $5)`,
          [booking.booking_id, normalizedShowId, ticket.seatId, ticket.ticketType, ticket.price]
        );
      }

      await client.query(
        `INSERT INTO payments
           (booking_id, amount, payment_reference, payment_method,
            card_last_four, status)
         VALUES ($1, $2, $3, $4, $5, 'Approved')`,
        [
          booking.booking_id,
          pricing.totalBeforeTax,
          paymentResult.paymentReference,
          paymentResult.paymentMethod,
          paymentResult.cardLastFour,
        ]
      );

      await client.query(
        `UPDATE shows
            SET available_seats = GREATEST(0,
              (SELECT COUNT(*) FROM seats WHERE showroom_id = $1) -
              (SELECT COUNT(*) FROM tickets WHERE show_id = $2))
          WHERE show_id = $2`,
        [show.showroom_id, normalizedShowId]
      );

      if (lockSessionId) {
        await client.query(
          `DELETE FROM seat_locks
            WHERE show_id = $1 AND session_id = $2`,
          [normalizedShowId, String(lockSessionId)]
        );
      } else {
        await client.query(
          `DELETE FROM seat_locks
            WHERE show_id = $1 AND seat_id = ANY($2::int[])`,
          [normalizedShowId, seatCheck.seatIds]
        );
      }

      await client.query('COMMIT');

      committedOrder = {
        bookingId: booking.booking_id,
        confirmationNumber,
        status: 'Confirmed',
        bookingDate: booking.booking_date,
        createdAt: booking.created_at,
        movieTitle: show.movie_title,
        showDate: show.show_date,
        showTime: show.show_time,
        showroomName: show.showroom_name,
        confirmationEmail: normalizedEmail,
        paymentReference: paymentResult.paymentReference,
        paymentMethod: paymentResult.paymentMethod,
        paymentStatus: 'Approved',
        cardLastFour: paymentResult.cardLastFour,
        tickets: ticketAssignments,
        lineItems: pricing.lineItems,
        totalTickets: ticketCheck.totalTickets,
        totalAmount: pricing.totalBeforeTax,
      };
    } catch (error) {
      await client.query('ROLLBACK');
      if (error.code === '23505') {
        throw Object.assign(new Error('One of the selected seats is no longer available.'), { status: 409 });
      }
      throw error;
    } finally {
      client.release();
    }

    let emailSent = false;
    let emailWarning = null;
    try {
      await sendOrderConfirmationEmail(committedOrder.confirmationEmail, committedOrder);
      emailSent = true;
    } catch (error) {
      console.error('Order confirmation email error:', error.message);
      emailWarning = 'Your booking was confirmed, but the confirmation email could not be sent.';
    }

    return { ...committedOrder, emailSent, emailWarning };
  }

  async listOrders(userId) {
    const result = await this.pool.query(
      `SELECT b.booking_id, b.confirmation_number, b.status, b.booking_date,
              b.created_at, b.total_amount, b.payment_reference,
              b.payment_method, b.payment_status, b.card_last_four,
              b.confirmation_email,
              MIN(m.title) AS movie_title,
              MIN(s.show_date) AS show_date,
              MIN(s.show_time) AS show_time,
              MIN(r.showroom_name) AS showroom_name,
              COUNT(t.ticket_id)::int AS ticket_count,
              STRING_AGG(se.row_number || se.seat_number, ', ' ORDER BY se.row_number, se.seat_number) AS seat_labels
         FROM bookings b
         JOIN tickets t ON t.booking_id = b.booking_id
         JOIN shows s ON s.show_id = t.show_id
         JOIN movies m ON m.movie_id = s.movie_id
         JOIN showrooms r ON r.showroom_id = s.showroom_id
         JOIN seats se ON se.seat_id = t.seat_id
        WHERE b.user_id = $1
          AND b.confirmation_number IS NOT NULL
        GROUP BY b.booking_id
        ORDER BY b.created_at DESC`,
      [userId]
    );

    return result.rows.map((row) => ({
      ...mapOrderHeader(row),
      ticketCount: row.ticket_count,
      seatLabels: row.seat_labels,
    }));
  }

  async getOrder(userId, bookingId) {
    const headerResult = await this.pool.query(
      `SELECT b.booking_id, b.confirmation_number, b.status, b.booking_date,
              b.created_at, b.total_amount, b.payment_reference,
              b.payment_method, b.payment_status, b.card_last_four,
              b.confirmation_email,
              m.title AS movie_title, s.show_date, s.show_time,
              r.showroom_name
         FROM bookings b
         JOIN tickets t ON t.booking_id = b.booking_id
         JOIN shows s ON s.show_id = t.show_id
         JOIN movies m ON m.movie_id = s.movie_id
         JOIN showrooms r ON r.showroom_id = s.showroom_id
        WHERE b.booking_id = $1 AND b.user_id = $2
          AND b.confirmation_number IS NOT NULL
        LIMIT 1`,
      [bookingId, userId]
    );
    if (headerResult.rows.length === 0) return null;

    const ticketResult = await this.pool.query(
      `SELECT t.ticket_id, t.ticket_type, t.price,
              se.seat_id, se.row_number, se.seat_number
         FROM tickets t
         JOIN seats se ON se.seat_id = t.seat_id
        WHERE t.booking_id = $1
        ORDER BY se.row_number, se.seat_number`,
      [bookingId]
    );

    return {
      ...mapOrderHeader(headerResult.rows[0]),
      tickets: ticketResult.rows.map((row) => ({
        ticketId: row.ticket_id,
        ticketType: row.ticket_type,
        price: Number(row.price),
        seatId: row.seat_id,
        row: row.row_number,
        number: row.seat_number,
        label: `${row.row_number}${row.seat_number}`,
      })),
    };
  }
}

module.exports = { CheckoutFacade };
