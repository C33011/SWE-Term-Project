import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getToken } from './auth';

const PAYMENT_STATE_KEY = 'checkoutForPayment';
const PENDING_BOOKING_KEY = 'pendingBooking';
const LAST_ORDER_KEY = 'lastCompletedOrder';

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
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [newCard, setNewCard] = useState({
    cardNumber: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: '',
    billingAddress: '',
    saveCard: false,
  });

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
        const savedCards = data.cards || [];
        setCards(savedCards);
        if (savedCards.length > 0) setSelectedMethod(String(savedCards[0].cardId));
      })
      .catch(() => {
        if (!cancelled) setCards([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingCards(false);
      });

    return () => { cancelled = true; };
  }, []);

  const updateNewCard = (field, value) => {
    setNewCard((current) => ({ ...current, [field]: value }));
  };

  const placeOrder = async () => {
    setError(null);
    if (!paymentState?.pendingBooking) {
      setError('Your booking information is missing. Return to the order summary.');
      return;
    }

    const payment = selectedMethod === 'new'
      ? { type: 'new', ...newCard }
      : { type: 'saved', cardId: Number(selectedMethod) };

    setProcessing(true);
    try {
      const pending = paymentState.pendingBooking;
      const response = await fetch('/api/orders/place', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          showId: pending.showId,
          seatIds: pending.seatIds,
          ticketCounts: pending.tickets,
          confirmationEmail: paymentState.confirmationEmail,
          lockSessionId: pending.lockSessionId,
          payment,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Payment could not be completed.');

      sessionStorage.setItem(LAST_ORDER_KEY, JSON.stringify(data.order));
      sessionStorage.removeItem(PENDING_BOOKING_KEY);
      sessionStorage.removeItem(PAYMENT_STATE_KEY);
      navigate(`/confirmation/${data.order.bookingId}`, {
        replace: true,
        state: { order: data.order },
      });
    } catch (paymentError) {
      setError(paymentError.message);
    } finally {
      setProcessing(false);
    }
  };

  if (!paymentState?.summary) {
    return (
      <div style={pageStyle}>
        <div style={overlayStyle}></div>
        <main style={{ ...cardStyle, position: 'relative', zIndex: 2, textAlign: 'center', maxWidth: '520px' }}>
          <h1 style={goldHeading}>No Order Ready for Payment</h1>
          <p style={{ color: '#bbb', margin: '16px 0 26px' }}>Complete the order summary before opening the payment page.</p>
          <button onClick={() => navigate('/')} style={goldButton}>Browse Movies 🍿</button>
        </main>
      </div>
    );
  }

  const { summary, confirmationEmail } = paymentState;

  return (
    <div style={pageStyle}>
      <div style={overlayStyle}></div>
      <main style={{ width: '100%', maxWidth: '760px', position: 'relative', zIndex: 2, paddingBottom: '60px' }}>
        <button onClick={() => navigate('/checkout')} style={backButton}>← Back to Order Summary</button>

        <div style={{ ...cardStyle, marginTop: '24px' }}>
          <div style={goldBanner}>
            <h1 style={{ color: '#000', fontFamily: 'Georgia, serif', fontSize: '29px', margin: 0, letterSpacing: '2px' }}>PAYMENT GATEWAY</h1>
          </div>
          <p style={{ color: '#bdeeff', textAlign: 'center', margin: '18px 0 28px', fontWeight: 'bold' }}>
            Secure mock payment for the course project. No external card network is contacted.
          </p>

          <section style={sectionStyle}>
            <h2 style={sectionHeading}>Order Details</h2>
            <p style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '8px' }}>{summary.movieTitle}</p>
            <p style={mutedText}>{summary.seats.map((seat) => seat.label).join(', ')} · {summary.totalTickets} ticket(s)</p>
            <p style={mutedText}>Confirmation email: <strong style={{ color: '#0dcaf0' }}>{confirmationEmail}</strong></p>
            <p style={{ fontSize: '24px', margin: '14px 0 0' }}>Amount: <strong style={{ color: '#d4af37' }}>${Number(summary.totalBeforeTax).toFixed(2)}</strong></p>
          </section>

          <section>
            <h2 style={sectionHeading}>Choose Payment Method</h2>
            {loadingCards ? (
              <p style={mutedText}>Loading saved payment methods…</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {cards.map((card) => (
                  <PaymentChoice
                    key={card.cardId}
                    selected={selectedMethod === String(card.cardId)}
                    onSelect={() => setSelectedMethod(String(card.cardId))}
                  >
                    Saved card ending in <strong style={{ color: '#d4af37' }}>{card.lastFour}</strong> — expires {String(card.expiryMonth).padStart(2, '0')}/{card.expiryYear}
                  </PaymentChoice>
                ))}
                <PaymentChoice selected={selectedMethod === 'new'} onSelect={() => setSelectedMethod('new')}>
                  Enter a different card
                </PaymentChoice>
              </div>
            )}

            {selectedMethod === 'new' && (
              <div style={{ border: '2px dashed #555', backgroundColor: 'rgba(0,0,0,0.45)', padding: '22px', borderRadius: '12px', marginTop: '16px' }}>
                <label style={labelStyle}>Card number *</label>
                <input
                  value={newCard.cardNumber}
                  onChange={(event) => updateNewCard('cardNumber', event.target.value)}
                  placeholder="4242 4242 4242 4242"
                  inputMode="numeric"
                  autoComplete="cc-number"
                  style={inputStyle}
                />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                  <div><label style={labelStyle}>Month *</label><input value={newCard.expiryMonth} onChange={(event) => updateNewCard('expiryMonth', event.target.value)} placeholder="MM" inputMode="numeric" autoComplete="cc-exp-month" style={inputStyle} /></div>
                  <div><label style={labelStyle}>Year *</label><input value={newCard.expiryYear} onChange={(event) => updateNewCard('expiryYear', event.target.value)} placeholder="YYYY" inputMode="numeric" autoComplete="cc-exp-year" style={inputStyle} /></div>
                  <div><label style={labelStyle}>CVV *</label><input value={newCard.cvv} onChange={(event) => updateNewCard('cvv', event.target.value)} placeholder="123" inputMode="numeric" autoComplete="cc-csc" type="password" style={inputStyle} /></div>
                </div>
                <label style={labelStyle}>Billing address *</label>
                <textarea value={newCard.billingAddress} onChange={(event) => updateNewCard('billingAddress', event.target.value)} rows="3" style={{ ...inputStyle, resize: 'vertical' }} />
                <label style={{ color: '#ddd', display: 'flex', gap: '10px', alignItems: 'center', cursor: 'pointer' }}>
                  <input type="checkbox" checked={newCard.saveCard} onChange={(event) => updateNewCard('saveCard', event.target.checked)} style={{ accentColor: '#d4af37', width: '18px', height: '18px' }} />
                  Save this card to my profile (maximum 3)
                </label>
                <p style={{ color: '#999', marginTop: '12px', fontSize: '12px' }}>CVV is validated for this payment and is never stored.</p>
              </div>
            )}
          </section>

          {error && <div role="alert" style={errorStyle}>{error}</div>}

          <button type="button" onClick={placeOrder} disabled={processing || loadingCards} style={{ ...goldButton, width: '100%', marginTop: '28px', opacity: processing ? 0.7 : 1 }}>
            {processing ? 'Processing Payment…' : `Pay $${Number(summary.totalBeforeTax).toFixed(2)} 🎟️🍿`}
          </button>
        </div>
      </main>
    </div>
  );
};

