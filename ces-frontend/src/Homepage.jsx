import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getToken, getUser } from './auth';

const HomePage = () => {
  const [movies, setMovies] = useState([]);
  const [genres, setGenres] = useState([]);
  const [favoriteIds, setFavoriteIds] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [genreFilter, setGenreFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const user = getUser();
  const isCustomer = user?.role === 'customer';

  useEffect(() => {
    const load = async () => {
      try {
        const moviesData = await (await fetch('/api/movies')).json();
        const genresData = await (await fetch('/api/genres')).json();
        setMovies(moviesData);
        setGenres(genresData);
        if (isCustomer) {
          const response = await fetch('/api/auth/favorites', { headers: { Authorization: `Bearer ${getToken()}` } });
          if (response.ok) setFavoriteIds((await response.json()).map((movie) => movie.movie_id));
        }
      } finally { setLoading(false); }
    };
    load();
  }, [isCustomer]);

  const toggleFavorite = async (event, movieId) => {
    event.stopPropagation();
    const response = await fetch('/api/auth/favorites/toggle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify({ movieId }),
    });
    if (!response.ok) return;
    const data = await response.json();
    setFavoriteIds((current) => data.isFavorite ? [...new Set([...current, movieId])] : current.filter((id) => id !== movieId));
  };

  const filtered = movies.filter((movie) => movie.title.toLowerCase().includes(searchTerm.toLowerCase()) && (genreFilter === '' || String(movie.genre_id) === genreFilter));
  
  // --- SINGLE BACKGROUND PLAYLIST LOGIC ---
  const currentlyRunningWithTrailers = filtered.filter((m) => 
    m.status === 'Currently Running' && 
    m.trailer_url && 
    !m.title.toLowerCase().includes('scary movie') 
  );

  const getYouTubeId = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const buildMasterPlaylistUrl = (trailers) => {
    if (!trailers || trailers.length === 0) return '';
    const ids = trailers.map(m => getYouTubeId(m.trailer_url)).filter(id => id);
    if (ids.length === 0) return '';
    
    const firstId = ids[0];
    const allIdsString = ids.join(',');
    
    // start=5 cuts the first 5 seconds; end=115 cuts the last 10 seconds to avoid next video previews on typical ~2m trailers
    return `https://www.youtube.com/embed/${firstId}?autoplay=1&mute=1&controls=0&modestbranding=1&showinfo=0&iv_load_policy=3&disablekb=1&fs=0&playsinline=1&start=5&end=105&playlist=${allIdsString}&loop=1`;
  };
  
  const renderCard = (movie) => (
    <div 
      key={movie.movie_id} 
      onClick={() => navigate(`/movies/${movie.movie_id}`)} 
      style={{ 
        backgroundColor: '#1a1a1a', 
        borderRadius: '12px', 
        overflow: 'hidden', 
        cursor: 'pointer', 
        width: '220px', 
        border: '1px solid #333',
        boxShadow: '0 8px 16px rgba(0,0,0,0.8)',
        transition: 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), border-color 0.4s ease, box-shadow 0.4s ease',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.08) translateY(-5px)';
        e.currentTarget.style.borderColor = '#d4af37';
        e.currentTarget.style.boxShadow = '0 15px 30px rgba(212, 175, 55, 0.3)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1) translateY(0)';
        e.currentTarget.style.borderColor = '#333';
        e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.8)';
      }}
    >
      {isCustomer && (
        <button 
          type="button" 
          onClick={(e) => toggleFavorite(e, movie.movie_id)} 
          style={{ 
            position: 'absolute', 
            top: '10px', 
            right: '10px', 
            fontSize: '20px', 
            backgroundColor: 'rgba(0,0,0,0.7)', 
            backdropFilter: 'blur(4px)',
            borderRadius: '50%', 
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 2,
            border: '1px solid #d4af37',
            color: '#fff',
            transition: 'background-color 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(212,175,55,0.4)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.7)'}
        >
          {favoriteIds.includes(movie.movie_id) ? '❤️' : '🤍'}
        </button>
      )}
      <img src={movie.poster_url} alt={movie.title} style={{ width: '100%', height: '320px', objectFit: 'cover' }} />
      <div style={{ padding: '15px', display: 'flex', flexDirection: 'column', flexGrow: 1, justifyContent: 'space-between' }}>
        <h4 style={{ margin: '0 0 10px 0', fontSize: '18px', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{movie.title}</h4>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '14px', color: '#ccc' }}>Rating: <strong style={{ color: '#d4af37', textShadow: '0 0 5px rgba(212,175,55,0.5)' }}>{movie.rating}</strong></span>
          <span style={{ 
            fontSize: '12px', 
            padding: '4px 10px', 
            background: 'linear-gradient(90deg, #d4af37 0%, #b38f27 100%)', 
            borderRadius: '6px', 
            color: '#000', 
            fontWeight: '900',
            boxShadow: '0 2px 4px rgba(0,0,0,0.5)'
          }}>
            TICKETS
          </span>
        </div>
      </div>
    </div>
  );

  if (loading) return <div style={{ backgroundColor: '#111', color: '#d4af37', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '24px', fontFamily: 'Georgia, serif' }}>Loading Movie Magic...</div>;
  
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
      fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif' 
    }}>
      
      {/* ================= FULL-SCREEN IMMERSIVE BACKGROUND TRAILER ================= */}
      {currentlyRunningWithTrailers.length > 0 && (
        <div style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          width: '100vw', 
          height: '100vh', 
          zIndex: 0, 
          pointerEvents: 'none', 
          overflow: 'hidden'
        }}>
          <iframe 
            width="100%" 
            height="100%" 
            src={buildMasterPlaylistUrl(currentlyRunningWithTrailers)} 
            title="Master Background Trailers" 
            frameBorder="0" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            style={{ 
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: '177.77vh', 
              height: '100vh',
              minWidth: '100vw',
              minHeight: '56.25vw',
              transform: 'translate(-50%, -50%) scale(1.1)',
              border: 'none',
              opacity: 0.7, 
              filter: 'contrast(1.15) brightness(1.05)'
            }}
          ></iframe>
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.45)' }}></div>
        </div>
      )}

      {/* ================= FOREGROUND CONTENT (z-index 2) ================= */}
      <div style={{ position: 'relative', zIndex: 2, width: '100%' }}>

        {/* Gold Nav Bar */}
        <div style={{ 
          backgroundColor: '#d4af37', 
          color: '#000', 
          padding: '12px 30px', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          fontSize: '16px', 
          fontWeight: 'bold', 
          letterSpacing: '1px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.5)'
        }}>
          <div style={{ display: 'flex', gap: '35px', alignItems: 'center' }}>
          </div>
        </div>

        {/* Massive Promo Banner */}
        <div style={{ 
          width: '100%', 
          marginTop: '70px',
          height: '400px', 
          backgroundImage: 'url("https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80")', 
          backgroundSize: 'cover', 
          backgroundPosition: 'center', 
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderBottom: '5px solid #d4af37',
          boxShadow: '0 10px 30px rgba(0,0,0,0.8)'
        }}>
          
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1 }}></div>
          
          <div style={{ 
            position: 'relative',
            zIndex: 2,
            backgroundColor: 'rgba(0, 0, 0, 0.65)', 
            backdropFilter: 'blur(6px)', /* Added glassmorphism for beauty */
            padding: '35px 60px', 
            borderRadius: '12px', 
            textAlign: 'center',
            border: '2px solid rgba(212, 175, 55, 0.8)',
            boxShadow: '0 0 30px rgba(0,0,0,0.9), 0 0 15px rgba(212,175,55,0.2)'
          }}>
            <h1 style={{ margin: '0 0 10px 0', fontSize: '52px', color: '#d4af37', fontFamily: 'Georgia, serif', textTransform: 'uppercase', letterSpacing: '3px', textShadow: '2px 2px 5px rgba(0,0,0,0.8)' }}>Treat Yourself</h1>
            <p style={{ margin: 0, color: '#fff', fontSize: '24px', fontStyle: 'italic', textShadow: '1px 1px 3px rgba(0,0,0,0.8)' }}>Experience Software Engineering Magic</p>
            <div style={{ marginTop: '25px', display: 'inline-block', backgroundColor: '#900', color: '#fff', padding: '12px 25px', fontSize: '18px', fontWeight: 'bold', transform: 'rotate(-2deg)', boxShadow: '0 4px 10px rgba(0,0,0,0.6)', border: '1px solid #ff4d4d' }}>
              CINEMA E-BOOKING SYSTEM
            </div>
          </div>
        </div>
        
        {/* Center Main Content Container */}
        <div style={{ maxWidth: '1200px', margin: '40px auto', padding: '0 20px', marginTop: '180px' }}>
          
          {/* Search & Filter Toolbar with Pixelated Characters */}
          <div style={{ marginBottom: '50px', display: 'flex', gap: '30px', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'flex-end' }}>
            
            {/* Search Input Box with Character on Top */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', width: '100%', maxWidth: '380px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '10px', marginBottom: '8px' }}>
                <img src="https://api.dicebear.com/7.x/pixel-art/svg?seed=Felix" alt="Pixel guide search" style={{ width: '45px', height: '45px', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.6))' }} />
                <div style={{ backgroundColor: 'rgba(212, 175, 55, 0.95)', color: '#000', padding: '6px 14px', borderRadius: '12px 12px 12px 0', fontSize: '15px', fontWeight: 'bold', marginBottom: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.5)' }}>
                  What are we watching?
                </div>
              </div>
              <input 
                placeholder="Search movies by title..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
                style={{ 
                  padding: '16px 25px', 
                  width: '100%',
                  boxSizing: 'border-box',
                  borderRadius: '10px', 
                  border: '2px solid #d4af37', 
                  backgroundColor: 'rgba(10, 10, 10, 0.85)', 
                  backdropFilter: 'blur(5px)',
                  color: '#fff', 
                  outline: 'none', 
                  fontSize: '16px', 
                  boxShadow: '0 8px 20px rgba(0,0,0,0.8)',
                  transition: 'all 0.3s ease' 
                }}
                onFocus={(e) => e.target.style.boxShadow = '0 0 25px rgba(212, 175, 55, 0.5)'}
                onBlur={(e) => e.target.style.boxShadow = '0 8px 20px rgba(0,0,0,0.8)'}
              />
            </div>

            {/* Dropdown Box with Character on Top */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', width: '100%', maxWidth: '280px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '10px', marginBottom: '8px' }}>
                <img src="https://api.dicebear.com/7.x/pixel-art/svg?seed=Aneka" alt="Pixel guide filter" style={{ width: '45px', height: '45px', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.6))' }} />
                <div style={{ backgroundColor: 'rgba(212, 175, 55, 0.95)', color: '#000', padding: '6px 14px', borderRadius: '12px 12px 12px 0', fontSize: '15px', fontWeight: 'bold', marginBottom: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.5)' }}>
                  Pick a genre!
                </div>
              </div>
              <select 
                value={genreFilter} 
                onChange={(e) => setGenreFilter(e.target.value)}
                style={{ 
                  padding: '16px 25px', 
                  width: '100%',
                  boxSizing: 'border-box',
                  borderRadius: '10px', 
                  border: '2px solid #d4af37', 
                  backgroundColor: 'rgba(10, 10, 10, 0.85)', 
                  backdropFilter: 'blur(5px)',
                  color: '#fff', 
                  outline: 'none', 
                  fontSize: '16px', 
                  cursor: 'pointer', 
                  boxShadow: '0 8px 20px rgba(0,0,0,0.8)',
                  transition: 'all 0.3s ease' 
                }}
                onFocus={(e) => e.target.style.boxShadow = '0 0 25px rgba(212, 175, 55, 0.5)'}
                onBlur={(e) => e.target.style.boxShadow = '0 8px 20px rgba(0,0,0,0.8)'}
              >
                <option value="">All Genres</option>
                {genres.map((g) => <option key={g.genre_id} value={g.genre_id}>{g.name}</option>)}
              </select>
            </div>

          </div>

          {/* NOW SHOWING SECTION with New Character Header */}
          <div style={{ 
            background: 'linear-gradient(135deg, rgba(42,8,8,0.95) 0%, rgba(17,17,17,0.98) 100%)', 
            backdropFilter: 'blur(8px)',
            padding: '50px 40px', 
            borderRadius: '18px', 
            marginTop: '160px', 
            marginBottom: '80px', 
            boxShadow: '0 15px 40px rgba(0,0,0,0.9)',
            border: '1px solid #661a1a'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '40px', position: 'relative' }}>
              <img src="https://api.dicebear.com/7.x/pixel-art/svg?seed=Jasper" alt="Now Showing Pixel Guide" style={{ width: '65px', height: '65px', filter: 'drop-shadow(0 6px 8px rgba(0,0,0,0.8))', marginBottom: '-15px', zIndex: 1 }} />
              <h2 style={{ 
                margin: 0, 
                fontSize: '32px', 
                color: '#d4af37', 
                textTransform: 'uppercase', 
                letterSpacing: '2px', 
                backgroundColor: 'rgba(10,10,10,0.8)',
                padding: '8px 30px',
                borderRadius: '12px',
                border: '2px solid #d4af37',
                boxShadow: '0 0 20px rgba(212,175,55,0.3)',
                zIndex: 2
              }}>
                Now Showing
              </h2>
            </div>
            <div style={{ display: 'flex', gap: '35px', flexWrap: 'wrap', justifyContent: 'center' }}>
              {filtered.filter((m) => m.status === 'Currently Running').map(renderCard)}
            </div>
          </div>
          
          {/* COMING SOON SECTION with New Character Header */}
          <div style={{ 
            background: 'linear-gradient(135deg, rgba(13,27,42,0.95) 0%, rgba(17,17,17,0.98) 100%)', 
            backdropFilter: 'blur(8px)',
            padding: '50px 40px', 
            borderRadius: '18px', 
            boxShadow: '0 15px 40px rgba(0,0,0,0.9)',
            border: '1px solid #1b263b'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '40px', position: 'relative' }}>
              <img src="https://api.dicebear.com/7.x/pixel-art/svg?seed=Oscar" alt="Coming Soon Pixel Guide" style={{ width: '65px', height: '65px', filter: 'drop-shadow(0 6px 8px rgba(0,0,0,0.8))', marginBottom: '-15px', zIndex: 1 }} />
              <h2 style={{ 
                margin: 0, 
                fontSize: '32px', 
                color: '#d4af37', 
                textTransform: 'uppercase', 
                letterSpacing: '2px', 
                backgroundColor: 'rgba(10,10,10,0.8)',
                padding: '8px 30px',
                borderRadius: '12px',
                border: '2px solid #d4af37',
                boxShadow: '0 0 20px rgba(212,175,55,0.3)',
                zIndex: 2
              }}>
                Coming Soon
              </h2>
            </div>
            <div style={{ display: 'flex', gap: '35px', flexWrap: 'wrap', justifyContent: 'center' }}>
              {filtered.filter((m) => m.status === 'Coming Soon').map(renderCard)}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default HomePage;