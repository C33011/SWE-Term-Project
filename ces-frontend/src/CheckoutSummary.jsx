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
    return <div style={{ padding: '35px', textAlign: 'center' }}>Building your order summary…</div>;
  }

  if (!pending) {
    return (
      <main style={{ maxWidth: '650px', margin: '40px auto', padding: '0 20px', fontFamily: 'Arial' }}>
        <h1>No Pending Booking</h1>
        <p>Select a movie, showtime, tickets, and seats before checking out.</p>
        <button onClick={() => navigate('/')}>Browse Movies</button>
      </main>
    );
  }

  if (error && !summary) {
    return (
      <main style={{ maxWidth: '650px', margin: '40px auto', padding: '0 20px', fontFamily: 'Arial' }}>
        <h1>Checkout Could Not Continue</h1>
        <p role="alert" style={{ color: '#c0392b', fontWeight: 'bold' }}>{error}</p>
        <button onClick={() => navigate(`/booking/${pending.showId}`)}>Return to Seat Selection</button>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: '720px', margin: '40px auto', padding: '0 20px', fontFamily: 'Arial' }}>
      <button onClick={() => navigate(`/booking/${pending.showId}`)} style={{ marginBottom: '18px' }}>
        ← Back to Seat Selection
      </button>

      <h1>Order Summary</h1>
      <section style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '22px' }}>
        <p><strong>Movie:</strong> {summary.movieTitle}</p>
        <p>
          <strong>Showtime:</strong> {formatShowDate(summary.showDate)} at {String(summary.showTime).slice(0, 5)}
        </p>
        <p><strong>Showroom:</strong> {summary.showroomName}</p>
        <p><strong>Selected seats:</strong> {summary.seats.map((seat) => seat.label).join(', ')}</p>
        <p><strong>Number of tickets:</strong> {summary.totalTickets}</p>

        <h2 style={{ fontSize: '20px', marginTop: '25px' }}>Ticket Breakdown</h2>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc', padding: '8px' }}>Type</th>
                <th style={{ textAlign: 'right', borderBottom: '1px solid #ccc', padding: '8px' }}>Quantity</th>
                <th style={{ textAlign: 'right', borderBottom: '1px solid #ccc', padding: '8px' }}>Price each</th>
                <th style={{ textAlign: 'right', borderBottom: '1px solid #ccc', padding: '8px' }}>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {summary.ticketBreakdown.map((line) => (
                <tr key={line.ticketType}>
                  <td style={{ padding: '8px' }}>{line.ticketType}</td>
                  <td style={{ padding: '8px', textAlign: 'right' }}>{line.quantity}</td>
                  <td style={{ padding: '8px', textAlign: 'right' }}>${Number(line.pricePerTicket).toFixed(2)}</td>
                  <td style={{ padding: '8px', textAlign: 'right' }}>${Number(line.subtotal).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p style={{ fontSize: '21px', textAlign: 'right', borderTop: '1px solid #ccc', paddingTop: '15px' }}>
          <strong>Total before tax: ${Number(summary.totalBeforeTax).toFixed(2)}</strong>
        </p>
      </section>

      <section style={{ marginTop: '25px' }}>
        <h2>Confirmation Email</h2>
        <p>Confirm your account email or enter a different address for this order.</p>
        <label htmlFor="confirmationEmail">Email address *</label>
        <input
          id="confirmationEmail"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          style={{ display: 'block', width: '100%', padding: '10px', boxSizing: 'border-box', marginTop: '6px' }}
        />
      </section>

      {error && <p role="alert" style={{ color: '#c0392b', fontWeight: 'bold' }}>{error}</p>}

      <button
        type="button"
        onClick={continueToPayment}
        disabled={submitting}
        style={{ marginTop: '20px', padding: '11px 24px', cursor: 'pointer' }}
      >
        {submitting ? 'Confirming…' : 'Confirm and Continue to Payment →'}
      </button>
    </main>
  );
};

export default CheckoutSummary;
