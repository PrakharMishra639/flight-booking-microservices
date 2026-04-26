


import { useState, useEffect, useRef } from 'react';
import flightService from '../../redux/services/flightService';
import NearbyAirports from './NearbyAirports';
import { Loader2, MapPin, Plane } from 'lucide-react';

const AirportAutocomplete = ({ value, onChange, placeholder, label, icon: Icon }) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const timeoutRef = useRef(null);

  // Sync internal query with parent value (3-letter code) on mount or change
  useEffect(() => {
    const syncValue = async () => {
      // If we have a code and it's not already reflected in the query label
      if (value && value.length === 3 && !query.includes(`(${value})`)) {
        try {
          const response = await flightService.getAirportByCode(value);
          // Backend returns { success: true, data: airport }
          if (response && response.success && response.data) {
            const airport = response.data;
            setQuery(`${airport.city} (${airport.code})`);
          } else {
            setQuery(value);
          }
        } catch (error) {
          console.error('Failed to sync airport code:', error);
          setQuery(value); // Fallback to just the code
        }
      } else if (!value) {
        setQuery('');
      }
    };

    syncValue();
  }, [value]);

  const fetchSuggestions = async (q) => {
    if (!q || q.length < 2) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    try {
      const data = await flightService.searchAirports(q);
      setSuggestions(data || []);
    } catch (error) {
      console.error('Failed to fetch suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    setShowDropdown(true);

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      fetchSuggestions(val);
    }, 300);
  };

  const handleSelect = (airport) => {
    setQuery(`${airport.city} (${airport.code})`);
    onChange(airport.code);
    setShowDropdown(false);
    setSuggestions([]);
  };

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          {Icon ? <Icon className="h-5 w-5 text-slate-400" /> : <MapPin className="h-5 w-5 text-slate-400" />}
        </div>
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => query.length >= 2 && setShowDropdown(true)}
          className="block w-full h-14 pl-12 pr-12 bg-slate-800/50 border border-slate-700/50 rounded-2xl text-white placeholder-slate-400 focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm"
          placeholder={placeholder}
          autoComplete="off"
        />
        {loading && (
          <div className="absolute inset-y-0 right-4 flex items-center">
            <Loader2 className="h-4 w-4 text-primary animate-spin" />
          </div>
        )}
        {/* Nearby Airports Button - Now receives airportCode and label */}
        <NearbyAirports
          onSelect={onChange}
          label={label}
          airportCode={value}
        />
      </div>

      {showDropdown && (suggestions.length > 0 || loading) && (
        <div className="absolute z-50 w-full mt-2 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="max-h-64 overflow-y-auto custom-scrollbar">
            {suggestions.map((airport) => (
              <button
                key={airport.airport_id}
                type="button"
                onClick={() => handleSelect(airport)}
                className="w-full px-5 py-4 flex items-center justify-between hover:bg-slate-800 transition-colors border-b border-slate-800/50 last:border-0 text-left"
              >
                <div className="flex items-start gap-3">
                  <div className="mt-1 p-2 bg-slate-800 rounded-lg">
                    <Plane className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-bold text-white text-sm">{airport.city}, {airport.country}</p>
                    <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{airport.name}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <span className="px-2 py-1 bg-primary/10 text-primary text-[10px] font-black rounded-md border border-primary/20">
                    {airport.code}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AirportAutocomplete;