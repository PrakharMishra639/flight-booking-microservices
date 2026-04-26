import { motion, AnimatePresence } from 'framer-motion';
import { X, Plane, Clock, MapPin, ShieldCheck, Info } from 'lucide-react';
import { formatTime, formatDuration, formatDate, formatCurrency } from '../../utils/helpers';

const FlightDetailModal = ({ isOpen, onClose, itineraries }) => {
  if (!itineraries || itineraries.length === 0) return null;

  const combinedPrice = itineraries.reduce((sum, it) => sum + it.totalPrice, 0);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100]"
          />

          {/* Modal Container */}
          <div className="fixed inset-0 flex items-center justify-center p-4 z-[101] pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden pointer-events-auto flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="bg-slate-900 p-6 md:p-8 text-white relative flex-shrink-0">
                <button
                  onClick={onClose}
                  className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-primary rounded-xl">
                    <Plane className="h-5 w-5 text-white" />
                  </div>
                  <h2 className="text-xl font-bold">Flight Details</h2>
                </div>
                <div className="flex flex-col gap-2">
                  {itineraries.map((itinerary, i) => (
                    <p key={i} className="text-slate-400 font-medium">
                      <span className="text-primary font-bold mr-2">{i === 0 ? 'Outward' : 'Return'}:</span>
                      {itinerary.sourceAirport} → {itinerary.destAirport} • {formatDuration(itinerary.totalDuration)} • {formatDate(itinerary.departureTime)}
                    </p>
                  ))}
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
                <div className="space-y-12">
                  {itineraries.map((itinerary, routeIdx) => (
                    <div key={`route-${routeIdx}`} className="space-y-8">
                      {itineraries.length > 1 && (
                        <h3 className="text-lg font-black text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-2">
                          {routeIdx === 0 ? 'Outward Journey' : 'Return Journey'}
                        </h3>
                      )}
                      {itinerary.segments.map((segment, idx) => (
                    <div key={idx} className="relative">
                      {/* Segment Info */}
                      <div className="flex gap-6">
                        {/* Timeline Visual */}
                        <div className="flex flex-col items-center">
                          <div className="h-4 w-4 rounded-full border-4 border-primary bg-white z-10"></div>
                          <div className="flex-1 w-[2px] bg-slate-100 my-1"></div>
                          <div className="h-4 w-4 rounded-full border-4 border-slate-900 bg-white z-10"></div>
                        </div>

                        {/* Details */}
                        <div className="flex-1 space-y-6">
                          {/* Departure */}
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-2xl font-black text-slate-900">{formatTime(segment.departure_time)}</p>
                              <div className="flex flex-col">
                                <p className="text-sm font-bold text-slate-500 uppercase">
                                  {segment.SourceAirport?.city || 'Unknown City'} ({segment.SourceAirport?.code || segment.source_airport_id})
                                </p>
                                <p className="text-[10px] text-slate-400 font-medium line-clamp-1">{segment.SourceAirport?.name}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-bold text-slate-900">{segment.Flight?.Airline?.name || 'AeroFlow'}</p>
                              <p className="text-xs text-slate-400 font-medium">Flight {segment.Flight?.flight_no}</p>
                            </div>
                          </div>

                          {/* Flight Duration Badge */}
                          <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-2xl w-fit">
                            <Clock className="h-4 w-4 text-primary" />
                            <span className="text-xs font-black text-slate-700 uppercase tracking-widest">
                              {formatDuration(segment.duration_minutes)} Flight
                            </span>
                          </div>

                          {/* Arrival */}
                          <div>
                            <p className="text-2xl font-black text-slate-900">{formatTime(segment.arrival_time)}</p>
                            <div className="flex flex-col">
                              <p className="text-sm font-bold text-slate-500 uppercase">
                                {segment.DestAirport?.city || 'Unknown City'} ({segment.DestAirport?.code || segment.dest_airport_id})
                              </p>
                              <p className="text-[10px] text-slate-400 font-medium line-clamp-1">{segment.DestAirport?.name}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Layover Info */}
                      {idx < itinerary.segments.length - 1 && itinerary.layovers && itinerary.layovers[idx] && (
                        <div className="ml-[30px] my-6 p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-center gap-3">
                          <Clock className="h-5 w-5 text-amber-500" />
                          <div>
                            <p className="text-xs font-black text-amber-600 uppercase tracking-widest">Layover</p>
                            <p className="text-sm font-bold text-slate-700">
                              {formatDuration(itinerary.layovers[idx].waitTime)} in {segment.DestAirport?.city || itinerary.layovers[idx].to} ({itinerary.layovers[idx].to})
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  </div>
                ))}
                </div>

                {/* Additional Info */}
                <div className="mt-12 grid grid-cols-2 gap-4">
                  <div className="p-4 bg-emerald-50 rounded-3xl border border-emerald-100">
                    <div className="flex items-center gap-2 mb-1">
                      <ShieldCheck className="h-4 w-4 text-emerald-600" />
                      <p className="text-xs font-black text-emerald-600 uppercase">Refundable</p>
                    </div>
                    <p className="text-sm text-slate-600">Free cancellation within 24 hours</p>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-3xl border border-blue-100">
                    <div className="flex items-center gap-2 mb-1">
                      <Info className="h-4 w-4 text-blue-600" />
                      <p className="text-xs font-black text-blue-600 uppercase">Baggage</p>
                    </div>
                    <p className="text-sm text-slate-600">Adult: 25kg Check-in, 7kg Cabin</p>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 md:p-8 bg-slate-50 border-t border-slate-100 flex items-center justify-between flex-shrink-0">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total Price</p>
                  <p className="text-3xl font-black text-slate-900">{formatCurrency(combinedPrice)}</p>
                </div>
                <button
                  onClick={onClose}
                  className="px-8 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold transition-all"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default FlightDetailModal;
