import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const Register = () => {
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    password: '', confirmPassword: '', subscribeToPromotions: false,
  });
  const [message, setMessage] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const set = (field) => (e) =>
    setForm({ ...form, [field]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  const handleSubmit = async () => {
    setMessage(null);

    if (!form.firstName || !form.lastName || !form.email || !form.password) {
      return setMessage({ type: 'error', text: 'Please fill in all required fields (marked with *).' });
    }
    if (form.password.length < 8) {
      return setMessage({ type: 'error', text: 'Password must be at least 8 characters.' });
    }
    if (form.password !== form.confirmPassword) {
      return setMessage({ type: 'error', text: 'Passwords do not match.' });
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      setMessage(res.ok ? { type: 'success', text: data.message } : { type: 'error', text: data.error });
    } catch {
      setMessage({ type: 'error', text: 'Could not reach the server. Is the backend running?' });
    }
    setSubmitting(false);
  };

  const input = { display: 'block', width: '100%', padding: '8px', marginBottom: '12px', boxSizing: 'border-box' };

  return (
    <div style={{ maxWidth: '420px', margin: '40px auto', fontFamily: 'Arial', padding: '0 20px' }}>
      <h2>Create an Account</h2>
      <p style={{ color: '#666', fontSize: '14px' }}>Fields marked with * are required.</p>

      <label>First Name *</label>
      <input style={input} value={form.firstName} onChange={set('firstName')} />
      <label>Last Name *</label>
      <input style={input} value={form.lastName} onChange={set('lastName')} />
      <label>Email *</label>
      <input style={input} type="email" value={form.email} onChange={set('email')} />
      <label>Phone (optional)</label>
      <input style={input} value={form.phone} onChange={set('phone')} />
      <label>Password * (min 8 characters)</label>
      <input style={input} type="password" value={form.password} onChange={set('password')} />
      <label>Confirm Password *</label>
      <input style={input} type="password" value={form.confirmPassword} onChange={set('confirmPassword')} />

      <label style={{ display: 'block', marginBottom: '15px' }}>
        <input type="checkbox" checked={form.subscribeToPromotions} onChange={set('subscribeToPromotions')} />
        {' '}Subscribe to promotional emails
      </label>

      {message && (
        <p style={{ color: message.type === 'error' ? '#c0392b' : '#27ae60', fontWeight: 'bold' }}>
          {message.text}
        </p>
      )}

      <button onClick={handleSubmit} disabled={submitting} style={{ padding: '10px 20px', cursor: 'pointer' }}>
        {submitting ? 'Creating account…' : 'Register'}
      </button>

      <p style={{ marginTop: '15px' }}>Already have an account? <Link to="/login">Log in</Link></p>
    </div>
  );
};

export default Register;