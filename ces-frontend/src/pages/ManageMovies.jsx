import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getToken } from '../auth';

const ManageMovies = () => {
  const navigate = useNavigate();
  const [movies, setMovies] = useState([]);
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadMovies = () => {
    setLoading(true);
    fetch('/api/movies')
      .then((res) => res.json())
      .then(setMovies)
      .catch(() => setMessage({ type: 'error', text: 'Could not load movies.' }))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadMovies(); }, []);

  const remove = async (movie) => {
    if (!window.confirm(`Delete "${movie.title}"? This cannot be undone.`)) return;

    try {
      const res = await fetch(`/api/movies/${movie.movie_id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      if (res.ok) {
        setMovies((current) => current.filter((m) => m.movie_id !== movie.movie_id));
        setMessage({ type: 'success', text: data.message });
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to delete movie.' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Could not reach the server.' });
    }
  };

  if (loading) {
    return (
      <div style={{ backgroundColor: '#111', color: '#d4af37', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '24px', fontFamily: 'Georgia, serif' }}>
        Loading movies... 🎬
      </div>
    );
  }

  return (
    <div style={{ 
      backgroundColor: '#111', 
      color: '#fff', 
      minHeight: '100vh', 
      width: '100%', 
      overflowX: 'hidden', 
      margin: 0, 
      padding: '40px 20px', 
      position: 'relative',
      fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
      backgroundImage: 'url("https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80")',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      boxSizing: 'border-box'
    }}>
      
      {/* Dark overlay for rich cinema atmosphere */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(5, 5, 8, 0.85)', zIndex: 1 }}></div>

      <main style={{ width: '100%', maxWidth: '1200px', position: 'relative', zIndex: 2, paddingBottom: '60px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        
        <div style={{ width: '100%', maxWidth: '850px' }}>
          <div style={{ marginBottom: '25px', display: 'flex', justifyContent: 'flex-start' }}>
            <Link to="/admin" style={{ color: '#0dcaf0', textDecoration: 'none', fontWeight: 'bold', border: '1px solid #0dcaf0', padding: '10px 20px', borderRadius: '8px' }}>← Admin Portal</Link>
          </div>

          {/* Manage Movies Box Container */}
          <div style={{ 
            backgroundColor: 'rgba(15, 15, 15, 0.95)', backdropFilter: 'blur(10px)', 
            padding: '40px', borderRadius: '18px', border: '2px solid #d4af37', 
            boxShadow: '0 20px 50px rgba(0,0,0,0.9)' 
          }}>
            
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '30px' }}>
              <img src="https://api.iconify.design/pixelarticons:clapperboard.svg?color=%23d4af37" alt="Clapperboard Icon" style={{ width: '50px', height: '50px', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.8))', marginBottom: '8px' }} />
              
              {/* Shining Golden Background Header */}
              <div style={{
                background: 'linear-gradient(135deg, #ffe58f 0%, #d4af37 50%, #997415 100%)',
                padding: '12px 30px',
                borderRadius: '12px',
                boxShadow: '0 0 25px rgba(212,175,55,0.7), inset 0 2px 4px rgba(255,255,255,0.6)',
                border: '2px solid #fff',
                textAlign: 'center',
                width: '100%',
                boxSizing: 'border-box',
                marginBottom: '20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <h2 style={{ color: '#000', fontFamily: 'Georgia, serif', fontSize: '26px', margin: 0, textTransform: 'uppercase', letterSpacing: '2px', textShadow: '1px 1px 2px rgba(255,255,255,0.5)' }}>Manage Movies</h2>
                <button 
                  onClick={() => navigate('/admin/movies/add')} 
                  style={{ 
                    backgroundColor: '#000', color: '#d4af37', border: '1px solid #d4af37', 
                    padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: '900',
                    fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px'
                  }}
                >
                  Add Movie 🍿
                </button>
              </div>
            </div>

            {message && (
              <div style={{ backgroundColor: message.type === 'error' ? 'rgba(192, 57, 43, 0.3)' : 'rgba(46, 204, 113, 0.2)', border: `1px solid ${message.type === 'error' ? '#c0392b' : '#27ae60'}`, padding: '14px', borderRadius: '10px', marginBottom: '20px', textAlign: 'center' }}>
                <p style={{ color: message.type === 'error' ? '#ffb3b3' : '#2ecc71', fontWeight: 'bold', margin: 0, fontSize: '14px' }}>
                  {message.text}
                </p>
              </div>
            )}

            {movies.length === 0 ? (
              <p style={{ color: '#888', textAlign: 'center', fontSize: '16px' }}>No movies yet.</p>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {movies.map((movie) => (
                  <li key={movie.movie_id} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    gap: '12px', padding: '16px', backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    borderRadius: '10px', border: '1px solid #333'
                  }}>
                    <div>
                      <strong style={{ color: '#fff', fontSize: '17px' }}>{movie.title}</strong>
                      <div style={{ color: '#0dcaf0', fontSize: '13px', marginTop: '4px' }}>{movie.status}{movie.rating ? ` · ${movie.rating}` : ''}</div>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button 
                        onClick={() => navigate(`/admin/movies/edit/${movie.movie_id}`)} 
                        style={{ 
                          padding: '8px 16px', cursor: 'pointer', backgroundColor: 'rgba(212,175,55,0.2)', 
                          color: '#d4af37', border: '1px solid #d4af37', borderRadius: '8px', fontWeight: 'bold', fontSize: '13px' 
                        }}
                      >
                        Edit ✏️
                      </button>
                      <button 
                        onClick={() => remove(movie)} 
                        style={{ 
                          padding: '8px 16px', cursor: 'pointer', backgroundColor: 'rgba(192,57,43,0.3)', 
                          color: '#ffb3b3', border: '1px solid #c0392b', borderRadius: '8px', fontWeight: 'bold', fontSize: '13px' 
                        }}
                      >
                        Delete 🗑️
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

      </main>
    </div>
  );
};

export default ManageMovies;
