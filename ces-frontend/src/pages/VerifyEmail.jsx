import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';

const VerifyEmail = () => {
  const { token } = useParams();
  const [status, setStatus] = useState('Verifying your account…');
  const [ok, setOk] = useState(false);
  const ran = useRef(false); // React StrictMode runs effects twice in dev — only call once

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    fetch(`/api/auth/verify/${token}`, { method: 'POST' })
      .then(async (res) => {
        const data = await res.json();
        setOk(res.ok);
        setStatus(res.ok ? data.message : data.error);
      })
      .catch(() => setStatus('Could not reach the server.'));
  }, [token]);

  return (
    <div style={{ maxWidth: '420px', margin: '60px auto', fontFamily: 'Arial', textAlign: 'center' }}>
      <h2>Email Verification</h2>
      <p style={{ fontWeight: 'bold', color: ok ? '#27ae60' : '#333' }}>{status}</p>
      {ok && <Link to="/login">Go to Login →</Link>}
    </div>
  );
};

export default VerifyEmail;