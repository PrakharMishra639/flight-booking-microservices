import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Loader2, ArrowLeft } from 'lucide-react';
import authService from '../../redux/services/authService';
import Alert from '../Common/Alert';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState(false);
  const navigate = useNavigate();

  const validate = (value) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!value) setErrors({ email: 'Email is required' });
    else if (!emailRegex.test(value)) setErrors({ email: 'Please enter a valid email format' });
    else setErrors({});
  };

  const handleChange = (e) => {
    const value = e.target.value;
    setEmail(value);
    if (touched) validate(value);
  };

  const handleBlur = () => {
    setTouched(true);
    validate(email);
  };

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    if (Object.keys(errors).length > 0 || !email) return;

    setLoading(true);
    setError('');
    
    try {
      await authService.requestOtp(email, 'password_reset');
      setSuccess(true);
      setTimeout(() => {
        navigate(`/reset-password?email=${encodeURIComponent(email)}`);
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to request OTP. Please try again.');
      setLoading(false);
    }
  };

  const getInputClass = () => {
    const isError = touched && errors.email;
    const isValid = touched && !errors.email && email;
    
    return `block w-full pl-10 px-4 py-3 rounded-xl bg-white/50 backdrop-blur-sm transition-all border ${
      isError 
        ? 'border-red-500 ring-red-500/10 focus:ring-red-500 shadow-[0_4px_10px_rgba(239,68,68,0.05)]' 
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
          <Link to="/login" className="flex items-center text-sm font-medium text-slate-500 hover:text-primary mb-6 transition-colors">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to Login
          </Link>
 
          <h2 className="text-3xl font-heading font-bold text-slate-800 mb-2">Forgot Password?</h2>
          <p className="text-slate-500 mb-8">Enter your email and we'll send you an OTP to reset your password.</p>
          
          <Alert message={error} type="error" onDismiss={() => setError('')} />
          {success && <Alert message="OTP sent successfully! Redirecting to reset form..." type="success" />}
 
          {!success && (
            <form onSubmit={handleRequestOtp} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className={`h-5 w-5 ${touched && errors.email ? 'text-red-400' : 'text-slate-400'}`} />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={getInputClass()}
                    placeholder="you@example.com"
                  />
                </div>
                {touched && errors.email && (
                  <p className="mt-1.5 text-xs text-red-500 font-medium ml-1 flex items-center gap-1">
                    <span className="w-1 h-1 bg-red-500 rounded-full" /> {errors.email}
                  </p>
                )}
              </div>
 
              <button
                type="submit"
                disabled={loading || Object.keys(errors).length > 0 || !email}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-primary hover:bg-primary-dark focus:outline-none transition-all disabled:opacity-50"
              >
                {loading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Request Reset OTP'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
