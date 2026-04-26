import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { User, Calendar, CreditCard, Hash, Search, ArrowRight } from 'lucide-react';
import adminService from '../../redux/services/adminService';
import { setBookings, setLoading, setError } from '../../redux/slices/adminSlice';
import Loader from '../Common/Loader';
import Alert from '../Common/Alert';
import { formatCurrency, formatDate } from '../../utils/helpers';

const BookingsPage = () => {
  const dispatch = useDispatch();
  const { bookings, loading, error } = useSelector((state) => state.admin);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchBookings();
  }, [dispatch]);

  const fetchBookings = async () => {
    dispatch(setLoading(true));
    try {
      const data = await adminService.getAllBookings();
      dispatch(setBookings(data));
    } catch (err) {
      dispatch(setError(err.message));
    } finally {
      dispatch(setLoading(false));
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'CONFIRMED': return 'text-emerald-500 bg-emerald-50 border-emerald-100';
      case 'CANCELLED': return 'text-red-500 bg-red-50 border-red-100';
      case 'PENDING': return 'text-amber-500 bg-amber-50 border-amber-100';
      default: return 'text-slate-500 bg-slate-50 border-slate-100';
    }
  };

  const filteredBookings = bookings.filter(b => 
    b.pnr?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    b.User?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.User?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-4xl font-heading font-black text-slate-900 tracking-tight">Global Reservations</h2>
          <p className="text-slate-500 font-medium italic">Monitor all passenger seat inventories</p>
        </div>
        
        <div className="relative w-full md:w-96">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search PNR, Name or E-mail..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-6 py-4 bg-white border border-slate-100 rounded-2xl font-bold text-slate-900 shadow-xl shadow-slate-200/50 focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-slate-300"
          />
        </div>
      </div>

      <Alert message={error} type="error" />

      {loading ? (
        <div className="flex justify-center py-20"><Loader /></div>
      ) : (
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-[0.2em]">PNR / Status</th>
                <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Passenger</th>
                <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Travel Date</th>
                <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Total Price</th>
                <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-[0.2em] text-right">Payment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredBookings.map((booking) => (
                <tr key={booking.booking_id} className="hover:bg-slate-50/30 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex flex-col gap-2">
                      <span className="font-black text-slate-900 tracking-[0.15em] text-sm uppercase">#{booking.pnr}</span>
                      <span className={`w-fit px-2 py-0.5 rounded-lg text-[9px] font-black border uppercase tracking-widest ${getStatusStyle(booking.status)}`}>
                        {booking.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 bg-slate-100 rounded-xl flex items-center justify-center">
                        <User className="h-4 w-4 text-slate-500" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-800">{booking.User?.name || 'Guest User'}</span>
                        <span className="text-[10px] font-medium text-slate-400 truncate w-32">{booking.User?.email || booking.contact_email}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                      <Calendar className="h-3.5 w-3.5 text-primary" />
                      {formatDate(booking.booking_date)}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className="text-sm font-black text-slate-900 tracking-tight">
                      {['PENDING', 'CANCELLED', 'EXPIRED'].includes(booking.status) 
                        ? formatCurrency(0) 
                        : formatCurrency(booking.total_price)}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    {booking.status === 'CONFIRMED' ? (
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded uppercase tracking-tighter">Payment Completed</span>
                        {booking.Payments?.[0] && <span className="text-[9px] font-bold text-slate-400 font-mono">ID: {booking.Payments[0].transaction_id}</span>}
                      </div>
                    ) : (
                      <span className="text-[10px] font-black text-amber-500 bg-amber-50 px-2 py-0.5 rounded uppercase tracking-tighter">
                        No Payment
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {filteredBookings.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center">
                      <Hash className="h-12 w-12 text-slate-100 mb-4" />
                      <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No records found matching your hash</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default BookingsPage;
