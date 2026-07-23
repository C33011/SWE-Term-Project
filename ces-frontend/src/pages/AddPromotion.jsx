import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { getToken } from '../auth';

const AddPromotion = () => {
  const [form, setForm] = useState({
    promoCode: '', discountPercentage: '', validUntil: '',
  });
  const [message, setMessage] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async () => {
    setMessage(null);
    if (!form.promoCode.trim() || !form.discountPercentage || !form.validUntil) {
      return setMessage({ type: 'error', text: 'Please fill in all required fields (marked with *).' });
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/promotions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: data.message });
        setForm({ promoCode: '', discountPercentage: '', validUntil: '' });
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to create promotion.' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Could not reach the server.' });
    }
    setSubmitting(false);
  };

  const input = { display: 'block', width: '100%', padding: '8px', marginBottom: '12px', boxSizing: 'border-box' };

  return (
    <div style={{ maxWidth: '520px', margin: '40px auto', fontFamily: 'Arial', padding: '0 20px' }}>
      <p><Link to="/admin">← Admin Portal</Link></p>
      <h2>Add Promotion</h2>
      <p style={{ color: '#666', fontSize: '14px' }}>
        Fields marked with * are required. Subscribed customers are emailed when you save.
      </p>

      <label>Promo Code *</label>
      <input style={input} value={form.promoCode} onChange={set('promoCode')} placeholder="SUMMER10" />

      <label>Discount % *</label>
      <input style={input} type="number" min="0" max="100" step="0.01"
        value={form.discountPercentage} onChange={set('discountPercentage')} />

      <label>Valid Until *</label>
      <input style={input} type="date" value={form.validUntil} onChange={set('validUntil')} />

      {message && (
        <p style={{ color: message.type === 'error' ? '#c0392b' : '#27ae60', fontWeight: 'bold' }}>
          {message.text}
        </p>
      )}

      <button onClick={handleSubmit} disabled={submitting} style={{ padding: '10px 20px', cursor: 'pointer' }}>
        {submitting ? 'Saving…' : 'Create & Email Subscribers'}
      </button>
    </div>
  );
};

export default AddPromotion;
