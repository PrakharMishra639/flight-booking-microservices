import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import PassengerDetails from '../components/Booking/PassengerDetails';
import SeatSelection from '../components/Booking/SeatSelection';
import BookingSummary from '../components/Booking/BookingSummary';
import Alert from '../components/Common/Alert';
import bookingService from '../redux/services/bookingService';
import { setCurrentBooking } from '../redux/slices/bookingSlice';
import { Loader2, ArrowLeft, CreditCard, ChevronRight, Users, Armchair } from 'lucide-react';

const Checkout = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { selectedSchedule, selectedSeatsBySchedule } = useSelector(state => state.booking);
  const { searchParams } = useSelector(state => state.flight);
  const { user } = useSelector(state => state.auth);

  const schedule = selectedSchedule;
  const count = parseInt(searchParams.passengers) || 1;

  const [step, setStep] = useState(1); // 1: Passengers, 2: Seats
  const [passengers, setPassengers] = useState(
    Array.from({ length: count }, () => ({ name: '', age: '', gender: 'MALE', idType: 'PASSPORT', idNumber: '' }))
  );
  const [contactEmail, setContactEmail] = useState(user?.email || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [passengerErrors, setPassengerErrors] = useState(Array.from({ length: count }, () => ({})));

  // Protect route if no schedule selected
  useEffect(() => {
    if (!schedule) {
      navigate('/');
    }
  }, [schedule, navigate]);

  // Sync passengers array with the count if it changes
  useEffect(() => {
    if (passengers.length !== count) {
      if (passengers.length < count) {
        // Expand
        const diff = count - passengers.length;
        const newPax = Array.from({ length: diff }, () => ({ name: '', age: '', gender: 'MALE', idType: 'PASSPORT', idNumber: '' }));
        setPassengers([...passengers, ...newPax]);
        setPassengerErrors([...passengerErrors, ...Array.from({ length: diff }, () => ({}))]);
      } else {
        // Shrink (rare, but for safety)
        setPassengers(passengers.slice(0, count));
        setPassengerErrors(passengerErrors.slice(0, count));
      }
    }
  }, [count, passengers.length, passengerErrors]);

  if (!schedule) return null;

  // Build all flight segments that need seat selection
  const allSegments = [];
  if (schedule.segments) {
    schedule.segments.forEach(seg => allSegments.push({ type: 'Outbound', schedule: seg }));
  }
  if (schedule.isRoundTrip && schedule.returnFlight?.segments) {
    schedule.returnFlight.segments.forEach(seg => allSegments.push({ type: 'Return', schedule: seg }));
  }

  // Check if user selected enough seats for each segment
  const checkAllSeatsSelected = () => {
    if (allSegments.length === 0) return false;
    return allSegments.every(seg => {
      const selected = selectedSeatsBySchedule[seg.schedule.schedule_id] || [];
      return selected.length === count;
    });
  };

  // Check if passenger form is valid (including PassengerDetails internal validation)
  const isPassengerFormValid = () => {
    // 1. Email Check
    if (!contactEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) return false;
    
    // 2. Count Check
    if (passengers.length !== count) return false;
    
    // 3. Independent Field Check (matching PassengerDetails rules)
    const nameRegex = /^[a-zA-Z\s]{2,50}$/;
    const idRegex = /^[a-zA-Z0-9]{12}$/;
    
    return passengers.every(p => {
      return (
        p.name && nameRegex.test(p.name) &&
        p.age && p.age >= 1 && p.age <= 120 &&
        p.gender &&
        p.idNumber && idRegex.test(p.idNumber)
      );
    });
  };

  // Calculate total price: base_fare * passengers + seat_selection_fees
  const calculateTotal = () => {
    let total = 0;

    allSegments.forEach(seg => {
      const baseFare = parseFloat(seg.schedule.base_price || 0);
      const selectedSeats = selectedSeatsBySchedule[seg.schedule.schedule_id] || [];
      
      if (selectedSeats.length === 0) {
        // Fallback: If they haven't picked seats yet, assume ECONOMY price
        total += baseFare * count;
      } else {
        selectedSeats.forEach(seat => {
          const seatClass = seat.Seat?.class || 'ECONOMY';
          const multiplier = seatClass === 'FIRST' ? 4.0 : seatClass === 'BUSINESS' ? 2.5 : 1.0;
          total += baseFare * multiplier;
        });
      }
    });

    // Add 5% booking fee
    const bookingFee = total * 0.05;
    total += bookingFee;

    // Seat selection fees
    Object.values(selectedSeatsBySchedule).forEach(seats => {
      if (Array.isArray(seats)) {
        seats.forEach(seat => { total += parseFloat(seat.price || 0); });
      }
    });

    return Math.round(total * 100) / 100;
  };

  // Create booking via API
  const handleCreateBooking = async () => {
    if (!checkAllSeatsSelected()) {
      setError(`Please select exactly ${count} seat(s) for each flight segment.`);
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Build legs structure: each leg contains the schedule and the list of passengers with their respective seats for that specific leg
      const legsData = allSegments.map(seg => {
        const scheduleId = seg.schedule.schedule_id;
        const selectedSeats = selectedSeatsBySchedule[scheduleId] || [];
        
        return {
          scheduleId,
          passengers: passengers.map((p, idx) => ({
            name: p.name,
            age: parseInt(p.age),
            gender: p.gender,
            idType: p.idType,
            idNumber: p.idNumber,
            seatId: selectedSeats[idx]?.seat_id
          }))
        };
      });

      const payload = {
        legs: legsData,
        passengers: passengers.length,
        contactEmail
      };

      const result = await bookingService.createBooking(payload);
      dispatch(setCurrentBooking(result.booking));
      navigate(`/payment/${result.booking.booking_id}`);
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.errors?.map(e => e.message).join(', ') || 'Failed to create booking.');
    } finally {
      setLoading(false);
    }
  };

  const totalAmount = calculateTotal();

  return (
    <div className="bg-slate-50 min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Back Button */}
        <button onClick={() => navigate(-1)} className="flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 mb-6 transition-colors group">
          <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" /> Back to Results
        </button>

        <Alert message={error} type="error" onDismiss={() => setError('')} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">

            {/* Step Progress Bar */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
              <div className="flex gap-4">
                {/* Step 1 */}
                <button
                  onClick={() => setStep(1)}
                  className={`flex-1 relative rounded-2xl p-4 transition-all duration-300 border-2 ${step === 1
                      ? 'border-primary bg-primary/5 shadow-lg shadow-primary/10'
                      : step > 1
                        ? 'border-emerald-200 bg-emerald-50 cursor-pointer hover:border-emerald-300'
                        : 'border-slate-200 bg-slate-50'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm ${step === 1 ? 'bg-primary text-white' : step > 1 ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400'
                      }`}>
                      {step > 1 ? '✓' : '1'}
                    </div>
                    <div className="text-left">
                      <p className={`text-xs font-bold uppercase tracking-widest ${step >= 1 ? 'text-primary' : 'text-slate-400'}`}>Step 1</p>
                      <p className={`font-bold text-sm ${step >= 1 ? 'text-slate-900' : 'text-slate-400'}`}>Passenger Details</p>
                    </div>
                  </div>
                </button>

                <ChevronRight className="w-5 h-5 text-slate-300 self-center shrink-0" />

                {/* Step 2 */}
                <div className={`flex-1 relative rounded-2xl p-4 transition-all duration-300 border-2 ${step === 2
                    ? 'border-primary bg-primary/5 shadow-lg shadow-primary/10'
                    : 'border-slate-200 bg-slate-50'
                  }`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm ${step === 2 ? 'bg-primary text-white' : 'bg-slate-200 text-slate-400'
                      }`}>
                      2
                    </div>
                    <div className="text-left">
                      <p className={`text-xs font-bold uppercase tracking-widest ${step >= 2 ? 'text-primary' : 'text-slate-400'}`}>Step 2</p>
                      <p className={`font-bold text-sm ${step >= 2 ? 'text-slate-900' : 'text-slate-400'}`}>Seat Selection</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 1: Passenger Details */}
            {step === 1 && (
              <div className="space-y-6 animate-fade-in-up">
                <PassengerDetails
                  count={count}
                  passengers={passengers}
                  onChange={setPassengers}
                  email={contactEmail}
                  onEmailChange={setContactEmail}
                />
                <div className="flex justify-end pt-4">
                  <button
                    onClick={() => setStep(2)}
                    disabled={!isPassengerFormValid()}
                    className="px-10 py-4 bg-primary hover:bg-primary-dark disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white rounded-2xl font-bold shadow-xl shadow-primary/20 hover:shadow-primary/40 transition-all duration-300 flex items-center gap-3 hover:-translate-y-0.5 active:scale-95"
                  >
                    <Armchair className="w-5 h-5" />
                    Continue to Seat Selection
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
                {!isPassengerFormValid() && (
                  <p className="text-xs text-center text-slate-400 font-medium mt-2">
                    Fill all passenger details and a valid contact email to continue
                  </p>
                )}
              </div>
            )}

            {/* Step 2: Seat Selection */}
            {step === 2 && (
              <div className="space-y-8 animate-fade-in-up">
                {allSegments.map((seg, idx) => (
                  <div key={idx} className="bg-white border border-slate-100 rounded-3xl p-8 shadow-sm">
                    <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                      <span className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-sm font-black text-primary">{idx + 1}</span>
                      {seg.type} Flight:
                      <span className="text-slate-500 font-medium ml-1">
                        {seg.schedule?.Flight?.flight_no || seg.schedule?.Flight?.Airline?.name || 'Flight'}
                      </span>
                      <span className="ml-auto text-xs font-bold text-slate-400 uppercase tracking-wider">
                        {seg.schedule?.SourceAirport?.code} → {seg.schedule?.DestAirport?.code}
                      </span>
                    </h3>
                    <SeatSelection schedule={seg.schedule} maxSelectable={count} />
                  </div>
                ))}

                <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                  <button
                    onClick={() => setStep(1)}
                    className="px-6 py-3 bg-transparent border border-slate-200 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-colors flex items-center gap-2"
                  >
                    <Users className="w-4 h-4" />
                    Back to Passengers
                  </button>
                  <button
                    onClick={handleCreateBooking}
                    disabled={loading || !checkAllSeatsSelected()}
                    className="px-10 py-4 bg-slate-900 hover:bg-black disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white rounded-2xl font-bold shadow-xl transition-all duration-300 flex items-center gap-3 hover:-translate-y-0.5 active:scale-95"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CreditCard className="w-5 h-5" />}
                    {loading ? 'Creating Booking...' : 'Proceed to Payment'}
                  </button>
                </div>
                {!checkAllSeatsSelected() && (
                  <p className="text-xs text-center text-slate-400 font-medium">
                    Select {count} seat(s) per flight segment to proceed
                  </p>
                )}
              </div>
            )}

          </div>

          {/* Sidebar: Booking Summary */}
          <div className="lg:col-span-1">
            <BookingSummary
              schedule={schedule}
              selectedSeatsBySchedule={selectedSeatsBySchedule}
              passengersCount={count}
              totalAmount={totalAmount}
            />
          </div>

        </div>
      </div>
    </div>
  );
};

export default Checkout;
