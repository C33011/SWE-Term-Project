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

// NEW: auth routes + access-control middleware
const authRoutes = require('./auth');
const { authenticate, requireAdmin } = require('./middleware');
app.use('/api/auth', authRoutes(pool));

// NEW: example protected admin route (proves access control to the TA)
app.get('/api/admin/ping', authenticate, requireAdmin, (req, res) => {
  res.json({ message: 'Admin access confirmed' });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/movies', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM movies ORDER BY movie_id');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching movies:', err);
    res.status(500).json({ error: 'Failed to fetch movies' });
  }
});

app.get('/api/genres', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM genres ORDER BY genre_id');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching genres:', err);
    res.status(500).json({ error: 'Failed to fetch genres' });
  }
});

app.get('/api/movies/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM movies WHERE movie_id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Movie not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching movie:', err);
    res.status(500).json({ error: 'Failed to fetch movie' });
  }
});

app.listen(PORT, () => {
  console.log(`CES backend running on http://localhost:${PORT}`);
});