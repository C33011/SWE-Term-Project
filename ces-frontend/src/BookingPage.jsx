import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getUser } from './auth';

const DEFAULT_PRICES = { Adult: 12.50, Senior: 9.50, Child: 8.50 };
const EMPTY_TICKETS = { Adult: 0, Senior: 0, Child: 0 };
const PENDING_BOOKING_KEY = 'pendingBooking';

function formatDateOnly(value) {
  const [year, month, day] = String(value).slice(0, 10).split('-').map(Number);
  if (!year || !month || !day) return String(value);
  return new Date(year, month - 1, day).toLocaleDateString();
}

function readPendingBooking(showId) {
  try {
    const raw = sessionStorage.getItem(PENDING_BOOKING_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return String(parsed.showId) === String(showId) ? parsed : null;
  } catch {
    sessionStorage.removeItem(PENDING_BOOKING_KEY);
    return null;
  }
}

const BookingPage = () => {
  const { showId } = useParams();
  const navigate = useNavigate();

  const restored = useMemo(() => readPendingBooking(showId), [showId]);
  const [show, setShow] = useState(null);
  const [seats, setSeats] = useState([]);
  const [prices, setPrices] = useState(DEFAULT_PRICES);
  const [tickets, setTickets] = useState(restored?.tickets || EMPTY_TICKETS);
  const [selectedSeats, setSelectedSeats] = useState(restored?.seatIds || []);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      fetch(`/api/shows/${showId}/seats`).then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Could not load the seat map.');
        return data;
      }),
      fetch('/api/checkout/prices').then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Could not load ticket prices.');
        return data;
      }),
    ])
      .then(([seatData, priceData]) => {
        if (cancelled) return;
        setShow(seatData.show);
        setSeats(seatData.seats || []);
        setPrices(priceData.prices || DEFAULT_PRICES);

        // Keep restored seats
        const availableIds = new Set(
          (seatData.seats || []).filter((seat) => !seat.booked).map((seat) => seat.seatId)
        );
        setSelectedSeats((current) => current.filter((id) => availableIds.has(id)));
      })
      .catch((loadError) => {
        if (!cancelled) setError(loadError.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [showId]);

  const totalTickets = tickets.Adult + tickets.Senior + tickets.Child;
  const totalCents =
    tickets.Adult * Math.round(prices.Adult * 100) +
    tickets.Senior * Math.round(prices.Senior * 100) +
    tickets.Child * Math.round(prices.Child * 100);

  const persistBooking = (seatIds = selectedSeats, ticketCounts = tickets) => {
    sessionStorage.setItem(PENDING_BOOKING_KEY, JSON.stringify({
      showId: Number(showId),
      show,
      seatIds,
      tickets: ticketCounts,
      savedAt: new Date().toISOString(),
    }));
  };

  const updateTicketCount = (type, rawValue) => {
    const parsed = Number.parseInt(rawValue, 10);
    const count = Number.isInteger(parsed) ? Math.max(0, Math.min(parsed, 20)) : 0;
    const nextTickets = { ...tickets, [type]: count };
    setTickets(nextTickets);
    setSelectedSeats([]);
    setError(null);
    persistBooking([], nextTickets);
  };

  const toggleSeat = (seat) => {
    if (seat.booked) return;
    setError(null);

    setSelectedSeats((current) => {
      let next;
      if (current.includes(seat.seatId)) {
        next = current.filter((id) => id !== seat.seatId);
      } else if (totalTickets <= 0) {
        setError('Choose at least one ticket before selecting seats.');
        return current;
      } else if (current.length >= totalTickets) {
        setError(`You selected ${totalTickets} ticket(s). Deselect a seat or add another ticket.`);
        return current;
      } else {
        next = [...current, seat.seatId];
      }

      persistBooking(next, tickets);
      return next;
    });
  };

  const proceed = () => {
    setError(null);

    if (totalTickets <= 0) {
      setError('Please choose at least one ticket.');
      return;
    }

    if (selectedSeats.length !== totalTickets) {
      setError(`Select exactly ${totalTickets} seat(s). You currently selected ${selectedSeats.length}.`);
      return;
    }

    const seatLabels = selectedSeats.map(
      (id) => seats.find((seat) => seat.seatId === id)?.label
    );

    sessionStorage.setItem(PENDING_BOOKING_KEY, JSON.stringify({
      showId: Number(showId),
      show,
      seatIds: selectedSeats,
      seatLabels,
      tickets,
      savedAt: new Date().toISOString(),
    }));

    const user = getUser();
    if (!user) {
      navigate('/login?redirect=%2Fcheckout');
      return;
    }

    if (user.role !== 'customer') {
      setError('Checkout requires a customer account. Please log in as a customer.');
      return;
    }

    navigate('/checkout');
  };

  const rows = [...new Set(seats.map((seat) => seat.row))];

  if (loading) {
    return <div style={{ padding: '30px', textAlign: 'center' }}>Loading booking details…</div>;
  }

  return (
    <main style={{ padding: '20px', fontFamily: 'Arial', maxWidth: '820px', margin: '0 auto', textAlign: 'center' }}>
      <div style={{ textAlign: 'left' }}>
        <button onClick={() => navigate(-1)} style={{ padding: '8px 16px', cursor: 'pointer' }}>← Back</button>
      </div>

      <h1>{show?.movie_title || 'Book Tickets'}</h1>
      {show && (
        <p style={{ fontSize: '17px' }}>
          {formatDateOnly(show.show_date)} at {String(show.show_time).slice(0, 5)}
          {show.showroom_name ? ` · ${show.showroom_name}` : ''}
        </p>
      )}

      <section aria-labelledby="ticket-heading">
        <h2 id="ticket-heading">1. Choose Tickets</h2>
        <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '20px', marginBottom: '20px' }}>
          {Object.keys(tickets).map((type) => (
            <label key={type} style={{ fontWeight: 'bold' }}>
              {type} (${Number(prices[type]).toFixed(2)}):{' '}
              <input
                aria-label={`${type} ticket count`}
                type="number"
                min="0"
                max="20"
                value={tickets[type]}
                onChange={(event) => updateTicketCount(type, event.target.value)}
                style={{ width: '60px', padding: '6px' }}
              />
            </label>
          ))}
        </div>
        <p><strong>Total tickets: {totalTickets}</strong></p>
      </section>

      <section aria-labelledby="seat-heading">
        <h2 id="seat-heading">2. Select {totalTickets > 0 ? totalTickets : ''} Seat(s)</h2>
        <p style={{ color: '#666', margin: '4px 0 14px' }}>SCREEN</p>

        {seats.length === 0 ? (
          <p>No seats are configured for this showroom.</p>
        ) : (
          <div style={{ display: 'inline-block', maxWidth: '100%', overflowX: 'auto' }}>
            {rows.map((row) => (
              <div key={row} style={{ display: 'flex', gap: '8px', marginBottom: '8px', justifyContent: 'center' }}>
                {seats.filter((seat) => seat.row === row).map((seat) => {
                  const isSelected = selectedSeats.includes(seat.seatId);
                  const backgroundColor = seat.booked ? '#c0392b' : isSelected ? '#27ae60' : '#f0f0f0';
                  const color = seat.booked || isSelected ? 'white' : 'black';

                  return (
                    <button
                      key={seat.seatId}
                      type="button"
                      onClick={() => toggleSeat(seat)}
                      disabled={seat.booked}
                      aria-pressed={isSelected}
                      title={seat.booked ? `${seat.label} is already booked` : seat.label}
                      style={{
                        height: '40px', width: '40px', borderRadius: '4px', border: '1px solid #999',
                        backgroundColor, color, fontSize: '11px',
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
        )}

        <div style={{ marginTop: '12px', fontSize: '13px', color: '#666' }}>
          <span style={{ color: '#27ae60' }}>■</span> selected&nbsp;&nbsp;
          <span style={{ color: '#c0392b' }}>■</span> booked&nbsp;&nbsp;
          <span>□</span> available
        </div>
      </section>

      {error && <p role="alert" style={{ color: '#c0392b', fontWeight: 'bold' }}>{error}</p>}

      <section style={{ marginTop: '24px', borderTop: '1px solid #ccc', paddingTop: '18px' }}>
        <p><strong>Total before tax: ${(totalCents / 100).toFixed(2)}</strong></p>
        <p style={{ color: '#666', fontSize: '14px' }}>
          You may choose seats as a guest. Login is required only when proceeding to checkout.
        </p>
        <button
          type="button"
          onClick={proceed}
          style={{ padding: '11px 24px', cursor: 'pointer', fontSize: '15px' }}
        >
          Proceed to Checkout →
        </button>
      </section>
    </main>
  );
};

export default BookingPage;
