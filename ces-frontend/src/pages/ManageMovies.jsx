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

  if (loading) return <div style={{ padding: '20px', fontFamily: 'Arial' }}>Loading movies…</div>;

  return (
    <div style={{ maxWidth: '800px', margin: '40px auto', fontFamily: 'Arial', padding: '0 20px' }}>
      <p><Link to="/admin">← Admin Portal</Link></p>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
        <h2 style={{ margin: 0 }}>Manage Movies</h2>
        <button onClick={() => navigate('/admin/movies/add')} style={{ padding: '8px 16px', cursor: 'pointer' }}>
          Add Movie
        </button>
      </div>

      {message && (
        <p style={{ color: message.type === 'error' ? '#c0392b' : '#27ae60', fontWeight: 'bold' }}>
          {message.text}
        </p>
      )}

      {movies.length === 0 ? (
        <p style={{ color: '#666' }}>No movies yet.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, marginTop: '20px' }}>
          {movies.map((movie) => (
            <li key={movie.movie_id} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              gap: '12px', padding: '12px 0', borderBottom: '1px solid #eee',
            }}>
              <div>
                <strong>{movie.title}</strong>
                <div style={{ color: '#666', fontSize: '14px' }}>{movie.status}{movie.rating ? ` · ${movie.rating}` : ''}</div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => navigate(`/admin/movies/edit/${movie.movie_id}`)} style={{ padding: '6px 12px', cursor: 'pointer' }}>
                  Edit
                </button>
                <button onClick={() => remove(movie)} style={{ padding: '6px 12px', cursor: 'pointer' }}>
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ManageMovies;
