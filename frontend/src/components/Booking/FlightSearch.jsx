


import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { PlaneTakeoff, PlaneLanding, Calendar, Users, Search } from 'lucide-react';
import { setSearchParams, setSearchPhase } from '../../redux/slices/flightSlice';
import { motion, AnimatePresence } from 'framer-motion';
import CalendarPicker from './CalendarPicker';
import TripTypeToggle from './TripTypeToggle';
import AirportAutocomplete from './AirportAutocomplete';
import { ArrowLeftRight } from 'lucide-react'; // Added generic icon

// REMOVED: import NearbyAirports from './NearbyAirports'; - NOT NEEDED HERE

const FlightSearch = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { searchParams } = useSelector((state) => state.flight);
  const isSearchPage = window.location.pathname === '/search';

  const [form, setForm] = useState({
    source: searchParams.source || '',
    destination: searchParams.destination || '',
    date: searchParams.date || new Date().toISOString().split('T')[0],
    returnDate: searchParams.returnDate || '',
    tripType: searchParams.tripType || 'one-way',
    passengers: searchParams.passengers || 1,
    travelClass: searchParams.travelClass || 'ECONOMY',
  });

  useEffect(() => {
    setForm(prev => ({
      ...prev,
      source: searchParams.source || prev.source,
      destination: searchParams.destination || prev.destination,
      date: searchParams.date || prev.date,
      returnDate: searchParams.returnDate || prev.returnDate,
      tripType: searchParams.tripType || prev.tripType,
      passengers: searchParams.passengers || prev.passengers,
      travelClass: searchParams.travelClass || prev.travelClass,
    }));
  }, [searchParams]);

  const handleSearch = (e) => {
    e.preventDefault();
    dispatch(setSearchParams(form));
    dispatch(setSearchPhase('outward')); // Bug fix: Reset searchPhase so that we don't open search results in "Return" tab.
    navigate('/search');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="glass-dark w-full max-w-6xl mx-auto rounded-3xl p-6 sm:p-8"
    >
      <div className="mb-6">
        <TripTypeToggle
          value={form.tripType}
          onChange={(val) => setForm({ ...form, tripType: val, returnDate: val === 'one-way' ? '' : form.returnDate })}
        />
      </div>

      <form onSubmit={handleSearch} className="flex flex-col lg:flex-row lg:items-end gap-4">

        {/* FROM Field */}
        <div className="w-full lg:flex-1 relative">
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">From</label>
          <div className="relative flex items-center">
            <AirportAutocomplete
              value={form.source}
              onChange={(code) => setForm({ ...form, source: code })}
              placeholder="Search city or airport..."
              label="From"
              icon={PlaneTakeoff}
            />
            {/* Swap Button inside between the two autocomplete fields graphically */}
            <button
              type="button"
              onClick={() => setForm(f => ({ ...f, source: f.destination, destination: f.source }))}
              className="absolute -right-6 z-20 w-8 h-8 rounded-full bg-slate-800 border border-slate-700/50 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 shadow-xl transition-all hidden lg:flex"
            >
              <ArrowLeftRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* TO Field */}
        <div className="w-full lg:flex-1 relative">
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">To</label>
          <AirportAutocomplete
            value={form.destination}
            onChange={(code) => setForm({ ...form, destination: code })}
            placeholder="Search city or airport..."
            label="To"
            icon={PlaneLanding}
          />
        </div>

        {/* Date Fields */}
        <div className={`w-full relative transition-all duration-300 ${form.tripType === 'round-trip' ? 'lg:w-40' : 'lg:w-48'}`}>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
            {form.tripType === 'round-trip' ? 'Departure' : 'Date'}
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
              <Calendar className="h-5 w-5 text-slate-400" />
            </div>
            <CalendarPicker
              value={form.date}
              onChange={(date) => {
                const newForm = { ...form, date };
                setForm(newForm);
                if (isSearchPage) dispatch(setSearchParams(newForm));
              }}
              onFocus={() => dispatch(setSearchPhase('outward'))}
              source={form.source}
              destination={form.destination}
            />
          </div>
        </div>

        <AnimatePresence>
          {form.tripType === 'round-trip' && (
            <motion.div
              initial={{ opacity: 0, x: -20, width: 0 }}
              animate={{ opacity: 1, x: 0, width: 'auto' }}
              exit={{ opacity: 0, x: -20, width: 0 }}
              className="w-full lg:w-40 relative"
            >
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 text-nowrap">Return</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                  <Calendar className="h-5 w-5 text-slate-400" />
                </div>
                <CalendarPicker
                  value={form.returnDate}
                  onChange={(date) => {
                    const newForm = { ...form, returnDate: date };
                    setForm(newForm);
                    if (isSearchPage) dispatch(setSearchParams(newForm));
                  }}
                  onFocus={() => dispatch(setSearchPhase('return'))}
                  source={form.destination}
                  destination={form.source}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Passengers Field */}
        <div className="w-full lg:w-28 relative">
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Pass.</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Users className="h-4 w-4 text-slate-400" />
            </div>
            <select
              value={form.passengers}
              onChange={(e) => setForm({ ...form, passengers: parseInt(e.target.value) })}
              className="block w-full h-14 pl-10 pr-2 bg-slate-800/50 border border-slate-700/50 rounded-2xl text-white appearance-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm"
            >
              {[1, 2, 3, 4, 5, 6].map(n => <option key={n} value={n} className="bg-slate-800 text-white">{n}</option>)}
            </select>
          </div>
        </div>

        {/* Class Field */}
        <div className="w-full lg:w-32 relative">
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Class</label>
          <div className="relative">
            <select
              value={form.travelClass}
              onChange={(e) => setForm({ ...form, travelClass: e.target.value })}
              className="block w-full h-14 px-4 bg-slate-800/50 border border-slate-700/50 rounded-2xl text-white appearance-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm"
            >
              <option value="ECONOMY" className="bg-slate-800 text-white">Economy</option>
              <option value="BUSINESS" className="bg-slate-800 text-white">Business</option>
              <option value="FIRST" className="bg-slate-800 text-white">First</option>
            </select>
          </div>
        </div>

        {/* Search Button */}
        <div className="w-full lg:w-auto">
          <button
            type="submit"
            className="w-full lg:w-auto h-14 px-5 bg-primary hover:bg-primary-dark text-white rounded-2xl shadow-lg shadow-primary/30 flex items-center justify-center transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-primary"
          >
            <Search className="h-6 w-6" />
            <span className="lg:hidden ml-2 font-medium">Search Flights</span>
          </button>
        </div>

      </form>
    </motion.div>
  );
};

export default FlightSearch;