import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getToken } from './auth';

function formatDate(value) {
  const text = String(value || '').slice(0, 10);
  const [year, month, day] = text.split('-').map(Number);
  return year && month && day ? new Date(year, month - 1, day).toLocaleDateString() : text;
}

const OrderHistory = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('/api/orders', { headers: { Authorization: `Bearer ${getToken()}` } })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Could not load order history.');
        return data.orders || [];
      })
      .then(setOrders)
      .catch((loadError) => setError(loadError.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={pageStyle}>
      <div style={overlayStyle}></div>
      <main style={{ width: '100%', maxWidth: '980px', position: 'relative', zIndex: 2 }}>
        <div style={headerStyle}>
          <h1 style={{ color: '#000', fontFamily: 'Georgia,serif', margin: 0 }}>🎟️ My Order History</h1>
        </div>
        {loading && <div style={messageCard}>Loading your cinema memories…</div>}
        {error && <div style={{ ...messageCard, color: '#ffb3b3' }}>{error}</div>}
        {!loading && !error && orders.length === 0 && (
          <div style={messageCard}>
            <h2 style={{ color: '#d4af37' }}>No completed orders yet</h2>
            <p style={{ color: '#bbb', margin: '12px 0 20px' }}>Your confirmed movie bookings will appear here.</p>
            <button onClick={() => navigate('/')} style={goldButton}>Browse Movies</button>
          </div>
        )}
        <div style={{ display: 'grid', gap: '18px' }}>
          {orders.map((order) => (
            <article key={order.bookingId} style={orderCard}>
              <div>
                <h2 style={{ color: '#d4af37', fontFamily: 'Georgia,serif', marginBottom: '8px' }}>{order.movieTitle}</h2>
                <p style={muted}>{formatDate(order.showDate)} at {String(order.showTime).slice(0, 5)} · {order.showroomName}</p>
                <p style={muted}>Seats: {order.seatLabels} · {order.ticketCount} ticket(s)</p>
                <p style={{ color: '#0dcaf0', fontWeight: 'bold', marginTop: '8px' }}>{order.confirmationNumber}</p>
              </div>
              <div style={{ textAlign: 'right', minWidth: '150px' }}>
                <p style={{ color: '#7dffb3', fontWeight: 'bold' }}>{order.status}</p>
                <p style={{ color: '#fff', fontSize: '22px', fontWeight: 'bold', margin: '12px 0' }}>${Number(order.totalAmount).toFixed(2)}</p>
                <button onClick={() => navigate(`/confirmation/${order.bookingId}`)} style={outlineButton}>View Details</button>
              </div>
            </article>
          ))}
        </div>
      </main>
    </div>
  );
};

const pageStyle = { minHeight: '100vh', padding: '45px 20px', backgroundColor: '#111', backgroundImage: 'url("https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=1920&q=80")', backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative', display: 'flex', justifyContent: 'center', color: '#fff', fontFamily: '"Segoe UI",Tahoma,sans-serif', boxSizing: 'border-box' };
const overlayStyle = { position: 'absolute', inset: 0, backgroundColor: 'rgba(5,5,8,0.9)', zIndex: 1 };
const headerStyle = { background: 'linear-gradient(135deg,#ffe58f,#d4af37,#997415)', border: '2px solid #fff', boxShadow: '0 0 24px rgba(212,175,55,0.55)', borderRadius: '14px', padding: '18px 28px', textAlign: 'center', marginBottom: '28px' };
const orderCard = { backgroundColor: 'rgba(15,15,15,0.96)', border: '2px solid #d4af37', borderRadius: '15px', padding: '25px', boxShadow: '0 12px 35px rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'space-between', gap: '24px', flexWrap: 'wrap' };
const messageCard = { backgroundColor: 'rgba(15,15,15,0.96)', border: '2px solid #d4af37', borderRadius: '15px', padding: '35px', textAlign: 'center', color: '#d4af37' };
const muted = { color: '#bbb', margin: '5px 0' };
const goldButton = { background: 'linear-gradient(90deg,#d4af37,#b38f27)', color: '#000', border: 'none', borderRadius: '9px', padding: '12px 22px', cursor: 'pointer', fontWeight: '900' };
const outlineButton = { background: 'transparent', color: '#0dcaf0', border: '1px solid #0dcaf0', borderRadius: '8px', padding: '10px 16px', cursor: 'pointer', fontWeight: 'bold' };

export default OrderHistory;
