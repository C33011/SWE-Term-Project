import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getToken } from './auth'; // Adjust the path if necessary

const HomePage = () => {
  const [movies, setMovies] = useState([]);
  const [genres, setGenres] = useState([]);
  const [favoriteIds, setFavoriteIds] = useState([]); // NEW: Tracks which movies are favorited
  const [searchTerm, setSearchTerm] = useState('');
  const [genreFilter, setGenreFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch movies and genres
        const moviesResponse = await fetch('/api/movies');
        const moviesData = await moviesResponse.json();

        const genresResponse = await fetch('/api/genres');
        const genresData = await genresResponse.json();
        

        setMovies(moviesData);
        setGenres(genresData);

        // NEW: Fetch user's favorites if they are logged in
        const token = getToken();
        if (token) {
          const favResponse = await fetch('/api/auth/favorites', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (favResponse.ok) {
            const favData = await favResponse.json();
            // Extract just the movie IDs to easily check if a movie is favorited
            setFavoriteIds(favData.map(movie => movie.movie_id));
          }
        }

        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // NEW: Function to handle clicking the heart
  const handleToggleFavorite = async (e, movieId) => {
    e.stopPropagation(); // CRITICAL: Stops the click from triggering the movie card navigation!
    
    const token = getToken('token');

    console.log("HEART CLICKED! Token found:", token);
    
    if (!token) {
      alert("Please log in to add favorite movies!");
      return;
    }

    try {
      const response = await fetch('/api/auth/favorites/toggle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ movieId })
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.isFavorite) {
          // Add to state
          setFavoriteIds([...favoriteIds, movieId]);
        } else {
          // Remove from state
          setFavoriteIds(favoriteIds.filter(id => id !== movieId));
        }
      }
    } catch (err) {
      console.error('Error toggling heart:', err);
    }
  };

  const filteredMovies = movies.filter((movie) => {
    const matchesSearch = movie.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGenre = genreFilter === '' || movie.genre_id.toString() === genreFilter;
    return matchesSearch && matchesGenre;
  });

  const currentlyRunning = filteredMovies.filter((m) => m.status === 'Currently Running');
  const comingSoon = filteredMovies.filter((m) => m.status === 'Coming Soon');

  if (loading) return <div>Loading...</div>;

  // REUSABLE MOVIE CARD RENDERER
  const renderMovieCard = (movie) => {
    const isFavorited = favoriteIds.includes(movie.movie_id);

    return (
      <div 
        key={movie.movie_id} 
        onClick={() => navigate(`/movies/${movie.movie_id}`)}
        // Added position: 'relative' so the heart can be positioned perfectly inside
        style={{ border: '1px solid #ddd', padding: '10px', cursor: 'pointer', width: '180px', textAlign: 'center', position: 'relative' }}
      >
        {/* --- ADDED HEART ICON --- */}
        <div 
          onClick={(e) => handleToggleFavorite(e, movie.movie_id)}
          style={{ 
            position: 'absolute', 
            top: '10px', 
            right: '10px', 
            fontSize: '24px', 
            backgroundColor: 'rgba(255,255,255,0.7)', // Slight white background to make it visible over dark posters
            borderRadius: '50%', 
            padding: '2px 5px',
            transition: 'transform 0.2s',
            zIndex: 2 // Ensures it sits above the image
          }}
          title={isFavorited ? "Remove from Favorites" : "Add to Favorites"}
        >
          {isFavorited ? '❤️' : '🤍'}
        </div>

        <img src={movie.poster_url} alt={movie.title} width="100%" />
        <h4>{movie.title}</h4>
        <p>Rating: {movie.rating}</p>
      </div>
    );
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h1>Cinema E-Booking System</h1>

      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
        <input
          type="text"
          placeholder="Search movies by title..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ padding: '8px', width: '300px' }}
        />
        <select
          value={genreFilter}
          onChange={(e) => setGenreFilter(e.target.value)}
          style={{ padding: '8px' }}
        >
          <option value="">All Genres</option>
          {genres.map((g) => (
            <option key={g.genre_id} value={g.genre_id}>{g.name}</option>
          ))}
        </select>
        <select style={{ padding: '8px' }} disabled>
          <option>Filter by Show Date (Not Implemented)</option>
        </select>
      </div>

      {filteredMovies.length === 0 && (
        <p style={{ fontWeight: 'bold' }}>No movies match your search or filter. Try different criteria.</p>
      )}

      <h2>Currently Running</h2>
      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginBottom: '30px' }}>
        {currentlyRunning.map(renderMovieCard)}
      </div>

      <h2>Coming Soon</h2>
      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
        {comingSoon.map(renderMovieCard)}
      </div>
    </div>
  );
};

export default HomePage;