import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const HomePage = () => {
  const [movies, setMovies] = useState([]);
  const [genres, setGenres] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [genreFilter, setGenreFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const moviesResponse = await fetch('/api/movies');
        const moviesData = await moviesResponse.json();

        const genresResponse = await fetch('/api/genres');
        const genresData = await genresResponse.json();

        setMovies(moviesData);
        setGenres(genresData);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredMovies = movies.filter((movie) => {
    const matchesSearch = movie.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGenre = genreFilter === '' || movie.genre_id.toString() === genreFilter;
    return matchesSearch && matchesGenre;
  });

  const currentlyRunning = filteredMovies.filter((m) => m.status === 'Currently Running');
  const comingSoon = filteredMovies.filter((m) => m.status === 'Coming Soon');

  if (loading) return <div style={{ padding: '20px' }}>Loading movies from database...</div>;

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h1>Cinema E-Booking System</h1>

      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
        <input
          type="text"
          placeholder="Search movies by title..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ padding: '8px', width: '250px' }}
        />

        <select value={genreFilter} onChange={(e) => setGenreFilter(e.target.value)} style={{ padding: '8px' }}>
          <option value="">All Genres</option>
          {genres.map((genre) => (
            <option key={genre.genre_id} value={genre.genre_id}>{genre.name}</option>
          ))}
        </select>

        <select disabled style={{ padding: '8px', backgroundColor: '#eee' }}>
          <option>Filter by Show Date (Not Implemented)</option>
        </select>
      </div>

      {/* Sprint 1 feedback fix: message when nothing matches */}
      {filteredMovies.length === 0 && (
        <p style={{ fontWeight: 'bold' }}>No movies match your search or filter. Try different criteria.</p>
      )}

      <h2>Currently Running</h2>
      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginBottom: '30px' }}>
        {currentlyRunning.map((movie) => (
          <div key={movie.movie_id} onClick={() => navigate(`/movies/${movie.movie_id}`)}
            style={{ border: '1px solid #ddd', padding: '10px', cursor: 'pointer', width: '180px', textAlign: 'center' }}>
            <img src={movie.poster_url} alt={movie.title} width="100%" />
            <h4>{movie.title}</h4>
            <p>Rating: {movie.rating}</p>
          </div>
        ))}
      </div>

      <h2>Coming Soon</h2>
      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
        {comingSoon.map((movie) => (
          <div key={movie.movie_id} onClick={() => navigate(`/movies/${movie.movie_id}`)}
            style={{ border: '1px solid #ddd', padding: '10px', cursor: 'pointer', width: '180px', textAlign: 'center' }}>
            <img src={movie.poster_url} alt={movie.title} width="100%" />
            <h4>{movie.title}</h4>
            <p>Rating: {movie.rating}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HomePage;