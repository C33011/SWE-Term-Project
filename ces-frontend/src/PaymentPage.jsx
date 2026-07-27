import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getToken } from './auth';

const PAYMENT_STATE_KEY = 'checkoutForPayment';

function readStoredPaymentState() {
  try {
    const raw = sessionStorage.getItem(PAYMENT_STATE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    sessionStorage.removeItem(PAYMENT_STATE_KEY);
    return null;
  }
}

const PaymentPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const paymentState = location.state || readStoredPaymentState();
  const [cards, setCards] = useState([]);
  const [selectedMethod, setSelectedMethod] = useState('new');
  const [loadingCards, setLoadingCards] = useState(true);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/profile/cards', {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Could not load saved cards.');
        return data;
      })
      .then((data) => {
        if (cancelled) return;
        setCards(data.cards || []);
        if ((data.cards || []).length > 0) {
          setSelectedMethod(String(data.cards[0].cardId));
        }
      })
      .catch(() => {
        if (!cancelled) setCards([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingCards(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (!paymentState?.summary) {
    return (
      <div style={{ backgroundColor: '#111', color: '#fff', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px', fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif' }}>
        <div style={{ maxWidth: '500px', backgroundColor: 'rgba(15, 15, 15, 0.95)', backdropFilter: 'blur(10px)', padding: '40px', borderRadius: '18px', border: '2px solid #d4af37', boxShadow: '0 20px 50px rgba(0,0,0,0.9)', textAlign: 'center' }}>
          <img src="https://api.iconify.design/pixelarticons:warning.svg?color=%23d4af37" alt="Warning" style={{ width: '50px', height: '50px', marginBottom: '15px' }} />
          <h1 style={{ color: '#d4af37', fontFamily: 'Georgia, serif', fontSize: '26px', margin: '0 0 15px 0' }}>No Order Ready for Payment</h1>
          <p style={{ color: '#aaa', fontSize: '15px', marginBottom: '25px' }}>Complete the order summary before opening the payment page.</p>
          <button 
            onClick={() => navigate('/')}
            style={{ 
              background: 'linear-gradient(90deg, #d4af37 0%, #b38f27 100%)', color: '#000', 
              fontWeight: '900', padding: '14px 28px', border: 'none', borderRadius: '10px', 
              cursor: 'pointer', fontSize: '16px', textTransform: 'uppercase', letterSpacing: '1px'
            }}
          >
            Browse Movies 🍿
          </button>
        </div>
      </div>
    );
  }

  const { summary, confirmationEmail } = paymentState;

  const input = { 
    display: 'block', width: '100%', padding: '12px 16px', marginBottom: '16px', 
    boxSizing: 'border-box', borderRadius: '8px', border: '2px solid #d4af37', 
    backgroundColor: 'rgba(0, 0, 0, 0.9)', color: '#fff', fontSize: '15px', outline: 'none',
    boxShadow: '0 0 10px rgba(0,0,0,0.8)'
  };

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
      backgroundImage: 'url("https://imgs.search.brave.com/a715Z0ex2Qu-F4wCJFnt_UF70nbU3hYm7ln-mfnmk5E/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9tZWRp/YS5nZXR0eWltYWdl/cy5jb20vaWQvMTQ5/MjIwNjA3OC9waG90/by9oYXBweS1mYW1p/bHktYnV5aW5nLW1v/dmllLXRpY2tldHMt/aW4tY2luZW1hLmpw/Zz9zPTYxMng2MTIm/dz0wJms9MjAmYz1M/aFFfczBwVW9XRlgt/cjYteGRxSEZlN08y/eG5oTVd6OGdka2Vy/ZndwWEpFPQ")',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      boxSizing: 'border-box'
    }}>
      
      {/* Dark overlay for rich cinema concession / payment atmosphere */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(5, 5, 8, 0.82)', zIndex: 1 }}></div>

      <main style={{ width: '100%', maxWidth: '1200px', position: 'relative', zIndex: 2, paddingBottom: '60px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        
        <div style={{ width: '100%', maxWidth: '720px' }}>
          <div style={{ marginBottom: '25px', display: 'flex', justifyContent: 'flex-start' }}>
            <button onClick={() => navigate('/checkout')} style={{ background: 'transparent', color: '#0dcaf0', border: '1px solid #0dcaf0', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>← Back to Order Summary</button>
          </div>

          {/* Payment Main Box Container */}
          <div style={{ 
            backgroundColor: 'rgba(15, 15, 15, 0.95)', backdropFilter: 'blur(10px)', 
            padding: '40px', borderRadius: '18px', border: '2px solid #d4af37', 
            boxShadow: '0 20px 50px rgba(0,0,0,0.9)' 
          }}>
            
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '30px' }}>
              
              
              {/* Shining Golden Background Header */}
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
                <h1 style={{ color: '#000', fontFamily: 'Georgia, serif', fontSize: '28px', margin: 0, textTransform: 'uppercase', letterSpacing: '2px', textShadow: '1px 1px 2px rgba(255,255,255,0.5)' }}>Payment Gateway</h1>
              </div>

              <p style={{ color: '#ffb3b3', backgroundColor: 'rgba(192, 57, 43, 0.25)', border: '1px solid #c0392b', padding: '12px 16px', borderRadius: '8px', marginTop: '18px', fontSize: '13px', textAlign: 'center', fontWeight: 'bold', width: '100%', boxSizing: 'border-box' }}>
                ⚠️ Sprint 3 payment mockup: no card will be charged and no final booking will be created on this page.
              </p>
            </div>

            <section style={{ border: '1px solid #333', borderRadius: '12px', padding: '25px', marginBottom: '30px', backgroundColor: 'rgba(0,0,0,0.6)' }}>
              <h2 style={{ marginTop: 0, color: '#d4af37', fontFamily: 'Georgia, serif', fontSize: '20px', borderBottom: '1px solid #333', paddingBottom: '10px' }}>Order Details</h2>
              <p style={{ fontSize: '18px', fontWeight: 'bold', color: '#fff', marginBottom: '8px' }}>{summary.movieTitle}</p>
              <p style={{ color: '#aaa', fontSize: '14px', marginBottom: '8px' }}>{summary.seats.map((seat) => seat.label).join(', ')} · {summary.totalTickets} ticket(s)</p>
              <p style={{ color: '#aaa', fontSize: '14px', marginBottom: '15px' }}>Confirmation email: <strong style={{ color: '#0dcaf0' }}>{confirmationEmail}</strong></p>
              <p style={{ fontSize: '22px', margin: 0 }}><strong>Amount: <span style={{ color: '#d4af37' }}>${Number(summary.totalBeforeTax).toFixed(2)}</span></strong></p>
            </section>

            <section style={{ marginBottom: '25px' }}>
              <h2 style={{ color: '#d4af37', fontFamily: 'Georgia, serif', fontSize: '20px', marginBottom: '15px' }}>Choose Payment Method</h2>
              {loadingCards ? (
                <p style={{ color: '#888' }}>Loading saved payment methods…</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {cards.map((card) => (
                    <label key={card.cardId} style={{ display: 'flex', alignItems: 'center', gap: '12px', border: selectedMethod === String(card.cardId) ? '2px solid #d4af37' : '1px solid #333', backgroundColor: 'rgba(0,0,0,0.8)', padding: '16px', borderRadius: '10px', cursor: 'pointer', transition: 'all 0.2s' }}>
                      <input
                        type="radio"
                        name="paymentMethod"
                        value={card.cardId}
                        checked={selectedMethod === String(card.cardId)}
                        onChange={(event) => setSelectedMethod(event.target.value)}
                        style={{ width: '18px', height: '18px', accentColor: '#d4af37' }}
                      />
                      <span style={{ color: '#fff', fontSize: '15px' }}>Saved card ending in <strong style={{ color: '#d4af37' }}>{card.lastFour}</strong> — expires {String(card.expiryMonth).padStart(2, '0')}/{card.expiryYear}</span>
                    </label>
                  ))}

                  <label style={{ display: 'flex', alignItems: 'center', gap: '12px', border: selectedMethod === 'new' ? '2px solid #d4af37' : '1px solid #333', backgroundColor: 'rgba(0,0,0,0.8)', padding: '16px', borderRadius: '10px', cursor: 'pointer', transition: 'all 0.2s' }}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="new"
                      checked={selectedMethod === 'new'}
                      onChange={(event) => setSelectedMethod(event.target.value)}
                      style={{ width: '18px', height: '18px', accentColor: '#d4af37' }}
                    />
                    <span style={{ color: '#fff', fontSize: '15px' }}>Enter a different card</span>
                  </label>
                </div>
              )}

              {selectedMethod === 'new' && (
                <div style={{ border: '2px dashed #444', backgroundColor: 'rgba(0,0,0,0.4)', padding: '20px', borderRadius: '12px', marginTop: '15px' }}>
                  <label style={{ color: '#ccc', fontSize: '13px', fontWeight: 'bold' }}>Card number</label>
                  <input disabled placeholder="Card entry enabled in final sprint" style={input} />
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <input disabled placeholder="MM/YY" style={{ ...input, marginBottom: 0, flex: 1 }} />
                    <input disabled placeholder="CVV" style={{ ...input, marginBottom: 0, flex: 1 }} />
                  </div>
                </div>
              )}
            </section>

            {message && (
              <div style={{ backgroundColor: 'rgba(46, 204, 113, 0.2)', border: '1px solid #27ae60', padding: '14px', borderRadius: '10px', marginBottom: '20px', textAlign: 'center' }}>
                <p role="status" style={{ color: '#2ecc71', fontWeight: 'bold', margin: 0, fontSize: '14px' }}>{message}</p>
              </div>
            )}

            <button
              type="button"
              onClick={() => setMessage('Payment processing is intentionally disabled for Sprint 3. No charge was made.')}
              style={{ 
                width: '100%', marginTop: '10px', padding: '16px 20px', cursor: 'pointer', 
                background: 'linear-gradient(90deg, #d4af37 0%, #b38f27 100%)', color: '#000', 
                fontWeight: '900', border: 'none', borderRadius: '10px', fontSize: '18px', 
                boxShadow: '0 8px 20px rgba(212,175,55,0.4)', textTransform: 'uppercase', letterSpacing: '1px',
                transition: 'transform 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              Pay ${Number(summary.totalBeforeTax).toFixed(2)} (Mockup) 🎟️🍿
            </button>
          </div>
        </div>

      </main>
    </div>
  );
};

export default PaymentPage;