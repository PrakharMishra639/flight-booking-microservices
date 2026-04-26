import { formatCurrency, formatDuration, formatTime } from '../../utils/helpers';
import { Plane, ArrowRight, Check, Clock, Info } from 'lucide-react';
import { motion } from 'framer-motion';

// Helper function to format all flight numbers in an itinerary
const formatFlightNumbers = (segments) => {
  if (!segments || segments.length === 0) return '';
  return segments.map(segment => segment.Flight?.flight_no || 'N/A').join(' → ');
};

const FlightResults = ({ flights, onSelect, selectedId }) => {
  if (!flights || flights.length === 0) {
    return (
      <div className="bg-white rounded-[2rem] p-16 text-center border border-slate-100 shadow-sm">
        <div className="h-20 w-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
          <Plane className="h-10 w-10 text-slate-300" />
        </div>
        <h3 className="text-xl font-bold text-slate-900">No flights found</h3>
        <p className="text-slate-500 mt-2 max-w-sm mx-auto">We couldn't find any flights matching your criteria. Try adjusting your filters or search for a different date.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {flights.map((itinerary, index) => {
        const isSelected = selectedId === (itinerary.itineraryId || itinerary.id || index);
        
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            key={index}
            onClick={() => onSelect(itinerary)}
            className={`group relative bg-white rounded-[2rem] border cursor-pointer transition-all duration-500 ${
              isSelected 
              ? 'border-primary ring-4 ring-primary/10 shadow-2xl shadow-primary/20 scale-[1.02]' 
              : 'border-slate-100 hover:shadow-2xl hover:border-primary/20 hover:scale-[1.01]'
            }`}
          >
            {isSelected && (
              <div className="absolute top-4 right-4 bg-primary text-white p-1 rounded-full z-10">
                <Check className="h-4 w-4" />
              </div>
            )}
            
            <div className="p-6 md:p-8 flex flex-col md:flex-row items-stretch gap-8">
              {/* Airline & Flight Info */}
              <div className="flex flex-row md:flex-col items-center md:items-start gap-4 md:w-48 flex-shrink-0">
                <div className={`h-14 w-14 rounded-2xl flex items-center justify-center border transition-all ${isSelected ? 'bg-primary/10 border-primary/20 scale-110' : 'bg-slate-50 border-slate-100 group-hover:scale-110'}`}>
                  {itinerary.airlineLogo ? (
                    <img src={`http://localhost:3000${itinerary.airlineLogo}`} alt="Airline Logo" className="h-8 w-8 object-contain" />
                  ) : (
                    <Plane className={`h-7 w-7 ${isSelected ? 'text-primary' : 'text-primary'}`} />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap gap-1 mb-1">
                    {itinerary.airlines.map((airline, i) => (
                      <span key={i} className="text-sm font-bold text-slate-900">
                        {airline}{i < itinerary.airlines.length - 1 ? ',' : ''}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center flex-wrap gap-2">
                    <span className="px-2 py-0.5 bg-slate-100 text-[10px] font-bold text-slate-500 rounded uppercase tracking-wider">
                      {itinerary.type}
                    </span>
                    {itinerary.stops > 0 && (
                      <span className="px-2 py-0.5 bg-amber-100 text-[10px] font-bold text-amber-600 rounded uppercase tracking-wider">
                        Connecting
                      </span>
                    )}
                    <span className="text-xs text-slate-400 font-medium whitespace-nowrap">
                      {formatFlightNumbers(itinerary.segments)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Time & Route */}
              <div className="flex-1 flex flex-col justify-center mt-4 md:mt-0">
                <div className="flex items-center justify-between gap-2 sm:gap-6 relative">
                  <div className="flex-1 text-center md:text-left">
                    <p className="text-xl sm:text-3xl font-heading font-black text-slate-900 tracking-tight">
                      {formatTime(itinerary.departureTime)}
                    </p>
                    <p className="text-sm font-bold text-slate-400 mt-1">{itinerary.sourceAirport}</p>
                  </div>

                  <div className="flex-[2] px-4 flex flex-col items-center">
                    <div className="w-full flex items-center gap-3 mb-2">
                      <div className={`h-[2px] flex-1 ${isSelected ? 'bg-primary/20' : 'bg-slate-200'}`}></div>
                      <div className="relative flex-1">
                        <Plane className={`h-4 w-4 sm:h-5 sm:w-5 transform rotate-90 mx-auto ${isSelected ? 'text-primary' : 'text-slate-300'}`} />
                        {itinerary.stops > 0 && (
                          <div className="absolute -top-1 left-1/2 -translate-x-1/2 flex gap-1">
                            {[...Array(itinerary.stops)].map((_, i) => (
                              <div key={i} className="h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full bg-amber-500 border border-white shadow-sm"></div>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className={`h-[2px] flex-1 ${isSelected ? 'bg-primary/20' : 'bg-slate-200'}`}></div>
                    </div>

                    <div className="flex flex-col items-center">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Clock className="h-3.5 w-3.5 text-primary" />
                        <span className="text-sm font-black text-slate-900 uppercase tracking-wide">
                          {formatDuration(itinerary.totalDuration)}
                        </span>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${itinerary.stops === 0 ? 'text-emerald-600 bg-emerald-50 border border-emerald-100' : 'text-amber-600 bg-amber-50 border border-amber-100'}`}>
                        {itinerary.stops === 0 ? 'NON-STOP' : `${itinerary.stops} STOP${itinerary.stops > 1 ? 'S' : ''} • CONNECTING`}
                      </span>
                    </div>
                  </div>

                  <div className="flex-1 text-center md:text-right">
                    <p className="text-xl sm:text-3xl font-heading font-black text-slate-900 tracking-tight">
                      {formatTime(itinerary.arrivalTime)}
                    </p>
                    <p className="text-sm font-bold text-slate-400 mt-1">{itinerary.destAirport}</p>
                  </div>
                </div>

                {/* Layovers / Segments Info */}
                {itinerary.layovers && itinerary.layovers.length > 0 && (
                  <div className="mt-6 flex flex-wrap gap-3">
                    {itinerary.layovers.map((layover, i) => (
                      <div key={i} className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-100">
                        <Clock className="h-3 w-3 text-amber-500" />
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                          Layover: <span className="text-slate-900">{formatDuration(layover.waitTime)}</span> in <span className="text-primary font-black uppercase">{layover.to}</span>
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Price Area */}
              <div className="md:w-56 flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-4 md:pl-8 md:border-l border-slate-100 pt-6 md:pt-0 border-t md:border-t-0 mt-2 md:mt-0">
                <div className="text-left md:text-right">
                  <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Per Person</p>
                  <p className={`text-2xl sm:text-4xl font-black tracking-tighter transition-colors ${isSelected ? 'text-slate-900' : 'text-primary'}`}>
                    {formatCurrency(itinerary.totalPrice)}
                  </p>
                </div>
                <div className={`h-10 w-10 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-primary border-primary text-white' : 'border-slate-200 text-slate-200'}`}>
                  <Check className="h-6 w-6" />
                </div>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default FlightResults;

