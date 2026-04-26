import { useSelector, useDispatch } from 'react-redux';
import { setSearchParams } from '../../redux/slices/flightSlice';
import { Sliders, Clock, Plane, Filter, Check, Sun, Moon } from 'lucide-react';

const FlightFilters = () => {
  const dispatch = useDispatch();
  const { searchParams, availableFilters } = useSelector((state) => state.flight);

  const handleStopsChange = (stops) => {
    dispatch(setSearchParams({ stops }));
  };

  const handleSortChange = (sortBy) => {
    dispatch(setSearchParams({ sortBy }));
  };

  const handleAirlineChange = (airlineName) => {
    const currentAirlines = searchParams.airlines || [];
    const newAirlines = currentAirlines.includes(airlineName)
      ? currentAirlines.filter(name => name !== airlineName)
      : [...currentAirlines, airlineName];
    
    dispatch(setSearchParams({ airlines: newAirlines }));
  };

  const handleTimeFilter = (timeOption) => {
    if (searchParams.timeFilter === timeOption) {
      dispatch(setSearchParams({ timeFilter: null }));
    } else {
      dispatch(setSearchParams({ timeFilter: timeOption, sortBy: 'time_asc' }));
    }
  };

  const handleReset = () => {
    dispatch(setSearchParams({ 
      stops: 3, 
      sortBy: 'price_asc',
      airlines: [],
      timeFilter: null
    }));
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Filter className="h-5 w-5 text-primary" />
          Filters
        </h3>
        <button 
          onClick={handleReset}
          className="text-xs font-semibold text-primary hover:underline"
        >
          Reset All
        </button>
      </div>

      {/* Sort By */}
      <div>
        <p className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <Sliders className="h-4 w-4 text-slate-400" />
          Sort By
        </p>
        <div className="grid grid-cols-2 gap-2">
          {[
            { id: 'price_asc', label: 'Price: Low to High' },
            { id: 'duration_asc', label: 'Fastest' },
            { id: 'time_asc', label: 'Earliest' }
          ].map((option) => (
            <button
              key={option.id}
              onClick={() => handleSortChange(option.id)}
              className={`px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                searchParams.sortBy === option.id
                  ? 'bg-primary text-white shadow-lg shadow-primary/20'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/50'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Departure Time */}
      <div>
        <p className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <Clock className="h-4 w-4 text-slate-400" />
          Departure Time
        </p>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => handleTimeFilter('morning')}
            className={`px-3 py-3 rounded-xl text-xs font-bold transition-all border flex flex-col items-center justify-center gap-1 ${
              searchParams.timeFilter === 'morning'
                ? 'bg-primary border-primary text-white shadow-md shadow-primary/20'
                : 'bg-white border-slate-200 text-slate-600 hover:border-primary hover:text-primary'
            }`}
          >
            <Sun className={`h-4 w-4 ${searchParams.timeFilter === 'morning' ? 'text-white' : 'text-amber-500'}`} />
            12 AM - 12 PM
          </button>
          
          <button
            onClick={() => handleTimeFilter('evening')}
             className={`px-3 py-3 rounded-xl text-xs font-bold transition-all border flex flex-col items-center justify-center gap-1 ${
              searchParams.timeFilter === 'evening'
                ? 'bg-primary border-primary text-white shadow-md shadow-primary/20'
                : 'bg-white border-slate-200 text-slate-600 hover:border-primary hover:text-primary'
            }`}
          >
            <Moon className={`h-4 w-4 ${searchParams.timeFilter === 'evening' ? 'text-white' : 'text-indigo-500'}`} />
            12 PM - 12 AM
          </button>
        </div>
      </div>

      {/* Stops */}
      <div>
        <p className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <Clock className="h-4 w-4 text-slate-400" />
          Stops
        </p>
        <div className="space-y-3">
          {[
            { label: 'Any', value: 3 },
            { label: 'Non-stop', value: 0 },
            { label: '1 Stop', value: 1 },
            { label: '2 Stops', value: 2 },
          ].map((option) => (
            <label key={option.value} className="flex items-center group cursor-pointer">
              <div className="relative flex items-center">
                <input
                  type="radio"
                  name="stops"
                  checked={searchParams.stops === option.value}
                  onChange={() => handleStopsChange(option.value)}
                  className="peer h-5 w-5 cursor-pointer appearance-none rounded-full border border-slate-300 checked:border-primary transition-all"
                />
                <div className="absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary opacity-0 peer-checked:opacity-100 transition-opacity"></div>
              </div>
              <span className="ml-3 text-sm text-slate-600 group-hover:text-slate-900 transition-colors">
                {option.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Airlines */}
      <div>
         <p className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <Plane className="h-4 w-4 text-slate-400" />
          Airlines
        </p>
        <div className="space-y-2">
          {availableFilters?.airlines?.length > 0 ? (
            availableFilters.airlines.map((airline) => (
              <label key={airline.airline_id} className="flex items-center group cursor-pointer">
                <div className="relative flex items-center">
                  <input
                    type="checkbox"
                    checked={(searchParams.airlines || []).includes(airline.name)}
                    onChange={() => handleAirlineChange(airline.name)}
                    className="peer h-4 w-4 cursor-pointer appearance-none rounded border border-slate-300 checked:bg-primary checked:border-primary transition-all"
                  />
                  <Check className="absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
                </div>
                <span className="ml-3 text-xs text-slate-600 group-hover:text-slate-900 transition-colors">
                  {airline.name}
                </span>
              </label>
            ))
          ) : (
            <p className="text-xs text-slate-400 italic">No airline filters available</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default FlightFilters;
