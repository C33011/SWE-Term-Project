import React from 'react';
import { useNavigate } from 'react-router-dom';
import { getUser } from '../auth';

const AdminHome = () => {
  const user = getUser();
  const navigate = useNavigate();
  const items = [
    { title: 'Manage Movies', desc: 'Add, edit, or remove movies', path: '/admin/movies', icon: 'https://api.iconify.design/pixelarticons:clapperboard.svg?color=%23d4af37', bg: 'linear-gradient(135deg, rgba(42,8,8,0.95) 0%, rgba(17,17,17,0.98) 100%)', borderColor: '#661a1a' },
    { title: 'Manage Promotions', desc: 'Create and send promotional offers', path: '/admin/promotions/add', icon: 'https://api.iconify.design/pixelarticons:gift.svg?color=%23d4af37', bg: 'linear-gradient(135deg, rgba(13,27,42,0.95) 0%, rgba(17,17,17,0.98) 100%)', borderColor: '#1b263b' },
    { title: 'Manage Users', desc: 'View and manage customer accounts', path: '/admin/users', icon: 'https://api.iconify.design/pixelarticons:users.svg?color=%23d4af37', bg: 'linear-gradient(135deg, rgba(30,20,40,0.95) 0%, rgba(17,17,17,0.98) 100%)', borderColor: '#4a2c6d' },
    { title: 'Manage Showtimes', desc: 'Schedule shows and assign halls', path: '/admin/showtimes/add', icon: 'https://api.iconify.design/pixelarticons:calendar.svg?color=%23d4af37', bg: 'linear-gradient(135deg, rgba(20,40,30,0.95) 0%, rgba(17,17,17,0.98) 100%)', borderColor: '#1e4d3a' },
  ];

  return (
    <div style={{ 
      backgroundColor: '#111', 
      color: '#fff', 
      minHeight: '100vh', 
      padding: '20px 20px', 
      fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
      backgroundImage: 'url("https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80")',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      position: 'relative'
    }}>
      {/* Dark overlay for rich cinematic atmosphere */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 1 }}></div>

      {/* Foreground Content */}
      <div style={{ maxWidth: '900px', margin: '0 auto', backgroundColor: 'rgba(17,17,17,0.92)', backdropFilter: 'blur(8px)', padding: '50px', borderRadius: '20px', border: '2px solid #d4af37', boxShadow: '0 0 40px rgba(212,175,55,0.3)', position: 'relative', zIndex: 2 }}>
        
        {/* Floating Cinema Icons Background Flair */}
        <div style={{ position: 'absolute', top: '25px', left: '30px', opacity: 0.15, fontSize: '32px', pointerEvents: 'none' }}>🍿</div>
        <div style={{ position: 'absolute', top: '30px', right: '35px', opacity: 0.15, fontSize: '32px', pointerEvents: 'none' }}>🎟️</div>
        <div style={{ position: 'absolute', bottom: '25px', left: '40px', opacity: 0.15, fontSize: '32px', pointerEvents: 'none' }}>🎬</div>
        <div style={{ position: 'absolute', bottom: '30px', right: '45px', opacity: 0.15, fontSize: '32px', pointerEvents: 'none' }}>⭐</div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '40px', position: 'relative' }}>
          <img src="https://api.dicebear.com/7.x/pixel-art/svg?seed=AdminBoss" alt="Pixel Admin Guide" style={{ width: '70px', height: '70px', filter: 'drop-shadow(0 6px 8px rgba(0,0,0,0.8))', marginBottom: '-15px', zIndex: 1 }} />
          <h1 style={{ 
            color: '#d4af37', fontFamily: 'Georgia, serif', fontSize: '42px', margin: 0, textTransform: 'uppercase', letterSpacing: '2px', textShadow: '2px 2px 4px #000',
            backgroundColor: 'rgba(10,10,10,0.8)', padding: '8px 30px', borderRadius: '12px', border: '2px solid #d4af37', boxShadow: '0 0 20px rgba(212,175,55,0.3)', zIndex: 2
          }}>
            Admin Portal
          </h1>
          <p style={{ color: '#ccc', margin: '20px 0 0 0', fontSize: '18px', fontStyle: 'italic', zIndex: 2 }}>
            Welcome back, <strong style={{ color: '#d4af37', fontStyle: 'normal' }}>{user?.firstName}</strong>. Select an area to manage:
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '25px', marginTop: '30px', zIndex: 2, position: 'relative' }}>
          {items.map((item) => (
            <div key={item.title}
              style={{ 
                background: item.bg, backdropFilter: 'blur(8px)', border: `2px solid ${item.borderColor}`, borderRadius: '15px', 
                padding: '30px 20px', cursor: 'pointer', textAlign: 'center', boxShadow: '0 8px 20px rgba(0,0,0,0.8)',
                transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center'
              }}
              onClick={() => navigate(item.path)}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-8px) scale(1.03)'; e.currentTarget.style.borderColor = '#d4af37'; e.currentTarget.style.boxShadow = '0 15px 30px rgba(212,175,55,0.3)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0) scale(1)'; e.currentTarget.style.borderColor = item.borderColor; e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.8)'; }}
            >
              <div style={{ backgroundColor: 'rgba(0,0,0,0.6)', padding: '15px', borderRadius: '50%', marginBottom: '20px', border: '1px solid #d4af37', boxShadow: '0 4px 10px rgba(0,0,0,0.5)' }}>
                <img src={item.icon} alt={item.title} style={{ width: '36px', height: '36px', display: 'block' }} />
              </div>
              <h3 style={{ margin: '0 0 10px 0', fontSize: '20px', color: '#d4af37', fontFamily: 'Georgia, serif' }}>{item.title}</h3>
              <p style={{ color: '#bbb', margin: 0, fontSize: '14px', lineHeight: '1.4' }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminHome;
