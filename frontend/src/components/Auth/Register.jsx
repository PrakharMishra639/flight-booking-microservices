import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, User, Phone, Loader2, Eye, EyeOff, ShieldCheck, ArrowLeft, RotateCw } from 'lucide-react';
import authService from '../../redux/services/authService';
import { setCredentials } from '../../redux/slices/authSlice';
import Alert from '../Common/Alert';
import { API_URL } from '../../utils/constants';
import { generateCodeVerifier, generateCodeChallenge } from '../../utils/pkce';

const Register = () => {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  
  // OTP Flow States
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [countdown, setCountdown] = useState(0);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const validate = (field, value) => {
    let newErrors = { ...errors };
    
    if (field === 'name') {
      if (!value) newErrors.name = 'Full name is required';
      else if (value.length < 2) newErrors.name = 'Name must be at least 2 characters';
      else if (value.length > 50) newErrors.name = 'Name cannot exceed 50 characters';
      else if (!/^[a-zA-Z\s]*$/.test(value)) newErrors.name = 'Name can only contain letters and spaces';
      else delete newErrors.name;
    }

    if (field === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!value) newErrors.email = 'Email is required';
      else if (!emailRegex.test(value)) newErrors.email = 'Please enter a valid email (e.g., user@example.com)';
      else delete newErrors.email;
    }

    if (field === 'phone') {
      if (!value) newErrors.phone = 'Phone number is required';
      else if (!/^\d{10}$/.test(value)) newErrors.phone = 'Phone number must be exactly 10 digits';
      else delete newErrors.phone;
    }

    if (field === 'password') {
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
      if (!value) newErrors.password = 'Password is required';
      else if (value.length < 8) newErrors.password = 'Password must be at least 8 characters';
      else if (!passwordRegex.test(value)) newErrors.password = 'Must include uppercase, lowercase, and a number';
      else delete newErrors.password;

      // Also re-validate confirm password if it's already touched
      if (touched.confirmPassword) {
        if (formData.confirmPassword !== value) newErrors.confirmPassword = 'Passwords do not match';
        else delete newErrors.confirmPassword;
      }
    }

    if (field === 'confirmPassword') {
      if (!value) newErrors.confirmPassword = 'Please confirm your password';
      else if (value !== formData.password) newErrors.confirmPassword = 'Passwords do not match';
      else delete newErrors.confirmPassword;
    }

    setErrors(newErrors);
  };

  const handleBlur = (field) => {
    setTouched({ ...touched, [field]: true });
    validate(field, formData[field]);
  };

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    if (touched[field]) {
      validate(field, value);
    }
  };

  const isFormValid = () => {
    const requiredFields = ['name', 'email', 'phone', 'password', 'confirmPassword'];
    const hasAllFields = requiredFields.every(f => formData[f]);
    const hasNoErrors = Object.keys(errors).length === 0;
    return hasAllFields && hasNoErrors;
  };

  // Timer logic for Resend OTP
  useEffect(() => {
    let timer = null;
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!isFormValid()) {
      // Mark all as touched to show errors
      const allTouched = {};
      ['name', 'email', 'phone', 'password', 'confirmPassword'].forEach(f => {
        allTouched[f] = true;
        validate(f, formData[f]);
      });
      setTouched(allTouched);
      return;
    }

    setLoading(true);
    setError('');
    try {
      await authService.requestOtp(formData.email, 'registration');
      setIsOtpSent(true);
      setCountdown(30);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send OTP. Please check your email.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      // Step 1: Verify OTP
      await authService.verifyOtp(formData.email, otp);
      
      // Step 2: Proceed with Registration (exclude confirmPassword)
      const { confirmPassword, ...registerData } = formData;
      const data = await authService.register(registerData);
      dispatch(setCredentials({
        user: data.user
      }));
      navigate('/');
    } catch (err) {
      if (err.response?.data?.errors) {
         setError(err.response.data.errors.map(e => e.message).join(', '));
      } else {
         setError(err.response?.data?.error || 'Verification or registration failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  const getInputClass = (field) => {
    const isError = touched[field] && errors[field];
    const isValid = touched[field] && !errors[field] && formData[field];
    
    return `block w-full pl-10 px-4 py-3 rounded-xl bg-white/50 backdrop-blur-sm transition-all text-sm border ${
      isError 
        ? 'border-red-500 ring-red-500/10 focus:ring-red-500 shadow-[0_0_10px_rgba(239,68,68,0.05)]' 
        : isValid 
          ? 'border-emerald-500 focus:ring-emerald-500 focus:border-emerald-500' 
          : 'border-slate-200 focus:ring-primary focus:border-transparent'
    }`;
  };

  const handleGoogleLogin = async () => {
    try {
      const redirect_uri = window.location.origin + '/oauth-callback';
      const data = await authService.getGoogleOAuthUrl(null, 'register', redirect_uri);
      window.location.href = data.url;
    } catch (err) {
      setError('Failed to initialize Google Registration. Please try again.');
      console.error(err);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4 py-12">
      <div className="glass w-full max-w-md rounded-2xl p-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl -mx-32 -mt-32 pointer-events-none" />
        
        <div className="relative z-10">
          <h2 className="text-3xl font-heading font-bold text-slate-800 text-center mb-2">
            {isOtpSent ? 'Verify Email' : 'Create Account'}
          </h2>
          <p className="text-slate-500 text-center mb-8">
            {isOtpSent ? `We've sent a code to ${formData.email}` : 'Join AeroFlow today'}
          </p>
          
          <Alert message={error} type="error" onDismiss={() => setError('')} />

          {!isOtpSent ? (
            /* Step 1: Registration Details */
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className={`h-5 w-5 ${touched.name && errors.name ? 'text-red-400' : 'text-slate-400'}`} />
                  </div>
                  <input
                    type="text" required
                    value={formData.name} 
                    onChange={(e) => handleChange('name', e.target.value)}
                    onBlur={() => handleBlur('name')}
                    className={getInputClass('name')}
                    placeholder="Enter your name"
                  />
                </div>
                {touched.name && errors.name && (
                  <p className="mt-1 text-[10px] text-red-500 font-bold flex items-center gap-1">
                    <span className="w-1 h-1 bg-red-500 rounded-full" /> {errors.name}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className={`h-5 w-5 ${touched.email && errors.email ? 'text-red-400' : 'text-slate-400'}`} />
                  </div>
                  <input
                    type="email" required
                    value={formData.email} 
                    onChange={(e) => handleChange('email', e.target.value)}
                    onBlur={() => handleBlur('email')}
                    className={getInputClass('email')}
                    placeholder="Enter your email"
                  />
                </div>
                {touched.email && errors.email && (
                  <p className="mt-1 text-[10px] text-red-500 font-bold flex items-center gap-1">
                    <span className="w-1 h-1 bg-red-500 rounded-full" /> {errors.email}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className={`h-5 w-5 ${touched.phone && errors.phone ? 'text-red-400' : 'text-slate-400'}`} />
                  </div>
                  <input
                    type="tel"
                    value={formData.phone} 
                    onChange={(e) => handleChange('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                    onBlur={() => handleBlur('phone')}
                    className={getInputClass('phone')}
                    placeholder="10-digit mobile number"
                  />
                </div>
                {touched.phone && errors.phone && (
                  <p className="mt-1 text-[10px] text-red-500 font-bold flex items-center gap-1">
                    <span className="w-1 h-1 bg-red-500 rounded-full" /> {errors.phone}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className={`h-5 w-5 ${touched.password && errors.password ? 'text-red-400' : 'text-slate-400'}`} />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"} required
                      value={formData.password} 
                      onChange={(e) => handleChange('password', e.target.value)}
                      onBlur={() => handleBlur('password')}
                      className={getInputClass('password')}
                      placeholder="At least 8 chars"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Confirm</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <ShieldCheck className={`h-5 w-5 ${touched.confirmPassword && errors.confirmPassword ? 'text-red-400' : 'text-slate-400'}`} />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"} required
                      value={formData.confirmPassword} 
                      onChange={(e) => handleChange('confirmPassword', e.target.value)}
                      onBlur={() => handleBlur('confirmPassword')}
                      className={getInputClass('confirmPassword')}
                      placeholder="Repeat password"
                    />
                  </div>
                </div>

                <div className="md:col-span-2">
                  {touched.password && errors.password ? (
                    <p className="mt-1 text-[10px] text-red-500 font-bold flex items-center gap-1">
                      <span className="w-1 h-1 bg-red-500 rounded-full" /> {errors.password}
                    </p>
                  ) : touched.confirmPassword && errors.confirmPassword ? (
                    <p className="mt-1 text-[10px] text-red-500 font-bold flex items-center gap-1">
                      <span className="w-1 h-1 bg-red-500 rounded-full" /> {errors.confirmPassword}
                    </p>
                  ) : null}
                </div>
              </div>

              <button
                type="submit" disabled={loading || !isFormValid()}
                className="w-full flex justify-center mt-6 py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-primary hover:bg-primary-dark focus:outline-none transition-all disabled:opacity-50"
              >
                {loading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Send OTP'}
              </button>
            </form>
          ) : (
            /* Step 2: OTP Verification */
            <form onSubmit={handleVerifyAndRegister} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Entry OTP Code</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <ShieldCheck className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="text" required maxLength="6"
                    value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    className="block w-full pl-10 px-4 py-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent bg-white/50 backdrop-blur-sm transition-all text-center tracking-[0.5em] text-xl font-bold"
                    placeholder="••••••"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  type="submit" disabled={loading || otp.length < 6}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all disabled:opacity-50"
                >
                  {loading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Verify & Register'}
                </button>

                <div className="flex items-center justify-between px-1">
                  <button
                    type="button"
                    onClick={() => setIsOtpSent(false)}
                    className="text-xs font-semibold text-slate-500 hover:text-primary flex items-center gap-1 transition-colors"
                  >
                    <ArrowLeft className="h-3 w-3" /> Back to details
                  </button>

                  <button
                    type="button"
                    disabled={countdown > 0 || loading}
                    onClick={handleSendOtp}
                    className="text-xs font-bold text-primary hover:text-primary-dark disabled:text-slate-400 flex items-center gap-1 transition-colors"
                  >
                    <RotateCw className={`h-3 w-3 ${countdown > 0 ? '' : 'animate-pulse'}`} />
                    {countdown > 0 ? `Resend in ${countdown}s` : 'Resend OTP'}
                  </button>
                </div>
              </div>
            </form>
          )}

          {!isOtpSent && (
            <>
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200"></div></div>
                <div className="relative flex justify-center text-sm"><span className="px-2 bg-white/50 text-slate-400">Or continue with</span></div>
              </div>

              <div className="mb-6 mt-2">
                <button
                  onClick={handleGoogleLogin}
                  className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white border border-slate-200 rounded-xl shadow-sm text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Continue with Google
                </button>
              </div>
            </>
          )}

          <p className="mt-6 text-center text-sm text-slate-600">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-primary hover:text-primary-dark transition-colors">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;

