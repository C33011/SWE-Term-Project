import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';

const ResetPassword = () => {
  const { token } = useParams();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [message, setMessage] = useState(null);
  const [done, setDone] = useState(false);

  const handleSubmit = async () => {
    setMessage(null);
    if (password.length < 8) return setMessage('Password must be at least 8 characters.');
    if (password !== confirm) return setMessage('Passwords do not match.');

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password }),
      });
      const data = await res.json();
      setMessage(data.message || data.error);
      setDone(res.ok);
    } catch {
      setMessage('Could not reach the server.');
    }
  };

  const input = { display: 'block', width: '100%', padding: '8px', marginBottom: '12px', boxSizing: 'border-box' };

  return (
    <div style={{ maxWidth: '380px', margin: '40px auto', fontFamily: 'Arial', padding: '0 20px' }}>
      <h2>Set a New Password</h2>
      <label>New Password * (min 8 characters)</label>
      <input style={input} type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      <label>Confirm New Password *</label>
      <input style={input} type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
      {message && <p style={{ fontWeight: 'bold' }}>{message}</p>}
      {done
        ? <Link to="/login">Go to Login →</Link>
        : <button onClick={handleSubmit} style={{ padding: '10px 20px', cursor: 'pointer' }}>Update Password</button>}
    </div>
  );
};

export default ResetPassword;