const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080;
app.use(cors());
app.use(express.json());

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

const authRoutes = require('./auth');
const cardRoutes = require('./cards');
const { authenticate, requireAdmin, requireCustomer } = require('./middleware');
const { sendPromotionEmail } = require('./email');

app.use('/api/auth', authRoutes(pool));
app.use('/api/profile/cards', cardRoutes(pool));

app.get('/api/admin/ping', authenticate, requireAdmin, (req, res) => {
  res.json({ message: 'Admin access confirmed' });
});

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.get('/api/movies', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM movies ORDER BY movie_id');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching movies:', error);
    res.status(500).json({ error: 'Failed to fetch movies' });
  }
});

app.get('/api/genres', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM genres ORDER BY genre_id');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching genres:', error);
    res.status(500).json({ error: 'Failed to fetch genres' });
  }
});

app.get('/api/movies/:id/shows', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT s.show_id, s.movie_id, s.show_date, s.show_time, s.duration,
              s.available_seats, s.showroom_id, r.showroom_name
       FROM shows s
       LEFT JOIN showrooms r ON r.showroom_id = s.showroom_id
       WHERE s.movie_id = $1
       ORDER BY s.show_date, s.show_time`,
      [req.params.id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching showtimes:', error);
    res.status(500).json({ error: 'Failed to fetch showtimes' });
  }
});

app.get('/api/movies/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM movies WHERE movie_id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Movie not found' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching movie:', error);
    res.status(500).json({ error: 'Failed to fetch movie' });
  }
});

app.get('/api/showrooms', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT showroom_id, showroom_name, number_of_seats FROM showrooms ORDER BY showroom_id'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching showrooms:', error);
    res.status(500).json({ error: 'Failed to fetch showrooms' });
  }
});

app.post('/api/movies', authenticate, requireAdmin, async (req, res) => {
  const {
    title, genreId, rating, description, posterUrl, trailerUrl,
    director, producer, castMembers, reviews, status, releaseDate,
  } = req.body;

  if (!title || !title.trim()) {
    return res.status(400).json({ error: 'Title is required.' });
  }
  if (status !== 'Currently Running' && status !== 'Coming Soon') {
    return res.status(400).json({ error: 'Status must be Currently Running or Coming Soon.' });
  }

  try {
    if (genreId) {
      const genre = await pool.query('SELECT genre_id FROM genres WHERE genre_id = $1', [genreId]);
      if (genre.rows.length === 0) {
        return res.status(400).json({ error: 'Invalid genre.' });
      }
    }

    const result = await pool.query(
      `INSERT INTO movies
         (title, genre_id, rating, description, poster_url, trailer_url,
          director, producer, cast_members, reviews, status, release_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [
        title.trim(),
        genreId || null,
        rating || null,
        description || null,
        posterUrl || null,
        trailerUrl || null,
        director || null,
        producer || null,
        castMembers || null,
        reviews || null,
        status,
        releaseDate || null,
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error adding movie:', error);
    res.status(500).json({ error: 'Failed to add movie' });
  }
});

app.put('/api/movies/:id', authenticate, requireAdmin, async (req, res) => {
  const {
    title, genreId, rating, description, posterUrl, trailerUrl,
    director, producer, castMembers, reviews, status, releaseDate,
  } = req.body;

  if (!title || !title.trim()) {
    return res.status(400).json({ error: 'Title is required.' });
  }
  if (status !== 'Currently Running' && status !== 'Coming Soon') {
    return res.status(400).json({ error: 'Status must be Currently Running or Coming Soon.' });
  }

  try {
    if (genreId) {
      const genre = await pool.query('SELECT genre_id FROM genres WHERE genre_id = $1', [genreId]);
      if (genre.rows.length === 0) {
        return res.status(400).json({ error: 'Invalid genre.' });
      }
    }

    const result = await pool.query(
      `UPDATE movies SET
         title = $1, genre_id = $2, rating = $3, description = $4,
         poster_url = $5, trailer_url = $6, director = $7, producer = $8,
         cast_members = $9, reviews = $10, status = $11, release_date = $12
       WHERE movie_id = $13
       RETURNING *`,
      [
        title.trim(),
        genreId || null,
        rating || null,
        description || null,
        posterUrl || null,
        trailerUrl || null,
        director || null,
        producer || null,
        castMembers || null,
        reviews || null,
        status,
        releaseDate || null,
        req.params.id,
      ]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Movie not found.' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating movie:', error);
    res.status(500).json({ error: 'Failed to update movie' });
  }
});

app.delete('/api/movies/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM movies WHERE movie_id = $1 RETURNING movie_id',
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Movie not found.' });
    }
    res.json({ message: 'Movie deleted.' });
  } catch (error) {
    console.error('Error deleting movie:', error);
    res.status(500).json({ error: 'Failed to delete movie' });
  }
});

