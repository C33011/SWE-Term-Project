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

  const inputStyle = { width: '100%', padding: '8px', boxSizing: 'border-box' };
  if (loading) return <div style={{ padding: '20px' }}>Loading profile...</div>;

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial', maxWidth: '900px', margin: '0 auto' }}>
      <button onClick={() => navigate('/')} style={{ marginBottom: '20px' }}>← Back to Movies</button>
      <h1>Edit Profile</h1>
      {message && <p style={{ fontWeight: 'bold' }}>{message}</p>}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <h2>Personal Details</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
          <div><label>Email (cannot be changed)</label><input type="email" value={profile.email} readOnly style={{ ...inputStyle, backgroundColor: '#eee' }} /></div>
          <div><label>Phone number</label><input value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} style={inputStyle} /></div>
          <div><label>First name *</label><input value={profile.firstName} onChange={(e) => setProfile({ ...profile, firstName: e.target.value })} style={inputStyle} required /></div>
          <div><label>Last name *</label><input value={profile.lastName} onChange={(e) => setProfile({ ...profile, lastName: e.target.value })} style={inputStyle} required /></div>
        </div>

        <h2>Mailing Address</h2>
        <p>You may store one mailing address.</p>
        <input value={profile.address} onChange={(e) => setProfile({ ...profile, address: e.target.value })} style={inputStyle} />

        <label><input type="checkbox" checked={profile.subscribeToPromotions}
          onChange={(e) => setProfile({ ...profile, subscribeToPromotions: e.target.checked })} /> Subscribe to promotional emails</label>
        <button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
      </form>

      {user?.role === 'customer' && <><hr style={{ margin: '32px 0' }} /><PaymentCards /></>}

      <hr style={{ margin: '32px 0' }} />
      <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '420px' }}>
        <h2>Change Password</h2>
        <p>Use at least 8 characters with uppercase, lowercase, a number, and a special character.</p>
        <label>Current password *</label><input type="password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} required />
        <label>New password *</label><input type="password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} required />
        <label>Confirm new password *</label><input type="password" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} required />
        {pwMsg && <p style={{ fontWeight: 'bold' }}>{pwMsg}</p>}
        <button type="submit">Update Password</button>
      </form>
    </div>
  );
};

export default EditProfile;
