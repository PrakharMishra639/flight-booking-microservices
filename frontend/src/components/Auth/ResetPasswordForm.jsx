import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Lock, ShieldCheck, Mail, Loader2, ArrowLeft } from 'lucide-react';
import authService from '../../redux/services/authService';
import Alert from '../Common/Alert';

const ResetPasswordForm = () => {
  const [formData, setFormData] = useState({ email: '', otpCode: '', newPassword: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  
  const navigate = useNavigate();
  const location = useLocation();

  const validate = (field, value) => {
    let newErrors = { ...errors };
    
    if (field === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!value) newErrors.email = 'Email is required';
      else if (!emailRegex.test(value)) newErrors.email = 'Invalid email format';
      else delete newErrors.email;
    }

    if (field === 'otpCode') {
      if (!value) newErrors.otpCode = 'OTP is required';
      else if (!/^\d{6}$/.test(value)) newErrors.otpCode = 'OTP must be exactly 6 digits';
      else delete newErrors.otpCode;
    }

    if (field === 'newPassword') {
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
      if (!value) newErrors.newPassword = 'New password is required';
      else if (value.length < 8) newErrors.newPassword = 'Password must be at least 8 characters';
      else if (!passwordRegex.test(value)) newErrors.newPassword = 'Must include uppercase, lowercase, and a number';
      else delete newErrors.newPassword;

      if (touched.confirmPassword) {
        if (formData.confirmPassword !== value) newErrors.confirmPassword = 'Passwords do not match';
        else delete newErrors.confirmPassword;
      }
    }

    if (field === 'confirmPassword') {
      if (!value) newErrors.confirmPassword = 'Please confirm your password';
      else if (value !== formData.newPassword) newErrors.confirmPassword = 'Passwords do not match';
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
    if (touched[field]) validate(field, value);
  };

  const isFormValid = () => {
    const required = ['email', 'otpCode', 'newPassword', 'confirmPassword'];
    return required.every(f => formData[f]) && Object.keys(errors).length === 0;
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const emailParam = params.get('email');
    if (emailParam) {
      setFormData(prev => ({ ...prev, email: emailParam }));
    }
  }, [location]);

  const handleReset = async (e) => {
    e.preventDefault();
    if (!isFormValid()) return;

    setLoading(true);
    setError('');

    try {
      await authService.resetPassword(formData.email, formData.otpCode, formData.newPassword);
      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Failed to reset password. Please check your OTP.'
      );
      setLoading(false);
    }
  };

  const getInputClass = (field) => {
    const isError = touched[field] && errors[field];
    const isValid = touched[field] && !errors[field] && formData[field];
    
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
          <Link to="/forgot-password" className="flex items-center text-sm font-medium text-slate-500 hover:text-primary mb-6 transition-colors">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Link>

          <h2 className="text-3xl font-heading font-bold text-slate-800 mb-2">Reset Password</h2>
          <p className="text-slate-500 mb-8">Enter the OTP sent to your email and your new password.</p>
          
          <Alert message={error} type="error" onDismiss={() => setError('')} />
          {success && <Alert message="Password reset successful! Redirecting to login..." type="success" />}

          {!success && (
            <form onSubmit={handleReset} className="space-y-4">
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
                    placeholder="you@example.com"
                  />
                </div>
                {touched.email && errors.email && (
                  <p className="mt-1.5 text-xs text-red-500 font-medium ml-1 flex items-center gap-1">
                    <span className="w-1 h-1 bg-red-500 rounded-full" /> {errors.email}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">OTP Code</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <ShieldCheck className={`h-5 w-5 ${touched.otpCode && errors.otpCode ? 'text-red-400' : 'text-slate-400'}`} />
                  </div>
                  <input
                    type="text" required maxLength="6"
                    value={formData.otpCode}
                    onChange={(e) => handleChange('otpCode', e.target.value.replace(/\D/g, ''))}
                    onBlur={() => handleBlur('otpCode')}
                    className={getInputClass('otpCode') + " text-center tracking-widest font-black text-lg"}
                    placeholder="000000"
                  />
                </div>
                {touched.otpCode && errors.otpCode && (
                  <p className="mt-1.5 text-xs text-red-500 font-medium ml-1 flex items-center gap-1">
                    <span className="w-1 h-1 bg-red-500 rounded-full" /> {errors.otpCode}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className={`h-5 w-5 ${touched.newPassword && errors.newPassword ? 'text-red-400' : 'text-slate-400'}`} />
                  </div>
                  <input
                    type="password" required
                    value={formData.newPassword}
                    onChange={(e) => handleChange('newPassword', e.target.value)}
                    onBlur={() => handleBlur('newPassword')}
                    className={getInputClass('newPassword')}
                    placeholder="••••••••"
                  />
                </div>
                {touched.newPassword && errors.newPassword && (
                  <p className="mt-1.5 text-xs text-red-500 font-medium ml-1 flex items-center gap-1">
                    <span className="w-1 h-1 bg-red-500 rounded-full" /> {errors.newPassword}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Confirm New Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <ShieldCheck className={`h-5 w-5 ${touched.confirmPassword && errors.confirmPassword ? 'text-red-400' : 'text-slate-400'}`} />
                  </div>
                  <input
                    type="password" required
                    value={formData.confirmPassword}
                    onChange={(e) => handleChange('confirmPassword', e.target.value)}
                    onBlur={() => handleBlur('confirmPassword')}
                    className={getInputClass('confirmPassword')}
                    placeholder="••••••••"
                  />
                </div>
                {touched.confirmPassword && errors.confirmPassword && (
                  <p className="mt-1.5 text-xs text-red-500 font-medium ml-1 flex items-center gap-1">
                    <span className="w-1 h-1 bg-red-500 rounded-full" /> {errors.confirmPassword}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || !isFormValid()}
                className="w-full flex justify-center mt-6 py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-primary hover:bg-primary-dark focus:outline-none transition-all disabled:opacity-50"
              >
                {loading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Reset Password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordForm;
