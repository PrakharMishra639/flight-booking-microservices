import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import ProtectedRoute from './components/Common/ProtectedRoute';

import Home from './pages/Home';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import OAuthCallback from './components/Auth/OAuthCallback';
import ForgotPassword from './components/Auth/ForgotPassword';
import ResetPasswordForm from './components/Auth/ResetPasswordForm';
import SearchResults from './pages/SearchResults';
import Checkout from './pages/Checkout';
import Payment from './pages/Payment';
import About from './pages/About';
import Support from './pages/Support';
import WebCheckin from './pages/WebCheckin';

import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import authService from './redux/services/authService';
import { setCredentials, logout } from './redux/slices/authSlice';
import { store } from './redux/store';

import Profile from './components/User/Profile';
import Admin from './pages/Admin';

import RealtimeNotifications from './components/Common/RealtimeNotifications';

function App() {
  const dispatch = useDispatch();
  const { isAuthenticated, accessTokenExpiresAt } = useSelector(state => state.auth);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const userData = await authService.getProfile();
        if (userData) {
          dispatch(setCredentials({ user: userData }));
        }
      } catch (err) {
        // If profile fetch fails, we ensure local state is cleared
        // But we don't necessarily need to force logout if they were already logged out
      }
    };
    initAuth();
  }, [dispatch]);

  // Token Expiry Proactive Refresh
  useEffect(() => {
    if (!isAuthenticated || !accessTokenExpiresAt) return;

    const expiryTime = parseInt(accessTokenExpiresAt, 10);
    const delay = expiryTime - Date.now() - 60000; // 1 min before expiry
    
    if (delay <= 0) {
      // It's already expired or expiring inside 1 minute.
      authService.refreshAccessToken().then(data => {
         dispatch(setCredentials({ user: data.user, accessTokenExpiresAt: data.accessTokenExpiresAt }));
      }).catch(err => {
         dispatch(logout());
      });
      return;
    }

    const timer = setTimeout(() => {
      // Check current redux store to see if user is still authenticated right before acting
      const currentlyAuthenticated = store.getState().auth.isAuthenticated;
      if (!currentlyAuthenticated) {
        dispatch(logout());
        return;
      }

      authService.refreshAccessToken().then(data => {
         dispatch(setCredentials({ user: data.user, accessTokenExpiresAt: data.accessTokenExpiresAt }));
      }).catch((err) => {
         dispatch(logout());
      });
    }, delay);

    return () => clearTimeout(timer);
  }, [isAuthenticated, accessTokenExpiresAt, dispatch]);

  return (
    <Router>
      <RealtimeNotifications />
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="search" element={<SearchResults />} />
          <Route path="about" element={<About />} />
          <Route path="support" element={<Support />} />
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
          <Route path="oauth-callback" element={<OAuthCallback />} />
          <Route path="forgot-password" element={<ForgotPassword />} />
          <Route path="reset-password" element={<ResetPasswordForm />} />
          <Route path="web-checkin" element={<WebCheckin />} />
          
          <Route element={<ProtectedRoute />}>
            <Route path="checkout" element={<Checkout />} />
            <Route path="payment/:bookingId" element={<Payment />} />
            <Route path="profile" element={<Profile />} />
          </Route>
          
          <Route element={<ProtectedRoute roleRequired="ADMIN" />}>
            <Route path="admin/*" element={<Admin />} />
          </Route>
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
