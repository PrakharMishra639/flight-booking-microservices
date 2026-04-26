


import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Wallet, Search, TrendingUp, Calendar, CreditCard } from 'lucide-react';
import adminService from '../../redux/services/adminService';
import { setPayments, setLoading, setError } from '../../redux/slices/adminSlice';
import Loader from '../Common/Loader';
import Alert from '../Common/Alert';
import { formatCurrency, formatTime } from '../../utils/helpers';

const PaymentsPage = () => {
  const dispatch = useDispatch();
  const { payments, loading, error } = useSelector((state) => state.admin);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchPayments();
  }, [dispatch]);

  const fetchPayments = async () => {
    dispatch(setLoading(true));
    try {
      const data = await adminService.getAllPayments();
      dispatch(setPayments(data));
    } catch (err) {
      dispatch(setError(err.message));
    } finally {
      dispatch(setLoading(false));
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'SUCCESS': return 'text-emerald-500 bg-emerald-50 border-emerald-100';
      case 'FAILED': return 'text-red-500 bg-red-50 border-red-100';
      case 'PENDING': return 'text-amber-500 bg-amber-50 border-amber-100';
      default: return 'text-slate-500 bg-slate-50 border-slate-100';
    }
  };

  const filteredPayments = payments.filter(p =>
    p.transaction_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.Booking?.pnr?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.Booking?.User?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-4xl font-heading font-black text-slate-900 tracking-tight">Finances & Ledger</h2>
          <p className="text-slate-500 font-medium italic">Audit all platform transactions</p>
        </div>

        <div className="relative w-full md:w-96">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search TXID, PNR, or Name..."
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
                <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Transaction ID</th>
                <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Source PNR</th>
                <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Amount</th>
                <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Method</th>
                <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-[0.2em] text-right">Date & Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredPayments.map((payment) => (
                <tr key={payment.payment_id} className="hover:bg-slate-50/30 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 bg-slate-100 rounded-xl flex items-center justify-center">
                        <CreditCard className="h-4 w-4 text-slate-500" />
                      </div>
                      <span className="text-xs font-black text-slate-900 font-mono tracking-tighter uppercase">{payment.transaction_id}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col">
                      <span className="text-sm font-black text-slate-700 tracking-widest uppercase">#{payment.Booking?.pnr}</span>
                      <span className="text-[10px] font-bold text-slate-400 italic">{payment.Booking?.User?.name || 'Guest'}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className="text-lg font-black text-emerald-600 tracking-tight">
                      {formatCurrency(parseFloat(payment.amount) || 0)}
                    </span>
                  </td>
                  <td className="px-8 py-6 uppercase tracking-[0.1em] text-[10px] font-black text-slate-400">
                    {payment.payment_method || 'STRIPE_CC'}
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex flex-col items-end gap-1.5">
                      <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black border uppercase tracking-widest ${getStatusStyle(payment.status)}`}>
                        {payment.status}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400">{formatTime(payment.created_at)}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredPayments.length === 0 && (
            <div className="py-20 text-center">
              <TrendingUp className="h-12 w-12 text-slate-100 mx-auto mb-4" />
              <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No financial records found</p>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50 flex flex-col gap-4">
          <div className="h-12 w-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Volume</p>
            <p className="text-2xl font-black text-slate-900 tracking-tight">
              {formatCurrency(
                payments.reduce((acc, p) => {
                  const amount = parseFloat(p.amount) || 0;
                  return p.status === 'SUCCESS' ? acc + amount : acc;
                }, 0)
              )}
            </p>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50 flex flex-col gap-4">
          <div className="h-12 w-12 bg-primary/5 rounded-2xl flex items-center justify-center text-primary">
            <Wallet className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Successful TXs</p>
            <p className="text-2xl font-black text-slate-900 tracking-tight">{payments.filter(p => p.status === 'SUCCESS').length}</p>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50 flex flex-col gap-4">
          <div className="h-12 w-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400">
            <Calendar className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Period</p>
            <p className="text-2xl font-black text-slate-900 tracking-tight">Q2 2024</p>
          </div>
        </div>

        <div className="bg-slate-900 p-8 rounded-[2rem] shadow-xl shadow-slate-900/20 flex flex-col justify-between text-white">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Platform Status</p>
          <div>
            <p className="text-sm font-bold flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Processing
            </p>
            <p className="text-[10px] font-black text-slate-500 mt-1 uppercase">Gateways: Stripe, PayPal</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentsPage;
