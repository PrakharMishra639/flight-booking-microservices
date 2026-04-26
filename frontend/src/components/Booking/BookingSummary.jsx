import { formatCurrency, formatTime } from '../../utils/helpers';
import { Plane, Calendar, Armchair, Receipt } from 'lucide-react';

const BookingSummary = ({ schedule, selectedSeatsBySchedule, passengersCount, totalAmount }) => {
  if (!schedule) return null;

  // Build segments list
  const allSegments = [];
  if (schedule.segments) {
    schedule.segments.forEach(seg => allSegments.push({ type: 'Outbound', schedule: seg }));
  }
  if (schedule.isRoundTrip && schedule.returnFlight?.segments) {
    schedule.returnFlight.segments.forEach(seg => allSegments.push({ type: 'Return', schedule: seg }));
  }

  // 1. Calculate Total Base Fare (for all passengers)
  const totalBasePrice = (() => {
    let sum = 0;
    allSegments.forEach(seg => {
      const basePrice = parseFloat(seg.schedule.base_price || 0);
        
      const selectedSeats = selectedSeatsBySchedule?.[seg.schedule.schedule_id] || [];
      if (selectedSeats.length === 0) {
        // If not selected yet, assume they will pay Economy base price
        sum += basePrice * passengersCount;
      } else {
        // If seats are selected, apply multiplier based on the specific seat class chosen
        selectedSeats.forEach(seat => {
          const seatClass = seat.Seat?.class || 'ECONOMY';
          const multiplier = seatClass === 'FIRST' ? 4.0 : seatClass === 'BUSINESS' ? 2.5 : 1.0;
          sum += basePrice * multiplier;
        });
      }
    });
    return Math.round(sum * 100) / 100;
  })();

  // 2. Calculate Booking Fee (5% of total base, rounded to 2 decimals)
  const bookingFee = Math.round(totalBasePrice * 0.05 * 100) / 100;

  // 3. Calculate Seat Fees
  const totalSeatPrice = Object.values(selectedSeatsBySchedule || {}).reduce((total, seats) => {
    if (!Array.isArray(seats)) return total;
    return total + seats.reduce((sum, seat) => sum + parseFloat(seat.price || 0), 0);
  }, 0);

  // 4. Final Total (calculated here to ensure internal consistency)
  const finalTotal = Math.round((totalBasePrice + bookingFee + totalSeatPrice) * 100) / 100;

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xl sticky top-24">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Receipt className="w-5 h-5 text-primary" />
          Booking Summary
        </h3>
        <span className="text-xs px-3 py-1.5 bg-primary/10 text-primary rounded-lg font-bold uppercase tracking-wider">
          {passengersCount} PAX
        </span>
      </div>
      
      {/* Flight Segments */}
      {allSegments.map((seg, idx) => {
        const flightSeats = selectedSeatsBySchedule?.[seg.schedule.schedule_id] || [];
        return (
          <div key={idx} className="mb-5 pb-5 border-b border-slate-100 last:border-0 last:mb-0 last:pb-0">
            <div className="flex items-center gap-3 mb-4">
               <div className="h-9 w-9 bg-gradient-to-br from-primary to-primary-dark rounded-xl flex items-center justify-center shadow-md shadow-primary/30 shrink-0">
                 <Plane className="h-4 w-4 text-white" />
               </div>
               <div className="flex-1 min-w-0">
                 <p className="text-[10px] font-bold text-primary uppercase tracking-widest">{seg.type}</p>
                 <p className="font-bold text-slate-900 text-sm truncate">
                   {seg.schedule.SourceAirport?.code || '???'} 
                   <span className="text-slate-300 mx-1.5">→</span> 
                   {seg.schedule.DestAirport?.code || '???'}
                 </p>
               </div>
            </div>
            
            <div className="p-3 bg-slate-50 rounded-xl space-y-2 text-xs">
              <div className="flex justify-between items-center text-slate-500">
                <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Departure</span>
                <span className="font-bold text-slate-900 bg-white px-2 py-0.5 rounded-md shadow-sm">
                  {formatTime(seg.schedule.departure_time)}
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-500">
                <span className="flex items-center gap-1.5">
                  <Armchair className="w-3.5 h-3.5" /> Seats
                </span>
                <span className={`font-bold truncate max-w-[140px] text-right ${flightSeats.length > 0 ? 'text-primary' : 'text-slate-300'}`}>
                  {flightSeats.length > 0 
                    ? flightSeats.map(s => s.Seat?.seat_number || '?').join(', ') 
                    : 'Not selected'}
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-500">
                <span>Flight</span>
                <span className="font-bold text-slate-700 font-mono text-[11px]">
                  {seg.schedule.Flight?.flight_no || seg.schedule.Flight?.Airline?.name || '—'}
                </span>
              </div>
            </div>
          </div>
        );
      })}

      {/* Price Breakdown */}
      <div className="mt-4 p-4 bg-slate-50 rounded-2xl space-y-3 text-sm">
        
        <div className="flex justify-between">
          <span className="text-slate-500">Base Fare ({passengersCount} Pax)</span>
          <span className="font-bold text-slate-900">
            {formatCurrency(totalBasePrice)}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-slate-500 flex items-center">
            Booking Fee <span className="ml-2 text-[10px] font-bold bg-slate-200 text-slate-500 px-1.5 py-0.5 rounded uppercase">5%</span>
          </span>
          <span className="font-bold text-slate-900">
            {formatCurrency(bookingFee)}
          </span>
        </div>
        
        {totalSeatPrice > 0 && (
          <div className="flex justify-between pt-2">
            <span className="text-slate-500">Seat Selection</span>
            <span className="font-bold text-primary">{formatCurrency(totalSeatPrice)}</span>
          </div>
        )}

        <div className="pt-4 mt-2 border-t-2 border-slate-200 flex justify-between items-end">
           <div>
             <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Total</p>
           </div>
           <p className="text-3xl font-black text-primary tracking-tight">{formatCurrency(finalTotal)}</p>
        </div>
      </div>
    </div>
  );
};

export default BookingSummary;
