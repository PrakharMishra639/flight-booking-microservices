import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import { resetCheckinState, fetchBookingByPNR, confirmCheckin } from '../redux/slices/checkinSlice';
import PNRSearch from '../components/Checkin/PNRSearch';
import BoardingPassPreview from '../components/Checkin/BoardingPassPreview';
import { CheckCircle2, Clock, AlertTriangle, Download, Mail, ChevronRight, Loader2, User, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const WebCheckin = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { booking, window, boardingPasses, loading, error, success } = useSelector((state) => state.checkin);
  const [countdown, setCountdown] = useState('');

  useEffect(() => {
    const pnr = searchParams.get('pnr');
    if (pnr) {
      dispatch(fetchBookingByPNR(pnr.toUpperCase()));
    }
    return () => dispatch(resetCheckinState());
  }, [dispatch, searchParams]);

  useEffect(() => {
    if (window?.hoursUntilDeparture > 0) {
      const timer = setInterval(() => {
        const dep = new Date(booking?.BookingDetails[0]?.Schedule?.departure_time);
        const now = new Date();
        const diff = dep - now;
        
        if (diff <= 0) {
          setCountdown('Departed');
          clearInterval(timer);
          return;
        }

        const h = Math.floor(diff / (1000 * 60 * 60));
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((diff % (1000 * 60)) / 1000);
        setCountdown(`${h}h ${m}m ${s}s`);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [window, booking]);

  const handleConfirm = () => {
    dispatch(confirmCheckin(booking.pnr));
  };

  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-20 px-4 text-slate-900">
      {!booking ? (
        <div className="max-w-7xl mx-auto">
          <PNRSearch />
        </div>
      ) : (
        <div className="max-w-7xl mx-auto">
          {/* Header Status */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-12 gap-8">
            <div>
              <nav className="flex items-center gap-2 mb-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                <span>AeroFlow</span>
                <ChevronRight className="w-3 h-3" />
                <span className="text-indigo-600">Web Check-In</span>
              </nav>
              <h1 className="text-4xl md:text-5xl font-heading font-extrabold text-slate-900 tracking-tight flex flex-wrap items-center gap-4">
                Confirm Your Flight
                {booking.checkin_status === 'COMPLETED' && (
                  <span className="text-[10px] bg-emerald-50 text-emerald-600 px-4 py-1.5 rounded-full border border-emerald-100 font-black uppercase tracking-[0.2em]">
                    Checked-In
                  </span>
                )}
              </h1>
              <p className="text-slate-500 mt-4 font-medium flex items-center gap-3">
                PNR: <span className="text-slate-900 font-mono font-bold bg-white px-3 py-1 rounded-lg border border-slate-100 shadow-sm">{booking.pnr}</span> 
                <span className="w-1.5 h-1.5 rounded-full bg-slate-200"></span>
                {Array.from(new Set(booking.BookingDetails.map(d => d.passenger_name))).length} Passenger(s)
              </p>
            </div>

            {!success && booking.checkin_status !== 'COMPLETED' && window?.isOpen && (
              <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-xl shadow-indigo-500/5 flex items-center gap-5 min-w-[240px]">
                <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center">
                  <Clock className="w-7 h-7 text-indigo-600" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Check-in Closes</p>
                  <p className="text-2xl font-heading font-extrabold text-slate-900 font-mono tabular-nums">{countdown}</p>
                </div>
              </div>
            )}
          </div>

          {/* Main Content Area */}
          <div className="grid lg:grid-cols-12 gap-8">
            {/* Left Column: Itinerary Summary */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full -translate-y-16 translate-x-16" />
                
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-8 relative">Flight Itinerary</h3>
                {booking.BookingDetails.length > 0 && (() => {
                  const schedules = Array.from(new Set(booking.BookingDetails.map(d => d.Schedule.schedule_id)))
                    .map(id => booking.BookingDetails.find(d => d.Schedule.schedule_id === id).Schedule)
                    .sort((a,b) => new Date(a.departure_time) - new Date(b.departure_time));

                  return (
                    <div className="space-y-6 relative">
                      {schedules.map((schedule, idx) => (
                        <div key={schedule.schedule_id} className="relative">
                          {idx !== 0 && <div className="my-6 border-t border-slate-100 border-dashed" />}
                          <div className="flex gap-6">
                            <div className="flex flex-col items-center pt-2">
                              <div className="w-3 h-3 rounded-full border-2 border-indigo-600 bg-white"></div>
                              <div className="w-0.5 h-12 bg-slate-100 my-1 rounded-full"></div>
                              <div className="w-3 h-3 rounded-full bg-slate-200"></div>
                            </div>
                            <div className="space-y-6 flex-1">
                              <div className="relative">
                                <p className="text-2xl font-heading font-extrabold text-slate-900 leading-none mb-1">{schedule.SourceAirport.code}</p>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{schedule.SourceAirport.city}</p>
                              </div>
                              <div className="relative">
                                <p className="text-2xl font-heading font-extrabold text-slate-900 leading-none mb-1">{schedule.DestAirport.code}</p>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{schedule.DestAirport.city}</p>
                              </div>
                            </div>
                          </div>
                      
                          <div className="mt-4 pt-4 border-t border-slate-50 grid grid-cols-2 lg:grid-cols-4 gap-4">
                             <div>
                               <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 text-nowrap">Flight</span>
                               <span className="text-slate-900 font-extrabold text-sm">{schedule.Flight?.Airline?.name || 'AeroFlow'} {schedule.Flight?.flight_no}</span>
                             </div>
                             <div>
                               <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 text-nowrap">Departure</span>
                               <span className="text-slate-900 font-extrabold text-sm">{new Date(schedule.departure_time).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                             </div>
                             <div>
                               <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 text-nowrap">Arrival</span>
                               <span className="text-slate-900 font-extrabold text-sm">{new Date(schedule.arrival_time).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                             </div>
                             <div className="text-left lg:text-right">
                               <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</span>
                               <span className="text-emerald-500 font-extrabold text-sm">Confirmed</span>
                             </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>

              {/* Status Message */}
              {!success && booking.checkin_status !== 'COMPLETED' && (
                <div className={`p-8 rounded-[2rem] border-2 transition-all duration-300 ${window?.isOpen ? 'bg-indigo-50/50 border-indigo-100 shadow-lg shadow-indigo-500/5' : 'bg-amber-50 border-amber-100'}`}>
                  <div className="flex items-start gap-4 mb-6">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${window?.isOpen ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'bg-amber-100 text-amber-600'}`}>
                      {window?.isOpen ? (
                        <CheckCircle2 className="w-6 h-6" />
                      ) : (
                        <AlertTriangle className="w-6 h-6" />
                      )}
                    </div>
                    <div>
                      <h4 className={`text-lg font-heading font-extrabold ${window?.isOpen ? 'text-indigo-800' : 'text-amber-800'}`}>
                        {window?.isOpen ? 'Ready to Check-In' : 'Not Yet Time'}
                      </h4>
                      <p className={`text-sm mt-1 font-medium ${window?.isOpen ? 'text-indigo-600/70' : 'text-amber-700/70'}`}>
                        {window?.isOpen ? 'Everything is set!' : 'Almost there.'}
                      </p>
                    </div>
                  </div>
                  
                  <p className="text-sm text-slate-600 leading-relaxed font-medium bg-white/50 p-4 rounded-xl border border-white/50">
                    {window?.isOpen 
                      ? 'Your window is now open. Confirm your details below to generate your official boarding passes.' 
                      : window?.tooEarly 
                        ? `This window will open exactly 24h before departure, which is on ${new Date(new Date(booking.BookingDetails[0].Schedule.departure_time).getTime() - 24 * 60 * 60 * 1000).toLocaleString()}.`
                        : 'Web check-in for this flight has officially closed. Please proceed to the airport check-in counter for assistance.'}
                  </p>
                  
                  {window?.isOpen && (
                    <button
                      onClick={handleConfirm}
                      disabled={loading}
                      className="w-full mt-8 py-5 bg-indigo-600 hover:bg-slate-900 text-white rounded-[1.25rem] font-black transition-all shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-3 group active:scale-[0.98]"
                    >
                      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                        <>
                          Confirm & Generate Passes
                          <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </>
                      )}
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Right Column: Passengers / Boarding Passes */}
            <div className="lg:col-span-8 space-y-8">
              {booking.checkin_status === 'COMPLETED' || success ? (
                <>
                  <div className="flex flex-col md:flex-row justify-between items-center bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm gap-6">
                     <div className="flex items-center gap-6">
                       <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shadow-sm">
                         <CheckCircle2 className="w-8 h-8" />
                       </div>
                       <div>
                          <h3 className="text-2xl font-heading font-extrabold text-slate-900">Boarding Passes Issued</h3>
                          <p className="text-sm font-medium text-slate-400">Successfully checked-in for this flight</p>
                       </div>
                     </div>
                  </div>

                  <div className="space-y-8">
                    {boardingPasses.map((pass) => (
                      <BoardingPassPreview 
                        key={pass.boarding_pass_id} 
                        pass={pass} 
                        schedule={booking.BookingDetails.find(d => d.booking_detail_id === pass.booking_detail_id)?.Schedule}
                        pnr={booking.pnr} 
                      />
                    ))}
                  </div>
                </>
              ) : (
                <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8">
                     <Users className="w-24 h-24 text-slate-50 -mr-8 -mt-8" />
                  </div>
                  
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-10 relative">Passenger Manifest</h3>
                  <div className="space-y-6 relative">
                    {(() => {
                      const groupedPassengers = booking.BookingDetails.reduce((acc, detail) => {
                        if (!acc[detail.passenger_name]) {
                          acc[detail.passenger_name] = { ...detail, legs: [] };
                        }
                        acc[detail.passenger_name].legs.push(detail);
                        return acc;
                      }, {});
                      
                      return Object.values(groupedPassengers).map((passenger) => (
                        <div key={passenger.passenger_name} className="flex flex-col p-8 bg-slate-50/50 hover:bg-slate-50 rounded-3xl border border-slate-100 transition-colors gap-6 group">
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 w-full">
                            <div className="flex items-center gap-6">
                               <div className="w-16 h-16 rounded-2xl bg-white border border-slate-100 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                                 <User className="w-8 h-8 text-slate-400" />
                               </div>
                               <div>
                                 <p className="font-heading font-extrabold text-slate-900 text-xl mb-1">{passenger.passenger_name}</p>
                                 <div className="flex items-center gap-3">
                                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{passenger.passenger_gender}</span>
                                   <span className="w-1 h-1 rounded-full bg-slate-200"></span>
                                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Age {passenger.passenger_age}</span>
                                 </div>
                               </div>
                            </div>
                            <div className="hidden sm:block text-right">
                               <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</p>
                               <p className="text-xs font-bold text-amber-600">Pending Check-in</p>
                            </div>
                          </div>
                          
                          <div className="mt-2 pt-6 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {passenger.legs.map((leg) => (
                              <div key={leg.booking_detail_id} className="bg-white p-4 rounded-2xl border border-slate-100 flex flex-wrap items-center justify-between shadow-sm gap-4 w-full">
                                 <div className="flex-1 min-w-[120px]">
                                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 truncate">{leg.Schedule?.SourceAirport?.code} → {leg.Schedule?.DestAirport?.code}</p>
                                   <div className="flex flex-wrap items-center gap-2">
                                     <p className="text-2xl font-heading font-extrabold text-indigo-600">{leg.FlightSeat?.Seat?.seat_number || 'TBA'}</p>
                                     <span className="text-[9px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded uppercase font-bold tracking-widest">{leg.FlightSeat?.Seat?.class || 'Economy'}</span>
                                   </div>
                                 </div>

                              </div>
                            ))}
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              )}
              
              {/* Support Card */}
              <div className="bg-indigo-900 rounded-[2rem] p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl shadow-indigo-900/20">
                 <div className="flex items-center gap-6">
                   <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center">
                      <Mail className="w-7 h-7" />
                   </div>
                   <div>
                      <h4 className="text-xl font-heading font-extrabold">Need Assistance?</h4>
                      <p className="text-indigo-200 text-sm font-medium">Our support team is available 24/7 during your travels.</p>
                   </div>
                 </div>
                 <button className="px-6 py-3 bg-white text-indigo-900 rounded-xl font-black text-sm uppercase tracking-widest hover:bg-indigo-50 transition-all">
                    Contact Support
                 </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default WebCheckin;
