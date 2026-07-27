const express = require('express');

const LOCK_MINUTES = 5;

function validateSessionId(value) {
  const sessionId = String(value || '').trim();
  return /^[A-Za-z0-9_-]{16,100}$/.test(sessionId) ? sessionId : null;
}

module.exports = function createSeatLockRoutes(pool) {
  const router = express.Router();

  router.post('/sync', async (req, res) => {
    const showId = Number(req.body.showId);
    const seatIds = Array.isArray(req.body.seatIds) ? req.body.seatIds.map(Number) : [];
    const sessionId = validateSessionId(req.body.sessionId);

    if (!Number.isInteger(showId) || showId <= 0 || !sessionId) {
      return res.status(400).json({ error: 'Valid show and booking session values are required.' });
    }
    if (seatIds.some((id) => !Number.isInteger(id) || id <= 0) || new Set(seatIds).size !== seatIds.length) {
      return res.status(400).json({ error: 'Invalid seat selection.' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('DELETE FROM seat_locks WHERE expires_at <= CURRENT_TIMESTAMP');

      const showResult = await client.query(
        `SELECT showroom_id FROM shows
          WHERE show_id = $1 AND (show_date + show_time) > CURRENT_TIMESTAMP`,
        [showId]
      );
      if (showResult.rows.length === 0) {
        throw Object.assign(new Error('This showtime is unavailable.'), { status: 409 });
      }

      if (seatIds.length > 0) {
        const validSeats = await client.query(
          `SELECT seat_id FROM seats
            WHERE showroom_id = $1 AND seat_id = ANY($2::int[])`,
          [showResult.rows[0].showroom_id, seatIds]
        );
        if (validSeats.rows.length !== seatIds.length) {
          throw Object.assign(new Error('One or more seats do not belong to this showroom.'), { status: 400 });
        }

        const booked = await client.query(
          `SELECT seat_id FROM tickets
            WHERE show_id = $1 AND seat_id = ANY($2::int[])`,
          [showId, seatIds]
        );
        if (booked.rows.length > 0) {
          throw Object.assign(new Error('One or more selected seats are already booked.'), {
            status: 409,
            unavailableSeatIds: booked.rows.map((row) => row.seat_id),
          });
        }

        const otherLocks = await client.query(
          `SELECT seat_id FROM seat_locks
            WHERE show_id = $1
              AND seat_id = ANY($2::int[])
              AND session_id <> $3
              AND expires_at > CURRENT_TIMESTAMP`,
          [showId, seatIds, sessionId]
        );
        if (otherLocks.rows.length > 0) {
          throw Object.assign(new Error('One or more selected seats are being held by another customer.'), {
            status: 409,
            unavailableSeatIds: otherLocks.rows.map((row) => row.seat_id),
          });
        }
      }

      await client.query(
        'DELETE FROM seat_locks WHERE show_id = $1 AND session_id = $2',
        [showId, sessionId]
      );

      for (const seatId of seatIds) {
        await client.query(
          `INSERT INTO seat_locks (show_id, seat_id, session_id, expires_at)
           VALUES ($1, $2, $3, CURRENT_TIMESTAMP + INTERVAL '${LOCK_MINUTES} minutes')`,
          [showId, seatId, sessionId]
        );
      }

      await client.query('COMMIT');
      res.json({
        lockedSeatIds: seatIds,
        expiresInSeconds: LOCK_MINUTES * 60,
      });
    } catch (error) {
      await client.query('ROLLBACK');
      if (error.code === '23505') {
        return res.status(409).json({ error: 'A selected seat was just held by another customer.' });
      }
      res.status(error.status || 500).json({
        error: error.status ? error.message : 'Could not hold the selected seats.',
        unavailableSeatIds: error.unavailableSeatIds,
      });
    } finally {
      client.release();
    }
  });

  router.post('/release', async (req, res) => {
    const showId = Number(req.body.showId);
    const sessionId = validateSessionId(req.body.sessionId);
    if (!Number.isInteger(showId) || showId <= 0 || !sessionId) {
      return res.status(400).json({ error: 'Valid show and booking session values are required.' });
    }

    try {
      await pool.query(
        'DELETE FROM seat_locks WHERE show_id = $1 AND session_id = $2',
        [showId, sessionId]
      );
      res.json({ message: 'Seat hold released.' });
    } catch (error) {
      console.error('Release seat lock error:', error);
      res.status(500).json({ error: 'Could not release the seat hold.' });
    }
  });

  return router;
};
