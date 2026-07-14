import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { saveLogin } from '../auth';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async () => {
    setError(null);
    if (!email || !password) return setError('Please enter both email and password.');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, rememberMe }),
      });
      const data = await res.json();
      if (!res.ok) return setError(data.error);

      saveLogin(data.token, data.user, rememberMe);
      // Role-based routing: admin -> admin portal, customer -> home
      navigate(data.user.role === 'admin' ? '/admin' : '/');
    } catch {
      setError('Could not reach the server. Is the backend running?');
    }
  };

  const input = { display: 'block', width: '100%', padding: '8px', marginBottom: '12px', boxSizing: 'border-box' };

  return (
    <div style={{ maxWidth: '380px', margin: '40px auto', fontFamily: 'Arial', padding: '0 20px' }}>
      <h2>Log In</h2>
      <label>Email *</label>
      <input style={input} type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <label>Password *</label>
      <input style={input} type="password" value={password} onChange={(e) => setPassword(e.target.value)} />

      <label style={{ display: 'block', marginBottom: '15px' }}>
        <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
        {' '}Remember me
      </label>

      {error && <p style={{ color: '#c0392b', fontWeight: 'bold' }}>{error}</p>}

      <button onClick={handleSubmit} style={{ padding: '10px 20px', cursor: 'pointer' }}>Log In</button>

      <p style={{ marginTop: '15px' }}><Link to="/forgot-password">Forgot my password</Link></p>
      <p>New here? <Link to="/register">Create an account</Link></p>
    </div>
  );
};

export default Login;