import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getToken, getUser } from './auth';
import PaymentCards from './components/PaymentCards';

const EditProfile = () => {
  const navigate = useNavigate();
  const user = getUser();
  const [profile, setProfile] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    subscribeToPromotions: false, address: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [pw, setPw] = useState({ current: '', next: '', confirm: '' });
  const [pwMsg, setPwMsg] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch('/api/auth/profile', {
          headers: { Authorization: `Bearer ${getToken()}` },
        });
        const data = await response.json();
        if (!response.ok) {
          setMessage(data.error || 'Could not load profile.');
          return;
        }
        setProfile({
          firstName: data.first_name || '',
          lastName: data.last_name || '',
          email: data.email || '',
          phone: data.phone || '',
          subscribeToPromotions: data.subscribe_to_promotions === true,
          address: data.address || '',
        });
      } catch (error) {
        console.error('Failed to fetch profile:', error);
        setMessage('Could not reach the server.');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      const response = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify(profile),
      });
      const data = await response.json();
      setMessage(response.ok ? data.message : data.error || 'Update failed.');
    } catch (error) {
      console.error('Update error:', error);
      setMessage('Could not reach the server.');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (event) => {
    event.preventDefault();
    setPwMsg('');
    if (!pw.current || !pw.next || !pw.confirm) return setPwMsg('All password fields are required.');
    if (pw.next !== pw.confirm) return setPwMsg('New passwords do not match.');

    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          currentPassword: pw.current,
          newPassword: pw.next,
          confirmPassword: pw.confirm,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        setPwMsg(data.message);
        setPw({ current: '', next: '', confirm: '' });
      } else {
        setPwMsg(data.error || 'Could not change password.');
      }
    } catch {
      setPwMsg('Could not reach the server.');
    }
  };

  const inputStyle = { 
    width: '100%', padding: '12px 16px', boxSizing: 'border-box', 
    borderRadius: '8px', border: '2px solid #555', 
    backgroundColor: 'rgba(0,0,0,0.7)', color: '#fff', fontSize: '16px', 
    outline: 'none', transition: 'all 0.3s ease', boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.5)'
  };

  const cardStyle = {
    backgroundColor: 'rgba(20, 15, 25, 0.95)', padding: '40px', borderRadius: '15px', 
    border: '2px solid #8B0000', boxShadow: '0 10px 40px rgba(0,0,0,0.9), 0 0 20px rgba(139,0,0,0.3)', marginBottom: '35px',
    position: 'relative'
  };

  if (loading) return <div style={{ backgroundColor: '#111', color: '#d4af37', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '24px', fontFamily: 'Georgia, serif' }}>Loading profile...</div>;

  return (
    <div style={{ background: 'linear-gradient(135deg, #111 0%, #2a0808 100%)', color: '#fff', minHeight: '100vh', padding: '40px 20px', fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <button onClick={() => navigate('/')} style={{ background: 'transparent', color: '#d4af37', border: '1px solid #d4af37', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', marginBottom: '20px' }}>← Back to Movies</button>
        
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px', marginBottom: '40px' }}>
          <img src="https://api.dicebear.com/7.x/pixel-art/svg?seed=VIPUser" alt="VIP User" style={{ width: '70px', height: '70px', filter: 'drop-shadow(0 0 10px rgba(212,175,55,0.8))' }} />
          <h1 style={{ color: '#d4af37', fontFamily: 'Georgia, serif', fontSize: '46px', margin: 0, textTransform: 'uppercase', letterSpacing: '2px', textShadow: '2px 2px 5px #000' }}>EDIT Profile</h1>
        </div>
        
        {message && <p style={{ color: '#fff', fontWeight: 'bold', textAlign: 'center', backgroundColor: 'rgba(39, 174, 96, 0.8)', padding: '12px', borderRadius: '8px', boxShadow: '0 4px 10px rgba(0,0,0,0.5)' }}>{message}</p>}

        <div style={cardStyle}>
          <div style={{ position: 'absolute', top: '-20px', right: '30px' }}>
             <img src="https://api.iconify.design/pixelarticons:edit.svg?color=%238B0000" alt="edit" style={{ width: '40px', height: '40px', backgroundColor: '#111', borderRadius: '50%', padding: '5px', border: '2px solid #8B0000' }} />
          </div>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h2 style={{ color: '#e50914', borderBottom: '1px solid #333', paddingBottom: '10px', margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
              Personal Details
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '25px' }}>
              <div><label style={{ color: '#ccc', display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Email (cannot be changed)</label><input type="email" value={profile.email} readOnly style={{ ...inputStyle, backgroundColor: 'rgba(255,255,255,0.05)', color: '#777', borderColor: '#333' }} /></div>
              <div><label style={{ color: '#d4af37', display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Phone number</label><input value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} style={inputStyle} onFocus={(e) => e.target.style.borderColor = '#d4af37'} onBlur={(e) => e.target.style.borderColor = '#555'} /></div>
              <div><label style={{ color: '#d4af37', display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>First name *</label><input value={profile.firstName} onChange={(e) => setProfile({ ...profile, firstName: e.target.value })} style={inputStyle} required onFocus={(e) => e.target.style.borderColor = '#d4af37'} onBlur={(e) => e.target.style.borderColor = '#555'} /></div>
              <div><label style={{ color: '#d4af37', display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Last name *</label><input value={profile.lastName} onChange={(e) => setProfile({ ...profile, lastName: e.target.value })} style={inputStyle} required onFocus={(e) => e.target.style.borderColor = '#d4af37'} onBlur={(e) => e.target.style.borderColor = '#555'} /></div>
            </div>

            <h2 style={{ color: '#e50914', borderBottom: '1px solid #333', paddingBottom: '10px', margin: '20px 0 10px 0' }}>Mailing Address</h2>
            <input value={profile.address} placeholder="Enter your full mailing address" onChange={(e) => setProfile({ ...profile, address: e.target.value })} style={inputStyle} onFocus={(e) => e.target.style.borderColor = '#d4af37'} onBlur={(e) => e.target.style.borderColor = '#555'} />

            <label style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#fff', cursor: 'pointer', marginTop: '10px', fontSize: '16px', fontWeight: 'bold' }}>
              <input type="checkbox" checked={profile.subscribeToPromotions} onChange={(e) => setProfile({ ...profile, subscribeToPromotions: e.target.checked })} style={{ width: '22px', height: '22px', accentColor: '#e50914' }} /> 
              Subscribe to promotional emails & ticket offers
            </label>
            <button type="submit" disabled={saving} style={{ background: 'linear-gradient(90deg, #e50914 0%, #8B0000 100%)', color: '#fff', fontWeight: 'bold', padding: '15px 30px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '18px', marginTop: '10px', boxShadow: '0 4px 15px rgba(229, 9, 20, 0.4)' }}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>

        {user?.role === 'customer' && <div style={{ ...cardStyle, border: '2px solid #2980b9', boxShadow: '0 10px 40px rgba(0,0,0,0.9), 0 0 20px rgba(41, 128, 185, 0.3)' }}><PaymentCards /></div>}

        <div style={{ ...cardStyle, border: '2px solid #4a0e4e', boxShadow: '0 10px 40px rgba(0,0,0,0.9), 0 0 20px rgba(74, 14, 78, 0.3)' }}>
           <div style={{ position: 'absolute', top: '-25px', right: '30px' }}>
             <img src="https://api.iconify.design/pixelarticons:lock.svg?color=%23d4af37" alt="lock" style={{ width: '45px', height: '45px', backgroundColor: '#111', borderRadius: '50%', padding: '5px', border: '2px solid #4a0e4e' }} />
          </div>
          <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <h2 style={{ color: '#d4af37', borderBottom: '1px solid #333', paddingBottom: '10px', margin: '0 0 10px 0' }}>Security Center</h2>
            <p style={{ color: '#aaa', fontSize: '14px', fontStyle: 'italic' }}>Use at least 8 characters with uppercase, lowercase, a number, and a special character.</p>
            <div><label style={{ color: '#ccc', display: 'block', marginBottom: '8px' }}>Current password *</label><input type="password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} required style={inputStyle} onFocus={(e) => e.target.style.borderColor = '#8a2be2'} onBlur={(e) => e.target.style.borderColor = '#555'} /></div>
            <div><label style={{ color: '#ccc', display: 'block', marginBottom: '8px' }}>New password *</label><input type="password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} required style={inputStyle} onFocus={(e) => e.target.style.borderColor = '#8a2be2'} onBlur={(e) => e.target.style.borderColor = '#555'} /></div>
            <div><label style={{ color: '#ccc', display: 'block', marginBottom: '8px' }}>Confirm new password *</label><input type="password" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} required style={inputStyle} onFocus={(e) => e.target.style.borderColor = '#8a2be2'} onBlur={(e) => e.target.style.borderColor = '#555'} /></div>
            {pwMsg && <p style={{ color: '#fff', fontWeight: 'bold', backgroundColor: 'rgba(231, 76, 60, 0.8)', padding: '10px', borderRadius: '6px' }}>{pwMsg}</p>}
            <button type="submit" style={{ background: 'linear-gradient(90deg, #4a0e4e 0%, #8a2be2 100%)', color: '#fff', fontWeight: 'bold', padding: '15px 30px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '18px', marginTop: '10px', boxShadow: '0 4px 15px rgba(138, 43, 226, 0.4)' }}>
              Update Password
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditProfile;