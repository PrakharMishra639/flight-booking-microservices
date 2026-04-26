import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Loader2 } from 'lucide-react';
import authService from '../../redux/services/authService';
import { setCredentials } from '../../redux/slices/authSlice';
import Alert from '../Common/Alert';

const OTPVerification = ({ email, onSuccess }) => {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = await authService.loginWithOtp(email, otp);
      if (onSuccess) {
          onSuccess(data);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Verification failed. Invalid OTP.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass w-full max-w-sm rounded-2xl p-8 relative overflow-hidden">
      <div className="relative z-10 text-center">
        <ShieldCheck className="h-12 w-12 text-primary mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Verify OTP</h2>
        <p className="text-slate-500 mb-6 text-sm">We've sent a code to {email}</p>
        
        <Alert message={error} type="error" onDismiss={() => setError('')} />

        <form onSubmit={handleVerify} className="space-y-4">
          <div>
            <input
              type="text"
              required
              maxLength="6"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="block w-full text-center tracking-widest text-2xl font-bold px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent bg-white/50 backdrop-blur-sm transition-all"
              placeholder="000000"
            />
          </div>

          <button
            type="submit"
            disabled={loading || otp.length < 6}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-primary hover:bg-primary-dark focus:outline-none transition-all disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Verify Code'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default OTPVerification;
