import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getToken, getUser } from '../auth';

const ManageUsers = () => {
  const me = getUser();
  const [users, setUsers] = useState([]);
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/users', { headers: { Authorization: `Bearer ${getToken()}` } })
      .then(async (res) => {
        const data = await res.json();
        if (res.ok) setUsers(data);
        else setMessage({ type: 'error', text: data.error || 'Could not load users.' });
      })
      .catch(() => setMessage({ type: 'error', text: 'Could not reach the server.' }))
      .finally(() => setLoading(false));
  }, []);

  const updateStatus = async (user, status) => {
    if (status === user.status) return;
    try {
      const res = await fetch(`/api/users/${user.user_id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (res.ok) {
        setUsers((current) =>
          current.map((u) => (u.user_id === data.user_id ? data : u))
        );
        setMessage({ type: 'success', text: `Updated ${data.email} to ${data.status}.` });
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to update status.' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Could not reach the server.' });
    }
  };

  if (loading) return <div style={{ padding: '20px', fontFamily: 'Arial' }}>Loading users…</div>;

  return (
    <div style={{ maxWidth: '800px', margin: '40px auto', fontFamily: 'Arial', padding: '0 20px' }}>
      <p><Link to="/admin">← Admin Portal</Link></p>
      <h2>Manage Users</h2>

      {message && (
        <p style={{ color: message.type === 'error' ? '#c0392b' : '#27ae60', fontWeight: 'bold' }}>
          {message.text}
        </p>
      )}

      <ul style={{ listStyle: 'none', padding: 0, marginTop: '20px' }}>
        {users.map((user) => (
          <li key={user.user_id} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            gap: '12px', padding: '12px 0', borderBottom: '1px solid #eee',
          }}>
            <div>
              <strong>{user.first_name} {user.last_name}</strong>
              <div style={{ color: '#666', fontSize: '14px' }}>
                {user.email} · {user.role}
                {user.promotional_emails ? ' · promo emails on' : ''}
              </div>
            </div>
            <select
              value={user.status}
              disabled={user.user_id === me?.userId}
              onChange={(e) => updateStatus(user, e.target.value)}
              style={{ padding: '6px 8px' }}
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Suspended">Suspended</option>
            </select>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ManageUsers;