app.post('/api/shows', authenticate, requireAdmin, async (req, res) => {
  const { movieId, showroomId, showDate, showTime, duration } = req.body;

  if (!movieId || !showroomId || !showDate || !showTime) {
    return res.status(400).json({
      error: 'Movie, showroom, date, and time are required.',
    });
  }

  try {
    const movie = await pool.query('SELECT movie_id FROM movies WHERE movie_id = $1', [movieId]);
    if (movie.rows.length === 0) {
      return res.status(400).json({ error: 'Movie not found.' });
    }

    const room = await pool.query(
      'SELECT showroom_id, number_of_seats FROM showrooms WHERE showroom_id = $1',
      [showroomId]
    );
    if (room.rows.length === 0) {
      return res.status(400).json({ error: 'Showroom not found.' });
    }

    const result = await pool.query(
      `INSERT INTO shows
         (movie_id, showroom_id, show_date, show_time, duration, available_seats)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        movieId,
        showroomId,
        showDate,
        showTime,
        duration || 120,
        room.rows[0].number_of_seats,
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({
        error: 'That showroom already has a show at this date and time.',
      });
    }
    console.error('Error scheduling show:', error);
    res.status(500).json({ error: 'Failed to schedule show' });
  }
});

app.post('/api/promotions', authenticate, requireAdmin, async (req, res) => {
  const { promoCode, discountPercentage, validUntil } = req.body;
  const discount = Number(discountPercentage);

  if (!promoCode || !promoCode.trim()) {
    return res.status(400).json({ error: 'Promo code is required.' });
  }
  if (!Number.isFinite(discount) || discount < 0 || discount > 100) {
    return res.status(400).json({ error: 'Discount must be between 0 and 100.' });
  }
  if (!validUntil) {
    return res.status(400).json({ error: 'Valid until date is required.' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO promotions (promo_code, discount_percentage, valid_until)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [promoCode.trim().toUpperCase(), discount, validUntil]
    );
    const promo = result.rows[0];

    const subscribers = await pool.query(
      `SELECT email FROM users
       WHERE promotional_emails = TRUE AND status = 'Active' AND role = 'customer'`
    );

    let emailsSent = 0;
    for (const user of subscribers.rows) {
      try {
        await sendPromotionEmail(user.email, promo);
        emailsSent += 1;
      } catch (err) {
        console.error(`Failed to email ${user.email}:`, err.message);
      }
    }

    res.status(201).json({
      ...promo,
      emailsSent,
      message: `Promotion created. Emailed ${emailsSent} subscribed user(s).`,
    });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'That promo code already exists.' });
    }
    console.error('Error creating promotion:', error);
    res.status(500).json({ error: 'Failed to create promotion' });
  }
});

app.get('/api/users', authenticate, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT user_id, email, first_name, last_name, role, status, promotional_emails
       FROM users
       ORDER BY user_id`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

app.put('/api/users/:id/status', authenticate, requireAdmin, async (req, res) => {
  const { status } = req.body;
  if (!['Active', 'Inactive', 'Suspended'].includes(status)) {
    return res.status(400).json({ error: 'Status must be Active, Inactive, or Suspended.' });
  }
  if (Number(req.params.id) === Number(req.user.userId)) {
    return res.status(400).json({ error: 'You cannot change your own status.' });
  }

  try {
    const result = await pool.query(
      `UPDATE users SET status = $1, updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $2
       RETURNING user_id, email, first_name, last_name, role, status, promotional_emails`,
      [status, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({ error: 'Failed to update user status' });
  }
});

app.get('/api/auth/favorites', authenticate, requireCustomer, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT m.* FROM movies m
       JOIN favorite_movies f ON m.movie_id = f.movie_id
       WHERE f.user_id = $1
       ORDER BY f.date_added DESC`,
      [req.user.userId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching favorites:', error);
    res.status(500).json({ error: 'Failed to fetch favorites' });
  }
});

app.post('/api/auth/favorites/toggle', authenticate, requireCustomer, async (req, res) => {
  const movieId = Number(req.body.movieId);
  if (!Number.isInteger(movieId) || movieId <= 0) {
    return res.status(400).json({ error: 'Invalid movie ID.' });
  }

  try {
    const movie = await pool.query('SELECT movie_id FROM movies WHERE movie_id = $1', [movieId]);
    if (movie.rows.length === 0) return res.status(404).json({ error: 'Movie not found.' });

    const check = await pool.query(
      'SELECT movie_id FROM favorite_movies WHERE user_id = $1 AND movie_id = $2',
      [req.user.userId, movieId]
    );
    if (check.rows.length > 0) {
      await pool.query(
        'DELETE FROM favorite_movies WHERE user_id = $1 AND movie_id = $2',
        [req.user.userId, movieId]
      );
      return res.json({ message: 'Removed from favorites', isFavorite: false });
    }

    await pool.query(
      'INSERT INTO favorite_movies (user_id, movie_id) VALUES ($1, $2)',
      [req.user.userId, movieId]
    );
    res.status(201).json({ message: 'Added to favorites', isFavorite: true });
  } catch (error) {
    console.error('Error toggling favorite:', error);
    res.status(500).json({ error: 'Failed to toggle favorite' });
  }
});

app.listen(PORT, () => {
  console.log(`CES backend running on http://localhost:${PORT}`);
});
