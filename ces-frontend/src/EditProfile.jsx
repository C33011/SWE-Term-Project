import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

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

  useEffect(() => {
    const fetchProfile = async () => {
      console.log("Attempting to fetch profile..."); // Debug log 1
      try {
        const response = await fetch('/api/auth/profile', {
          headers: { 
            'Authorization': `Bearer ${localStorage.getItem('token')}` 
          }
        });
        
        console.log("Response status:", response.status); // Debug log 2
        
        if (response.ok) {
          const data = await response.json();
          console.log("Successfully fetched profile data:", data); // Debug log 3
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
          const errorText = await response.text();
          console.error("Backend returned an error:", errorText);
        }
      } catch (err) {
        console.error('Failed to fetch profile due to connection/network error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
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
        setMessage('Profile updated successfully! Check your email.');
      } else {
        setMessage(data.error || 'Update failed.');
      }
    } catch (err) {
      console.error('Update error:', err);
      setMessage('Something went wrong. Please try again.');
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
    </div>
  );
};

export default EditProfile;