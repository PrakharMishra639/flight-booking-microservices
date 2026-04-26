



import { useState } from 'react';
import { createPortal } from 'react-dom';
import { MapPin, Loader2, AlertCircle, X, Navigation } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import flightService from '../../redux/services/flightService';

const NearbyAirports = ({ onSelect, label = 'From', airportCode = '' }) => {
  const [state, setState] = useState('idle');
  const [airports, setAirports] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [btnRect, setBtnRect] = useState(null);
  const [radius, setRadius] = useState(150);

  const handleClick = async (e) => {
    e.stopPropagation();

    const rect = e.currentTarget.getBoundingClientRect();
    setBtnRect({
      top: rect.bottom + window.scrollY + 8,
      left: rect.left + window.scrollX,
    });

    if (!airportCode) {
      setErrorMsg(`Please select a ${label.toLowerCase()} airport first.`);
      setState('error');
      setIsOpen(true);
      return;
    }

    setState('loading');
    setIsOpen(true);
    setAirports([]);

    try {
      const response = await flightService.getAirportByCode(airportCode);

      if (!response || !response.success || !response.data) {
        setErrorMsg(`Could not find coordinates for ${airportCode}.`);
        setState('error');
        return;
      }

      const { latitude, longitude } = response.data;
      const data = await flightService.getNearbyAirports(latitude, longitude, radius);
      setAirports(data || []);
      setState(data && data.length > 0 ? 'success' : 'empty');
    } catch (err) {
      console.error('Error fetching nearby airports:', err);
      setErrorMsg('Could not fetch nearby airports. Please try again.');
      setState('error');
    }
  };

  const handleSelectAirport = (code) => {
    onSelect(code);
    setIsOpen(false);
    setState('idle');
    setAirports([]);
  };

  const handleClose = () => {
    setIsOpen(false);
    setState('idle');
    setAirports([]);
  };

  const dropdown = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 8, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.97 }}
          transition={{ duration: 0.18 }}
          style={{
            position: 'absolute',
            top: btnRect?.top ?? 0,
            left: btnRect?.left ?? 0,
            zIndex: 99999,
            minWidth: 300,
            maxWidth: 360,
          }}
          className="bg-white rounded-2xl shadow-2xl border border-slate-100 ring-1 ring-slate-900/5 overflow-hidden"
        >
          <div className="flex items-center justify-between px-4 py-3 bg-slate-900 text-white">
            <div className="flex items-center gap-2">
              <Navigation className="h-4 w-4 text-primary" />
              <span className="text-sm font-bold">Airports Near {airportCode}</span>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={radius}
                onChange={(e) => setRadius(Number(e.target.value))}
                className="text-xs bg-slate-800 text-white border border-slate-700 rounded-lg px-2 py-1 focus:outline-none"
              >
                <option value={50}>50 km</option>
                <option value={100}>100 km</option>
                <option value={150}>150 km</option>
                <option value={200}>200 km</option>
                <option value={250}>250 km</option>
                <option value={300}>300 km</option>
              </select>
              <button onClick={handleClose} className="p-1 hover:bg-white/10 rounded-lg transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="p-3">
            {state === 'loading' && (
              <div className="flex flex-col items-center py-8 gap-3">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
                <p className="text-sm text-slate-500 font-medium">Finding airports near {airportCode}...</p>
              </div>
            )}

            {state === 'error' && (
              <div className="flex flex-col items-center py-6 gap-2 text-center px-4">
                <AlertCircle className="h-8 w-8 text-red-400" />
                <p className="text-sm font-semibold text-slate-700">Error</p>
                <p className="text-xs text-slate-500">{errorMsg}</p>
              </div>
            )}

            {state === 'empty' && (
              <div className="flex flex-col items-center py-6 gap-2 text-center px-4">
                <MapPin className="h-8 w-8 text-slate-300" />
                <p className="text-sm font-semibold text-slate-700">No airports found</p>
                <p className="text-xs text-slate-500">Try increasing the search radius above.</p>
              </div>
            )}

            {state === 'success' && airports.length > 0 && (
              <div className="flex flex-col gap-1 max-h-64 overflow-y-auto pr-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 mb-1">
                  {airports.length} airport{airports.length !== 1 ? 's' : ''} found near {airportCode}
                </p>
                {airports.map((airport) => (
                  <button
                    key={airport.airport_id || airport.code}
                    onClick={() => handleSelectAirport(airport.code)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-colors text-left group"
                  >
                    <div className="flex-shrink-0 bg-primary/10 text-primary font-black text-sm w-10 h-10 rounded-xl flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                      {airport.code}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{airport.name}</p>
                      <p className="text-xs text-slate-500">{airport.city}{airport.country ? `, ${airport.country}` : ''}</p>
                    </div>
                    <MapPin className="h-4 w-4 text-slate-300 ml-auto group-hover:text-primary transition-colors flex-shrink-0" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        title={`Find airports near ${airportCode || label}`}
        className="absolute right-3 top-1/2 -translate-y-1/2 h-8 w-8 flex items-center justify-center rounded-xl transition-all z-10 bg-slate-700/50 text-slate-400 hover:bg-primary/20 hover:text-primary"
      >
        <MapPin className="h-4 w-4" />
      </button>
      {typeof document !== 'undefined' && createPortal(dropdown, document.body)}
    </>
  );
};

export default NearbyAirports;