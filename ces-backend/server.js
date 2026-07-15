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
