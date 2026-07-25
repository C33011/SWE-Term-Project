import { BrowserRouter, Routes, Route, Link, useNavigate, Navigate } from 'react-router-dom';
import HomePage from './Homepage';
import MovieDetails from './MovieDetails';
import BookingPage from './BookingPage';
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
    <nav style={{ display: 'flex', gap: '15px', padding: '12px 20px', borderBottom: '1px solid #ddd', alignItems: 'center' }}>
      <Link to="/">🎬 CES</Link>
      {user?.role === 'customer' && <Link to="/favorites">My Favorite Movies</Link>}
      <div style={{ marginLeft: 'auto', display: 'flex', gap: '15px', alignItems: 'center' }}>
        {user ? <>
          <span>Hi, {user.firstName}!</span>
          {user.role === 'admin' && <Link to="/admin">Admin Portal</Link>}
          <Link to="/edit-profile">Edit Profile</Link>
          <button onClick={() => { logout(); navigate('/login'); }}>Logout</button>
        </> : <><Link to="/login">Login</Link><Link to="/register">Sign Up</Link></>}
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
  return getUser()?.role === 'customer' ? children : <Navigate to="/login" replace />;
}

function App() {
  return (
    <BrowserRouter>
      <NavBar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/movies/:id" element={<MovieDetails />} />
        <Route path="/booking/:showId" element={<BookingPage />} />
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
