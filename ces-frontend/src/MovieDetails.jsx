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

  if (loading) return <div style={{ backgroundColor: '#111', color: '#d4af37', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '24px', fontFamily: 'Georgia, serif' }}>Loading movie details... 🎬</div>;
  if (!movie || movie.error) return <div style={{ backgroundColor: '#111', color: '#d4af37', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '24px', fontFamily: 'Georgia, serif' }}>Movie not found.</div>;

  return (
    <div style={{ backgroundColor: '#111', color: '#fff', minHeight: '100vh', padding: '40px 20px', fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto', backgroundColor: 'rgba(17,17,17,0.95)', padding: '45px', borderRadius: '20px', border: '2px solid #d4af37', boxShadow: '0 0 40px rgba(212,175,55,0.2)' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <button onClick={() => navigate('/')} style={{ background: 'transparent', color: '#d4af37', border: '1px solid #d4af37', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
            ← Back to Movies
          </button>
          <img src="https://api.dicebear.com/7.x/pixel-art/svg?seed=MoviePopup" alt="Pixel Cinema Guide" style={{ width: '45px', height: '45px', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }} />
        </div>

        <div style={{ display: 'flex', gap: '40px', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative' }}>
            <img src={movie.poster_url} alt={movie.title} style={{ width: '300px', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.9)', border: '2px solid #333', objectFit: 'cover' }} />
          </div>

          <div style={{ flex: 1, minWidth: '300px' }}>
            <h1 style={{ color: '#d4af37', fontFamily: 'Georgia, serif', fontSize: '42px', marginTop: 0, textTransform: 'uppercase', letterSpacing: '2px', textShadow: '2px 2px 4px #000' }}>
              {movie.title}
            </h1>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', backgroundColor: 'rgba(0,0,0,0.6)', padding: '20px', borderRadius: '12px', border: '1px solid #333', marginBottom: '25px' }}>
              <div><strong style={{ color: '#d4af37' }}>Rating:</strong> <span style={{ color: '#fff'  }}>{movie.rating}</span></div>
              <div><strong style={{ color: '#d4af37' }}>Status:</strong> <span style={{ color: '#fff' }}>{movie.status}</span></div>
              {movie.director && <div style={{ gridColumn: 'span 2' }}><strong style={{ color: '#d4af37' }}>Director:</strong> <span style={{ color: '#fff' }}>{movie.director}</span></div>}
              {movie.cast_members && <div style={{ gridColumn: 'span 2' }}><strong style={{ color: '#d4af37' }}>Cast:</strong> <span style={{ color: '#ccc' }}>{movie.cast_members}</span></div>}
            </div>
            
            <p style={{ fontSize: '18px', lineHeight: '1.6', color: '#ddd', marginBottom: '30px' }}>
              {movie.description}
            </p>

            {/* EDIT C: real showtimes from the database */}
            <h3 style={{ color: '#d4af37', borderBottom: '1px solid #333', paddingBottom: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <img src="https://api.iconify.design/pixelarticons:calendar.svg?color=%23d4af37" alt="Calendar" style={{ width: '22px', height: '22px' }} />
              Showtimes
            </h3>
            {shows.length === 0 ? (
              <p style={{ color: '#999' }}>No showtimes scheduled yet.</p>
            ) : (
              <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', marginTop: '15px' }}>
                {shows.map((show) => (
                  <button
                    key={show.show_id}
                    onClick={() => navigate(`/booking/${show.show_id}`)}
                    style={{ 
                      backgroundColor: 'rgba(212, 175, 55, 0.1)', color: '#d4af37', border: '1px solid #d4af37', 
                      padding: '12px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold',
                      boxShadow: '0 4px 10px rgba(0,0,0,0.5)', transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(212,175,55,0.3)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(212,175,55,0.1)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                  >
                    🎟️ {formatDateOnly(show.show_date)} — {show.show_time.slice(0, 5)}
                    {show.showroom_name ? ` (${show.showroom_name})` : ''}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <h3 style={{ marginTop: '50px', color: '#d4af37', borderBottom: '1px solid #333', paddingBottom: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img src="https://api.iconify.design/pixelarticons:sliders.svg?color=%23d4af37" alt="Trailer" style={{ width: '22px', height: '22px' }} />
          Trailer
        </h3>
        {movie.trailer_url ? (
          <div style={{ borderRadius: '12px', overflow: 'hidden', border: '2px solid #d4af37', boxShadow: '0 10px 30px rgba(212,175,55,0.2)', marginTop: '20px' }}>
            <iframe
              width="100%"
              height="500"
              src={movie.trailer_url}
              title={`${movie.title} trailer`}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              style={{ display: 'block' }}
            ></iframe>
          </div>
        ) : (
          <p style={{ color: '#999' }}>No trailer available.</p>
        )}
      </div>
    </div>
  );
};

export default MovieDetails;