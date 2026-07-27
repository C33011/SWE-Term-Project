import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { saveLogin } from '../auth';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState(null);
  const [trailers, setTrailers] = useState([]);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Fetch trailers for the top projector screen loop
  useEffect(() => {
    fetch('/api/movies')
      .then(async (res) => {
        if (res.ok) {
          const moviesData = await res.json();
          const validTrailers = moviesData.filter((m) => 
            m.status === 'Currently Running' && 
            m.trailer_url && 
            !m.title.toLowerCase().includes('scary movie')
          );
          setTrailers(validTrailers);
        }
      })
      .catch((err) => console.error('Error loading projector trailers:', err));
  }, []);

  const getYouTubeId = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const buildMasterPlaylistUrl = (trailerList) => {
    if (!trailerList || trailerList.length === 0) return '';
    const ids = trailerList.map(m => getYouTubeId(m.trailer_url)).filter(id => id);
    if (ids.length === 0) return '';
    
    const firstId = ids[0];
    const allIdsString = ids.join(',');
    
    return `https://www.youtube.com/embed/${firstId}?autoplay=1&mute=1&controls=0&modestbranding=1&showinfo=0&iv_load_policy=3&disablekb=1&fs=0&playsinline=1&start=5&end=105&playlist=${allIdsString}&loop=1`;
  };

  const handleSubmit = async () => {
    setError(null);
    if (!email || !password) return setError('Please enter both email and password.');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, rememberMe }),
      });
      const data = await res.json();
      if (!res.ok) return setError(data.error);

      saveLogin(data.token, data.user, rememberMe);

      const requestedRedirect = searchParams.get('redirect');
      const safeRedirect = requestedRedirect && requestedRedirect.startsWith('/') && !requestedRedirect.startsWith('//')
        ? requestedRedirect
        : null;

      if (data.user.role === 'customer' && safeRedirect) {
        navigate(safeRedirect, { replace: true });
      } else {
        navigate(data.user.role === 'admin' ? '/admin' : '/', { replace: true });
      }
    } catch {
      setError('Could not reach the server. Is the backend running?');
    }
  };

  const input = { 
    display: 'block', width: '100%', padding: '12px 16px', marginBottom: '18px', 
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
        
        {/* COMPACT CINEMA SCREEN AT THE TOP */}
        <div style={{ 
          width: '100%', 
          maxWidth: '1400px',
          height: '240px', 
          backgroundColor: '#000',
          borderBottom: '5px solid #d4af37',
          borderLeft: '5px solid #d4af37',
          borderRight: '5px solid #d4af37',
          borderBottomLeftRadius: '16px',
          borderBottomRightRadius: '16px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.9), 0 0 20px rgba(212,175,55,0.3)',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: '0px'
        }}>
          {/* Background Trailer Loop Inside the Screen */}
          {trailers.length > 0 && (
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1, overflow: 'hidden', opacity: 0.65 }}>
              <iframe 
                width="100%" 
                height="100%" 
                src={buildMasterPlaylistUrl(trailers)} 
                title="Cinema Screen Trailer Loop" 
                frameBorder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                style={{ 
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  width: '177.77vh', 
                  height: '100vh',
                  minWidth: '100%',
                  minHeight: '100%',
                  transform: 'translate(-50%, -50%) scale(1.1)',
                  border: 'none',
                  pointerEvents: 'none',
                  filter: 'contrast(1.15) brightness(1)'
                }}
              ></iframe>
            </div>
          )}

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

        {/* Login Box Overlapping the Seating Background */}
        <div style={{ 
          width: '100%', maxWidth: '420px', margin: '30px 20px 0 20px',
          backgroundColor: 'rgba(15, 15, 15, 0.95)', backdropFilter: 'blur(10px)', 
          padding: '30px 35px', borderRadius: '18px', border: '2px solid #d4af37', 
          boxShadow: '0 20px 50px rgba(0,0,0,0.9)' 
        }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '20px' }}>
            
          </div>

          <label style={{ color: '#ccc', fontWeight: 'bold', display: 'block', marginBottom: '5px', fontSize: '13px' }}>Email *</label>
          <input 
            style={input} 
            type="email" 
            value={email} 
            placeholder="Enter your email..."
            onChange={(e) => setEmail(e.target.value)} 
            onFocus={(e) => e.target.style.boxShadow = '0 0 15px rgba(212, 175, 55, 0.4)'}
            onBlur={(e) => e.target.style.boxShadow = '0 0 10px rgba(0,0,0,0.8)'}
          />
          
          <label style={{ color: '#ccc', fontWeight: 'bold', display: 'block', marginBottom: '5px', fontSize: '13px' }}>Password *</label>
          <input 
            style={input} 
            type="password" 
            value={password} 
            placeholder="Enter your password..."
            onChange={(e) => setPassword(e.target.value)} 
            onFocus={(e) => e.target.style.boxShadow = '0 0 15px rgba(212, 175, 55, 0.4)'}
            onBlur={(e) => e.target.style.boxShadow = '0 0 10px rgba(0,0,0,0.8)'}
          />

          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px', color: '#ccc', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}>
            <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} style={{ width: '16px', height: '16px', accentColor: '#d4af37' }} />
            Remember me
          </label>

          {error && <p style={{ color: '#ffb3b3', fontWeight: 'bold', backgroundColor: 'rgba(192, 57, 43, 0.3)', padding: '10px', borderRadius: '8px', border: '1px solid #c0392b', textAlign: 'center', marginBottom: '15px', fontSize: '13px' }}>{error}</p>}

          <button 
            onClick={handleSubmit} 
            style={{ 
              width: '100%', padding: '14px 20px', cursor: 'pointer', 
              background: 'linear-gradient(90deg, #d4af37 0%, #b38f27 100%)', color: '#000', 
              fontWeight: '900', border: 'none', borderRadius: '10px', fontSize: '16px', 
              boxShadow: '0 6px 15px rgba(212,175,55,0.4)', textTransform: 'uppercase', letterSpacing: '1px',
              transition: 'transform 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            Log In 
          </button>

          <div style={{ textAlign: 'center', marginTop: '18px', borderTop: '1px solid #222', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <p style={{ margin: 0, fontSize: '13px' }}><Link to="/forgot-password" style={{ color: '#d4af37', textDecoration: 'none', fontWeight: 'bold' }}>Forgot my password?</Link></p>
            <p style={{ color: '#aaa', margin: 0, fontSize: '13px' }}>New here? <Link to="/register" style={{ color: '#d4af37', textDecoration: 'none', fontWeight: 'bold' }}>Create an account</Link></p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Login;