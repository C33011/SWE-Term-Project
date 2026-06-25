import React, { useState } from 'react';
import HomePage from './HomePage';
import MovieDetails from './MovieDetails';

function App() {
  const [selectedMovieId, setSelectedMovieId] = useState(null);

  return (
    <div>
      {selectedMovieId === null ? (
        <HomePage onNavigateToDetails={(id) => setSelectedMovieId(id)} />
      ) : (
        <MovieDetails movieId={selectedMovieId} onBack={() => setSelectedMovieId(null)} />
      )}
    </div>
  );
}

export default App;