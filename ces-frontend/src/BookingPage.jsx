import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const PRICES = { Adult: 12.0, Senior: 9.0, Child: 8.0 };

const BookingPage = () => {
  const { showId } = useParams();
  const navigate = useNavigate();

  const [show, setShow] = useState(null);
  const [seats, setSeats] = useState([]);
  const [tickets, setTickets] = useState({ Adult: 0, Senior: 0, Child: 0 });
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`/api/shows/${showId}/seats`)
      .then((res) => res.json())
      .then((data) => {
        setShow(data.show);
        setSeats(data.seats);
      })
      .catch((err) => console.error('Error loading seat map:', err));
  }, [showId]);

  const totalTickets = tickets.Adult + tickets.Senior + tickets.Child;

  const toggleSeat = (seat) => {
    if (seat.booked) return;
    setError(null);
    setSelectedSeats((prev) => {
      if (prev.includes(seat.seatId)) {
        return prev.filter((id) => id !== seat.seatId);
      }
      if (prev.length >= totalTickets) {
        setError(`You chose ${totalTickets} ticket(s). Deselect a seat or add more tickets.`);
        return prev;
      }
      return [...prev, seat.seatId];
    });
  };

  const total =
    tickets.Adult * PRICES.Adult +
    tickets.Senior * PRICES.Senior +
    tickets.Child * PRICES.Child;

  const proceed = () => {
    setError(null);
    if (totalTickets === 0) return setError('Please choose at least one ticket.');
    if (selectedSeats.length !== totalTickets) {
      return setError(`Select exactly ${totalTickets} seat(s) — you have ${selectedSeats.length}.`);
    }
    const ticketTypes = [
      ...Array(tickets.Adult).fill('Adult'),
      ...Array(tickets.Senior).fill('Senior'),
      ...Array(tickets.Child).fill('Child'),
    ];
    const seatLabels = selectedSeats.map((id) => seats.find((s) => s.seatId === id)?.label);
    // Hand off to checkout (your teammate's part)
    navigate('/checkout', {
      state: { showId, show, seatIds: selectedSeats, seatLabels, ticketTypes, tickets, total },
    });
  };

  const rows = [...new Set(seats.map((s) => s.row))];

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial', maxWidth: '760px', margin: '0 auto', textAlign: 'center' }}>
      <div style={{ textAlign: 'left' }}>
        <button onClick={() => navigate(-1)} style={{ padding: '8px 16px', cursor: 'pointer' }}>← Back</button>
      </div>

      <h2>{show ? show.movie_title : 'Loading…'}</h2>
      {show && (
        <p style={{ fontSize: '17px' }}>
          {new Date(show.show_date).toLocaleDateString()} — {show.show_time?.slice(0, 5)}
          {show.showroom_name ? ` · ${show.showroom_name}` : ''}
        </p>
      )}

      <h3>1. Choose Tickets</h3>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginBottom: '20px' }}>
        {Object.keys(tickets).map((type) => (
          <label key={type} style={{ fontWeight: 'bold' }}>
            {type} (${PRICES[type].toFixed(2)}):{' '}
            <input
              type="number"
              min="0"
              value={tickets[type]}
              onChange={(e) => {
                setTickets({ ...tickets, [type]: parseInt(e.target.value) || 0 });
                setSelectedSeats([]);
              }}
              style={{ width: '55px', padding: '4px' }}
            />
          </label>
        ))}
      </div>

      <h3>2. Select {totalTickets > 0 ? totalTickets : ''} Seat(s)</h3>
      <p style={{ color: '#666', margin: '4px 0 14px' }}>SCREEN</p>

      <div style={{ display: 'inline-block' }}>
        {rows.map((row) => (
          <div key={row} style={{ display: 'flex', gap: '8px', marginBottom: '8px', justifyContent: 'center' }}>
            {seats.filter((s) => s.row === row).map((seat) => {
              const isSelected = selectedSeats.includes(seat.seatId);
              const bg = seat.booked ? '#c0392b' : isSelected ? '#27ae60' : '#f0f0f0';
              const color = seat.booked || isSelected ? 'white' : 'black';
              return (
                <button
                  key={seat.seatId}
                  onClick={() => toggleSeat(seat)}
                  disabled={seat.booked}
                  title={seat.booked ? 'Already booked' : seat.label}
                  style={{
                    height: '38px', width: '38px', borderRadius: '4px', border: '1px solid #999',
                    backgroundColor: bg, color, fontSize: '11px',
                    cursor: seat.booked ? 'not-allowed' : 'pointer',
                  }}
                >
                  {seat.label}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      <div style={{ marginTop: '10px', fontSize: '13px', color: '#666' }}>
        <span style={{ color: '#27ae60' }}>■</span> selected&nbsp;&nbsp;
        <span style={{ color: '#c0392b' }}>■</span> booked&nbsp;&nbsp;
        <span>■</span> available
      </div>

      {error && <p style={{ color: '#c0392b', fontWeight: 'bold' }}>{error}</p>}

      <div style={{ marginTop: '20px', borderTop: '1px solid #ccc', paddingTop: '15px' }}>
        <p><strong>Total: ${total.toFixed(2)}</strong> (before tax)</p>
        <button onClick={proceed} style={{ padding: '10px 22px', cursor: 'pointer', fontSize: '15px' }}>
          Proceed to Checkout →
        </button>
      </div>
    </div>
  );
};

export default BookingPage;