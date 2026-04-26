import React from 'react';
import { formatCurrency, formatDate, formatTime } from '../../utils/helpers';
import { Plane, Calendar, ScanLine, User } from 'lucide-react';

// Use forwardRef so we can attach a ref to it to capture the contents
const ETicket = React.forwardRef(({ booking }, ref) => {
  if (!booking || !booking.BookingDetails) return null;

  // Group unique flight segments (Schedules) in order
  const scheduleIds = [...new Set(booking.BookingDetails.map(d => d.schedule_id))];
  const uniqueSegments = scheduleIds.map(id => {
    const firstOccurence = booking.BookingDetails.find(d => d.schedule_id === id);
    return {
      schedule: firstOccurence.Schedule,
      leg_order: firstOccurence.leg_order
    };
  }).sort((a, b) => a.leg_order - b.leg_order);

  const mainAirline = uniqueSegments[0]?.schedule?.Flight?.Airline;

  return (
    <div 
      id="eticket-container"
      className="absolute top-[-10000px] left-[-10000px] print:static print:top-auto print:left-auto" 
    >
      <div 
        ref={ref} 
        className="w-[800px] min-h-[1100px] p-12 mx-auto font-sans"
        id="eticket-document"
        style={{ fontFamily: 'Inter, sans-serif', backgroundColor: '#f8fafc', color: '#0f172a', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
      >
        <div className="rounded-3xl overflow-hidden" style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' }}>
          
          {/* Header */}
          <div className="p-8 flex justify-between items-center" style={{ backgroundColor: '#0f172a', color: '#ffffff' }}>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl flex items-center justify-center text-xl font-black" style={{ backgroundColor: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)' }}>
                {mainAirline?.name?.charAt(0) || 'A'}
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-wider uppercase">{mainAirline?.name || 'AeroFlow Airways'}</h1>
                <p className="font-bold uppercase tracking-widest text-sm mt-1" style={{ color: '#34d399' }}>Official E-Ticket</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: '#94a3b8' }}>Booking Reference</p>
              <h2 className="text-4xl font-black font-mono tracking-tighter">{booking.pnr}</h2>
            </div>
          </div>

          <div className="p-8 pb-4">
            <h3 className="text-xs font-black uppercase tracking-widest mb-6 flex items-center gap-2" style={{ color: '#1e293b' }}>
              <Plane className="w-4 h-4" /> Flight Itinerary
            </h3>

            {/* Itinerary Wings */}
            <div className="space-y-6 mb-10">
              {uniqueSegments.map((seg, idx) => {
                const { schedule } = seg;
                const flight = schedule?.Flight;
                const source = schedule?.SourceAirport;
                const dest = schedule?.DestAirport;

                return (
                  <div key={`seg-${idx}`} className="p-6 rounded-2xl flex items-center justify-between" style={{ backgroundColor: '#f8fafc', border: '1px solid #f1f5f9' }}>
                    <div className="text-center w-[120px]">
                      <p className="text-4xl font-black">{source?.code}</p>
                      <p className="text-[10px] font-bold uppercase mt-1 truncate" style={{ color: '#64748b' }}>{source?.city}</p>
                      <div className="mt-3">
                        <p className="text-[11px] font-bold" style={{ color: '#0f172a' }}>{formatDate(schedule?.departure_time)}</p>
                        <p className="text-lg font-black" style={{ color: '#000000' }}>{formatTime(schedule?.departure_time)}</p>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-center flex-1 px-8">
                       <div className="w-full border-b-2 border-dashed relative" style={{ borderColor: '#cbd5e1' }}>
                          <Plane className="w-5 h-5 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-90" style={{ color: '#94a3b8', backgroundColor: '#f8fafc', padding: '0 4px' }} />
                       </div>
                       <p className="text-[10px] font-black mt-4 uppercase tracking-widest" style={{ color: '#94a3b8' }}>
                         {flight?.flight_no} • {Math.floor(schedule?.duration_minutes / 60)}h {schedule?.duration_minutes % 60}m
                       </p>
                    </div>
                    
                    <div className="text-center w-[120px]">
                      <p className="text-4xl font-black">{dest?.code}</p>
                      <p className="text-[10px] font-bold uppercase mt-1 truncate" style={{ color: '#64748b' }}>{dest?.city}</p>
                      <div className="mt-3">
                        <p className="text-[11px] font-bold" style={{ color: '#0f172a' }}>{formatDate(schedule?.arrival_time)}</p>
                        <p className="text-lg font-black" style={{ color: '#000000' }}>{formatTime(schedule?.arrival_time)}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mb-10 grid grid-cols-2 gap-8">
              <div className="p-4 rounded-xl border border-slate-100 bg-white">
                <p className="text-[10px] font-bold uppercase tracking-widest mb-1 flex items-center gap-1.5" style={{ color: '#94a3b8' }}><Calendar className="w-3.5 h-3.5" /> Booked On</p>
                <p className="text-sm font-bold" style={{ color: '#0f172a' }}>{new Date(booking.createdAt).toLocaleDateString()} {new Date(booking.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
              </div>
              <div className="p-4 rounded-xl border border-slate-100 bg-white">
                <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: '#94a3b8' }}>Contact Email</p>
                <p className="text-sm font-bold" style={{ color: '#0f172a' }}>{booking.contact_email}</p>
              </div>
            </div>

            {/* Passenger Manifest */}
            <h3 className="text-xs font-black uppercase tracking-widest pb-2 mb-6 border-b-2 flex items-center gap-2" style={{ color: '#1e293b', borderColor: '#e2e8f0' }}>
               <User className="w-4 h-4" /> Guest Manifest
            </h3>
            <div className="space-y-4">
              {Array.from(new Set(booking.BookingDetails.map(d => d.passenger_name))).map((paxName, idx) => {
                const paxDetails = booking.BookingDetails.filter(d => d.passenger_name === paxName);
                const firstDetail = paxDetails[0];

                return (
                  <div key={`pax-${idx}`} className="flex rounded-2xl overflow-hidden" style={{ border: '1px solid #e2e8f0', backgroundColor: '#ffffff' }}>
                    <div className="w-2 shrink-0" style={{ backgroundColor: '#0f172a' }}></div>
                    <div className="p-6 flex-1 flex items-center justify-between">
                      <div>
                        <p className="font-black text-xl" style={{ color: '#0f172a' }}>{firstDetail.passenger_name}</p>
                        <p className="text-[11px] font-bold mt-1 uppercase tracking-widest" style={{ color: '#64748b' }}>
                          {firstDetail.passenger_gender} • AGE {firstDetail.passenger_age} • ID: {firstDetail.passenger_id_number}
                        </p>
                      </div>
                      <div className="flex gap-4">
                        {paxDetails.map(d => (
                          <div key={d.booking_detail_id} className="px-4 py-2 rounded-xl border text-center min-w-[80px]" style={{ borderColor: '#f1f5f9', backgroundColor: '#f8fafc' }}>
                            <p className="text-[9px] font-black uppercase tracking-widest mb-0.5" style={{ color: '#94a3b8' }}>Leg {d.leg_order}</p>
                            <p className="font-black text-xl leading-none" style={{ color: '#0f172a' }}>{d.FlightSeat?.Seat?.seat_number || 'TBA'}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>

          {/* Footer Receipt Summary */}
          <div className="p-10 border-t mt-12 flex justify-between items-end" style={{ backgroundColor: '#0f172a', borderColor: '#0f172a', color: '#ffffff' }}>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: '#94a3b8' }}>Total Transaction Amount</p>
              <p className="text-5xl font-black">{formatCurrency(booking.total_price)}</p>
              <div className="flex items-center gap-2 mt-4">
                 <p className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded" style={{ backgroundColor: 'rgba(52, 211, 153, 0.1)', color: '#34d399', border: '1px solid rgba(52, 211, 153, 0.2)' }}>
                   Transaction Status: {booking.status}
                 </p>
              </div>
            </div>
            
            <div className="w-28 h-28 rounded-2xl p-2 bg-white flex items-center justify-center overflow-hidden">
               <div className="w-full h-full opacity-20" style={{ background: 'repeating-linear-gradient(45deg, #000, #000 10px, #fff 10px, #fff 20px)' }}></div>
            </div>
          </div>
          
        </div>
        <div className="mt-8 px-4 text-center">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: '#94a3b8' }}>
              Important Security Notice
            </p>
            <p className="text-[9px] font-medium leading-relaxed mt-2 mx-auto max-w-lg" style={{ color: '#cbd5e1' }}>
              Check-in counters close 60 minutes prior to departure for domestic flights and 90 minutes for international routes. 
              Please carry a valid government-issued photo ID. This is a computer-generated document and does not require a signature.
            </p>
        </div>
      </div>
    </div>
  );
});

ETicket.displayName = 'ETicket';
export default ETicket;
