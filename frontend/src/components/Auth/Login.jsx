import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Mail, Lock, Loader2, KeyRound, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import authService from '../../redux/services/authService';
import { setCredentials } from '../../redux/slices/authSlice';
import Alert from '../Common/Alert';
import { API_URL } from '../../utils/constants';
import { generateCodeVerifier, generateCodeChallenge } from '../../utils/pkce';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otpMode, setOtpMode] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [role, setRole] = useState('USER'); // Demo only
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const validate = (field, value) => {
    let newErrors = { ...errors };
    if (field === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!value) newErrors.email = 'Email is required';
      else if (!emailRegex.test(value)) newErrors.email = 'Please enter a valid email';
      else delete newErrors.email;
    }
    if (field === 'password') {
      if (!value) newErrors.password = 'Password is required';
      else if (value.length < 6) newErrors.password = 'Password must be at least 6 characters';
      else delete newErrors.password;
    }
    setErrors(newErrors);
  };

  const handleBlur = (field) => {
    setTouched({ ...touched, [field]: true });
    if (field === 'email') validate('email', email);
    if (field === 'password') validate('password', password);
  };

  const isFormValid = () => {
    if (otpMode) return email && (otpSent ? otpCode.length === 6 : true);
    return email && password && password.length >= 6 && Object.keys(errors).length === 0;
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const errorParam = params.get('error');
    if (errorParam) {
      setError(decodeURIComponent(errorParam));
    }
  }, [location]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!isFormValid()) return;

    setLoading(true);
    setError('');
    try {
      let data;
      if (otpMode) {
        if (!otpSent) {
          await authService.requestOtp(email, 'login');
          setOtpSent(true);
          setLoading(false);
          return;
        } else {
          data = await authService.loginWithOtp(email, otpCode);
        }
      } else {
        // Note: Even if we select 'ADMIN' here, the backend determines actual role
        data = await authService.login(email, password);
      }

      // Validate role matching
      if (role === 'ADMIN' && data.user.role !== 'ADMIN' && data.user.role !== 'SUPER_ADMIN') {
        throw new Error('Invalid credentials for Admin access');
      }

      if (role === 'USER' && data.user.role !== 'USER') {
        throw new Error('Invalid credentials for User access');
      }

      dispatch(setCredentials({
        user: data.user
      }));

      // Redirect based on role
      if (data.user.role === 'ADMIN' || data.user.role === 'SUPER_ADMIN') {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Authentication failed. Please check your details.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      localStorage.setItem('intendedRole', role);
      const redirect_uri = window.location.origin + '/oauth-callback';
      const data = await authService.getGoogleOAuthUrl(null, 'login', redirect_uri);
      window.location.href = data.url;

      // Redirect to Google login
      window.location.href = data.url;
    } catch (err) {
      setError('Failed to initialize Google Login. Please try again.');
      console.error(err);
    }
  };

  const getInputClass = (field, baseClass) => {
    const isError = touched[field] && errors[field];
    const isValid = touched[field] && !errors[field] && (field === 'email' ? email : password);

    return `${baseClass} ${isError
      ? 'border-red-500 ring-red-500/20 focus:ring-red-500 focus:border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.1)]'
      : isValid
        ? 'border-emerald-500 focus:ring-emerald-500 focus:border-emerald-500'
        : 'border-slate-200 focus:ring-primary focus:border-transparent'
      }`;
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="glass w-full max-w-md rounded-2xl p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl -mx-32 -mt-32 pointer-events-none" />

        <div className="relative z-10">
          <h2 className="text-3xl font-heading font-bold text-slate-800 text-center mb-2">Welcome Back</h2>
          <p className="text-slate-500 text-center mb-6">Sign in to manage your flights</p>

          <Alert message={error} type="error" onDismiss={() => setError('')} />

          {/* Role Toggle for Showing Purpose */}
          <div className="flex bg-slate-100 p-1 rounded-xl mb-6">
            <button
              onClick={() => setRole('USER')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${role === 'USER' ? 'bg-primary text-white shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Logged as User
            </button>
            <button
              onClick={() => setRole('ADMIN')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${role === 'ADMIN' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Logged as Admin
            </button>
          </div>

          {/* Auth Mode Toggle */}
          <div className="flex bg-slate-100 p-1 rounded-xl mb-6">
            <button
              onClick={() => { setOtpMode(false); setOtpSent(false); setErrors({}); setTouched({}); }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${!otpMode ? 'bg-white shadow-sm text-primary' : 'text-slate-500'}`}
            >
              Password
            </button>
            <button
              onClick={() => { setOtpMode(true); setErrors({}); setTouched({}); }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${otpMode ? 'bg-white shadow-sm text-primary' : 'text-slate-500'}`}
            >
              OTP Login
            </button>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className={`h-5 w-5 ${touched.email && errors.email ? 'text-red-400' : 'text-slate-400'}`} />
                </div>
                <input
                  type="email" required
                  disabled={otpSent}
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); if (touched.email) validate('email', e.target.value); }}
                  onBlur={() => handleBlur('email')}
                  className={getInputClass('email', "block w-full pl-10 px-4 py-3 rounded-xl bg-white/50 backdrop-blur-sm transition-all")}
                  placeholder="Enter your email"
                />
              </div>
              {touched.email && errors.email && (
                <p className="mt-1 text-xs text-red-500 font-medium flex items-center gap-1">
                  <span className="w-1 h-1 bg-red-500 rounded-full" /> {errors.email}
                </p>
              )}
            </div>

            {!otpMode && (
              <div>
                <div className="flex justify-between mb-1">
                  <label className="block text-sm font-medium text-slate-700">Password</label>
                  <Link to="/forgot-password" size="sm" className="text-xs font-semibold text-primary hover:text-primary-dark">Forgot?</Link>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className={`h-5 w-5 ${touched.password && errors.password ? 'text-red-400' : 'text-slate-400'}`} />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"} required
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); if (touched.password) validate('password', e.target.value); }}
                    onBlur={() => handleBlur('password')}
                    className={getInputClass('password', "block w-full pl-10 pr-10 px-4 py-3 rounded-xl bg-white/50 backdrop-blur-sm transition-all")}
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {touched.password && errors.password && (
                  <p className="mt-1 text-xs text-red-500 font-medium flex items-center gap-1">
                    <span className="w-1 h-1 bg-red-500 rounded-full" /> {errors.password}
                  </p>
                )}
              </div>
            )}

            {otpMode && otpSent && (
              <div className="animate-in fade-in slide-in-from-top-4 duration-300">
                <label className="block text-sm font-medium text-slate-700 mb-1">Verification Code</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <ShieldCheck className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="text" required maxLength="6"
                    value={otpCode} onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    className="block w-full pl-10 px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent bg-white/50 backdrop-blur-sm transition-all text-center tracking-widest font-bold"
                    placeholder="000000"
                  />
                </div>
                <button type="button" onClick={() => setOtpSent(false)} className="mt-2 text-xs text-primary font-semibold hover:underline">Change email</button>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-primary hover:bg-primary-dark focus:outline-none transition-all disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin h-5 w-5" /> : (otpMode && !otpSent ? 'Send OTP' : (otpSent ? 'Verify & Login' : 'Log In'))}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200"></div></div>
            <div className="relative flex justify-center text-sm"><span className="px-2 bg-white/50 text-slate-400">Or continue with</span></div>
          </div>

          {/* OAuth Provider Section */}
          <div className="mb-6">
            <button
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white border border-slate-200 rounded-xl shadow-sm text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Continue with Google
            </button>
          </div>

          <p className="mt-8 text-center text-sm text-slate-600">
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold text-primary hover:text-primary-dark transition-colors">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
