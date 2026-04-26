import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../../redux/slices/authSlice';
import authService from '../../redux/services/authService';
import Loader from '../Common/Loader';

const OAuthCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const error = params.get('error');
    
    // Capture intended role immediately to prevent race conditions during parallel effect runs
    const intendedRole = localStorage.getItem('intendedRole');

    if (error) {
      localStorage.removeItem('intendedRole');
      navigate(`/login?error=${encodeURIComponent(error)}`);
      return;
    }

    const completeOAuth = async () => {
      try {
        const code = params.get('code');
        const state = params.get('state');
        let profile;

        if (code) {
          const redirect_uri = window.location.origin + '/oauth-callback';
          const response = await authService.exchangeGoogleToken(code, null, redirect_uri, state);
          profile = response.user;
        } else {
          // Legacy flow fallback
          profile = await authService.getProfile();
        }
        
        // Validate against the role captured when this effect execution started
        if (intendedRole && profile.role !== intendedRole) {
          localStorage.removeItem('intendedRole');
          await authService.logout();
          const roleLabel = intendedRole.charAt(0).toUpperCase() + intendedRole.slice(1).toLowerCase();
          navigate(`/login?error=Invalid credentials for ${roleLabel} access`);
          return;
        }

        // Only clear if we successfully matched or if no role was intended
        localStorage.removeItem('intendedRole');
        dispatch(setCredentials({ user: profile }));
        
        if (profile.role === 'ADMIN') {
          navigate('/admin');
        } else {
          navigate('/');
        }
      } catch (err) {
        localStorage.removeItem('intendedRole');
        console.error('OAuth profile fetch failed', err);
        const errorMessage = err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to complete authentication';
        navigate(`/login?error=${encodeURIComponent(errorMessage)}`);
      }
    };
    
    completeOAuth();
  }, [location, navigate, dispatch]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
      <Loader />
      <p className="mt-4 text-slate-600 font-medium">Finalizing secure login...</p>
    </div>
  );
};

export default OAuthCallback;
