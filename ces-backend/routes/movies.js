
//creating router instance
const express = require("express");
const router = express.Router();

//import
const pool = require("../db");

//filter dropdown with frontend implementation assuming everything connects
router.get("/genres", async (req, res) => {
  try {
    //Query to fetch all the genres from db
      //sorted alphabetically for user
    const result = await pool.query(
      "SELECT genre_id, name FROM genres ORDER BY name"
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching genres:", err.message);
    res.status(500).json({ error: "Server error fetching genres" });
  }
});
//genre filter get
//title filter as well
router.get("/movies", async (req, res) => {
  const { genre_id, search } = req.query;
  try {
    let query = `SELECT movie_id, title, genre_id, rating, poster_url, status FROM movies`;
    const params = [];

    if (genre_id) {
      params.push(genre_id);
      query += ` WHERE genre_id = $${params.length}`;
    } else if (search) {
      params.push(`%${search}%`);
      //ILIKE - case-insensitive search
      query += ` WHERE title ILIKE $${params.length}`;
    }
  //alphabetically sorting
    query += " ORDER BY title";
    const result = await pool.query(query, params);

     //non-matching movie case
    if (result.rows.length === 0) {
      return res.json({ message: "No movies found", movies: [] });
    }
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching movies:", err.message);
    res.status(500).json({ error: "Server error fetching movies" });
  }
});

//showtimes for user to select from
router.get("/movies/:id", async (req, res) => {
  const { id } = req.params;
  try {
    //Get all showtimes for a specific movie from the database
    //Should work now but unsure
    const result = await pool.query(
      `SELECT movie_id, title, genre_id, rating, description,
              poster_url, trailer_url, director, cast_members, status
       FROM movies WHERE movie_id = $1`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Movie not found" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error fetching movie details:", err.message);
    res.status(500).json({ error: "Server error fetching movie details" });
  }
});

router.get("/showtimes/:movie_id", async (req, res) => {
  const { movie_id } = req.params;
  try {
    const result = await pool.query(
      `SELECT showtime_id, movie_id, hall_id, show_datetime, available_seats
       FROM showtimes WHERE movie_id = $1 ORDER BY show_datetime`,
      [movie_id]
    );
    if (result.rows.length === 0) {
      return res.json({ message: "No showtimes found", showtimes: [] });
    }
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching showtimes:", err.message);
    res.status(500).json({ error: "Server error fetching showtimes" });
  }
});

module.exports = router;