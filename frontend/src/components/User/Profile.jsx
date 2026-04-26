import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { User, Plane, CheckCircle2, Lock, ChevronDown, ChevronUp } from 'lucide-react';
import bookingService from '../../redux/services/bookingService';
import { formatCurrency, formatDate } from '../../utils/helpers';
import Loader from '../Common/Loader';
import Alert from '../Common/Alert';
import authService from '../../redux/services/authService';
import { logout, updateUser } from '../../redux/slices/authSlice';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
  const { user } = useSelector(state => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [passwordError, setPasswordError] = useState('');
  const [bookingError, setBookingError] = useState('');
  const [success, setSuccess] = useState('');

  // Password change state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [isPasswordSectionOpen, setIsPasswordSectionOpen] = useState(false);

  const isCancellable = (booking) => {
    if (!booking) return false;
    const now = new Date();
    const referenceTime = booking.status === 'CONFIRMED'
      ? new Date(booking.confirmed_at)
      : new Date(booking.booking_date);

    if (isNaN(referenceTime.getTime())) return true; // Fallback for edge cases

    const diffMinutes = (now - referenceTime) / (1000 * 60);
    return diffMinutes <= 5;
  };

  useEffect(() => {
    const fetchBookings = async () => {
      setLoading(true);
      try {
        const data = await bookingService.getUserBookings(currentPage, 5);
        setBookings(data.bookings || []);
        setTotalPages(data.totalPages || 1);
      } catch (err) {
        setBookingError('Failed to load your bookings');
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
  }, [currentPage]);

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
    setActionLoading(true);
    try {
      await bookingService.cancelBooking(bookingId);
      setSuccess(`Booking cancelled successfully`);
      const data = await bookingService.getUserBookings(currentPage, 5);
      setBookings(data.bookings || []);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      setBookingError(err.response?.data?.error || 'Failed to cancel booking');
    } finally {
      setActionLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long');
      return;
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      setPasswordError('New password must include uppercase, lowercase, and a number');
      return;
    }

    if (oldPassword === newPassword) {
      setPasswordError('New password cannot be the same as the old password');
      return;
    }

    setChangingPassword(true);
    try {
      await authService.changePassword(oldPassword, newPassword);
      setSuccess('Password reset successfully');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      if (!user?.has_password) {
         dispatch(updateUser({ has_password: true }));
      }
    } catch (err) {
      setPasswordError(
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Failed to change password'
      );
    } finally {
      setChangingPassword(false);
    }
  };

  const handleLogout = async () => {
    if (!window.confirm('Are you sure you want to log out?')) return;
    try {
      await authService.logout();
      dispatch(logout());
      navigate('/login');
    } catch (err) {
      setBookingError(err.response?.data?.error || 'Failed to logout');
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header Profile Card */}
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm mb-10 flex items-center gap-6">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center border-4 border-white shadow-md">
            <User className="h-10 w-10 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">{user?.name}</h2>
            <p className="text-slate-500">{user?.email}</p>
          </div>
          <div className="ml-auto">
            {!user?.is_oauth_user && (
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl text-sm font-semibold transition-colors border border-red-100"
              >
                Logout
              </button>
            )}
          </div>
        </div>

        {/* Reset Password Section - Placed at the top for maximum visibility */}
        <div className="mb-12 bg-white rounded-3xl p-10 border border-slate-200 shadow-sm overflow-hidden relative cursor-pointer" onClick={() => setIsPasswordSectionOpen(!isPasswordSectionOpen)}>
          <div className="relative z-10 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center">
                <Lock className="h-6 w-6 text-slate-600" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-slate-900">{user?.is_oauth_user && !user?.has_password ? 'Set Password' : 'Reset Password'}</h3>
                <p className="text-slate-500 text-sm font-medium">Update your account security credentials</p>
              </div>
            </div>
            <div>
              {isPasswordSectionOpen ? <ChevronUp className="w-6 h-6 text-slate-400" /> : <ChevronDown className="w-6 h-6 text-slate-400" />}
            </div>
          </div>
        </div>

        {isPasswordSectionOpen && (
          <div className="mb-12 bg-white rounded-3xl p-10 border border-slate-200 shadow-xl overflow-hidden relative -mt-6">
            <div className="relative z-10 pt-2">
              <Alert message={success} type="success" onDismiss={() => setSuccess('')} />
              <Alert message={passwordError} type="error" onDismiss={() => setPasswordError('')} />

              <form onSubmit={handleChangePassword} className="max-w-xl grid grid-cols-1 md:grid-cols-2 gap-6">
                {(!user?.is_oauth_user || user?.has_password) && (
                  <div className="md:col-span-2">
                    <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">Current Password</label>
                    <input
                      type="password"
                      required
                      placeholder="Enter your old password"
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:bg-white focus:border-primary outline-none transition-all"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">New Password</label>
                  <input
                    type="password"
                    required
                    placeholder="Min. 8 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:bg-white focus:border-primary outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">Confirm New Password</label>
                  <input
                    type="password"
                    required
                    placeholder="Repeat new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:bg-white focus:border-primary outline-none transition-all"
                  />
                </div>

                <div className="md:col-span-2 pt-4">
                  <button
                    type="submit"
                    disabled={changingPassword}
                    className="w-full md:w-auto px-10 py-4 bg-slate-900 text-white rounded-2xl font-black text-sm hover:bg-primary hover:shadow-xl hover:shadow-primary/20 transition-all disabled:opacity-50"
                  >
                    {changingPassword ? 'Processing...' : (user?.is_oauth_user && !user?.has_password ? 'Set Password' : 'Reset Password')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <h3 className="text-xl font-bold text-slate-900 mb-6">My Bookings</h3>

        <Alert message={bookingError} type="error" onDismiss={() => setBookingError('')} />

        {loading ? (
          <Loader />
        ) : bookings.length === 0 && currentPage === 1 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm">
            <Plane className="mx-auto h-12 w-12 text-slate-300 mb-4" />
            <h4 className="text-lg font-medium text-slate-900">No bookings yet</h4>
            <p className="text-slate-500 mt-2">When you book a flight, it will appear here.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.length === 0 && currentPage > 1 && (
              <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm">
                 <h4 className="text-lg font-medium text-slate-500">No bookings on this page</h4>
              </div>
            )}
            {bookings.map(booking => (
              <div key={booking.booking_id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-4">
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">PNR</p>
                    <p className="text-lg font-bold text-slate-900 tracking-wider">{booking.pnr}</p>
                  </div>
                  <div className="text-right">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${booking.status === 'CONFIRMED' ? 'bg-emerald-100 text-emerald-700' :
                        booking.status === 'PENDING' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                      }`}>
                      {booking.status}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  {booking.BookingDetails && booking.BookingDetails[0]?.Schedule && (
                    <div>
                      <p className="font-semibold text-slate-900">
                        {booking.BookingDetails[0].Schedule.SourceAirport?.code} to {booking.BookingDetails[0].Schedule.DestAirport?.code}
                      </p>
                      <p className="text-sm text-slate-500">{formatDate(booking.BookingDetails[0].Schedule.departure_time)}</p>
                    </div>
                  )}
                  <div className="text-left md:text-right">
                    <p className="font-semibold text-slate-900">{formatCurrency(booking.total_price)}</p>
                    <p className="text-sm text-slate-500">{booking.passenger_count} Passenger(s)</p>
                  </div>
                </div>

                {/* Actions */}
                {(booking.status === 'PENDING' || booking.status === 'CONFIRMED') && (
                  <div className="mt-6 pt-4 border-t border-slate-100 flex gap-3 justify-end">
                    {booking.status === 'PENDING' && (
                      <button
                        onClick={() => navigate(`/payment/${booking.booking_id}`)}
                        className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary-dark transition-colors"
                      >
                        Pay Now
                      </button>
                    )}
                    {isCancellable(booking) && (
                      <button
                        onClick={() => handleCancelBooking(booking.booking_id)}
                        disabled={actionLoading}
                        className="px-4 py-2 bg-white text-red-600 border border-red-200 rounded-xl text-sm font-semibold hover:bg-red-50 transition-colors disabled:opacity-50"
                      >
                        Cancel Booking
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between bg-white px-6 py-4 border border-slate-200 rounded-3xl mt-6 shadow-sm">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1 || loading}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
                >
                  Previous
                </button>
                <div className="text-sm font-medium text-slate-600">
                  Page <span className="font-bold text-slate-900">{currentPage}</span> of {totalPages}
                </div>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages || loading}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default Profile;
