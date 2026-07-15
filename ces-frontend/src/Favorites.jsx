import React from 'react';
import { useNavigate } from 'react-router-dom';

const Favorites = () => {
  const navigate = useNavigate();

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial', maxWidth: '900px', margin: '0 auto' }}>
      <button onClick={() => navigate('/')} style={{ padding: '8px 16px', marginBottom: '20px', cursor: 'pointer' }}>
        ← Back to Movies
      </button>
      
      <h1>My Favorite Movies</h1>
      <p>List of your favorited movies will appear here.</p>
      {/* Map your favorite movies list here: favorites.map(m => ...) */}
    </div>
  );
};

export default Favorites;