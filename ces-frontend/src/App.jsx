import React from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate, Navigate } from 'react-router-dom';
import HomePage from './HomePage';
import MovieDetails from './MovieDetails';
import BookingPage from './BookingPage';
import Register from './pages/Register';
import Login from './pages/Login';
import VerifyEmail from './pages/VerifyEmail';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import AdminHome from './pages/AdminHome';
import { getUser, logout } from './auth';
import EditProfile from './EditProfile'; 
import Favorites from './Favorites';


function NavBar() {
  const user = getUser();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();               // clears the stored token = session ended
    navigate('/login');


  };

  return (
    <nav style={{ display: 'flex', gap: '15px', padding: '12px 20px', borderBottom: '1px solid #ddd', alignItems: 'center', fontFamily: 'Arial' }}>
      
      {/*Grouped CES and My Favorite Movies on the left */}
      <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
        <Link to="/" style={{ fontWeight: 'bold', textDecoration: 'none', fontSize: '18px' }}>🎬 CES</Link>
        {user && (
          <Link to="/favorites" style={{ textDecoration: 'none', color: '#007BFF', fontWeight: 'bold' }}>
            My Favorite Movies
          </Link>
        )}
      </div>

      <div style={{ marginLeft: 'auto', display: 'flex', gap: '15px', alignItems: 'center' }}>
        {user ? (
          <>
            <span>Hi, {user.firstName}!</span>
            {user.role === 'admin' && <Link to="/admin">Admin Portal</Link>}
            
            {/* Edit Profile link between greeting and logout  */}
            <Link to="/edit-profile" style={{ textDecoration: 'none', color: '#333' }}>Edit Profile</Link>
            
            <button onClick={handleLogout} style={{ cursor: 'pointer', padding: '6px 12px' }}>Logout</button>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Sign Up</Link>
          </>
        )}
      </div>
    </nav>
  );
}

function AdminRoute({ children }) {
  const user = getUser();
  if (!user || user.role !== 'admin') return <Navigate to="/login" replace />;
  return children;
}

function App() {
  return (
    <BrowserRouter>
      <NavBar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/movies/:id" element={<MovieDetails />} />
        <Route path="/booking/:id" element={<BookingPage />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/verify/:token" element={<VerifyEmail />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/admin" element={<AdminRoute><AdminHome /></AdminRoute>} />
        <Route path="/edit-profile" element={<EditProfile />} />
        <Route path="/favorites" element={<Favorites />} />
        
        
      </Routes>
    </BrowserRouter>
  );
}

export default App;