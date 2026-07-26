import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

function formatDateOnly(value) {
  const [year, month, day] = String(value).slice(0, 10).split('-').map(Number);
  if (!year || !month || !day) return String(value);
  return new Date(year, month - 1, day).toLocaleDateString();
}

const MovieDetails = () => {
  const { id: movieId } = useParams();
  const navigate = useNavigate();
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [shows, setShows] = useState([]); // EDIT A: real showtimes from DB

  useEffect(() => {
    const fetchMovie = async () => {
      try {
        const response = await fetch(`/api/movies/${movieId}`);
        const data = await response.json();
        setMovie(data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching movie details:', error);
        setLoading(false);
      }
    };
    fetchMovie();
  }, [movieId]);

  // EDIT B: fetch the real showtimes for this movie
  useEffect(() => {
    fetch(`/api/movies/${movieId}/shows`)
      .then((res) => res.json())
      .then(setShows)
      .catch((err) => console.error('Error fetching shows:', err));
  }, [movieId]);

  if (loading) return <div style={{ padding: '20px' }}>Loading movie details...</div>;
  if (!movie || movie.error) return <div style={{ padding: '20px' }}>Movie not found.</div>;

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial', maxWidth: '900px', margin: '0 auto' }}>
      <button onClick={() => navigate('/')} style={{ padding: '8px 16px', marginBottom: '20px', cursor: 'pointer' }}>
        ← Back to Movies
      </button>

      <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap' }}>
        <img src={movie.poster_url} alt={movie.title} style={{ width: '250px', borderRadius: '8px' }} />

        <div style={{ flex: 1, minWidth: '300px' }}>
          <h1>{movie.title}</h1>
          <p><strong>Rating:</strong> {movie.rating}</p>
          <p><strong>Status:</strong> {movie.status}</p>
          {movie.director && <p><strong>Director:</strong> {movie.director}</p>}
          {movie.cast_members && <p><strong>Cast:</strong> {movie.cast_members}</p>}
          <p style={{ marginTop: '15px' }}>{movie.description}</p>

          {/* EDIT C: real showtimes from the database */}
          <h3 style={{ marginTop: '20px' }}>Showtimes</h3>
          {shows.length === 0 ? (
            <p>No showtimes scheduled yet.</p>
          ) : (
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {shows.map((show) => (
                <button
                  key={show.show_id}
                  onClick={() => navigate(`/booking/${show.show_id}`)}
                  style={{ border: '1px solid #333', padding: '8px 14px', borderRadius: '4px', cursor: 'pointer' }}
                >
                  {formatDateOnly(show.show_date)} — {show.show_time.slice(0, 5)}
                  {show.showroom_name ? ` (${show.showroom_name})` : ''}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <h3 style={{ marginTop: '30px' }}>Trailer</h3>
      {movie.trailer_url ? (
        <iframe
          width="100%"
          height="450"
          src={movie.trailer_url}
          title={`${movie.title} trailer`}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        ></iframe>
      ) : (
        <p>No trailer available.</p>
      )}
    </div>
  );
};

export default MovieDetails;