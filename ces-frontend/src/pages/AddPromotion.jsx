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
      padding: '40px 20px', 
      position: 'relative',
      fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
      backgroundImage: 'url("https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80")',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      boxSizing: 'border-box'
    }}>
      
      {/* Dark overlay for rich cinema atmosphere */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(5, 5, 8, 0.85)', zIndex: 1 }}></div>

      <main style={{ width: '100%', maxWidth: '1200px', position: 'relative', zIndex: 2, paddingBottom: '60px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        
        <div style={{ width: '100%', maxWidth: '540px' }}>
          <div style={{ marginBottom: '25px', display: 'flex', justifyContent: 'flex-start' }}>
            <Link to="/admin" style={{ color: '#0dcaf0', textDecoration: 'none', fontWeight: 'bold', border: '1px solid #0dcaf0', padding: '10px 20px', borderRadius: '8px' }}>← Admin Portal</Link>
          </div>

          {/* Add Promotion Box Container */}
          <div style={{ 
            backgroundColor: 'rgba(15, 15, 15, 0.95)', backdropFilter: 'blur(10px)', 
            padding: '40px', borderRadius: '18px', border: '2px solid #d4af37', 
            boxShadow: '0 20px 50px rgba(0,0,0,0.9)' 
          }}>
            
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '30px' }}>
              
              
              {/* Shining Golden Background Header */}
              <div style={{
                background: 'linear-gradient(135deg, #ffe58f 0%, #d4af37 50%, #997415 100%)',
                padding: '12px 30px',
                borderRadius: '12px',
                boxShadow: '0 0 25px rgba(212,175,55,0.7), inset 0 2px 4px rgba(255,255,255,0.6)',
                border: '2px solid #fff',
                textAlign: 'center',
                width: '100%',
                boxSizing: 'border-box',
                marginBottom: '15px'
              }}>
                <h2 style={{ color: '#000', fontFamily: 'Georgia, serif', fontSize: '26px', margin: 0, textTransform: 'uppercase', letterSpacing: '2px', textShadow: '1px 1px 2px rgba(255,255,255,0.5)' }}>Add Promotion</h2>
              </div>

              <p style={{ color: '#aaa', fontSize: '13px', margin: 0, textAlign: 'center' }}>
                Fields marked with * are required. Subscribed customers are emailed when you save.
              </p>
            </div>

            <label style={{ color: '#ccc', fontWeight: 'bold', display: 'block', marginBottom: '6px', fontSize: '14px' }}>Promo Code *</label>
            <input style={input} value={form.promoCode} onChange={set('promoCode')} placeholder="SUMMER10" />

            <label style={{ color: '#ccc', fontWeight: 'bold', display: 'block', marginBottom: '6px', fontSize: '14px' }}>Discount % *</label>
            <input style={input} type="number" min="0" max="100" step="0.01"
              value={form.discountPercentage} onChange={set('discountPercentage')} placeholder="10.00" />

            <label style={{ color: '#ccc', fontWeight: 'bold', display: 'block', marginBottom: '6px', fontSize: '14px' }}>Valid Until *</label>
            <input style={input} type="date" value={form.validUntil} onChange={set('validUntil')} />

            {message && (
              <div style={{ backgroundColor: message.type === 'error' ? 'rgba(192, 57, 43, 0.3)' : 'rgba(46, 204, 113, 0.2)', border: `1px solid ${message.type === 'error' ? '#c0392b' : '#27ae60'}`, padding: '14px', borderRadius: '10px', marginBottom: '20px', textAlign: 'center' }}>
                <p style={{ color: message.type === 'error' ? '#ffb3b3' : '#2ecc71', fontWeight: 'bold', margin: 0, fontSize: '14px' }}>
                  {message.text}
                </p>
              </div>
            )}

            <button 
              onClick={handleSubmit} 
              disabled={submitting} 
              style={{ 
                width: '100%', marginTop: '10px', padding: '16px 20px', cursor: submitting ? 'not-allowed' : 'pointer', 
                background: 'linear-gradient(90deg, #d4af37 0%, #b38f27 100%)', color: '#000', 
                fontWeight: '900', border: 'none', borderRadius: '10px', fontSize: '18px', 
                boxShadow: '0 8px 20px rgba(212,175,55,0.4)', textTransform: 'uppercase', letterSpacing: '1px',
                transition: 'transform 0.2s', opacity: submitting ? 0.7 : 1
              }}
              onMouseEnter={(e) => { if(!submitting) e.currentTarget.style.transform = 'translateY(-2px)' }}
              onMouseLeave={(e) => { if(!submitting) e.currentTarget.style.transform = 'translateY(0)' }}
            >
              {submitting ? 'Saving…' : 'Create & Email Subscribers 🎟️'}
            </button>
          </div>
        </div>

      </main>
    </div>
  );
};

export default AddPromotion;
