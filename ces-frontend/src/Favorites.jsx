import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getToken } from './auth';

const Favorites = () => {
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/favorites', { headers: { Authorization: `Bearer ${getToken()}` } })
      .then(async (response) => { if (response.ok) setFavorites(await response.json()); })
      .finally(() => setLoading(false));
  }, []);

  const remove = async (movieId) => {
    const response = await fetch('/api/auth/favorites/toggle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify({ movieId }),
    });
    if (response.ok) setFavorites((current) => current.filter((movie) => movie.movie_id !== movieId));
  };

  if (loading) return <div>Loading favorites...</div>;
  return <div style={{ padding: '20px' }}>
    <button onClick={() => navigate('/')}>← Back to Movies</button>
    <h1>My Favorite Movies</h1>
    {favorites.map((movie) => <div key={movie.movie_id} style={{ display: 'inline-block', width: '200px', margin: '10px' }}>
      <img src={movie.poster_url} alt={movie.title} width="100%" /><h3>{movie.title}</h3>
      <Link to={`/movies/${movie.movie_id}`}>View Details</Link><br />
      <button onClick={() => remove(movie.movie_id)}>Remove Favorite</button>
    </div>)}
  </div>;
};
export default Favorites;
