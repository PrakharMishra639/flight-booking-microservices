import { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Plane, ArrowRight, CheckCircle2, ChevronRight, Info } from 'lucide-react';
import flightService from '../redux/services/flightService';
import { setSearchResults, setReturnResults, setLoading, setError, setAvailableFilters, setAvailablePrices, setSearchPhase, setReturnPrices } from '../redux/slices/flightSlice';
import { setScheduleSelection } from '../redux/slices/bookingSlice';
import FlightResults from '../components/Booking/FlightResults';
import FlightSearch from '../components/Booking/FlightSearch';
import DateStrip from '../components/Booking/DateStrip';
import FlightFilters from '../components/Booking/FlightFilters';
import FlightDetailModal from '../components/Booking/FlightDetailModal';
import Loader from '../components/Common/Loader';
import Alert from '../components/Common/Alert';
import { formatDate, formatCurrency } from '../utils/helpers';

const SearchResults = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { searchParams, searchResults, returnResults, loading, error, searchPhase } = useSelector((state) => state.flight);

  // Selection & Phase State
  const [selectedOutward, setSelectedOutward] = useState(null);
  const [selectedReturn, setSelectedReturn] = useState(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchResults = async () => {
      if (!searchParams.source || !searchParams.destination || !searchParams.date) {
        return navigate('/');
      }

      dispatch(setLoading(true));
      try {
        const start = new Date(searchParams.date);
        start.setDate(start.getDate() - 7);
        const end = new Date(searchParams.date);
        end.setDate(end.getDate() + 7);

        const startDate = start.toISOString().split('T')[0];
        const endDate = end.toISOString().split('T')[0];

        const promises = [
          flightService.searchFlights(searchParams),
          flightService.getFilters(searchParams.source, searchParams.destination, searchParams.date),
          flightService.getDatePrices(searchParams.source, searchParams.destination, startDate, endDate)
        ];

        if (searchParams.tripType === 'round-trip' && searchParams.returnDate) {
          // Return journey prices +/- 7 days
          const rStart = new Date(searchParams.returnDate);
          rStart.setDate(rStart.getDate() - 7);
          const rEnd = new Date(searchParams.returnDate);
          rEnd.setDate(rEnd.getDate() + 7);
          
          const rStartDate = rStart.toISOString().split('T')[0];
          const rEndDate = rEnd.toISOString().split('T')[0];

          promises.push(
            flightService.searchFlights({
              ...searchParams,
              source: searchParams.destination,
              destination: searchParams.source,
              date: searchParams.returnDate
            })
          );

          // Fetch Return Leg Prices
          promises.push(
            flightService.getDatePrices(searchParams.destination, searchParams.source, rStartDate, rEndDate)
          );
        }

        const [flightsRes, filtersRes, pricesRes, returnRes, returnPricesRes] = await Promise.all(promises);

        dispatch(setSearchResults(flightsRes.results || []));
        dispatch(setAvailableFilters(filtersRes));
        dispatch(setAvailablePrices(pricesRes));

        if (returnRes) {
          dispatch(setReturnResults(returnRes.results || []));
          if (returnPricesRes) {
            dispatch(setReturnPrices(returnPricesRes));
          }
        }
      } catch (err) {
        dispatch(setError('Failed to fetch data. Please try again.'));
      } finally {
        dispatch(setLoading(false));
      }
    };

    fetchResults();
    setSelectedOutward(null);
    setSelectedReturn(null);
  }, [
    searchParams.source, 
    searchParams.destination, 
    searchParams.date, 
    searchParams.returnDate, 
    searchParams.tripType, 
    searchParams.passengers, 
    searchParams.travelClass, 
    dispatch, 
    navigate
  ]);

  const handleSelectFlight = (itinerary) => {
    if (searchPhase === 'outward') {
      setSelectedOutward(itinerary);
    } else {
      setSelectedReturn(itinerary);
    }
  };

  const handleNext = () => {
    if (searchParams.tripType === 'one-way') {
      dispatch(setScheduleSelection(selectedOutward));
      navigate('/checkout');
    } else {
      if (searchPhase === 'outward') {
        dispatch(setSearchPhase('return'));
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        // Finalize Round-Trip
        dispatch(setScheduleSelection({
          ...selectedOutward,
          isRoundTrip: true,
          returnFlight: selectedReturn,
          totalRoundTripPrice: selectedOutward.totalPrice + selectedReturn.totalPrice
        }));
        navigate('/checkout');
      }
    }
  };

  const currentResults = searchPhase === 'outward' ? searchResults : returnResults;
  const currentSelection = searchPhase === 'outward' ? selectedOutward : selectedReturn;

  const filteredAndSortedResults = useMemo(() => {
    if (!currentResults) return [];
    let processed = [...currentResults];
    if (searchParams.stops !== 3) {
      processed = processed.filter(flight => flight.stops === searchParams.stops);
    }
    if (searchParams.airlines && searchParams.airlines.length > 0) {
      processed = processed.filter(flight =>
        flight.airlines.some(airline => searchParams.airlines.includes(airline))
      );
    }

    if (searchParams.timeFilter) {
      processed = processed.filter(flight => {
        const hour = new Date(flight.departureTime).getHours();
        if (searchParams.timeFilter === 'morning') {
          return hour >= 0 && hour < 12;
        } else if (searchParams.timeFilter === 'evening') {
          return hour >= 12 && hour <= 23;
        }
        return true;
      });
    }

    processed.sort((a, b) => {
      if (searchParams.sortBy === 'price_asc')     return a.total_base_price - b.total_base_price;
      if (searchParams.sortBy === 'price_desc')    return b.total_base_price - a.total_base_price;
      if (searchParams.sortBy === 'duration_asc')  return a.total_duration_minutes - b.total_duration_minutes;
      if (searchParams.sortBy === 'duration_desc') return b.total_duration_minutes - a.total_duration_minutes;
      if (searchParams.sortBy === 'time_asc')      return new Date(a.departureTime) - new Date(b.departureTime);
      // Default: price low to high
      return a.total_base_price - b.total_base_price;
    });
    return processed;
  }, [currentResults, searchParams.stops, searchParams.airlines, searchParams.timeFilter, searchParams.sortBy]);

  const totalPrice = (selectedOutward?.totalPrice || 0) + (selectedReturn?.totalPrice || 0);

  return (
    <div className="bg-slate-50 min-h-screen pb-32">
      {/* Search Bar Bar */}
      {/* Search Header Container */}
      <div className="bg-slate-900 pt-6 pb-12 sticky top-0 z-40 shadow-2xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col gap-8">
            
            {/* 1. Search Box at the Top */}
            <FlightSearch />

            {/* 2. Wide Segment Selector (Indigo Style) */}
            {searchParams.tripType === 'round-trip' && (
              <div className="w-full bg-slate-800/40 backdrop-blur-md rounded-[1.25rem] p-1.5 flex border border-white/5 shadow-inner">
                <button 
                  onClick={() => dispatch(setSearchPhase('outward'))}
                  className={`flex-1 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-4 py-3.5 rounded-2xl font-black transition-all duration-300 ${
                    searchPhase === 'outward' 
                      ? 'bg-primary text-white shadow-xl shadow-primary/30 ring-1 ring-white/10' 
                      : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {selectedOutward && <CheckCircle2 className="h-4 w-4" />}
                    <span className="text-[10px] uppercase tracking-[0.2em] font-bold opacity-60">Departure</span>
                  </div>
                  <span className="text-base sm:text-lg font-heading tracking-tight">
                    {searchParams.source} <span className="mx-1 opacity-40">→</span> {searchParams.destination}
                  </span>
                </button>

                <button 
                  onClick={() => dispatch(setSearchPhase('return'))}
                  className={`flex-1 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-4 py-3.5 rounded-2xl font-black transition-all duration-300 ${
                    searchPhase === 'return' 
                      ? 'bg-primary text-white shadow-xl shadow-primary/30 ring-1 ring-white/10' 
                      : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {selectedReturn && <CheckCircle2 className="h-4 w-4" />}
                    <span className="text-[10px] uppercase tracking-[0.2em] font-bold opacity-60">Return</span>
                  </div>
                  <span className="text-base sm:text-lg font-heading tracking-tight">
                    {searchParams.destination} <span className="mx-1 opacity-40">→</span> {searchParams.source}
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="max-w-7xl mx-auto px-4 mt-8 relative z-10">
        <Alert message={error} type="error" />

        {loading ? (
          <div className="bg-white rounded-3xl p-12 shadow-xl border border-slate-100 flex flex-col items-center">
            <Loader />
            <p className="mt-4 text-slate-500 font-medium">Searching for the best {searchPhase} flights...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="col-span-1 lg:block">
              <div className="sticky top-40 space-y-6">
                <div className="bg-white rounded-[2rem] p-6 lg:p-8 border border-slate-100 shadow-sm overflow-x-auto whitespace-nowrap lg:whitespace-normal">
                  <FlightFilters />
                </div>
              </div>
            </div>

            <div className="lg:col-span-3">
              <DateStrip />

              {searchParams.tripType === 'round-trip' && selectedOutward && searchPhase === 'return' && (
                <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 mb-6 flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm font-medium">
                    <span className="text-emerald-600 font-bold uppercase text-[10px]">Outbound Selected:</span>
                    <span className="text-slate-900">{formatCurrency(selectedOutward.totalPrice)}</span>
                  </div>
                  <button onClick={() => dispatch(setSearchPhase('outward'))} className="text-xs font-bold text-emerald-600 hover:underline">Change</button>
                </div>
              )}

              <div className="mb-4 flex justify-between items-center text-sm text-slate-500">
                <p>Showing {filteredAndSortedResults.length} {searchPhase} results</p>
              </div>
              <FlightResults
                flights={filteredAndSortedResults}
                onSelect={handleSelectFlight}
                selectedId={currentSelection?.itineraryId || currentSelection?.id}
              />
            </div>
          </div>
        )}
      </div>

      {/* Unified Action Footer */}
      {(selectedOutward || selectedReturn) && (
        <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-slate-200 z-50 p-4 md:p-6 shadow-2xl animate-in slide-in-from-bottom duration-300">
          <div className="max-w-7xl mx-auto">
            {/* Validation Message Area */}
            {searchParams.tripType === 'round-trip' && (
              <div className="flex justify-center md:justify-end mb-4">
                {searchPhase === 'return' && !selectedReturn ? (
                  <div className="flex items-center gap-2 text-amber-600 bg-amber-50 px-4 py-2 rounded-xl border border-amber-100 text-xs font-bold animate-pulse">
                    <Info className="h-4 w-4" />
                    Please select both departure and return flights to continue
                  </div>
                ) : selectedOutward && selectedReturn ? (
                  (() => {
                    const arrival = new Date(selectedOutward.arrivalTime);
                    const departure = new Date(selectedReturn.departureTime);
                    const diffMins = (departure - arrival) / (1000 * 60);
                    if (diffMins < 60) {
                      return (
                        <div className="flex items-center gap-2 text-red-600 bg-red-50 px-4 py-2 rounded-xl border border-red-100 text-xs font-bold">
                          <Info className="h-4 w-4" />
                          Minimum 1 hour gap required between flights. Please select different flights or dates.
                        </div>
                      );
                    }
                    return null;
                  })()
                ) : null}
              </div>
            )}

            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-8 md:gap-12">
                <div className="hidden md:flex flex-col">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                    {searchParams.tripType === 'round-trip' ? 'Total Fare' : 'Final Fare'}
                  </p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl sm:text-3xl font-black text-slate-900">{formatCurrency(totalPrice || currentSelection?.totalPrice)}</span>
                    <span className="text-slate-400 text-[10px] sm:text-xs font-bold">Inc. taxes</span>
                  </div>
                </div>

                {/* Step info for round-trip */}
                {searchParams.tripType === 'round-trip' && (
                  <div className="hidden lg:flex items-center gap-4 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs ${selectedOutward ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400'}`}>1</div>
                    <div className="h-[2px] w-4 bg-slate-200"></div>
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs ${selectedReturn ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400'}`}>2</div>
                  </div>
                )}
              </div>

              <div className="w-full md:w-auto flex items-center gap-3">
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-4 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-2xl font-bold transition-all shadow-sm"
                >
                  <Info className="h-5 w-5 text-slate-400" />
                  View Details
                </button>

                <button
                  onClick={handleNext}
                  disabled={
                    (searchPhase === 'outward' && !selectedOutward) ||
                    (searchParams.tripType === 'round-trip' && searchPhase === 'return' && !selectedReturn) ||
                    (searchParams.tripType === 'round-trip' && selectedOutward && selectedReturn && (new Date(selectedReturn.departureTime) - new Date(selectedOutward.arrivalTime)) / (1000 * 60) < 60)
                  }
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 sm:px-12 py-4 bg-primary hover:bg-primary-dark text-white rounded-2xl font-black text-sm sm:text-base transition-all shadow-xl shadow-primary/30 disabled:opacity-50 disabled:cursor-not-allowed group whitespace-nowrap"
                >
                  {searchParams.tripType === 'one-way' || searchPhase === 'return' ? 'Continue to Checkout' : 'Choose Return Flight'}
                  <ChevronRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      <FlightDetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        itineraries={[selectedOutward, selectedReturn].filter(Boolean)}
      />
    </div>
  );
};

export default SearchResults;


