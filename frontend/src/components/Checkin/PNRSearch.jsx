import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchBookingByPNR } from '../../redux/slices/checkinSlice';
import { Search, Loader2, AlertCircle, ChevronRight } from 'lucide-react';

const PNRSearch = () => {
  const [pnr, setPnr] = useState('');
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.checkin);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (pnr.length === 6) {
      dispatch(fetchBookingByPNR(pnr.toUpperCase()));
    }
  };

  return (
    <div className="max-w-md mx-auto p-10 rounded-[2.5rem] bg-white border border-slate-100 shadow-2xl shadow-indigo-500/5 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 rounded-full -translate-y-12 translate-x-12 blur-3xl opacity-50" />
      
      <div className="text-center mb-10 relative">
        <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
          <Search className="w-8 h-8" />
        </div>
        <h2 className="text-3xl font-heading font-extrabold text-slate-900 mb-3 tracking-tight">Web Check-In</h2>
        <p className="text-slate-500 font-medium">Enter your 6-character PNR to begin</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 relative">
        <div>
          <label htmlFor="pnr" className="block text-[10px] font-black text-slate-400 mb-3 uppercase tracking-[0.2em] pl-1">
            Booking Reference (PNR)
          </label>
          <div className="group">
            <input
              type="text"
              id="pnr"
              maxLength={6}
              value={pnr}
              onChange={(e) => setPnr(e.target.value.toUpperCase())}
              placeholder="e.g. ABC123"
              className="w-full bg-slate-50/50 border-2 border-slate-100 rounded-2xl px-6 py-5 text-2xl font-mono text-slate-900 tracking-[0.4em] focus:border-indigo-500 focus:bg-white focus:outline-none transition-all placeholder:text-slate-300 placeholder:tracking-normal font-bold"
              required
            />
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-100 flex items-start gap-4 text-red-600 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <p className="font-semibold leading-relaxed">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || pnr.length !== 6}
          className={`w-full py-5 rounded-2xl font-black text-lg transition-all flex items-center justify-center gap-3 shadow-xl ${
            pnr.length === 6 
              ? 'bg-indigo-600 hover:bg-slate-900 text-white shadow-indigo-600/20 active:scale-[0.98]' 
              : 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'
          }`}
        >
          {loading ? (
            <Loader2 className="w-6 h-6 animate-spin" />
          ) : (
            <>
              Retrieve Booking
              <ChevronRight className="w-5 h-5" />
            </>
          )}
        </button>
      </form>
      
      <div className="mt-10 pt-8 border-t border-slate-50 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-full">
          <AlertCircle className="w-3 h-3 text-slate-400" />
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none">
            24h to 2h window
          </p>
        </div>
      </div>
    </div>
  );
};

export default PNRSearch;
