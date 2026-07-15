import { useEffect, useState } from 'react';
import { getToken } from '../auth';

const emptyForm = {
  cardNumber: '',
  expiryMonth: '',
  expiryYear: '',
  billingAddress: '',
};

const PaymentCards = () => {
  const [cards, setCards] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingCardId, setEditingCardId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    const loadCards = async () => {
      try {
        const response = await fetch('/api/profile/cards', {
          headers: { Authorization: `Bearer ${getToken()}` },
        });
        const data = await response.json();
        if (!response.ok) {
          setMessage({ type: 'error', text: data.error || 'Could not load cards.' });
          return;
        }
        setCards(data.cards || []);
      } catch (error) {
        console.error('Load cards error:', error);
        setMessage({ type: 'error', text: 'Could not reach the server.' });
      } finally {
        setLoading(false);
      }
    };
    loadCards();
  }, []);

  const updateField = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingCardId(null);
  };

  const startEditing = (card) => {
    setEditingCardId(card.cardId);
    setForm({
      cardNumber: '',
      expiryMonth: String(card.expiryMonth),
      expiryYear: String(card.expiryYear),
      billingAddress: card.billingAddress || '',
    });
    setMessage(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage(null);

    if (!form.expiryMonth || !form.expiryYear || !form.billingAddress.trim()) {
      setMessage({ type: 'error', text: 'Expiration date and billing address are required.' });
      return;
    }
    if (editingCardId === null && !form.cardNumber.trim()) {
      setMessage({ type: 'error', text: 'Card number is required.' });
      return;
    }

    setSaving(true);
    try {
      const editing = editingCardId !== null;
      const response = await fetch(
        editing ? `/api/profile/cards/${editingCardId}` : '/api/profile/cards',
        {
          method: editing ? 'PUT' : 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${getToken()}`,
          },
          body: JSON.stringify({
            cardNumber: form.cardNumber,
            expiryMonth: Number(form.expiryMonth),
            expiryYear: Number(form.expiryYear),
            billingAddress: form.billingAddress,
          }),
        }
      );
      const data = await response.json();
      if (!response.ok) {
        setMessage({ type: 'error', text: data.error || 'Could not save card.' });
        return;
      }

      setCards((current) =>
        editing
          ? current.map((card) => card.cardId === editingCardId ? data.card : card)
          : [...current, data.card]
      );
      resetForm();
      setMessage({ type: 'success', text: data.message });
    } catch (error) {
      console.error('Save card error:', error);
      setMessage({ type: 'error', text: 'Could not reach the server.' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (cardId) => {
    if (!window.confirm('Delete this payment card?')) return;
    const response = await fetch(`/api/profile/cards/${cardId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    const data = await response.json();
    if (!response.ok) {
      setMessage({ type: 'error', text: data.error || 'Could not delete card.' });
      return;
    }
    setCards((current) => current.filter((card) => card.cardId !== cardId));
    if (editingCardId === cardId) resetForm();
    setMessage({ type: 'success', text: data.message });
  };

  const inputStyle = {
    display: 'block', width: '100%', padding: '9px',
    marginTop: '5px', marginBottom: '15px', boxSizing: 'border-box',
  };
  const maximumReached = cards.length >= 3 && editingCardId === null;

  return (
    <section>
      <h2>Payment Cards</h2>
      <p style={{ color: '#666' }}>
        Up to three cards. Card numbers and billing addresses are encrypted;
        only the final four digits are displayed.
      </p>

      {loading ? <p>Loading payment cards...</p> : (
        <>
          <h3>Saved Cards ({cards.length}/3)</h3>
          {cards.length === 0 ? <p>No payment cards are stored.</p> : cards.map((card) => (
            <div key={card.cardId} style={{ border: '1px solid #ccc', padding: '15px', marginBottom: '12px' }}>
              <strong>•••• •••• •••• {card.lastFour}</strong>
              <p>Expires: {String(card.expiryMonth).padStart(2, '0')}/{card.expiryYear}</p>
              <p>Billing address: {card.billingAddress}</p>
              <button type="button" onClick={() => startEditing(card)}>Edit</button>
              <button type="button" onClick={() => handleDelete(card.cardId)} style={{ marginLeft: '10px' }}>Delete</button>
            </div>
          ))}

          <hr style={{ margin: '30px 0' }} />
          {maximumReached ? (
            <p style={{ color: '#c0392b', fontWeight: 'bold' }}>
              Maximum of three cards reached. Delete one before adding another.
            </p>
          ) : (
            <form onSubmit={handleSubmit}>
              <h3>{editingCardId ? 'Edit Payment Card' : 'Add Payment Card'}</h3>
              {editingCardId && <p>Leave card number blank to keep the current number.</p>}

              <label htmlFor="cardNumber">{editingCardId ? 'New card number' : 'Card number *'}</label>
              <input id="cardNumber" name="cardNumber" type="text" inputMode="numeric"
                value={form.cardNumber} onChange={updateField}
                placeholder={editingCardId ? 'Leave blank to keep current number' : '4242 4242 4242 4242'}
                required={!editingCardId} style={inputStyle} />

              <label htmlFor="expiryMonth">Expiration month *</label>
              <input id="expiryMonth" name="expiryMonth" type="number" min="1" max="12"
                value={form.expiryMonth} onChange={updateField} required style={inputStyle} />

              <label htmlFor="expiryYear">Expiration year *</label>
              <input id="expiryYear" name="expiryYear" type="number" min={new Date().getFullYear()}
                value={form.expiryYear} onChange={updateField} required style={inputStyle} />

              <label htmlFor="billingAddress">Billing address *</label>
              <input id="billingAddress" name="billingAddress" type="text"
                value={form.billingAddress} onChange={updateField} required style={inputStyle} />

              <button type="submit" disabled={saving}>
                {saving ? 'Saving...' : editingCardId ? 'Update Card' : 'Add Card'}
              </button>
              {editingCardId && <button type="button" onClick={resetForm} style={{ marginLeft: '10px' }}>Cancel</button>}
            </form>
          )}
        </>
      )}

      {message && <p style={{ color: message.type === 'success' ? 'green' : 'red', fontWeight: 'bold' }}>{message.text}</p>}
    </section>
  );
};

export default PaymentCards;
