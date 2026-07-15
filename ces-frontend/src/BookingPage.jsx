import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';

const PRICES = { Adult: 12.0, Child: 8.0, Senior: 9.0 };

const BookingPage = () => {
  const { id: movieId } = useParams();
  const [searchParams] = useSearchParams();
  const showtime = searchParams.get('time') || 'Not selected';
  const navigate = useNavigate();

  const [movie, setMovie] = useState(null);
  const [tickets, setTickets] = useState({ Adult: 0, Child: 0, Senior: 0 });
  const [selectedSeats, setSelectedSeats] = useState([]);

  useEffect(() => {
    fetch(`/api/movies/${movieId}`)
      .then((res) => res.json())
      .then(setMovie)
      .catch((err) => console.error('Error fetching movie:', err));
  }, [movieId]);

  const rows = ['A', 'B', 'C', 'D', 'E'];
  const cols = [1, 2, 3, 4, 5, 6, 7, 8];

  const toggleSeat = (seatId) => {
    setSelectedSeats((prev) =>
      prev.includes(seatId) ? prev.filter((s) => s !== seatId) : [...prev, seatId]
    );
  };

  const total = Object.entries(tickets)
    .reduce((sum, [type, qty]) => sum + PRICES[type] * qty, 0);

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial', maxWidth: '700px', margin: '0 auto', textAlign: 'center' }}>
      <div style={{ textAlign: 'left', marginBottom: '20px' }}>
        <button onClick={() => navigate(-1)} style={{ padding: '8px 16px', cursor: 'pointer' }}>
          ← Back to Details
        </button>
      </div>

      {/* Movie + showtime — required by the Sprint 1 spec */}
      <h2>{movie ? movie.title : 'Loading…'}</h2>
      <p style={{ fontSize: '18px' }}><strong>Showtime:</strong> {showtime}</p>

      <h3>Select Tickets</h3>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginBottom: '30px' }}>
        {Object.keys(tickets).map((type) => (
          <label key={type} style={{ fontWeight: 'bold' }}>
            {type} (${PRICES[type].toFixed(2)}):{' '}
            <input
              type="number" min="0" value={tickets[type]}
              onChange={(e) => setTickets({ ...tickets, [type]: parseInt(e.target.value) || 0 })}
              style={{ width: '50px', padding: '4px' }}
            />
          </label>
        ))}
      </div>

      <h3>Select Seats</h3>
      <p style={{ color: '#666', margin: '5px 0 15px' }}>SCREEN</p>
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${cols.length}, 45px)`,
        gap: '8px',
        justifyContent: 'center',
        margin: '0 auto',
      }}>
        {rows.map((row) => cols.map((col) => {
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
                fontWeight: isSelected ? 'bold' : 'normal',
              }}
            >
              {seatId}
            </button>
          );
        }))}
      </div>

      <div style={{ marginTop: '30px', padding: '20px', borderTop: '1px solid #ccc' }}>
        <p><strong>Selected Seats:</strong> {selectedSeats.length > 0 ? selectedSeats.join(', ') : 'None'}</p>
        <p><strong>Total:</strong> ${total.toFixed(2)}</p>
        <button
          disabled={selectedSeats.length === 0}
          style={{ padding: '10px 20px', cursor: selectedSeats.length ? 'pointer' : 'not-allowed' }}
        >
          Confirm Booking
        </button>
        <p style={{ color: '#888', fontSize: '13px' }}>(Checkout logic coming in a later sprint)</p>
      </div>
    </div>
  );
};

export default BookingPage;