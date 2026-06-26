import React, { useState } from 'react';
import HomePage from './HomePage';
import MovieDetails from './MovieDetails';
import BookingPage from './BookingPage'; 

function App() {
  const [selectedMovieId, setSelectedMovieId] = useState(null);
  // New state to track if we are in "booking mode"
  const [bookingMovieId, setBookingMovieId] = useState(null);

  return (
    <div>
      {/* If we are booking, show BookingPage */}
      {bookingMovieId !== null ? (
        <BookingPage movieId={bookingMovieId} onBack={() => setBookingMovieId(null)} />
      ) : selectedMovieId === null ? (
        <HomePage onNavigateToDetails={(id) => setSelectedMovieId(id)} />
      ) : (
        <MovieDetails 
          movieId={selectedMovieId} 
          onBack={() => setSelectedMovieId(null)} 
          // Add this to your MovieDetails so it can trigger the booking page
          onBookNow={(id) => setBookingMovieId(id)} 
        />
      )}
    </div>
  );
}

export default App;