import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getToken } from '../auth';

const emptyForm = {
  title: '', genreId: '', rating: '', description: '',
  posterUrl: '', trailerUrl: '', director: '', producer: '',
  castMembers: '', reviews: '', status: 'Currently Running', releaseDate: '',
};

const AddMovie = () => {
  const { id } = useParams();
  const editing = Boolean(id);
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyForm);
  const [genres, setGenres] = useState([]);
  const [message, setMessage] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(editing);

  useEffect(() => {
    fetch('/api/genres')
      .then((res) => res.json())
      .then(setGenres)
      .catch(() => setMessage({ type: 'error', text: 'Could not load genres.' }));
  }, []);

  useEffect(() => {
    if (!editing) return;
    fetch(`/api/movies/${id}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          setMessage({ type: 'error', text: data.error || 'Movie not found.' });
          return;
        }
        setForm({
          title: data.title || '',
          genreId: data.genre_id || '',
          rating: data.rating || '',
          description: data.description || '',
          posterUrl: data.poster_url || '',
          trailerUrl: data.trailer_url || '',
          director: data.director || '',
          producer: data.producer || '',
          castMembers: data.cast_members || '',
          reviews: data.reviews || '',
          status: data.status || 'Currently Running',
          releaseDate: data.release_date ? String(data.release_date).slice(0, 10) : '',
        });
      })
      .catch(() => setMessage({ type: 'error', text: 'Could not load movie.' }))
      .finally(() => setLoading(false));
  }, [editing, id]);

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async () => {
    setMessage(null);
    const requiredFields = [
      ['title', 'Title'],
      ['genreId', 'Genre'],
      ['rating', 'Rating'],
      ['description', 'Description'],
      ['posterUrl', 'Poster URL'],
      ['trailerUrl', 'Trailer URL'],
      ['director', 'Director'],
      ['castMembers', 'Cast'],
      ['releaseDate', 'Release date'],
    ];

    for (const [field, label] of requiredFields) {
      if (!String(form[field] || '').trim()) {
        return setMessage({ type: 'error', text: `${label} is required.` });
      }
    }

    const isHttpUrl = (value) => {
      try {
        const parsed = new URL(value);
        return parsed.protocol === 'http:' || parsed.protocol === 'https:';
      } catch {
        return false;
      }
    };

    if (!isHttpUrl(form.posterUrl)) {
      return setMessage({ type: 'error', text: 'Poster URL must be a valid http or https URL.' });
    }
    if (!isHttpUrl(form.trailerUrl)) {
      return setMessage({ type: 'error', text: 'Trailer URL must be a valid http or https URL.' });
    }

    setSubmitting(true);
    try {
      const res = await fetch(editing ? `/api/movies/${id}` : '/api/movies', {
        method: editing ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          ...form,
          genreId: form.genreId ? Number(form.genreId) : null,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        navigate('/admin/movies');
      } else {
        setMessage({ type: 'error', text: data.error || `Failed to ${editing ? 'update' : 'add'} movie.` });
      }
    } catch {
      setMessage({ type: 'error', text: 'Could not reach the server.' });
    }
    setSubmitting(false);
  };

  const input = { display: 'block', width: '100%', padding: '8px', marginBottom: '12px', boxSizing: 'border-box' };

  if (loading) return <div style={{ padding: '20px', fontFamily: 'Arial' }}>Loading movie…</div>;

  return (
    <div style={{ maxWidth: '520px', margin: '40px auto', fontFamily: 'Arial', padding: '0 20px' }}>
      <p><Link to="/admin/movies">← Manage Movies</Link></p>
      <h2>{editing ? 'Edit Movie' : 'Add Movie'}</h2>
      <p style={{ color: '#666', fontSize: '14px' }}>Fields marked with * are required.</p>

      <label>Title *</label>
      <input style={input} value={form.title} onChange={set('title')} />

      <label>Genre *</label>
      <select style={input} value={form.genreId} onChange={set('genreId')}>
        <option value="">Select a genre</option>
        {genres.map((g) => (
          <option key={g.genre_id} value={g.genre_id}>{g.name}</option>
        ))}
      </select>

      <label>Rating *</label>
      <select style={input} value={form.rating} onChange={set('rating')}>
        <option value="">Select a rating</option>
        {['G', 'PG', 'PG-13', 'R', 'NC-17'].map((rating) => (
          <option key={rating} value={rating}>{rating}</option>
        ))}
      </select>

      <label>Status *</label>
      <select style={input} value={form.status} onChange={set('status')}>
        <option value="Currently Running">Currently Running</option>
        <option value="Coming Soon">Coming Soon</option>
      </select>

      <label>Description *</label>
      <textarea style={{ ...input, minHeight: '80px' }} value={form.description} onChange={set('description')} />

      <label>Poster URL *</label>
      <input style={input} value={form.posterUrl} onChange={set('posterUrl')} />

      <label>Trailer URL *</label>
      <input style={input} value={form.trailerUrl} onChange={set('trailerUrl')} />

      <label>Director *</label>
      <input style={input} value={form.director} onChange={set('director')} />

      <label>Producer</label>
      <input style={input} value={form.producer} onChange={set('producer')} />

      <label>Cast *</label>
      <input style={input} value={form.castMembers} onChange={set('castMembers')} />

      <label>Reviews</label>
      <textarea style={{ ...input, minHeight: '70px' }} value={form.reviews} onChange={set('reviews')} />

      <label>Release Date *</label>
      <input style={input} type="date" value={form.releaseDate} onChange={set('releaseDate')} />

      {message && (
        <p style={{ color: message.type === 'error' ? '#c0392b' : '#27ae60', fontWeight: 'bold' }}>
          {message.text}
        </p>
      )}

      <button onClick={handleSubmit} disabled={submitting} style={{ padding: '10px 20px', cursor: 'pointer' }}>
        {submitting ? 'Saving…' : editing ? 'Save Changes' : 'Add Movie'}
      </button>
    </div>
  );
};

export default AddMovie;
