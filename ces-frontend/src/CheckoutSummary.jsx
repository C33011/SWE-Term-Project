import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getToken } from './auth';

const PENDING_BOOKING_KEY = 'pendingBooking';
const PAYMENT_STATE_KEY = 'checkoutForPayment';

function readPendingBooking() {
  try {
    const raw = sessionStorage.getItem(PENDING_BOOKING_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    sessionStorage.removeItem(PENDING_BOOKING_KEY);
    return null;
  }
}

function formatShowDate(dateValue) {
  const [year, month, day] = String(dateValue).slice(0, 10).split('-').map(Number);
  if (!year || !month || !day) return String(dateValue);
  return new Date(year, month - 1, day).toLocaleDateString();
}

const CheckoutSummary = () => {
  const navigate = useNavigate();
  const [pending] = useState(readPendingBooking);
  const [summary, setSummary] = useState(null);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!pending) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
    };

    Promise.all([
      fetch('/api/checkout/summary', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          showId: pending.showId,
          seatIds: pending.seatIds,
          ticketCounts: pending.tickets,
        }),
      }).then(async (response) => {
        const data = await response.json();
        if (!response.ok) {
          const err = new Error(data.error || 'Could not build the order summary.');
          err.status = response.status;
          err.bookedSeatIds = data.bookedSeatIds;
          throw err;
        }
        return data;
      }),
      fetch('/api/checkout/email', {
        headers: { Authorization: `Bearer ${getToken()}` },
      }).then(async (response) => {
        const data = await response.json();
        if (!response.ok) {
          const err = new Error(data.error || 'Could not retrieve your email address.');
          err.status = response.status;
          throw err;
        }
        return data;
      }),
    ])
      .then(([summaryData, emailData]) => {
        if (cancelled) return;
        setSummary(summaryData);
        setEmail(emailData.email || '');
      })
      .catch((loadError) => {
        if (cancelled) return;
        if (loadError.status === 401) {
          navigate('/login?redirect=%2Fcheckout', { replace: true });
          return;
        }
        setError(loadError.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [navigate, pending]);

  const continueToPayment = async () => {
    setError(null);
    const trimmedEmail = email.trim();
    const basicEmailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!basicEmailPattern.test(trimmedEmail)) {
      setError('Please enter a valid confirmation email address.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/checkout/email', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ email: trimmedEmail }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || 'Could not confirm the email address.');
        return;
      }

      const paymentState = {
        summary,
        confirmationEmail: data.email,
        pendingBooking: pending,
      };
      sessionStorage.setItem(PAYMENT_STATE_KEY, JSON.stringify(paymentState));
      navigate('/payment', { state: paymentState });
    } catch {
      setError('Could not reach the server.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ backgroundColor: '#111', color: '#d4af37', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '24px', fontFamily: 'Georgia, serif' }}>
        Printing your ticket... 🖨️🎟️
      </div>
    );
  }

  if (!pending) {
    return (
      <div style={{ backgroundColor: '#111', color: '#fff', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif', backgroundImage: 'url("https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80")', backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(5, 5, 8, 0.85)', zIndex: 1 }}></div>
        <main style={{ position: 'relative', zIndex: 2, backgroundColor: 'rgba(15, 15, 15, 0.95)', backdropFilter: 'blur(10px)', padding: '50px', borderRadius: '18px', border: '2px solid #d4af37', textAlign: 'center', boxShadow: '0 20px 50px rgba(0,0,0,0.9)', maxWidth: '500px', width: '90%' }}>
          <img src="https://api.iconify.design/pixelarticons:close.svg?color=%23c0392b" alt="Error" style={{ width: '60px', height: '60px', marginBottom: '20px' }} />
          <h1 style={{ color: '#d4af37', fontFamily: 'Georgia, serif', margin: '0 0 15px 0' }}>No Pending Booking</h1>
          <p style={{ fontSize: '16px', color: '#ccc', marginBottom: '25px' }}>Select a movie, showtime, tickets, and seats before checking out.</p>
          <button onClick={() => navigate('/')} style={{ background: 'linear-gradient(90deg, #d4af37 0%, #b38f27 100%)', color: '#000', fontWeight: '900', padding: '14px 28px', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '16px', textTransform: 'uppercase', letterSpacing: '1px' }}>Browse Movies 🍿</button>
        </main>
      </div>
    );
  }

  if (error && !summary) {
    return (
      <div style={{ backgroundColor: '#111', color: '#fff', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif', backgroundImage: 'url("https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80")', backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(5, 5, 8, 0.85)', zIndex: 1 }}></div>
        <main style={{ position: 'relative', zIndex: 2, backgroundColor: 'rgba(15, 15, 15, 0.95)', backdropFilter: 'blur(10px)', padding: '50px', borderRadius: '18px', border: '2px solid #d4af37', textAlign: 'center', boxShadow: '0 20px 50px rgba(0,0,0,0.9)', maxWidth: '500px', width: '90%' }}>
          <h1 style={{ color: '#d4af37', fontFamily: 'Georgia, serif' }}>Checkout Could Not Continue</h1>
          <p role="alert" style={{ color: '#ffb3b3', fontWeight: 'bold', backgroundColor: 'rgba(192, 57, 43, 0.3)', padding: '15px', borderRadius: '8px', border: '1px solid #c0392b', margin: '20px 0' }}>{error}</p>
          <button onClick={() => navigate(`/booking/${pending.showId}`)} style={{ background: 'transparent', color: '#0dcaf0', border: '2px solid #0dcaf0', padding: '12px 24px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Return to Seat Selection</button>
        </main>
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
      backgroundImage: 'url("https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80")',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      boxSizing: 'border-box'
    }}>
      
      {/* Dark overlay for rich cinema atmosphere */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(5, 5, 8, 0.85)', zIndex: 1 }}></div>

      <main style={{ width: '100%', maxWidth: '1200px', position: 'relative', zIndex: 2, paddingBottom: '60px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        
        <div style={{ width: '100%', maxWidth: '750px' }}>
          <div style={{ marginBottom: '25px', display: 'flex', justifyContent: 'flex-start' }}>
            <button onClick={() => navigate(`/booking/${pending.showId}`)} style={{ background: 'transparent', color: '#0dcaf0', border: '1px solid #0dcaf0', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
              ← Back to Seat Selection
            </button>
          </div>

          {/* The Ticket Stub Design matching the cinema aesthetic */}
          <div style={{ backgroundColor: '#111', color: '#fff', borderRadius: '18px', border: '2px solid #d4af37', boxShadow: '0 20px 50px rgba(0,0,0,0.9)', position: 'relative', overflow: 'hidden' }}>
            
            {/* Ticket Header with Shining Golden Banner */}
            <div style={{ backgroundColor: '#1a1a1a', padding: '35px', textAlign: 'center', borderBottom: '3px dashed #d4af37', position: 'relative' }}>
              <div style={{ position: 'absolute', bottom: '-15px', left: '-15px', width: '30px', height: '30px', backgroundColor: '#111', borderRadius: '50%', border: '2px solid #d4af37' }}></div>
              <div style={{ position: 'absolute', bottom: '-15px', right: '-15px', width: '30px', height: '30px', backgroundColor: '#111', borderRadius: '50%', border: '2px solid #d4af37' }}></div>
              
              <img src="https://api.iconify.design/pixelarticons:wallet.svg?color=%23d4af37" alt="Wallet" style={{ width: '50px', height: '50px', marginBottom: '10px', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.8))' }} />
              
              <div style={{
                background: 'linear-gradient(135deg, #ffe58f 0%, #d4af37 50%, #997415 100%)',
                padding: '12px 30px',
                borderRadius: '12px',
                boxShadow: '0 0 25px rgba(212,175,55,0.7), inset 0 2px 4px rgba(255,255,255,0.6)',
                border: '2px solid #fff',
                textAlign: 'center',
                width: '100%',
                boxSizing: 'border-box'
              }}>
                <h1 style={{ color: '#000', fontFamily: 'Georgia, serif', margin: 0, fontSize: '32px', textTransform: 'uppercase', letterSpacing: '2px', textShadow: '1px 1px 2px rgba(255,255,255,0.5)' }}>Order Summary</h1>
              </div>
            </div>

            {/* Ticket Body */}
            <section style={{ padding: '40px', backgroundColor: 'rgba(15, 15, 15, 0.95)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '25px', fontSize: '16px', borderBottom: '1px solid #333', paddingBottom: '30px', marginBottom: '30px' }}>
                <div>
                  <strong style={{ color: '#d4af37', fontSize: '13px', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Movie</strong>
                  <span style={{ fontWeight: '900', fontSize: '20px', color: '#fff' }}>{summary.movieTitle}</span>
                </div>
                <div>
                  <strong style={{ color: '#d4af37', fontSize: '13px', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Showtime</strong>
                  <span style={{ fontWeight: 'bold', color: '#fff' }}>{formatShowDate(summary.showDate)} at {String(summary.showTime).slice(0, 5)}</span>
                </div>
                <div>
                  <strong style={{ color: '#d4af37', fontSize: '13px', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Showroom</strong>
                  <span style={{ fontWeight: 'bold', color: '#fff' }}>{summary.showroomName}</span>
                </div>
                <div>
                  <strong style={{ color: '#d4af37', fontSize: '13px', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Seats & Tickets</strong>
                  <span style={{ fontWeight: '900', color: '#0dcaf0' }}>{summary.seats.map((seat) => seat.label).join(', ')} <span style={{ color: '#aaa', fontWeight: 'normal' }}>({summary.totalTickets} total)</span></span>
                </div>
              </div>

              <h2 style={{ fontSize: '20px', color: '#d4af37', margin: '0 0 15px 0', textTransform: 'uppercase', fontFamily: 'Georgia, serif' }}>Ticket Breakdown</h2>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', color: '#fff' }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left', borderBottom: '2px solid #444', padding: '12px 8px', color: '#aaa', textTransform: 'uppercase', fontSize: '13px' }}>Type</th>
                      <th style={{ textAlign: 'right', borderBottom: '2px solid #444', padding: '12px 8px', color: '#aaa', textTransform: 'uppercase', fontSize: '13px' }}>Qty</th>
                      <th style={{ textAlign: 'right', borderBottom: '2px solid #444', padding: '12px 8px', color: '#aaa', textTransform: 'uppercase', fontSize: '13px' }}>Price</th>
                      <th style={{ textAlign: 'right', borderBottom: '2px solid #444', padding: '12px 8px', color: '#aaa', textTransform: 'uppercase', fontSize: '13px' }}>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.ticketBreakdown.map((line) => (
                      <tr key={line.ticketType}>
                        <td style={{ padding: '14px 8px', borderBottom: '1px solid #222', fontWeight: 'bold', color: '#fff' }}>{line.ticketType}</td>
                        <td style={{ padding: '14px 8px', textAlign: 'right', borderBottom: '1px solid #222', color: '#ccc' }}>{line.quantity}</td>
                        <td style={{ padding: '14px 8px', textAlign: 'right', borderBottom: '1px solid #222', color: '#ccc' }}>${Number(line.pricePerTicket).toFixed(2)}</td>
                        <td style={{ padding: '14px 8px', textAlign: 'right', borderBottom: '1px solid #222', fontWeight: '900', color: '#d4af37' }}>${Number(line.subtotal).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{ fontSize: '24px', textAlign: 'right', borderTop: '2px solid #444', paddingTop: '20px', marginTop: '20px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '15px' }}>
                <span style={{ color: '#aaa', fontSize: '15px', textTransform: 'uppercase', fontWeight: 'bold' }}>Total Before Tax:</span> 
                <strong style={{ color: '#d4af37', textShadow: '0 0 10px rgba(212,175,55,0.4)' }}>${Number(summary.totalBeforeTax).toFixed(2)}</strong>
              </div>
            </section>

            {/* Ticket Footer - Email Input */}
            <section style={{ backgroundColor: '#0a0a0a', padding: '30px 40px', borderTop: '3px dashed #d4af37' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <img src="https://api.iconify.design/pixelarticons:mail.svg?color=%23d4af37" alt="Mail" style={{ width: '24px', height: '24px' }} />
                <h2 style={{ fontSize: '18px', margin: 0, color: '#d4af37', fontFamily: 'Georgia, serif' }}>Where do we send the tickets?</h2>
              </div>
              <p style={{ color: '#aaa', fontSize: '13px', marginBottom: '15px' }}>Confirm your account email or enter a different address for this order.</p>
              <input
                id="confirmationEmail"
                type="email"
                value={email}
                placeholder="Enter email address..."
                onChange={(event) => setEmail(event.target.value)}
                required
                style={{ 
                  display: 'block', width: '100%', padding: '14px 18px', boxSizing: 'border-box', 
                  borderRadius: '8px', border: '2px solid #d4af37', backgroundColor: 'rgba(0,0,0,0.9)', 
                  color: '#fff', fontSize: '16px', outline: 'none', boxShadow: '0 0 10px rgba(0,0,0,0.8)',
                  transition: 'box-shadow 0.2s' 
                }}
                onFocus={(e) => e.target.style.boxShadow = '0 0 15px rgba(212, 175, 55, 0.4)'}
                onBlur={(e) => e.target.style.boxShadow = '0 0 10px rgba(0,0,0,0.8)'}
              />
            </section>
          </div>

          {error && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', backgroundColor: 'rgba(192, 57, 43, 0.3)', padding: '14px', borderRadius: '10px', marginTop: '25px', border: '1px solid #c0392b' }}>
              <img src="https://api.iconify.design/pixelarticons:alert.svg?color=%23ffb3b3" alt="Alert" style={{ width: '24px', height: '24px' }} />
              <p style={{ color: '#ffb3b3', fontWeight: 'bold', margin: 0, fontSize: '15px' }}>{error}</p>
            </div>
          )}

          <div style={{ textAlign: 'center', marginTop: '35px', marginBottom: '50px' }}>
            <button
              type="button"
              onClick={continueToPayment}
              disabled={submitting}
              style={{ 
                background: 'linear-gradient(90deg, #d4af37 0%, #b38f27 100%)', color: '#000', 
                fontWeight: '900', padding: '18px 36px', border: 'none', borderRadius: '12px', 
                cursor: submitting ? 'not-allowed' : 'pointer', fontSize: '20px', boxShadow: '0 8px 25px rgba(212,175,55,0.4)',
                opacity: submitting ? 0.7 : 1, width: '100%', textTransform: 'uppercase', letterSpacing: '1px',
                transition: 'transform 0.2s'
              }}
              onMouseEnter={(e) => { if(!submitting) e.currentTarget.style.transform = 'translateY(-2px)' }}
              onMouseLeave={(e) => { if(!submitting) e.currentTarget.style.transform = 'translateY(0)' }}
            >
              {submitting ? 'Verifying...' : 'Continue to Payment 💳🍿'}
            </button>
          </div>
        </div>

      </main>
    </div>
  );
};

export default CheckoutSummary;