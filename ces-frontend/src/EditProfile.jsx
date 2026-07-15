import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getToken } from './auth'; // 1. IMPORT YOUR GETTOKEN HELPER (Change to '../auth' if they are in different folders)

const EditProfile = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    subscribeToPromotions: false,
    address: '',
    card1Num: '', card1Expiry: '',
    card2Num: '', card2Expiry: '',
    card3Num: '', card3Expiry: ''
  });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [pw, setPw] = useState({ current: '', next: '', confirm: '' });
  const [pwMsg, setPwMsg] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      const token = getToken(); // 2. GET THE TOKEN CORRECTLY

      if (!token) {
        console.error("No token found. User is not logged in.");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/auth/profile', {
          headers: { 
            'Authorization': `Bearer ${token}` // 3. USE TOKEN VARIABLE HERE
          }
        });
        if (response.ok) {
          const data = await response.json();
          setProfile({
            firstName: data.first_name || '',
            lastName: data.last_name || '',
            email: data.email || '',
            phone: data.phone || '',
            subscribeToPromotions: data.subscribe_to_promotions || false,
            address: data.address || '',
            card1Num: data.card1_num || '',
            card1Expiry: data.card1_expiry || '',
            card2Num: data.card2_num || '',
            card2Expiry: data.card2_expiry || '',
            card3Num: data.card3_num || '',
            card3Expiry: data.card3_expiry || ''
          });
        } else {
          console.error("Failed to load profile details. Server returned status:", response.status);
        }
      } catch (err) {
        console.error('Failed to fetch profile:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = getToken(); // 4. GET THE TOKEN CORRECTLY FOR SAVING AS WELL

    if (!token) {
      setMessage("Error: You must be logged in to save changes.");
      return;
    }

    try {
      const response = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // 5. USE TOKEN VARIABLE HERE
        },
        body: JSON.stringify({
          firstName: profile.firstName,
          lastName: profile.lastName,
          phone: profile.phone,
          subscribeToPromotions: profile.subscribeToPromotions,
          address: profile.address,
          card1Num: profile.card1Num,
          card1Expiry: profile.card1Expiry,
          card2Num: profile.card2Num,
          card2Expiry: profile.card2Expiry,
          card3Num: profile.card3Num,
          card3Expiry: profile.card3Expiry
        })
      });

      const data = await response.json();
      if (response.ok) {
        setMessage('Profile updated successfully!');
      } else {
        setMessage(data.error || 'Update failed.');
      }
    } catch (err) {
      console.error('Update error:', err);
      setMessage('Something went wrong. Please try again.');
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwMsg('');
    if (!pw.current) return setPwMsg('Current password is required.');
    if (pw.next.length < 8) return setPwMsg('New password must be at least 8 characters.');
    if (pw.next !== pw.confirm) return setPwMsg('New passwords do not match.');

    const token = getToken();
    if (!token) return setPwMsg('You must be logged in to change your password.');

    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ currentPassword: pw.current, newPassword: pw.next }),
      });
      const data = await response.json();
      if (response.ok) {
        setPwMsg(data.message || 'Password changed successfully!');
        setPw({ current: '', next: '', confirm: '' });
      } else {
        setPwMsg(data.error || 'Could not change password.');
      }
    } catch {
      setPwMsg('Something went wrong. Please try again.');
    }
  };

  if (loading) return <div style={{ padding: '20px', fontFamily: 'Arial' }}>Loading profile...</div>;

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial', maxWidth: '900px', margin: '0 auto' }}>
      <button onClick={() => navigate('/')} style={{ padding: '8px 16px', marginBottom: '20px', cursor: 'pointer' }}>
        ← Back to Movies
      </button>
      
      <h1>Edit Profile</h1>
      {message && <p style={{ fontWeight: 'bold', color: message.includes('successfully') ? 'green' : 'red' }}>{message}</p>}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <h3>Personal Details</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
          <div>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Email (Cannot be changed):</label>
            <input type="email" value={profile.email} disabled style={{ width: '100%', padding: '8px', backgroundColor: '#eee' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Phone Number:</label>
            <input type="text" value={profile.phone} onChange={(e) => setProfile({...profile, phone: e.target.value})} style={{ width: '100%', padding: '8px' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>First Name:</label>
            <input type="text" value={profile.firstName} onChange={(e) => setProfile({...profile, firstName: e.target.value})} style={{ width: '100%', padding: '8px' }} required />
          </div>
          <div>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Last Name:</label>
            <input type="text" value={profile.lastName} onChange={(e) => setProfile({...profile, lastName: e.target.value})} style={{ width: '100%', padding: '8px' }} required />
          </div>
        </div>

        <h3>Address Info (Limit 1)</h3>
        <div>
          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Street Address:</label>
          <input type="text" value={profile.address} onChange={(e) => setProfile({...profile, address: e.target.value})} style={{ width: '100%', padding: '8px' }} />
        </div>

        <h3>Payment Cards (Limit 3)</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px' }}>
            <input type="text" placeholder="Card 1 Number" value={profile.card1Num} onChange={(e) => setProfile({...profile, card1Num: e.target.value})} style={{ padding: '8px' }} />
            <input type="text" placeholder="MM/YY" value={profile.card1Expiry} onChange={(e) => setProfile({...profile, card1Expiry: e.target.value})} style={{ padding: '8px' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px' }}>
            <input type="text" placeholder="Card 2 Number" value={profile.card2Num} onChange={(e) => setProfile({...profile, card2Num: e.target.value})} style={{ padding: '8px' }} />
            <input type="text" placeholder="MM/YY" value={profile.card2Expiry} onChange={(e) => setProfile({...profile, card2Expiry: e.target.value})} style={{ padding: '8px' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px' }}>
            <input type="text" placeholder="Card 3 Number" value={profile.card3Num} onChange={(e) => setProfile({...profile, card3Num: e.target.value})} style={{ padding: '8px' }} />
            <input type="text" placeholder="MM/YY" value={profile.card3Expiry} onChange={(e) => setProfile({...profile, card3Expiry: e.target.value})} style={{ padding: '8px' }} />
          </div>
        </div>

        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 'bold' }}>
          <input type="checkbox" checked={profile.subscribeToPromotions} onChange={(e) => setProfile({...profile, subscribeToPromotions: e.target.checked})} />
          Subscribe to promotional emails
        </label>

        <button type="submit" style={{ padding: '12px', backgroundColor: '#007BFF', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold', borderRadius: '4px', alignSelf: 'flex-start' }}>
          Save Changes
        </button>
      </form>

      <hr style={{ margin: '32px 0', border: 'none', borderTop: '1px solid #ddd' }} />
      <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '420px' }}>
        <h3>Change Password</h3>
        <label style={{ fontWeight: 'bold' }}>Current Password *</label>
        <input type="password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} style={{ padding: '8px' }} required />
        <label style={{ fontWeight: 'bold' }}>New Password * (min 8 characters)</label>
        <input type="password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} style={{ padding: '8px' }} required minLength={8} />
        <label style={{ fontWeight: 'bold' }}>Confirm New Password *</label>
        <input type="password" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} style={{ padding: '8px' }} required minLength={8} />
        {pwMsg && <p style={{ fontWeight: 'bold', color: pwMsg.includes('successfully') ? 'green' : 'red' }}>{pwMsg}</p>}
        <button type="submit" style={{ padding: '12px', backgroundColor: '#007BFF', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold', borderRadius: '4px', alignSelf: 'flex-start' }}>
          Update Password
        </button>
      </form>
    </div>
  );
};

export default EditProfile;