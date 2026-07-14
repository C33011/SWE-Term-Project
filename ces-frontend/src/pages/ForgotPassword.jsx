import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState(null);

  const handleSubmit = async () => {
    if (!email) return setMessage('Please enter your email.');
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      setMessage(data.message || data.error);
    } catch {
      setMessage('Could not reach the server.');
    }
  };

  return (
    <div style={{ maxWidth: '380px', margin: '40px auto', fontFamily: 'Arial', padding: '0 20px' }}>
      <h2>Forgot Password</h2>
      <p>Enter your email and we'll send you a reset link.</p>
      <input
        style={{ display: 'block', width: '100%', padding: '8px', marginBottom: '12px', boxSizing: 'border-box' }}
        type="email" value={email} onChange={(e) => setEmail(e.target.value)}
      />
      {message && <p style={{ fontWeight: 'bold' }}>{message}</p>}
      <button onClick={handleSubmit} style={{ padding: '10px 20px', cursor: 'pointer' }}>Send Reset Link</button>
      <p style={{ marginTop: '15px' }}><Link to="/login">← Back to login</Link></p>
    </div>
  );
};

export default ForgotPassword;