import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getToken } from './auth'; // Using your helper function! (Change to '../auth' if it throws a path error)

const Favorites = () => {
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFavorites = async () => {
      const token = getToken(); // Getting the token correctly
      
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/auth/favorites', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
          const data = await response.json();
          setFavorites(data);
        } else {
          console.error("Server rejected the request. Status:", response.status);
        }
      } catch (err) {
        console.error('Failed to load favorites', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchFavorites();
  }, []);

  if (loading) return <div style={{ padding: '20px' }}>Loading favorites...</div>;

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial', maxWidth: '1200px', margin: '0 auto' }}>
      <button onClick={() => navigate('/')} style={{ padding: '8px 16px', marginBottom: '20px', cursor: 'pointer' }}>
        ← Back to Movies
      </button>
      
      <h1>My Favorite Movies</h1>
      
      {favorites.length === 0 ? (
        <p>You haven't added any favorite movies yet! Go back to the homepage and click some hearts.</p>
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
          {favorites.map(movie => (
            <div key={movie.movie_id} style={{ border: '1px solid #ccc', padding: '15px', width: '200px', textAlign: 'center', position: 'relative' }}>
              
              {/* Added a solid heart since we know it's a favorite! */}
              <div style={{ position: 'absolute', top: '10px', right: '10px', fontSize: '24px', backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: '50%', padding: '2px 5px' }}>
                ❤️
              </div>

              {/* Added the image tag so the posters show up! */}
              <img src={movie.poster_url} alt={movie.title} width="100%" />
              
              <h3 style={{ fontSize: '16px', margin: '10px 0' }}>{movie.title}</h3>
              
              <Link to={`/movies/${movie.movie_id}`} style={{ display: 'block', marginTop: '10px', textDecoration: 'none', color: 'blue', fontWeight: 'bold' }}>
                View Details
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Favorites;