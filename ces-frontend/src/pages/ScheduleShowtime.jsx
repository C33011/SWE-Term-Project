import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getToken } from '../auth';

const ScheduleShowtime = () => {
  const [movies, setMovies] = useState([]);
  const [showrooms, setShowrooms] = useState([]);
  const [form, setForm] = useState({
    movieId: '', showroomId: '', showDate: '', showTime: '',
  });
  const [scheduled, setScheduled] = useState([]);
  const [message, setMessage] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch('/api/movies').then((r) => r.json()),
      fetch('/api/showrooms').then((r) => r.json()),
    ])
      .then(([m, r]) => {
        setMovies(m);
        setShowrooms(r);
      })
      .catch(() => setMessage({ type: 'error', text: 'Could not load movies or showrooms.' }));
  }, []);

  useEffect(() => {
    if (!form.movieId) {
      setScheduled([]);
      return;
    }
    fetch(`/api/movies/${form.movieId}/shows`)
      .then((r) => r.json())
      .then(setScheduled)
      .catch(() => setScheduled([]));
  }, [form.movieId]);

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async () => {
    setMessage(null);
    if (!form.movieId || !form.showroomId || !form.showDate || !form.showTime) {
      return setMessage({ type: 'error', text: 'Please fill in all required fields (marked with *).' });
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/shows', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          movieId: Number(form.movieId),
          showroomId: Number(form.showroomId),
          showDate: form.showDate,
          showTime: form.showTime,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: 'Showtime scheduled.' });
        const shows = await fetch(`/api/movies/${form.movieId}/shows`).then((r) => r.json());
        setScheduled(shows);
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to schedule showtime.' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Could not reach the server.' });
    }
    setSubmitting(false);
  };

  const input = { display: 'block', width: '100%', padding: '8px', marginBottom: '12px', boxSizing: 'border-box' };

  return (
    <div style={{ maxWidth: '520px', margin: '40px auto', fontFamily: 'Arial', padding: '0 20px' }}>
      <p><Link to="/admin">← Admin Portal</Link></p>
      <h2>Schedule Showtime</h2>
      <p style={{ color: '#666', fontSize: '14px' }}>Pick a movie, then choose date, time, and showroom. Fields marked with * are required.</p>

      <label>Movie *</label>
      <select style={input} value={form.movieId} onChange={set('movieId')}>
        <option value="">Select a movie</option>
        {movies.map((m) => (
          <option key={m.movie_id} value={m.movie_id}>{m.title}</option>
        ))}
      </select>

      <label>Date *</label>
      <input style={input} type="date" value={form.showDate} onChange={set('showDate')} />

      <label>Time *</label>
      <input style={input} type="time" value={form.showTime} onChange={set('showTime')} />

      <label>Showroom *</label>
      <select style={input} value={form.showroomId} onChange={set('showroomId')}>
        <option value="">Select a showroom</option>
        {showrooms.map((r) => (
          <option key={r.showroom_id} value={r.showroom_id}>
            {r.showroom_name} ({r.number_of_seats} seats)
          </option>
        ))}
      </select>

      {message && (
        <p style={{ color: message.type === 'error' ? '#c0392b' : '#27ae60', fontWeight: 'bold' }}>
          {message.text}
        </p>
      )}

      <button onClick={handleSubmit} disabled={submitting} style={{ padding: '10px 20px', cursor: 'pointer' }}>
        {submitting ? 'Saving…' : 'Schedule Showtime'}
      </button>

      {form.movieId && (
        <div style={{ marginTop: '30px' }}>
          <h3>Existing showtimes for this movie</h3>
          {scheduled.length === 0 ? (
            <p style={{ color: '#666' }}>None yet.</p>
          ) : (
            <ul>
              {scheduled.map((s) => (
                <li key={s.show_id}>
                  {s.show_date} {String(s.show_time).slice(0, 5)} in {s.showroom_name || 'Unknown room'}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default ScheduleShowtime;
