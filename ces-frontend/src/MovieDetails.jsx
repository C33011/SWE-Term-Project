import React, { useState, useEffect } from 'react';

const MovieDetails = ({ movieId, onBack }) => {
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);

  // Hardcoded showtimes, as the assignment allows for this sprint
  const showtimes = ['2:00 PM', '5:00 PM', '8:00 PM'];

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

  if (loading) return <div style={{ padding: '20px' }}>Loading movie details...</div>;
  if (!movie) return <div style={{ padding: '20px' }}>Movie not found.</div>;

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial', maxWidth: '900px', margin: '0 auto' }}>
      <button onClick={onBack} style={{ padding: '8px 16px', marginBottom: '20px', cursor: 'pointer' }}>
        ← Back to Movies
      </button>

      <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap' }}>
        {/* Poster */}
        <img src={movie.poster_url} alt={movie.title} style={{ width: '250px', borderRadius: '8px' }} />

        {/* Details */}
        <div style={{ flex: 1, minWidth: '300px' }}>
          <h1>{movie.title}</h1>
          <p><strong>Rating:</strong> {movie.rating}</p>
          <p><strong>Status:</strong> {movie.status}</p>
          {movie.director && <p><strong>Director:</strong> {movie.director}</p>}
          {movie.cast_members && <p><strong>Cast:</strong> {movie.cast_members}</p>}
          <p style={{ marginTop: '15px' }}>{movie.description}</p>

          {/* Showtimes */}
          <h3 style={{ marginTop: '20px' }}>Showtimes</h3>
          <div style={{ display: 'flex', gap: '10px' }}>
            {showtimes.map((time) => (
              <span key={time} style={{ border: '1px solid #333', padding: '8px 14px', borderRadius: '4px' }}>
                {time}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Trailer */}
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