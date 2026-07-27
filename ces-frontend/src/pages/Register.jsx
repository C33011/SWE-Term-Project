import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const Register = () => {
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    password: '', confirmPassword: '', subscribeToPromotions: false,
  });
  const [message, setMessage] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [trailers, setTrailers] = useState([]);


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
      padding: 0, 
      position: 'relative',
      fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
      backgroundImage: 'url("https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80")',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center'
    }}>
      
      {/* Dark overlay covering the entire screen so the red seats background looks balanced */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.78)', zIndex: 1 }}></div>

      {/* Main Container */}
      <div style={{ width: '100%', maxWidth: '1200px', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', zIndex: 2, paddingBottom: '50px' }}>
        
        
        <div style={{ 
          }}>
          
          {/* Vignette & Cinematic Lighting Overlay */}
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'radial-gradient(circle, rgba(0,0,0,0.2) 30%, rgba(0,0,0,0.85) 100%)', zIndex: 2, pointerEvents: 'none' }}></div>

          {/* Visually Stunning Glowing Typography */}
          <div style={{ position: 'relative', zIndex: 3, textAlign: 'center', padding: '0 20px' }}>
            <span style={{ 
              color: '#0dcaf0', fontSize: '11px', letterSpacing: '5px', textTransform: 'uppercase', 
              fontWeight: '900', display: 'block', marginBottom: '6px',
              textShadow: '0 0 10px rgba(13,202,240,0.8), 0 2px 4px #000' 
            }}>
            
            </span>
            <h1 style={{ 
              margin: 0, fontSize: '32px', fontFamily: 'Georgia, serif', 
              textTransform: 'uppercase', letterSpacing: '2px', lineHeight: '1.2',
              background: 'linear-gradient(180deg, #fff 0%, #d4af37 50%, #b38f27 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.9)) drop-shadow(0 0 20px rgba(212,175,55,0.6))'
            }}>
              THE CINEMA E-BOOKING SYSTEM
            </h1>
          </div>
        </div>

        {/* Register Box Overlapping the Seating Background */}
        <div style={{ 
          width: '100%', maxWidth: '460px', margin: '30px 20px 0 20px',
          backgroundColor: 'rgba(15, 15, 15, 0.95)', backdropFilter: 'blur(10px)', 
          padding: '35px 40px', borderRadius: '18px', border: '2px solid #d4af37', 
          boxShadow: '0 20px 50px rgba(0,0,0,0.9)' 
        }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '20px' }}>
            <img src="https://api.dicebear.com/7.x/pixel-art/svg?seed=RegisterStar" alt="Pixel Star" style={{ width: '45px', height: '45px', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.8))', marginBottom: '6px' }} />
            <h2 style={{ color: '#d4af37', fontFamily: 'Georgia, serif', fontSize: '26px', margin: 0, textTransform: 'uppercase', letterSpacing: '2px', textShadow: '2px 2px 4px #000' }}>Create an Account</h2>
            <p style={{ color: '#aaa', fontSize: '13px', margin: '6px 0 0 0' }}>Fields marked with * are required.</p>
          </div>

          <label style={{ color: '#ccc', fontWeight: 'bold', display: 'block', marginBottom: '4px', fontSize: '13px' }}>First Name *</label>
          <input style={input} value={form.firstName} onChange={set('firstName')} placeholder="Enter first name..." />
          
          <label style={{ color: '#ccc', fontWeight: 'bold', display: 'block', marginBottom: '4px', fontSize: '13px' }}>Last Name *</label>
          <input style={input} value={form.lastName} onChange={set('lastName')} placeholder="Enter last name..." />
          
          <label style={{ color: '#ccc', fontWeight: 'bold', display: 'block', marginBottom: '4px', fontSize: '13px' }}>Email *</label>
          <input style={input} type="email" value={form.email} onChange={set('email')} placeholder="Enter email address..." />
          
          <label style={{ color: '#ccc', fontWeight: 'bold', display: 'block', marginBottom: '4px', fontSize: '13px' }}>Phone (optional)</label>
          <input style={input} value={form.phone} onChange={set('phone')} placeholder="Enter phone number..." />
          
          <label style={{ color: '#ccc', fontWeight: 'bold', display: 'block', marginBottom: '4px', fontSize: '13px' }}>Password * (min 8 characters)</label>
          <input style={input} type="password" value={form.password} onChange={set('password')} placeholder="Create password..." />
          
          <label style={{ color: '#ccc', fontWeight: 'bold', display: 'block', marginBottom: '4px', fontSize: '13px' }}>Confirm Password *</label>
          <input style={input} type="password" value={form.confirmPassword} onChange={set('confirmPassword')} placeholder="Confirm password..." />

          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', color: '#ccc', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}>
            <input type="checkbox" checked={form.subscribeToPromotions} onChange={set('subscribeToPromotions')} style={{ width: '16px', height: '16px', accentColor: '#d4af37' }} />
            Subscribe to promotional emails
          </label>

          {message && (
            <div style={{ color: message.type === 'error' ? '#ffb3b3' : '#2ecc71', fontWeight: 'bold', backgroundColor: message.type === 'error' ? 'rgba(192, 57, 43, 0.3)' : 'rgba(46, 204, 113, 0.2)', padding: '10px', borderRadius: '8px', border: `1px solid ${message.type === 'error' ? '#c0392b' : '#27ae60'}`, textAlign: 'center', marginBottom: '18px', fontSize: '13px' }}>
              {message.text}
            </div>
          )}

          <button 
            onClick={handleSubmit} 
            disabled={submitting} 
            style={{ 
              width: '100%', padding: '14px 20px', cursor: submitting ? 'not-allowed' : 'pointer', 
              background: 'linear-gradient(90deg, #d4af37 0%, #b38f27 100%)', color: '#000', 
              fontWeight: '900', border: 'none', borderRadius: '10px', fontSize: '16px', 
              boxShadow: '0 6px 15px rgba(212,175,55,0.4)', textTransform: 'uppercase', letterSpacing: '1px',
              transition: 'transform 0.2s', opacity: submitting ? 0.7 : 1
            }}
            onMouseEnter={(e) => { if(!submitting) e.currentTarget.style.transform = 'translateY(-2px)' }}
            onMouseLeave={(e) => { if(!submitting) e.currentTarget.style.transform = 'translateY(0)' }}
          >
            {submitting ? 'Creating account…' : 'Register 🍿'}
          </button>

          <div style={{ textAlign: 'center', marginTop: '20px', borderTop: '1px solid #222', paddingTop: '15px' }}>
            <p style={{ color: '#aaa', margin: 0, fontSize: '13px' }}>Already have an account? <Link to="/login" style={{ color: '#d4af37', textDecoration: 'none', fontWeight: 'bold' }}>Log in</Link></p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Register;
