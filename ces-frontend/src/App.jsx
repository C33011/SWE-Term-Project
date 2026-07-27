import { BrowserRouter, Routes, Route, Link, useNavigate, Navigate, useLocation } from 'react-router-dom';
import HomePage from './Homepage';
import MovieDetails from './MovieDetails';
import BookingPage from './BookingPage';
import CheckoutSummary from './CheckoutSummary';
import PaymentPage from './PaymentPage';
import ConfirmationPage from './ConfirmationPage';
import OrderHistory from './OrderHistory';
import Register from './pages/Register';
import Login from './pages/Login';
import VerifyEmail from './pages/VerifyEmail';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import AdminHome from './pages/AdminHome';
import ManageMovies from './pages/ManageMovies';
import AddMovie from './pages/AddMovie';
import AddPromotion from './pages/AddPromotion';
import ManageUsers from './pages/ManageUsers';
import ScheduleShowtime from './pages/ScheduleShowtime';
import EditProfile from './EditProfile';
import Favorites from './Favorites';
import { getUser, logout } from './auth';

function NavBar() {
  const user = getUser();
  const navigate = useNavigate();
  return (
    <nav style={{ 
      display: 'flex', 
      gap: '20px', 
      padding: '12px 40px', /* Increased right/left padding to add space on the edges */
      backgroundColor: '#d4af37', 
      borderBottom: '2px solid #b38f27', 
      alignItems: 'center',
      position: 'relative',
      zIndex: 10,
      fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
      fontWeight: 'bold'
    }}>
      <Link to="/" style={{ color: '#000', textDecoration: 'none', fontSize: '20px', fontFamily: 'Georgia, serif' }}>🎬 CES</Link>
      {user?.role === 'customer' && <>
        <Link to="/favorites" style={{ color: '#000', textDecoration: 'none' }}>My Favorite Movies</Link>
        <Link to="/orders" style={{ color: '#000', textDecoration: 'none' }}>My Orders</Link>
      </>}
      <div style={{ marginLeft: 'auto', display: 'flex', gap: '20px', alignItems: 'center' }}>
        {user ? <>
          <span style={{ color: '#000' }}>Hi, {user.firstName}!</span>
          {user.role === 'admin' && <Link to="/admin" style={{ color: '#000', textDecoration: 'none' }}>Admin Portal</Link>}
          <Link to="/edit-profile" style={{ color: '#000', textDecoration: 'none' }}>Edit Profile</Link>
          <button 
            onClick={() => { logout(); navigate('/login'); }} 
            style={{ backgroundColor: '#900', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            Logout
          </button>
        </> : <>
          <Link to="/login" style={{ color: '#000', textDecoration: 'none' }}>Login</Link>
          <Link to="/register" style={{ color: '#000', textDecoration: 'none' }}>Sign Up</Link>
        </>}
      </div>
    </nav>
  );
}

function ProtectedRoute({ children }) {
  return getUser() ? children : <Navigate to="/login" replace />;
}
function AdminRoute({ children }) {
  return getUser()?.role === 'admin' ? children : <Navigate to="/login" replace />;
}
function CustomerRoute({ children }) {
  const location = useLocation();
  const user = getUser();
  if (user?.role === 'customer') return children;
  const loginPath = `/login?redirect=${encodeURIComponent(location.pathname)}`;
  return <Navigate to={loginPath} replace />;
}

function App() {
  return (
    <BrowserRouter>
      <NavBar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/movies/:id" element={<MovieDetails />} />
        <Route path="/booking/:showId" element={<BookingPage />} />
        <Route path="/checkout" element={<CustomerRoute><CheckoutSummary /></CustomerRoute>} />
        <Route path="/payment" element={<CustomerRoute><PaymentPage /></CustomerRoute>} />
        <Route path="/confirmation/:bookingId" element={<CustomerRoute><ConfirmationPage /></CustomerRoute>} />
        <Route path="/orders" element={<CustomerRoute><OrderHistory /></CustomerRoute>} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/verify/:token" element={<VerifyEmail />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/admin" element={<AdminRoute><AdminHome /></AdminRoute>} />
        <Route path="/admin/movies" element={<AdminRoute><ManageMovies /></AdminRoute>} />
        <Route path="/admin/movies/add" element={<AdminRoute><AddMovie /></AdminRoute>} />
        <Route path="/admin/movies/edit/:id" element={<AdminRoute><AddMovie /></AdminRoute>} />
        <Route path="/admin/promotions/add" element={<AdminRoute><AddPromotion /></AdminRoute>} />
        <Route path="/admin/users" element={<AdminRoute><ManageUsers /></AdminRoute>} />
        <Route path="/admin/showtimes/add" element={<AdminRoute><ScheduleShowtime /></AdminRoute>} />
        <Route path="/edit-profile" element={<ProtectedRoute><EditProfile /></ProtectedRoute>} />
        <Route path="/favorites" element={<CustomerRoute><Favorites /></CustomerRoute>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
