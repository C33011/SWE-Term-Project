import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getToken } from './auth';

const Favorites = () => {
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/favorites', { headers: { Authorization: `Bearer ${getToken()}` } })
      .then(async (response) => { if (response.ok) setFavorites(await response.json()); })
      .finally(() => setLoading(false));
  }, []);

  const remove = async (movieId) => {
    const response = await fetch('/api/auth/favorites/toggle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify({ movieId }),
    });
    if (response.ok) setFavorites((current) => current.filter((movie) => movie.movie_id !== movieId));
  };

  if (loading) return <div style={{ backgroundColor: '#111', color: '#d4af37', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '24px', fontFamily: 'Georgia, serif' }}>Loading your stash... 🍿</div>;
  
  return (
    <div style={{ backgroundColor: '#0a0a0a', minHeight: '100vh', padding: '40px 20px', fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif', backgroundImage: 'radial-gradient(circle at top, #2a0808 0%, #0a0a0a 40%)' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        <button onClick={() => navigate('/')} style={{ background: 'rgba(0,0,0,0.5)', color: '#0dcaf0', border: '1px solid #0dcaf0', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', marginBottom: '30px', fontWeight: 'bold', boxShadow: '0 0 10px rgba(13, 202, 240, 0.2)' }}>
          ← Back to Movies
        </button>
        
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px', marginBottom: '50px', backgroundColor: 'rgba(20,20,20,0.8)', padding: '20px', borderRadius: '15px', border: '1px solid #d4af37', boxShadow: '0 10px 30px rgba(0,0,0,0.8)' }}>
          <img src="https://api.dicebear.com/7.x/pixel-art/svg?seed=Stash" alt="Pixel Stash Guide" style={{ width: '80px', height: '80px', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.5))' }} />
          <div>
            <h1 style={{ color: '#d4af37', fontFamily: 'Georgia, serif', fontSize: '42px', margin: 0, textTransform: 'uppercase', letterSpacing: '2px', textShadow: '2px 2px 4px #000' }}>My Favorites</h1>
            <p style={{ color: '#0dcaf0', margin: '5px 0 0 0', fontWeight: 'bold', fontSize: '18px' }}>Your personal cinema stash! 🎥✨</p>
          </div>
        </div>
        
        {favorites.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '50px', backgroundColor: 'rgba(17,17,17,0.9)', borderRadius: '15px', border: '1px dashed #d4af37' }}>
            <img src="https://api.iconify.design/pixelarticons:alien.svg?color=%23ccc" alt="Empty" style={{ width: '60px', height: '60px' }} />
            <p style={{ color: '#ccc', fontSize: '20px', marginTop: '15px' }}>It's a ghost town in here. Go favorite some movies!</p>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap', justifyContent: 'center' }}>
            {favorites.map((movie) => (
              <div 
                key={movie.movie_id} 
                style={{ 
                  backgroundColor: '#1a1a1a', borderRadius: '16px', overflow: 'hidden', 
                  width: '240px', border: '2px solid #333', boxShadow: '0 8px 20px rgba(0,0,0,0.9)',
                  position: 'relative', display: 'flex', flexDirection: 'column',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-10px)'; e.currentTarget.style.borderColor = '#0dcaf0'; e.currentTarget.style.boxShadow = '0 15px 30px rgba(13,202,240,0.3)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = '#333'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.9)'; }}
              >
                <button 
                  onClick={() => remove(movie.movie_id)} 
                  style={{ 
                    position: 'absolute', top: '15px', right: '15px', fontSize: '18px', 
                    backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)', borderRadius: '50%', 
                    width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', 
                    cursor: 'pointer', zIndex: 2, border: '2px solid #e74c3c', color: '#fff', transition: 'transform 0.2s' 
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.2)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  title="Remove from favorites"
                >
                  ❌
                </button>
                <div style={{ position: 'relative' }}>
                  <img src={movie.poster_url} alt={movie.title} style={{ width: '100%', height: '350px', objectFit: 'cover' }} />
                  <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '60px', background: 'linear-gradient(to top, #1a1a1a, transparent)' }}></div>
                </div>
                <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', flexGrow: 1, justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1a1a1a' }}>
                  <h4 style={{ margin: '0 0 15px 0', fontSize: '18px', color: '#fff', textAlign: 'center', width: '100%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{movie.title}</h4>
                  <Link to={`/movies/${movie.movie_id}`} style={{ 
                    textDecoration: 'none', background: 'linear-gradient(90deg, #17a2b8 0%, #0dcaf0 100%)', 
                    color: '#000', fontWeight: '900', padding: '10px 20px', borderRadius: '8px', width: '100%', textAlign: 'center',
                    boxShadow: '0 4px 10px rgba(13,202,240,0.4)'
                  }}>
                    VIEW DETAILS
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
export default Favorites;