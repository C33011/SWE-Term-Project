import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getUser } from './auth';

const DEFAULT_PRICES = { Adult: 12.50, Senior: 9.50, Child: 8.50 };
const EMPTY_TICKETS = { Adult: 0, Senior: 0, Child: 0 };
const PENDING_BOOKING_KEY = 'pendingBooking';
const BOOKING_SESSION_KEY = 'bookingSessionId';


function getOrCreateBookingSessionId() {
  let value = sessionStorage.getItem(BOOKING_SESSION_KEY);
  if (!value) {
    value = globalThis.crypto?.randomUUID?.() || `booking_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    sessionStorage.setItem(BOOKING_SESSION_KEY, value);
  }
  return value;
}

async function requestSeatHold(showId, sessionId, seatIds) {
  const response = await fetch('/api/seat-locks/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ showId: Number(showId), sessionId, seatIds }),
  });
  const data = await response.json();
  if (!response.ok) {
    const error = new Error(data.error || 'Could not hold the selected seats.');
    error.unavailableSeatIds = data.unavailableSeatIds || [];
    throw error;
  }
  return data;
}

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
  const bookingSessionId = useMemo(getOrCreateBookingSessionId, []);
  const [show, setShow] = useState(null);
  const [seats, setSeats] = useState([]);
  const [prices, setPrices] = useState(DEFAULT_PRICES);
  const [tickets, setTickets] = useState(restored?.tickets || EMPTY_TICKETS);
  const [selectedSeats, setSelectedSeats] = useState(restored?.seatIds || []);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [movieDetails, setMovieDetails] = useState(null);
  const [holdExpiresAt, setHoldExpiresAt] = useState(null);
  const [holdSeconds, setHoldSeconds] = useState(0);
  const [syncingHold, setSyncingHold] = useState(false);

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      fetch(`/api/shows/${showId}/seats?sessionId=${encodeURIComponent(bookingSessionId)}`).then(async (response) => {
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
      .then(async ([seatData, priceData]) => {
        if (cancelled) return;
        setShow(seatData.show);
        setSeats(seatData.seats || []);
        setPrices(priceData.prices || DEFAULT_PRICES);

        // Fetch full movie details to get the trailer URL for this specific movie
        if (seatData.show && seatData.show.movie_id) {
          try {
            const movieRes = await fetch(`/api/movies/${seatData.show.movie_id}`);
            if (movieRes.ok) {
              const movieData = await movieRes.json();
              if (!cancelled) setMovieDetails(movieData);
            }
          } catch {
            // fallback if bruh moment
          }
        }

        const availableIds = new Set(
          (seatData.seats || []).filter((seat) => !seat.booked && !seat.locked).map((seat) => seat.seatId)
        );
        const restoredSeatIds = (restored?.seatIds || []).filter((id) => availableIds.has(id));
        if (restoredSeatIds.length > 0) {
          try {
            const lockData = await requestSeatHold(showId, bookingSessionId, restoredSeatIds);
            if (!cancelled) {
              setHoldExpiresAt(Date.now() + lockData.expiresInSeconds * 1000);
              setSelectedSeats(restoredSeatIds);
            }
          } catch (holdError) {
            if (!cancelled) {
              setSelectedSeats([]);
              setError(holdError.message);
            }
          }
        } else {
          setSelectedSeats([]);
        }
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
  }, [showId, bookingSessionId, restored]);

  useEffect(() => {
    const refreshSeatStatuses = async () => {
      try {
        const response = await fetch(`/api/shows/${showId}/seats?sessionId=${encodeURIComponent(bookingSessionId)}`);
        const data = await response.json();
        if (!response.ok) return;
        setSeats(data.seats || []);
        const unavailableIds = new Set(
          (data.seats || []).filter((seat) => seat.booked || seat.locked).map((seat) => seat.seatId)
        );
        setSelectedSeats((current) => {
          const stillAvailable = current.filter((id) => !unavailableIds.has(id));
          if (stillAvailable.length !== current.length) {
            setError('A selected seat is no longer available. Please choose another seat.');
            persistBooking(stillAvailable, tickets);
          }
          return stillAvailable;
        });
      } catch {
        // Keep the current seat map if a background refresh briefly bruh moments
      }
    };

    const intervalId = window.setInterval(refreshSeatStatuses, 8000);
    return () => window.clearInterval(intervalId);
  }, [showId, bookingSessionId, tickets]);

  useEffect(() => {
    if (!holdExpiresAt || selectedSeats.length === 0) {
      setHoldSeconds(0);
      return undefined;
    }

    const update = () => setHoldSeconds(Math.max(0, Math.ceil((holdExpiresAt - Date.now()) / 1000)));
    update();
    const timerId = window.setInterval(update, 1000);
    return () => window.clearInterval(timerId);
  }, [holdExpiresAt, selectedSeats.length]);

  const getYouTubeId = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const getEmbedUrl = (url) => {
    const videoId = getYouTubeId(url);
    if (!videoId) return '';
    return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&controls=0&modestbranding=1&showinfo=0&iv_load_policy=3&disablekb=1&fs=0&playsinline=1&loop=1&playlist=${videoId}`;
  };

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
      lockSessionId: bookingSessionId,
      savedAt: new Date().toISOString(),
    }));
  };

  const updateTicketCount = (type, rawValue) => {
    const parsed = Number.parseInt(rawValue, 10);
    const count = Number.isInteger(parsed) ? Math.max(0, Math.min(parsed, 20)) : 0;
    const nextTickets = { ...tickets, [type]: count };
    setTickets(nextTickets);
    setSelectedSeats([]);
    setHoldExpiresAt(null);
    setError(null);
    persistBooking([], nextTickets);
    requestSeatHold(showId, bookingSessionId, []).catch(() => {});
  };

  const toggleSeat = async (seat) => {
    if (seat.booked || seat.locked || syncingHold) return;
    setError(null);

    let next;
    if (selectedSeats.includes(seat.seatId)) {
      next = selectedSeats.filter((id) => id !== seat.seatId);
    } else if (totalTickets <= 0) {
      setError('Choose at least one ticket before selecting seats.');
      return;
    } else if (selectedSeats.length >= totalTickets) {
      setError(`You selected ${totalTickets} ticket(s). Deselect a seat or add another ticket.`);
      return;
    } else {
      next = [...selectedSeats, seat.seatId];
    }

    setSyncingHold(true);
    try {
      const lockData = await requestSeatHold(showId, bookingSessionId, next);
      setSelectedSeats(next);
      setHoldExpiresAt(next.length > 0 ? Date.now() + lockData.expiresInSeconds * 1000 : null);
      persistBooking(next, tickets);
    } catch (holdError) {
      setError(holdError.message);
      if (holdError.unavailableSeatIds?.length) {
        setSeats((current) => current.map((item) => (
          holdError.unavailableSeatIds.includes(item.seatId) ? { ...item, locked: true } : item
        )));
      }
    } finally {
      setSyncingHold(false);
    }
  };

  const proceed = async () => {
    if (syncingHold) return;
    setError(null);

    if (totalTickets <= 0) {
      setError('Please choose at least one ticket.');
      return;
    }

    if (selectedSeats.length !== totalTickets) {
      setError(`Select exactly ${totalTickets} seat(s). You currently selected ${selectedSeats.length}.`);
      return;
    }

    setSyncingHold(true);
    try {
      const lockData = await requestSeatHold(showId, bookingSessionId, selectedSeats);
      setHoldExpiresAt(Date.now() + lockData.expiresInSeconds * 1000);
    } catch (holdError) {
      setError(holdError.message);
      setSyncingHold(false);
      return;
    }
    setSyncingHold(false);

    const seatLabels = selectedSeats.map(
      (id) => seats.find((seat) => seat.seatId === id)?.label
    );

    sessionStorage.setItem(PENDING_BOOKING_KEY, JSON.stringify({
      showId: Number(showId),
      show,
      seatIds: selectedSeats,
      seatLabels,
      tickets,
      lockSessionId: bookingSessionId,
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
    return (
      <div style={{ backgroundColor: '#111', color: '#d4af37', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '24px', fontFamily: 'Georgia, serif' }}>
        Popping fresh popcorn & setting up showroom... 🍿🎬
      </div>
    );
  }

  return (
    <div style={{ 
      backgroundColor: '#111', 
      color: '#fff', 
      minHeight: '100vh', 
      width: '100%', 
      overflowX: 'hidden', 
      margin: 0, 
      padding: '40px 20px', 
      position: 'relative',
      fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
      backgroundImage: 'url("https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80")',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center'
    }}>
      
      {/* Dark overlay with concession / theater vibe */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(5, 5, 8, 0.88)', zIndex: 1 }}></div>

      <main style={{ width: '100%', maxWidth: '900px', position: 'relative', zIndex: 2, paddingBottom: '60px' }}>
        
        <div style={{ marginBottom: '25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button onClick={() => navigate(-1)} style={{ background: 'transparent', color: '#0dcaf0', border: '1px solid #0dcaf0', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>← Back</button>
          <div style={{ display: 'flex', gap: '15px', fontSize: '24px' }}>
            🍿🥤🎟️
          </div>
        </div>

        {/* Movie Title Banner with Trailer Background & Golden Highlight */}
        <div style={{ 
          textAlign: 'center', marginBottom: '40px', backgroundColor: '#000', 
          borderRadius: '18px', border: '2px solid #d4af37', boxShadow: '0 15px 40px rgba(0,0,0,0.9)', 
          position: 'relative', overflow: 'hidden', minHeight: '220px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '30px' 
        }}>
          {/* Background Trailer Loop */}
          {movieDetails?.trailer_url && (
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1, opacity: 0.45, pointerEvents: 'none', overflow: 'hidden' }}>
              <iframe 
                width="100%" 
                height="100%" 
                src={getEmbedUrl(movieDetails.trailer_url)} 
                title="Movie Trailer Preview" 
                frameBorder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                style={{ position: 'absolute', top: '50%', left: '50%', width: '177.77vh', height: '100vh', minWidth: '100%', minHeight: '100%', transform: 'translate(-50%, -50%) scale(1.2)', border: 'none', filter: 'contrast(1.1) brightness(0.9)' }}
              ></iframe>
            </div>
          )}
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'radial-gradient(circle, rgba(0,0,0,0.4) 20%, rgba(0,0,0,0.85) 100%)', zIndex: 2, pointerEvents: 'none' }}></div>

          <div style={{ position: 'relative', zIndex: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <img src="https://api.iconify.design/pixelarticons:clapperboard.svg?color=%23d4af37" alt="Cinema Clapperboard" style={{ width: '50px', height: '50px', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.8))', marginBottom: '8px' }} />
            <h1 style={{ 
              color: '#fff', fontFamily: 'Georgia, serif', fontSize: '38px', textTransform: 'uppercase', margin: '0 0 10px 0', 
              textShadow: '0 0 20px rgba(212,175,55,0.9), 0 0 40px rgba(212,175,55,0.6), 2px 2px 4px #000',
              backgroundColor: 'rgba(0,0,0,0.6)', padding: '5px 25px', borderRadius: '12px', border: '1px solid rgba(212,175,55,0.5)'
            }}>
              {show?.movie_title || 'Book Tickets'}
            </h1>
            {show && (
              <div style={{ display: 'inline-block', backgroundColor: 'rgba(13, 202, 240, 0.2)', border: '1px solid #0dcaf0', padding: '6px 18px', borderRadius: '30px', color: '#0dcaf0', fontWeight: 'bold', fontSize: '15px', textShadow: '0 2px 4px #000' }}>
                🍿 {formatDateOnly(show.show_date)} at {String(show.show_time).slice(0, 5)} {show.showroom_name ? `| ${show.showroom_name}` : ''}
              </div>
            )}
          </div>
        </div>

        {/* 1. Choose Tickets Section */}
        <section aria-labelledby="ticket-heading" style={{ marginBottom: '40px', backgroundColor: 'rgba(15, 15, 15, 0.95)', backdropFilter: 'blur(10px)', padding: '35px', borderRadius: '18px', border: '2px solid #d4af37', boxShadow: '0 15px 40px rgba(0,0,0,0.9)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', borderBottom: '1px solid #333', paddingBottom: '15px', marginBottom: '25px' }}>
            
            <h2 id="ticket-heading" style={{ color: '#d4af37', margin: 0, fontFamily: 'Georgia, serif', fontSize: '24px' }}> Choose Tickets & Concessions Mood</h2>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '20px' }}>
            {Object.keys(tickets).map((type) => (
              <label key={type} style={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid #444', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', minWidth: '130px', boxShadow: '0 4px 10px rgba(0,0,0,0.5)' }}>
                <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#fff' }}>{type}</span>
                <span style={{ color: '#0dcaf0', fontWeight: 'bold', fontSize: '15px' }}>${Number(prices[type]).toFixed(2)}</span>
                <input
                  aria-label={`${type} ticket count`}
                  type="number"
                  min="0"
                  max="20"
                  value={tickets[type]}
                  onChange={(event) => updateTicketCount(type, event.target.value)}
                  style={{ width: '80px', padding: '10px', borderRadius: '8px', border: '2px solid #d4af37', backgroundColor: '#000', color: '#d4af37', fontSize: '18px', textAlign: 'center', outline: 'none', fontFamily: 'monospace' }}
                />
              </label>
            ))}
          </div>
          <div style={{ textAlign: 'center', fontSize: '20px', marginTop: '25px', fontWeight: 'bold' }}>
            Total tickets selected: <span style={{ color: '#d4af37', fontSize: '24px', backgroundColor: 'rgba(212,175,55,0.2)', padding: '4px 12px', borderRadius: '8px' }}>{totalTickets}</span> 🍿🥤
          </div>
        </section>

        {/* 2. Select Seats Section */}
        <section aria-labelledby="seat-heading" style={{ backgroundColor: 'rgba(15, 15, 15, 0.95)', backdropFilter: 'blur(10px)', padding: '35px', borderRadius: '18px', border: '2px solid #d4af37', boxShadow: '0 15px 40px rgba(0,0,0,0.9)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', borderBottom: '1px solid #333', paddingBottom: '15px', marginBottom: '30px' }}>
            
            <h2 id="seat-heading" style={{ color: '#d4af37', margin: 0, fontFamily: 'Georgia, serif', fontSize: '24px' }}> Select {totalTickets > 0 ? totalTickets : ''} Seat(s)</h2>
          </div>
          
          {/* Neon Screen */}
          <div style={{ position: 'relative', width: '70%', height: '35px', margin: '0 auto 40px auto', borderTop: '4px solid #0dcaf0', borderTopLeftRadius: '50%', borderTopRightRadius: '50%', boxShadow: '0 -15px 25px rgba(13,202,240,0.3)', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', paddingTop: '8px' }}>
            <span style={{ color: '#0dcaf0', letterSpacing: '12px', fontWeight: '900', fontSize: '14px', textShadow: '0 0 10px #0dcaf0' }}>CINEMA SCREEN</span>
          </div>

          {seats.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#999' }}>No seats are configured for this showroom.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', overflowX: 'auto', paddingBottom: '15px', gap: '10px' }}>
              {rows.map((row) => (
                <div key={row} style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                  {seats.filter((seat) => seat.row === row).map((seat) => {
                    const isSelected = selectedSeats.includes(seat.seatId);
                    const unavailable = seat.booked || seat.locked || syncingHold;
                    const backgroundColor = seat.booked ? '#c0392b' : seat.locked ? '#7f5af0' : isSelected ? '#d4af37' : 'rgba(255,255,255,0.1)';
                    const color = unavailable ? '#fff' : isSelected ? '#000' : '#fff';
                    const boxShadow = isSelected ? '0 0 12px #d4af37' : '0 2px 5px rgba(0,0,0,0.5)';
                    const border = seat.booked ? '1px solid #c0392b' : seat.locked ? '1px solid #9b7cff' : isSelected ? '1px solid #d4af37' : '1px solid #444';

                    return (
                      <button
                        key={seat.seatId}
                        type="button"
                        onClick={() => toggleSeat(seat)}
                        disabled={unavailable}
                        aria-pressed={isSelected}
                        title={seat.booked ? `${seat.label} is already booked` : seat.locked ? `${seat.label} is temporarily held` : seat.label}
                        style={{
                          height: '42px', width: '42px', borderRadius: '8px 8px 3px 3px', border,
                          backgroundColor, color, fontSize: '12px', fontWeight: 'bold', boxShadow,
                          cursor: unavailable ? 'not-allowed' : 'pointer',
                          transition: 'all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                        }}
                        onMouseEnter={(e) => { if(!unavailable && !isSelected) e.currentTarget.style.backgroundColor = 'rgba(13,202,240,0.3)'; }}
                        onMouseLeave={(e) => { if(!unavailable && !isSelected) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'; }}
                      >
                        {seat.label}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          )}

          <div style={{ marginTop: '30px', display: 'flex', justifyContent: 'center', gap: '25px', fontSize: '14px', color: '#ccc', backgroundColor: 'rgba(0,0,0,0.5)', padding: '12px', borderRadius: '10px', width: 'max-content', margin: '30px auto 0 auto', border: '1px solid #333' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '16px', height: '16px', backgroundColor: '#d4af37', borderRadius: '3px' }}></div> Selected</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '16px', height: '16px', backgroundColor: '#c0392b', borderRadius: '3px' }}></div> Booked</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '16px', height: '16px', backgroundColor: '#7f5af0', borderRadius: '3px' }}></div> Held</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '16px', height: '16px', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: '3px' }}></div> Available</span>
          </div>
          {selectedSeats.length > 0 && (
            <p style={{ textAlign: 'center', color: '#d4af37', marginTop: '14px', fontWeight: 'bold' }}>
              Your selected seats are held for this session{holdSeconds > 0 ? ` for ${Math.floor(holdSeconds / 60)}:${String(holdSeconds % 60).padStart(2, '0')}` : ''}.
            </p>
          )}
        </section>

        {error && (
          <div style={{ backgroundColor: 'rgba(192, 57, 43, 0.3)', padding: '12px', borderRadius: '10px', marginTop: '25px', border: '1px solid #c0392b', textAlign: 'center' }}>
            <p role="alert" style={{ color: '#ffb3b3', fontWeight: 'bold', margin: 0, fontSize: '15px' }}>{error}</p>
          </div>
        )}

        <section style={{ marginTop: '35px', backgroundColor: 'rgba(15, 15, 15, 0.95)', backdropFilter: 'blur(10px)', padding: '30px', borderRadius: '18px', border: '2px solid #d4af37', boxShadow: '0 15px 40px rgba(0,0,0,0.9)', textAlign: 'center' }}>
          <p style={{ fontSize: '24px', margin: '0 0 10px 0' }}>Total before tax: <strong style={{ color: '#0dcaf0', textShadow: '0 0 10px rgba(13,202,240,0.5)' }}>${(totalCents / 100).toFixed(2)}</strong></p>
          <p style={{ color: '#aaa', fontSize: '13px', marginBottom: '25px' }}>
            You may choose seats as a guest. Login is required only when proceeding to checkout.
          </p>
          <button
            type="button"
            onClick={proceed}
            disabled={syncingHold}
            style={{ 
              background: 'linear-gradient(90deg, #d4af37 0%, #b38f27 100%)', color: '#000', 
              fontWeight: '900', padding: '16px 36px', border: 'none', borderRadius: '10px', 
              cursor: 'pointer', fontSize: '18px', boxShadow: '0 8px 20px rgba(212,175,55,0.4)',
              textTransform: 'uppercase', letterSpacing: '1px', transition: 'transform 0.2s', width: '100%', maxWidth: '400px'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            {syncingHold ? 'Holding Seats…' : 'Proceed to Checkout 🎟️🍿'}
          </button>
        </section>

      </main>
    </div>
  );
};

export default BookingPage;