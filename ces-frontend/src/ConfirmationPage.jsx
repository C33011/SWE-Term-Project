import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { getToken } from './auth';

const LAST_ORDER_KEY = 'lastCompletedOrder';

function formatDate(value) {
  const text = String(value || '').slice(0, 10);
  const [year, month, day] = text.split('-').map(Number);
  return year && month && day ? new Date(year, month - 1, day).toLocaleDateString() : text;
}

const ConfirmationPage = () => {
  const { bookingId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [order, setOrder] = useState(location.state?.order || null);
  const [loading, setLoading] = useState(!location.state?.order);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (order) return;
    try {
      const cached = JSON.parse(sessionStorage.getItem(LAST_ORDER_KEY) || 'null');
      if (cached && String(cached.bookingId) === String(bookingId)) {
        setOrder(cached);
        setLoading(false);
        return;
      }
    } catch {
      sessionStorage.removeItem(LAST_ORDER_KEY);
    }

    fetch(`/api/orders/${bookingId}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Could not retrieve this booking.');
        return data.order;
      })
      .then(setOrder)
      .catch((loadError) => setError(loadError.message))
      .finally(() => setLoading(false));
  }, [bookingId, order]);

  if (loading) return <CenteredMessage text="Loading your confirmed tickets… 🎟️" />;
  if (error || !order) return <CenteredMessage text={error || 'Booking not found.'} error />;

  return (
    <div style={pageStyle}>
      <div style={overlayStyle}></div>
      <main style={{ ...cardStyle, position: 'relative', zIndex: 2, width: '100%', maxWidth: '780px' }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ fontSize: '42px', lineHeight: 1 }}>✅</div>
          <h1 style={{ color: '#d4af37', fontFamily: 'Georgia, serif', fontSize: '34px', margin: '8px 0' }}>Booking Confirmed!</h1>
          <p style={{ color: '#0dcaf0', fontWeight: 'bold', letterSpacing: '1px' }}>{order.confirmationNumber}</p>
          {order.emailWarning && <p style={{ color: '#ffcf70', marginTop: '12px' }}>{order.emailWarning}</p>}
        </div>

        <section style={sectionStyle}>
          <h2 style={sectionHeading}>{order.movieTitle}</h2>
          <p><strong>Showtime:</strong> {formatDate(order.showDate)} at {String(order.showTime).slice(0, 5)}</p>
          <p><strong>Showroom:</strong> {order.showroomName}</p>
          <p><strong>Confirmation email:</strong> {order.confirmationEmail}</p>
          <p><strong>Payment:</strong> {order.paymentMethod} ending in {order.cardLastFour}</p>
        </section>

        <section style={sectionStyle}>
          <h2 style={sectionHeading}>Tickets</h2>
          {(order.tickets || []).map((ticket) => (
            <div key={ticket.ticketId || `${ticket.seatId}-${ticket.ticketType}`} style={ticketRow}>
              <span>{ticket.ticketType} — Seat <strong style={{ color: '#0dcaf0' }}>{ticket.label}</strong></span>
              <strong style={{ color: '#d4af37' }}>${Number(ticket.price).toFixed(2)}</strong>
            </div>
          ))}
          <div style={{ ...ticketRow, borderTop: '2px solid #d4af37', marginTop: '12px', paddingTop: '16px', fontSize: '21px' }}>
            <strong>Total paid</strong>
            <strong style={{ color: '#d4af37' }}>${Number(order.totalAmount).toFixed(2)}</strong>
          </div>
        </section>

        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <button onClick={() => navigate('/orders')} style={goldButton}>View Order History</button>
          <button onClick={() => navigate('/')} style={outlineButton}>Browse More Movies</button>
        </div>
      </main>
    </div>
  );
};

function CenteredMessage({ text, error = false }) {
  return (
    <div style={{ ...pageStyle, alignItems: 'center' }}>
      <div style={overlayStyle}></div>
      <div style={{ ...cardStyle, position: 'relative', zIndex: 2, color: error ? '#ffb3b3' : '#d4af37', textAlign: 'center', fontSize: '20px' }}>{text}</div>
    </div>
  );
}

const pageStyle = { minHeight: '100vh', padding: '45px 20px', color: '#fff', backgroundColor: '#111', backgroundImage: 'url("https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1920&q=80")', backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative', display: 'flex', justifyContent: 'center', fontFamily: '"Segoe UI",Tahoma,sans-serif', boxSizing: 'border-box' };
const overlayStyle = { position: 'absolute', inset: 0, backgroundColor: 'rgba(5,5,8,0.87)', zIndex: 1 };
const cardStyle = { backgroundColor: 'rgba(15,15,15,0.96)', padding: '40px', border: '2px solid #d4af37', borderRadius: '18px', boxShadow: '0 20px 55px rgba(0,0,0,0.9)', boxSizing: 'border-box' };
const sectionStyle = { backgroundColor: 'rgba(0,0,0,0.62)', border: '1px solid #3b3b3b', borderRadius: '12px', padding: '24px', marginBottom: '22px', lineHeight: 1.8 };
const sectionHeading = { color: '#d4af37', fontFamily: 'Georgia,serif', borderBottom: '1px solid #444', paddingBottom: '10px', marginBottom: '14px' };
const ticketRow = { display: 'flex', justifyContent: 'space-between', gap: '15px', padding: '10px 0', borderBottom: '1px solid #333' };
const goldButton = { background: 'linear-gradient(90deg,#d4af37,#b38f27)', color: '#000', border: 'none', borderRadius: '9px', padding: '14px 24px', cursor: 'pointer', fontWeight: '900' };
const outlineButton = { background: 'transparent', color: '#0dcaf0', border: '1px solid #0dcaf0', borderRadius: '9px', padding: '14px 24px', cursor: 'pointer', fontWeight: 'bold' };

export default ConfirmationPage;
