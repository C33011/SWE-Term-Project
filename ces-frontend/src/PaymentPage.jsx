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
      <main style={{ maxWidth: '650px', margin: '40px auto', padding: '0 20px', fontFamily: 'Arial' }}>
        <h1>No Order Ready for Payment</h1>
        <p>Complete the order summary before opening the payment page.</p>
        <button onClick={() => navigate('/')}>Browse Movies</button>
      </main>
    );
  }

  const { summary, confirmationEmail } = paymentState;

  return (
    <main style={{ maxWidth: '720px', margin: '40px auto', padding: '0 20px', fontFamily: 'Arial' }}>
      <button onClick={() => navigate('/checkout')} style={{ marginBottom: '18px' }}>← Back to Order Summary</button>
      <h1>Payment</h1>
      <p style={{ padding: '12px', background: '#fff3cd', border: '1px solid #ffe69c', borderRadius: '6px' }}>
        Sprint 3 payment mockup: no card will be charged and no final booking will be created on this page.
      </p>

      <section style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '20px', marginBottom: '24px' }}>
        <h2 style={{ marginTop: 0 }}>Order</h2>
        <p><strong>{summary.movieTitle}</strong></p>
        <p>{summary.seats.map((seat) => seat.label).join(', ')} · {summary.totalTickets} ticket(s)</p>
        <p>Confirmation email: {confirmationEmail}</p>
        <p style={{ fontSize: '22px' }}><strong>Amount: ${Number(summary.totalBeforeTax).toFixed(2)}</strong></p>
      </section>

      <section>
        <h2>Choose Payment Method</h2>
        {loadingCards ? (
          <p>Loading saved payment methods…</p>
        ) : (
          <>
            {cards.map((card) => (
              <label key={card.cardId} style={{ display: 'block', border: '1px solid #ccc', padding: '14px', marginBottom: '10px' }}>
                <input
                  type="radio"
                  name="paymentMethod"
                  value={card.cardId}
                  checked={selectedMethod === String(card.cardId)}
                  onChange={(event) => setSelectedMethod(event.target.value)}
                />{' '}
                Saved card ending in {card.lastFour} — expires {String(card.expiryMonth).padStart(2, '0')}/{card.expiryYear}
              </label>
            ))}

            <label style={{ display: 'block', border: '1px solid #ccc', padding: '14px', marginBottom: '10px' }}>
              <input
                type="radio"
                name="paymentMethod"
                value="new"
                checked={selectedMethod === 'new'}
                onChange={(event) => setSelectedMethod(event.target.value)}
              />{' '}
              Enter a different card
            </label>
          </>
        )}

        {selectedMethod === 'new' && (
          <div style={{ border: '1px dashed #aaa', padding: '18px', marginTop: '12px' }}>
            <label>Card number</label>
            <input disabled placeholder="Card entry enabled in final sprint" style={{ display: 'block', width: '100%', padding: '9px', margin: '6px 0 12px', boxSizing: 'border-box' }} />
            <div style={{ display: 'flex', gap: '12px' }}>
              <input disabled placeholder="MM/YY" style={{ padding: '9px', flex: 1 }} />
              <input disabled placeholder="CVV" style={{ padding: '9px', flex: 1 }} />
            </div>
          </div>
        )}
      </section>

      {message && <p role="status" style={{ color: '#1f6f43', fontWeight: 'bold' }}>{message}</p>}

      <button
        type="button"
        onClick={() => setMessage('Payment processing is intentionally disabled for Sprint 3. No charge was made.')}
        style={{ marginTop: '22px', padding: '12px 24px', cursor: 'pointer' }}
      >
        Pay ${Number(summary.totalBeforeTax).toFixed(2)} (Mockup)
      </button>
    </main>
  );
};

export default PaymentPage;
