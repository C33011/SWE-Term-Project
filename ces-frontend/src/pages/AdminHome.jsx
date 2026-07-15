import React from 'react';
import { getUser } from '../auth';

const AdminHome = () => {
  const user = getUser();
  const items = [
    { title: 'Manage Movies', desc: 'Add, edit, or remove movies' },
    { title: 'Manage Promotions', desc: 'Create and send promotional offers' },
    { title: 'Manage Users', desc: 'View and manage customer accounts' },
    { title: 'Manage Showtimes', desc: 'Schedule shows and assign halls' },
  ];

  return (
    <div style={{ maxWidth: '800px', margin: '40px auto', fontFamily: 'Arial', padding: '0 20px' }}>
      <h1>Admin Portal</h1>
      <p>Welcome back, {user?.firstName}. Select an area to manage:</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginTop: '20px' }}>
        {items.map((item) => (
          <div key={item.title}
            style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '25px', cursor: 'pointer', textAlign: 'center' }}
            onClick={() => alert(`${item.title} — coming in Sprint 3`)}>
            <h3 style={{ margin: '0 0 8px' }}>{item.title}</h3>
            <p style={{ color: '#666', margin: 0, fontSize: '14px' }}>{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminHome;