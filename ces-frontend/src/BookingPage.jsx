// ces-frontend/src/BookingPage.jsx
import React from 'react';

const BookingPage = () => {
  // Placeholder data - this fulfills the "UI only" requirement
  const movie = { title: "Supergirl", showtime: "7:00 PM" };
  const prices = { adult: 15.00, child: 10.00, senior: 12.00 };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Booking: {movie.title}</h1>
      <p>Selected Showtime: {movie.showtime}</p>
      
      <h3>Select Tickets:</h3>
      {Object.entries(prices).map(([type, price]) => (
        <div key={type}>
          <label>{type.charAt(0).toUpperCase() + type.slice(1)} (${price}): </label>
          <input type="number" min="0" defaultValue="0" />
        </div>
      ))}

      <h3>Select Seats:</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 40px)', gap: '10px' }}>
        {[...Array(20)].map((_, i) => (
          <button key={i} style={{ padding: '10px' }}>{i + 1}</button>
        ))}
      </div>
    </div>
  );
};

export default BookingPage;