function PaymentChoice({ selected, onSelect, children }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: '12px', border: selected ? '2px solid #d4af37' : '1px solid #444', backgroundColor: 'rgba(0,0,0,0.8)', padding: '16px', borderRadius: '10px', cursor: 'pointer' }}>
      <input type="radio" name="paymentMethod" checked={selected} onChange={onSelect} style={{ width: '18px', height: '18px', accentColor: '#d4af37' }} />
      <span style={{ color: '#fff', fontSize: '15px' }}>{children}</span>
    </label>
  );
}

const pageStyle = {
  backgroundColor: '#111', color: '#fff', minHeight: '100vh', width: '100%', padding: '40px 20px', position: 'relative',
  fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
  backgroundImage: 'url("https://imgs.search.brave.com/a715Z0ex2Qu-F4wCJFnt_UF70nbU3hYm7ln-mfnmk5E/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9tZWRp/YS5nZXR0eWltYWdl/cy5jb20vaWQvMTQ5/MjIwNjA3OC9waG90/by9oYXBweS1mYW1p/bHktYnV5aW5nLW1v/dmllLXRpY2tldHMt/aW4tY2luZW1hLmpw/Zz9zPTYxMng2MTIm/dz0wJms9MjAmYz1M/aFFfczBwVW9XRlgt/cjYteGRxSEZlN08y/eG5oTVd6OGdka2Vy/ZndwWEpFPQ")',
  backgroundSize: 'cover', backgroundPosition: 'center', display: 'flex', justifyContent: 'center', boxSizing: 'border-box',
};
const overlayStyle = { position: 'absolute', inset: 0, backgroundColor: 'rgba(5,5,8,0.84)', zIndex: 1 };
const cardStyle = { backgroundColor: 'rgba(15,15,15,0.96)', backdropFilter: 'blur(10px)', padding: '40px', borderRadius: '18px', border: '2px solid #d4af37', boxShadow: '0 20px 50px rgba(0,0,0,0.9)' };
const goldBanner = { background: 'linear-gradient(135deg,#ffe58f 0%,#d4af37 50%,#997415 100%)', padding: '14px 30px', borderRadius: '12px', boxShadow: '0 0 25px rgba(212,175,55,0.7)', border: '2px solid #fff', textAlign: 'center' };
const goldHeading = { color: '#d4af37', fontFamily: 'Georgia, serif' };
const sectionStyle = { border: '1px solid #333', borderRadius: '12px', padding: '24px', marginBottom: '30px', backgroundColor: 'rgba(0,0,0,0.6)' };
const sectionHeading = { color: '#d4af37', fontFamily: 'Georgia, serif', fontSize: '21px', borderBottom: '1px solid #333', paddingBottom: '10px', marginBottom: '16px' };
const mutedText = { color: '#aaa', fontSize: '14px', marginBottom: '8px' };
const labelStyle = { color: '#ddd', fontSize: '13px', fontWeight: 'bold', display: 'block', marginBottom: '6px' };
const inputStyle = { display: 'block', width: '100%', padding: '12px 14px', marginBottom: '16px', boxSizing: 'border-box', borderRadius: '8px', border: '2px solid #d4af37', backgroundColor: 'rgba(0,0,0,0.9)', color: '#fff', fontSize: '15px', outline: 'none' };
const backButton = { background: 'transparent', color: '#0dcaf0', border: '1px solid #0dcaf0', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' };
const goldButton = { background: 'linear-gradient(90deg,#d4af37 0%,#b38f27 100%)', color: '#000', fontWeight: '900', padding: '16px 28px', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '17px', textTransform: 'uppercase', letterSpacing: '1px', boxShadow: '0 8px 20px rgba(212,175,55,0.35)' };
const errorStyle = { color: '#ffb3b3', backgroundColor: 'rgba(192,57,43,0.3)', border: '1px solid #c0392b', padding: '14px', borderRadius: '10px', marginTop: '20px', textAlign: 'center', fontWeight: 'bold' };

export default PaymentPage;
