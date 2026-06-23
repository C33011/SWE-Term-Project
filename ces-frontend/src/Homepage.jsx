import React, { useState, useEffect } from 'react';

const HomePage = ({ onNavigateToDetails }) => {
  const [movies, setMovies] = useState([]);
  const [genres, setGenres] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [genreFilter, setGenreFilter] = useState('');
  const [loading, setLoading] = useState(true);

  // Fetch data when the component loads
  useEffect(() => {
    // In reality, these would be your backend URLs (e.g., http://localhost:8080/api/movies)
    // For now, you can temporarily point these to a local JSON file if the backend isn't ready.
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
        console.error("Error fetching data:", error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter and Search Logic
  const filteredMovies = movies.filter(movie => {
    const matchesSearch = movie.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGenre = genreFilter === '' || movie.genre_id.toString() === genreFilter;
    return matchesSearch && matchesGenre;
  });

  const currentlyRunning = filteredMovies.filter(m => m.status === "Currently Running");
  const comingSoon = filteredMovies.filter(m => m.status === "Coming Soon");

  if (loading) return <div>Loading movies from database...</div>;

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h1>Cinema E-Booking System</h1>
      
      {/* Search and Filter Controls */}
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
          {genres.map(genre => (
            <option key={genre.genre_id} value={genre.genre_id}>{genre.name}</option>
          ))}
        </select>

        {/* Disabled Date Filter as per requirements */}
        <select disabled style={{ padding: '8px', backgroundColor: '#eee' }}>
          <option>Filter by Show Date (Not Implemented)</option>
        </select>
      </div>

      {/* Movie Displays */}
      <h2>Currently Running</h2>
      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginBottom: '30px' }}>
        {currentlyRunning.map(movie => (
          <div key={movie.movie_id} onClick={() => onNavigateToDetails(movie.movie_id)} style={{ border: '1px solid #ddd', padding: '10px', cursor: 'pointer', width: '180px', textAlign: 'center' }}>
            <img src={movie.poster_url} alt={movie.title} width="100%" />
            <h4>{movie.title}</h4>
            <p>Rating: {movie.rating}</p>
          </div>
        ))}
      </div>

      <h2>Coming Soon</h2>
      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
        {comingSoon.map(movie => (
          <div key={movie.movie_id} onClick={() => onNavigateToDetails(movie.movie_id)} style={{ border: '1px solid #ddd', padding: '10px', cursor: 'pointer', width: '180px', textAlign: 'center' }}>
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