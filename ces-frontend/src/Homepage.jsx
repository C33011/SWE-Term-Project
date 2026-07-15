import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getToken, getUser } from './auth';

const HomePage = () => {
  const [movies, setMovies] = useState([]);
  const [genres, setGenres] = useState([]);
  const [favoriteIds, setFavoriteIds] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [genreFilter, setGenreFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const isCustomer = getUser()?.role === 'customer';

  useEffect(() => {
    const load = async () => {
      try {
        const moviesData = await (await fetch('/api/movies')).json();
        const genresData = await (await fetch('/api/genres')).json();
        setMovies(moviesData);
        setGenres(genresData);
        if (isCustomer) {
          const response = await fetch('/api/auth/favorites', { headers: { Authorization: `Bearer ${getToken()}` } });
          if (response.ok) setFavoriteIds((await response.json()).map((movie) => movie.movie_id));
        }
      } finally { setLoading(false); }
    };
    load();
  }, [isCustomer]);

  const toggleFavorite = async (event, movieId) => {
    event.stopPropagation();
    const response = await fetch('/api/auth/favorites/toggle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify({ movieId }),
    });
    if (!response.ok) return;
    const data = await response.json();
    setFavoriteIds((current) => data.isFavorite ? [...new Set([...current, movieId])] : current.filter((id) => id !== movieId));
  };

  const filtered = movies.filter((movie) => movie.title.toLowerCase().includes(searchTerm.toLowerCase()) && (genreFilter === '' || String(movie.genre_id) === genreFilter));
  const renderCard = (movie) => (
    <div key={movie.movie_id} onClick={() => navigate(`/movies/${movie.movie_id}`)} style={{ border: '1px solid #ddd', padding: '10px', width: '180px', textAlign: 'center', position: 'relative', cursor: 'pointer' }}>
      {isCustomer && <button type="button" onClick={(e) => toggleFavorite(e, movie.movie_id)} style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 2 }}>
        {favoriteIds.includes(movie.movie_id) ? '❤️' : '🤍'}
      </button>}
      <img src={movie.poster_url} alt={movie.title} width="100%" />
      <h4>{movie.title}</h4><p>Rating: {movie.rating}</p>
    </div>
  );

  if (loading) return <div>Loading...</div>;
  return <div style={{ padding: '20px', fontFamily: 'Arial' }}>
    <h1>Cinema E-Booking System</h1>
    <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
      <input placeholder="Search movies by title..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
      <select value={genreFilter} onChange={(e) => setGenreFilter(e.target.value)}><option value="">All Genres</option>{genres.map((g) => <option key={g.genre_id} value={g.genre_id}>{g.name}</option>)}</select>
    </div>
    <h2>Currently Running</h2><div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>{filtered.filter((m) => m.status === 'Currently Running').map(renderCard)}</div>
    <h2>Coming Soon</h2><div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>{filtered.filter((m) => m.status === 'Coming Soon').map(renderCard)}</div>
  </div>;
};
export default HomePage;
