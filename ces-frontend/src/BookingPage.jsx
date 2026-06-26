import React, { useState } from 'react';

const BookingPage = ({ movieId, onBack }) => {
  const [tickets, setTickets] = useState({ Adult: 0, Child: 0, Senior: 0 });
  const [selectedSeats, setSelectedSeats] = useState([]);

  // Compact grid generation (5 rows, 8 columns)
  const rows = ['A', 'B', 'C', 'D', 'E'];
  const cols = [1, 2, 3, 4, 5, 6, 7, 8];

  const toggleSeat = (seatId) => {
    setSelectedSeats(prev => 
      prev.includes(seatId) ? prev.filter(s => s !== seatId) : [...prev, seatId]
    );
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial', maxWidth: '700px', margin: '0 auto', textAlign: 'center' }}>
      
      {/* Back Button aligned to the left */}
      <div style={{ textAlign: 'left', marginBottom: '20px' }}>
        <button onClick={onBack} style={{ padding: '8px 16px', cursor: 'pointer' }}>
          ← Back to Details
        </button>
      </div>

      <h2>Select Tickets & Seats</h2>

      {/* Ticket Counters - Compact Flexbox */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginBottom: '30px' }}>
        {Object.keys(tickets).map((type) => (
          <label key={type} style={{ fontWeight: 'bold' }}>
            {type}: {' '}
            <input 
              type="number" min="0" value={tickets[type]} 
              onChange={(e) => setTickets({...tickets, [type]: parseInt(e.target.value) || 0})}
              style={{ width: '50px', padding: '4px' }}
            />
          </label>
        ))}
      </div>

      {/* Centered Seat Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: `repeat(${cols.length}, 45px)`, 
        gap: '8px', 
        justifyContent: 'center',
        margin: '0 auto'
      }}>
        {rows.map(row => cols.map(col => {
          const seatId = `${row}${col}`;
          const isSelected = selectedSeats.includes(seatId);
          return (
            <button
              key={seatId}
              onClick={() => toggleSeat(seatId)}
              style={{
                height: '45px', width: '45px', cursor: 'pointer', borderRadius: '4px', border: '1px solid #999',
                backgroundColor: isSelected ? '#4CAF50' : '#f0f0f0',
                color: isSelected ? 'white' : 'black',
                fontWeight: isSelected ? 'bold' : 'normal'
              }}
            >
              {seatId}
            </button>
          );
        }))}
      </div>

      {/* Minimal Summary */}
      <div style={{ marginTop: '30px', padding: '20px', borderTop: '1px solid #ccc' }}>
        <p><strong>Selected Seats:</strong> {selectedSeats.length > 0 ? selectedSeats.join(', ') : 'None'}</p>
        <button 
          disabled={selectedSeats.length === 0} 
          style={{ padding: '10px 20px', cursor: selectedSeats.length ? 'pointer' : 'not-allowed' }}
        >
          Confirm Booking
        </button>
      </div>

    </div>
  );
};

export default BookingPage;