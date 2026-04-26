// import { useState, useEffect } from 'react';
// import { useDispatch, useSelector } from 'react-redux';
// import { toggleSeatSelection } from '../../redux/slices/bookingSlice';
// import bookingService from '../../redux/services/bookingService';
// import { getSocket } from '../../utils/socket';
// import Loader from '../Common/Loader';
// import Alert from '../Common/Alert';
// import { formatCurrency } from '../../utils/helpers';
// import { Armchair, CheckCircle2 } from 'lucide-react';

// const classLevels = { 'ECONOMY': 1, 'PREMIUM': 2, 'BUSINESS': 3, 'FIRST': 4 };

// const SeatSelection = ({ schedule, maxSelectable, currentSeatClass }) => {
//   const dispatch = useDispatch();
//   const { selectedSeatsBySchedule } = useSelector((state) => state.booking);
  
//   const [flightSeats, setFlightSeats] = useState([]);
//   const [othersSelecting, setOthersSelecting] = useState({}); // { seatId: userId }
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   const scheduleId = schedule?.schedule_id;
//   const selectedSeats = selectedSeatsBySchedule[scheduleId] || [];

//   // Socket.IO real-time seat updates
//   useEffect(() => {
//     const socket = getSocket();
//     if (socket && scheduleId) {
//       socket.emit('join_schedule', scheduleId);

//       socket.on('seat_availability', (data) => {
//         if (data.scheduleId === scheduleId) {
//           setFlightSeats(current => 
//             current.map(seat => 
//               seat.Seat?.seat_id === data.seatId 
//                 ? { ...seat, status: data.status } 
//                 : seat
//             )
//           );
//           // If the seat becomes unavailable, clear it from othersSelecting
//           if (data.status !== 'AVAILABLE') {
//             setOthersSelecting(prev => {
//               const next = { ...prev };
//               delete next[data.seatId];
//               return next;
//             });
//           }
//         }
//       });

//       socket.on('seat_selected', (data) => {
//         setOthersSelecting(prev => ({ ...prev, [data.seatId]: data.userId }));
//       });

//       socket.on('seat_released', (data) => {
//         setOthersSelecting(prev => {
//           const next = { ...prev };
//           delete next[data.seatId];
//           return next;
//         });
//       });
//     }

//     return () => {
//       if (socket) {
//         socket.off('seat_availability');
//         socket.off('seat_selected');
//         socket.off('seat_released');
//       }
//     };
//   }, [scheduleId]);

//   // Fetch seats from API
//   useEffect(() => {
//     const fetchSeats = async () => {
//       if (!scheduleId) return;
//       try {
//         setLoading(true);
//         setError(null);
//         const data = await bookingService.getSeatsForSchedule(scheduleId);
//         let validSeats = data || [];
        
//         const capacity = schedule?.Flight?.seat_capacity;
//         if (capacity && validSeats.length > capacity) {
//           // Sort accurately by row and column to ensure progressive slicing
//           validSeats.sort((a, b) => {
//             if (a.Seat?.row_number !== b.Seat?.row_number) {
//               return (a.Seat?.row_number || 0) - (b.Seat?.row_number || 0);
//             }
//             return (a.Seat?.column_letter || '').localeCompare(b.Seat?.column_letter || '');
//           });
//           // Truncate to the flight's explicit capacity limit
//           validSeats = validSeats.slice(0, capacity);
//         }

//         setFlightSeats(validSeats);
//       } catch (err) {
//         setError('Failed to load seat map. Please try again.');
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchSeats();
//   }, [scheduleId]);

//   // Loading state
//   if (loading) return (
//     <div className="flex flex-col items-center justify-center p-16 space-y-4">
//       <Loader />
//       <p className="text-slate-400 font-medium text-sm animate-pulse">Loading seat map...</p>
//     </div>
//   );

//   // Error state
//   if (error) return (
//     <div className="p-6">
//       <Alert message={error} type="error" />
//     </div>
//   );

//   // Empty state
//   if (!flightSeats || flightSeats.length === 0) return (
//     <div className="bg-slate-50 p-12 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center text-center">
//       <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
//         <Armchair className="w-8 h-8 text-slate-300" />
//       </div>
//       <h4 className="text-lg font-bold text-slate-900 mb-2">No Seats Available</h4>
//       <p className="text-slate-500 text-sm max-w-xs">
//         No seats found for this flight. The flight may be fully booked.
//       </p>
//     </div>
//   );

//   // Organize seats into rows
//   const rows = {};
//   flightSeats.forEach(fs => {
//     const row = fs.Seat?.row_number || 0;
//     if (!rows[row]) rows[row] = [];
//     rows[row].push(fs);
//   });

//   const rowNumbers = Object.keys(rows).map(Number).sort((a, b) => a - b);
  
//   // Get unique sorted columns
//   const columnsSet = new Set();
//   flightSeats.forEach(fs => { if (fs.Seat?.column_letter) columnsSet.add(fs.Seat.column_letter); });
//   const columns = Array.from(columnsSet).sort();
//   const middleIdx = Math.floor(columns.length / 2);

//   const getIsDowngrade = (fs) => {
//     if (!currentSeatClass) return false;
//     return (classLevels[fs.Seat?.class] || 1) < (classLevels[currentSeatClass] || 1);
//   };

//   // Handle seat click
//   const handleSeatClick = (seat) => {
//     if (seat.status !== 'AVAILABLE' || getIsDowngrade(seat)) return;
//     const isSelected = selectedSeats.some(s => s.flight_seat_id === seat.flight_seat_id);
//     const limit = parseInt(maxSelectable) || 1;
//     if (!isSelected && selectedSeats.length >= limit) return;

//     const socket = getSocket();
//     if (isSelected) {
//       socket.emit('release_seat', { scheduleId, seatId: seat.Seat?.seat_id });
//     } else {
//       socket.emit('select_seat', { scheduleId, seatId: seat.Seat?.seat_id });
//     }

//     dispatch(toggleSeatSelection({ scheduleId, seat }));
//   };

//   // Get seat visual style
//   const getSeatStyle = (fs) => {
//     const isSelected = selectedSeats.some(s => s.flight_seat_id === fs.flight_seat_id);
//     if (isSelected) return 'bg-primary text-white border-primary shadow-lg shadow-primary/30 scale-110 z-10';
    
//     // Check if someone else is selecting it
//     if (othersSelecting[fs.Seat?.seat_id]) {
//       return 'bg-indigo-50 text-indigo-400 border-indigo-200 animate-pulse cursor-not-allowed';
//     }

//     if (getIsDowngrade(fs)) {
//       return 'bg-slate-200 text-slate-300 border-slate-200 font-normal cursor-not-allowed diagonal-stripes opacity-60';
//     }

//     if (fs.status === 'AVAILABLE') {
//       if (parseFloat(fs.price) === 0) return 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100 hover:border-emerald-400 hover:shadow-md cursor-pointer';
//       return 'bg-white text-slate-600 border-slate-200 hover:border-primary hover:text-primary hover:shadow-md cursor-pointer';
//     }
//     if (fs.status === 'LOCKED') return 'bg-amber-50 text-amber-300 border-amber-200 cursor-not-allowed';
//     return 'bg-slate-100 text-slate-300 border-slate-100 cursor-not-allowed';
//   };

//   // Get seat class badge color
//   const getClassBadge = (seatClass) => {
//     if (seatClass === 'FIRST') return 'bg-amber-100 text-amber-700';
//     if (seatClass === 'BUSINESS') return 'bg-indigo-100 text-indigo-700';
//     return 'bg-slate-100 text-slate-500';
//   };

//   return (
//     <div>
//       <div className="flex flex-col lg:flex-row gap-8">
        
//         {/* Seat Map */}
//         <div className="flex-1 bg-slate-50 p-6 rounded-2xl border border-slate-200 overflow-x-auto">
          
//           {/* Legend */}
//           <div className="flex justify-center flex-wrap gap-6 mb-8 pb-4 border-b border-slate-200 text-[10px] font-bold uppercase tracking-widest text-slate-400">
//             <div className="flex items-center gap-2">
//               <div className="w-5 h-5 rounded-lg border-2 border-slate-200 bg-white"></div> Standard
//             </div>
//             <div className="flex items-center gap-2">
//               <div className="w-5 h-5 rounded-lg border-2 border-emerald-200 bg-emerald-50"></div> Free
//             </div>
//             <div className="flex items-center gap-2">
//               <div className="w-5 h-5 rounded-lg bg-primary shadow-md"></div> Selected
//             </div>
//             <div className="flex items-center gap-2">
//               <div className="w-5 h-5 rounded-lg bg-slate-100 border border-slate-100"></div> Taken
//             </div>
//           </div>

//           <div className="min-w-max mx-auto">
//             {/* Column Headers */}
//             <div className="flex items-center justify-center gap-3 mb-4">
//               <div className="w-10 text-center text-[10px] font-black text-slate-300">ROW</div>
//               <div className="flex gap-1.5">
//                 {columns.map((col, idx) => (
//                   <div key={`h-${col}`} className="flex items-center gap-1.5">
//                     <div className="w-11 text-center font-black text-slate-400 text-[11px]">{col}</div>
//                     {idx === middleIdx - 1 && <div className="w-6"></div>}
//                   </div>
//                 ))}
//               </div>
//             </div>

//             {/* Rows */}
//             <div className="space-y-2">
//               {rowNumbers.map(rowNum => {
//                 const firstSeat = rows[rowNum]?.[0];
//                 const seatClass = firstSeat?.Seat?.class;
                
//                 return (
//                   <div key={`r-${rowNum}`} className="flex items-center justify-center gap-3">
//                     <div className="w-10 text-center flex flex-col items-center">
//                       <span className="font-black text-slate-300 text-xs">{rowNum}</span>
//                       {seatClass && (
//                         <span className={`text-[7px] font-bold uppercase px-1 py-0.5 rounded mt-0.5 ${getClassBadge(seatClass)}`}>
//                           {seatClass === 'FIRST' ? 'F' : seatClass === 'BUSINESS' ? 'B' : 'E'}
//                         </span>
//                       )}
//                     </div>
//                     <div className="flex gap-1.5">
//                       {columns.map((col, idx) => {
//                         const seatInDB = rows[rowNum]?.find(s => s.Seat?.column_letter === col);
//                         const isSelected = seatInDB ? selectedSeats.some(s => s.flight_seat_id === seatInDB.flight_seat_id) : false;
                        
//                         return (
//                           <div key={`c-${col}`} className="flex items-center gap-1.5">
//                             {seatInDB ? (
//                               <button
//                                 onClick={() => handleSeatClick(seatInDB)}
//                                 disabled={(seatInDB.status !== 'AVAILABLE' && !isSelected) || getIsDowngrade(seatInDB)}
//                                 className={`w-11 h-11 rounded-xl border-2 flex items-center justify-center transition-all duration-200 ${getSeatStyle(seatInDB)}`}
//                                 title={`${seatInDB.Seat?.seat_number} — ${parseFloat(seatInDB.price) === 0 ? 'Free' : formatCurrency(seatInDB.price)} (${seatInDB.Seat?.class})${getIsDowngrade(seatInDB) ? ' - Downgrade Not Allowed' : ''}`}
//                               >
//                                 {isSelected 
//                                   ? <CheckCircle2 className="w-5 h-5" /> 
//                                   : <span className="text-[10px] font-bold">{col}</span>
//                                 }
//                               </button>
//                             ) : (
//                               <div className="w-11 h-11"></div>
//                             )}
//                             {idx === middleIdx - 1 && <div className="w-6"></div>}
//                           </div>
//                         );
//                       })}
//                     </div>
//                   </div>
//                 );
//               })}
//             </div>
//           </div>
//         </div>

//         {/* Selected Seats Panel */}
//         <div className="w-full lg:w-72 shrink-0">
//           <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm sticky top-24">
//             <h4 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
//               <Armchair className="w-5 h-5 text-primary" />
//               Your Seats
//             </h4>
//             <p className="text-xs text-slate-400 mb-5 pb-4 border-b border-slate-100">
//               Select <span className="font-bold text-primary">{maxSelectable}</span> seat(s)
//             </p>
            
//             <div className="space-y-3">
//               {Array.from({ length: parseInt(maxSelectable) || 1 }).map((_, idx) => {
//                 const seat = selectedSeats[idx];
//                 return (
//                   <div key={idx} className={`p-3 rounded-xl border-2 transition-all duration-300 ${
//                     seat 
//                       ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' 
//                       : 'bg-slate-50 border-dashed border-slate-200 text-slate-300'
//                   }`}>
//                     {seat ? (
//                       <div className="flex justify-between items-center">
//                         <div>
//                           <p className="font-black text-lg leading-none">{seat.Seat?.seat_number}</p>
//                           <p className="text-[9px] font-bold text-white/70 uppercase tracking-widest mt-1">{seat.Seat?.class}</p>
//                         </div>
//                         <p className="font-bold text-emerald-100">{parseFloat(seat.price) === 0 ? 'Free' : formatCurrency(seat.price)}</p>
//                       </div>
//                     ) : (
//                       <div className="text-center py-1 text-[10px] font-bold uppercase tracking-widest">
//                         Tap a seat
//                       </div>
//                     )}
//                   </div>
//                 );
//               })}
//             </div>

//             <div className="mt-6 pt-4 border-t border-slate-100">
//               <div className="flex justify-between items-end">
//                 <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Subtotal</span>
//                 <span className="text-xl font-black text-slate-900">
//                   {formatCurrency(selectedSeats.reduce((sum, s) => sum + parseFloat(s.price || 0), 0))}
//                 </span>
//               </div>
//             </div>
//           </div>
//         </div>

//       </div>
//     </div>
//   );
// };

// export default SeatSelection;




import { useState, useEffect, useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toggleSeatSelection } from '../../redux/slices/bookingSlice';
import bookingService from '../../redux/services/bookingService';
import { getSocket } from '../../utils/socket';
import Loader from '../Common/Loader';
import Alert from '../Common/Alert';
import { formatCurrency } from '../../utils/helpers';
import { Armchair, CheckCircle2, Loader2, XCircle } from 'lucide-react';

const classLevels = { 'ECONOMY': 1, 'PREMIUM': 2, 'BUSINESS': 3, 'FIRST': 4 };

const SeatSelection = ({ schedule, maxSelectable, currentSeatClass, currentSeatId }) => {
  const dispatch = useDispatch();
  const { selectedSeatsBySchedule } = useSelector((state) => state.booking);
  
  const [flightSeats, setFlightSeats] = useState([]);
  const [othersSelecting, setOthersSelecting] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lockingSeatId, setLockingSeatId] = useState(null);
  const [lockErrors, setLockErrors] = useState({});
  const [toastMessage, setToastMessage] = useState(null);

  const scheduleId = schedule?.schedule_id;
  const selectedSeats = selectedSeatsBySchedule[scheduleId] || [];
  
  const lockTimeoutsRef = useRef({});

  // ========== REFS for stable socket handler access ==========
  // These refs always point to the latest state, avoiding stale closures
  // in the socket useEffect which only depends on [scheduleId].
  const flightSeatsRef = useRef(flightSeats);
  const selectedSeatsRef = useRef(selectedSeats);
  const lockingSeatIdRef = useRef(lockingSeatId);
  const scheduleIdRef = useRef(scheduleId);

  useEffect(() => { flightSeatsRef.current = flightSeats; }, [flightSeats]);
  useEffect(() => { selectedSeatsRef.current = selectedSeats; }, [selectedSeats]);
  useEffect(() => { lockingSeatIdRef.current = lockingSeatId; }, [lockingSeatId]);
  useEffect(() => { scheduleIdRef.current = scheduleId; }, [scheduleId]);

  // Show toast notification
  const showToast = useCallback((message, type = 'info') => {
    setToastMessage({ message, type });
    setTimeout(() => setToastMessage(null), 3000);
  }, []);

  // Fetch seats from API
  const fetchSeats = useCallback(async () => {
    if (!scheduleId) return;
    try {
      setLoading(true);
      setError(null);
      const data = await bookingService.getSeatsForSchedule(scheduleId);
      let validSeats = data || [];
      
      const capacity = schedule?.Flight?.seat_capacity;
      if (capacity && validSeats.length > capacity) {
        validSeats.sort((a, b) => {
          if (a.Seat?.row_number !== b.Seat?.row_number) {
            return (a.Seat?.row_number || 0) - (b.Seat?.row_number || 0);
          }
          return (a.Seat?.column_letter || '').localeCompare(b.Seat?.column_letter || '');
        });
        validSeats = validSeats.slice(0, capacity);
      }

      setFlightSeats(validSeats);
    } catch (err) {
      setError('Failed to load seat map. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [scheduleId, schedule]);

  // ========== Socket.IO real-time seat updates ==========
  // CRITICAL FIX: This effect only depends on [scheduleId] so listeners
  // are registered once per schedule and never torn down / re-registered
  // due to flightSeats / selectedSeats / lockingSeatId changes.
  useEffect(() => {
    const socket = getSocket();
    
    if (!socket || !scheduleId) return;

    socket.emit('join_schedule', scheduleId);

    // Helper: check if the event belongs to THIS component's schedule
    const isMySchedule = (data) => String(data.scheduleId) === String(scheduleId);

    // --- Existing event handlers ---
    socket.on('seat_availability', (data) => {
      if (!isMySchedule(data)) return;
      setFlightSeats(current => 
        current.map(seat => 
          seat.Seat?.seat_id === data.seatId 
            ? { ...seat, status: data.status } 
            : seat
        )
      );
      if (data.status !== 'AVAILABLE') {
        setOthersSelecting(prev => {
          const next = { ...prev };
          delete next[data.seatId];
          return next;
        });
        if (String(lockingSeatIdRef.current) === String(data.seatId)) {
          setLockingSeatId(null);
        }
      }
    });

    socket.on('seat_selected', (data) => {
      if (!isMySchedule(data)) return;
      setOthersSelecting(prev => ({ ...prev, [data.seatId]: data.userId }));
      // Also update the seat status in flightSeats so it shows as locked
      setFlightSeats(current =>
        current.map(s =>
          String(s.Seat?.seat_id) === String(data.seatId)
            ? { ...s, status: 'LOCKED' }
            : s
        )
      );
    });

    socket.on('seat_released', (data) => {
      if (!isMySchedule(data)) return;
      setOthersSelecting(prev => {
        const next = { ...prev };
        delete next[data.seatId];
        return next;
      });
      // Update seat status back to AVAILABLE
      setFlightSeats(current =>
        current.map(s =>
          String(s.Seat?.seat_id) === String(data.seatId)
            ? { ...s, status: 'AVAILABLE' }
            : s
        )
      );
      if (String(lockingSeatIdRef.current) === String(data.seatId)) {
        setLockingSeatId(null);
      }
    });

    // --- When lock is successfully acquired ---
    socket.on('seat_lock_acquired', (data) => {
      if (!isMySchedule(data)) return;
      console.log('✅ Lock acquired:', data);
      
      if (data.success && data.seatId) {
        setLockingSeatId(null);
        
        if (lockTimeoutsRef.current[data.seatId]) {
          clearTimeout(lockTimeoutsRef.current[data.seatId]);
          delete lockTimeoutsRef.current[data.seatId];
        }
        
        const currentSeats = flightSeatsRef.current;
        const seat = currentSeats.find(s => String(s.Seat?.seat_id) === String(data.seatId));
        
        if (seat) {
          // If backend auto-released old seats on this schedule, deselect them
          if (data.releasedSeats && data.releasedSeats.length > 0) {
            const currentSelected = selectedSeatsRef.current;
            data.releasedSeats.forEach(releasedSeatId => {
              const oldSeat = currentSelected.find(s => String(s.Seat?.seat_id) === String(releasedSeatId));
              if (oldSeat) {
                dispatch(toggleSeatSelection({ scheduleId, seat: oldSeat }));
              }
            });
            setFlightSeats(current =>
              current.map(s =>
                data.releasedSeats.some(rid => String(s.Seat?.seat_id) === String(rid))
                  ? { ...s, status: 'AVAILABLE' }
                  : s
              )
            );
          }

          // Update seat status to LOCKED in UI
          setFlightSeats(current =>
            current.map(s =>
              String(s.Seat?.seat_id) === String(data.seatId)
                ? { ...s, status: 'LOCKED' }
                : s
            )
          );
          
          dispatch(toggleSeatSelection({ scheduleId, seat }));
          showToast(`Seat ${seat.Seat?.seat_number || data.seatId} locked.`, 'success');
        } else {
          console.warn('seat_lock_acquired: Could not find seat in flightSeats for seatId', data.seatId);
        }
      }
    });

    // --- When lock acquisition fails ---
    socket.on('seat_lock_failed', (data) => {
      if (!isMySchedule(data)) return;
      console.log('❌ Lock failed:', data);
      
      setLockingSeatId(null);
      if (lockTimeoutsRef.current[data.seatId]) {
        clearTimeout(lockTimeoutsRef.current[data.seatId]);
        delete lockTimeoutsRef.current[data.seatId];
      }
      
      setLockErrors(prev => ({ ...prev, [data.seatId]: data.message || 'Seat unavailable' }));
      showToast(data.message || `Cannot select seat ${data.seatId}`, 'error');
      
      setTimeout(() => {
        setLockErrors(prev => {
          const next = { ...prev };
          delete next[data.seatId];
          return next;
        });
      }, 2000);
    });

    // --- When lock expires ---
    socket.on('seat_lock_expired', (data) => {
      if (!isMySchedule(data)) return;
      console.log('⚠️ Lock expired:', data);
      
      showToast(`Your lock on seat ${data.seatId} has expired`, 'warning');
      setLockingSeatId(null);
      
      const currentSelected = selectedSeatsRef.current;
      const currentSeats = flightSeatsRef.current;
      const seat = currentSeats.find(s => String(s.Seat?.seat_id) === String(data.seatId));
      if (seat && currentSelected.some(s => String(s.Seat?.seat_id) === String(data.seatId))) {
        dispatch(toggleSeatSelection({ scheduleId, seat }));
      }
      
      setFlightSeats(current =>
        current.map(s =>
          String(s.Seat?.seat_id) === String(data.seatId)
            ? { ...s, status: 'AVAILABLE' }
            : s
        )
      );
    });

    socket.on('seat_lock_error', (data) => {
      if (!isMySchedule(data)) return;
      console.log('⚠️ Lock error:', data);
      setLockingSeatId(null);
      if (lockTimeoutsRef.current[data.seatId]) {
        clearTimeout(lockTimeoutsRef.current[data.seatId]);
        delete lockTimeoutsRef.current[data.seatId];
      }
      showToast(data.error || 'Failed to lock seat', 'error');
    });

    socket.on('seat_released_confirm', (data) => {
      if (!isMySchedule(data)) return;
      console.log('✅ Seat released:', data);
      if (data.success) {
        setFlightSeats(current =>
          current.map(s =>
            String(s.Seat?.seat_id) === String(data.seatId)
              ? { ...s, status: 'AVAILABLE' }
              : s
          )
        );
      }
    });

    socket.on('seat_release_failed', (data) => {
      if (!isMySchedule(data)) return;
      console.log('❌ Release failed:', data);
      showToast(data.message || 'Failed to release seat', 'error');
    });

    return () => {
      if (socket) {
        socket.off('seat_availability');
        socket.off('seat_selected');
        socket.off('seat_released');
        socket.off('seat_lock_acquired');
        socket.off('seat_lock_failed');
        socket.off('seat_lock_expired');
        socket.off('seat_lock_error');
        socket.off('seat_released_confirm');
        socket.off('seat_release_failed');
      }
      
      // Clear all timeouts
      Object.values(lockTimeoutsRef.current).forEach(timeout => clearTimeout(timeout));
      lockTimeoutsRef.current = {};
    };
  // CRITICAL: only re-run when scheduleId changes — NOT on flightSeats/selectedSeats/lockingSeatId
  }, [scheduleId, dispatch, showToast]);

  // Fetch seats on mount and schedule change
  useEffect(() => {
    fetchSeats();
  }, [fetchSeats]);

  const handleSeatClick = useCallback((seat) => {
    if (currentSeatId && seat.flight_seat_id === currentSeatId) return;

    const isSelected = selectedSeats.some(s => String(s.flight_seat_id) === String(seat.flight_seat_id));

    // Deselect if already selected
    if (isSelected) {
      handleSeatRelease(seat);
      return;
    }

    // Prevent clicking if seat is not available
    if (seat.status !== 'AVAILABLE') {
      if (seat.status === 'LOCKED') {
        showToast(`Seat ${seat.Seat?.seat_number} is currently locked by another user`, 'warning');
      }
      return;
    }
    
    // Prevent downgrade
    if (getIsDowngrade(seat)) {
      showToast(`Cannot downgrade from ${currentSeatClass} to ${seat.Seat?.class}`, 'warning');
      return;
    }
    
    // Prevent selecting more than max allowed (count pending locks too)
    const limit = parseInt(maxSelectable) || 1;
    const pendingCount = lockingSeatIdRef.current !== null ? 1 : 0;
    
    // Auto-release previous if limit is 1
    if (limit === 1 && selectedSeats.length === 1 && pendingCount === 0) {
      handleSeatRelease(selectedSeats[0]);
    } else if ((selectedSeats.length + pendingCount) >= limit) {
      showToast(`You can only select ${limit} seat(s)`, 'warning');
      return;
    }
    
    // Block if any seat lock is currently in progress
    const seatId = seat.Seat?.seat_id;
    if (lockingSeatIdRef.current !== null) {
      showToast('Please wait for the current seat to be locked', 'info');
      return;
    }
    
    // Set locking state for THIS SPECIFIC seat only
    setLockingSeatId(seatId);
    
    const socket = getSocket();
    
    // Emit select_seat event to acquire Redis lock
    socket.emit('select_seat', {
      scheduleId: schedule.schedule_id,
      seatId: seatId,
      maxSeats: parseInt(maxSelectable) || 1
    });
    
    // Set timeout for lock acquisition (5 seconds)
    const timeout = setTimeout(() => {
      // Use ref to check the current value at timeout time
      if (String(lockingSeatIdRef.current) === String(seatId)) {
        setLockingSeatId(null);
        setLockErrors(prev => ({ ...prev, [seatId]: 'Lock acquisition timeout' }));
        showToast(`Timeout while selecting seat ${seat.Seat?.seat_number}`, 'error');
        setTimeout(() => {
          setLockErrors(prev => {
            const next = { ...prev };
            delete next[seatId];
            return next;
          });
        }, 2000);
      }
    }, 5000);
    
    lockTimeoutsRef.current[seatId] = timeout;
  }, [schedule, maxSelectable, selectedSeats.length, currentSeatClass, showToast]);

  // Handle seat release with Redis unlock
  const handleSeatRelease = useCallback((seat) => {
    const socket = getSocket();
    const seatId = seat.Seat?.seat_id;
    
    socket.emit('release_seat', {
      scheduleId: schedule.schedule_id,
      seatId: seatId
    });
    
    // Clear timeout
    if (lockTimeoutsRef.current[seatId]) {
      clearTimeout(lockTimeoutsRef.current[seatId]);
      delete lockTimeoutsRef.current[seatId];
    }
    
    // Clear locking state for this seat
    if (String(lockingSeatIdRef.current) === String(seatId)) {
      setLockingSeatId(null);
    }
    
    dispatch(toggleSeatSelection({ scheduleId: schedule.schedule_id, seat }));
  }, [schedule, dispatch]);

  const getIsDowngrade = (fs) => {
    if (!currentSeatClass) return false;
    return (classLevels[fs.Seat?.class] || 1) < (classLevels[currentSeatClass] || 1);
  };

  // Get seat visual style
  const getSeatStyle = (fs) => {
    const isSelected = selectedSeats.some(s => s.flight_seat_id === fs.flight_seat_id);
    const isLocking = lockingSeatId !== null && String(lockingSeatId) === String(fs.Seat?.seat_id);
    const hasError = lockErrors[fs.Seat?.seat_id];
    const isOtherSelecting = othersSelecting[fs.Seat?.seat_id];
    const isDowngrade = getIsDowngrade(fs);
    
    if (isSelected) return 'bg-primary text-white border-primary shadow-lg shadow-primary/30 scale-110 z-10';
    if (currentSeatId && fs.flight_seat_id === currentSeatId) return 'bg-indigo-500 text-white border-indigo-500 shadow-md cursor-not-allowed scale-105 z-10';
    if (isLocking) return 'bg-amber-100 text-amber-600 border-amber-300 animate-pulse cursor-wait';
    if (hasError) return 'bg-red-100 text-red-600 border-red-300 cursor-not-allowed';
    if (isOtherSelecting) return 'bg-amber-100 text-amber-500 border-amber-300 animate-pulse cursor-not-allowed';
    if (isDowngrade) return 'bg-slate-200 text-slate-300 border-slate-200 cursor-not-allowed opacity-60';
    
    if (fs.status === 'AVAILABLE') {
      if (parseFloat(fs.price) === 0) return 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100 hover:border-emerald-400 hover:shadow-md cursor-pointer';
      return 'bg-white text-slate-600 border-slate-200 hover:border-primary hover:text-primary hover:shadow-md cursor-pointer';
    }
    if (fs.status === 'LOCKED') return 'bg-amber-100 text-amber-500 border-amber-300 cursor-not-allowed';
    return 'bg-slate-200 text-slate-400 border-slate-300 cursor-not-allowed';
  };

  // Get seat class badge color
  const getClassBadge = (seatClass) => {
    if (seatClass === 'FIRST') return 'bg-amber-100 text-amber-700';
    if (seatClass === 'BUSINESS') return 'bg-indigo-100 text-indigo-700';
    return 'bg-slate-100 text-slate-500';
  };

  // Organize seats into rows
  const rows = {};
  flightSeats.forEach(fs => {
    const row = fs.Seat?.row_number || 0;
    if (!rows[row]) rows[row] = [];
    rows[row].push(fs);
  });

  const rowNumbers = Object.keys(rows).map(Number).sort((a, b) => a - b);
  
  // Get unique sorted columns
  const columnsSet = new Set();
  flightSeats.forEach(fs => { if (fs.Seat?.column_letter) columnsSet.add(fs.Seat.column_letter); });
  const columns = Array.from(columnsSet).sort();
  const middleIdx = Math.floor(columns.length / 2);

  // Loading state
  if (loading) return (
    <div className="flex flex-col items-center justify-center p-16 space-y-4">
      <Loader />
      <p className="text-slate-400 font-medium text-sm animate-pulse">Loading seat map...</p>
    </div>
  );

  // Error state
  if (error) return (
    <div className="p-6">
      <Alert message={error} type="error" />
      <button 
        onClick={fetchSeats}
        className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark"
      >
        Try Again
      </button>
    </div>
  );

  // Empty state
  if (!flightSeats || flightSeats.length === 0) return (
    <div className="bg-slate-50 p-12 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center text-center">
      <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
        <Armchair className="w-8 h-8 text-slate-300" />
      </div>
      <h4 className="text-lg font-bold text-slate-900 mb-2">No Seats Available</h4>
      <p className="text-slate-500 text-sm max-w-xs">
        No seats found for this flight. The flight may be fully booked.
      </p>
    </div>
  );

  return (
    <div>
      {/* Toast Notification */}
      {toastMessage && (
        <div className={`fixed top-24 right-4 z-50 p-4 rounded-lg shadow-lg transition-all duration-300 ${
          toastMessage.type === 'success' ? 'bg-emerald-500 text-white' :
          toastMessage.type === 'error' ? 'bg-red-500 text-white' :
          toastMessage.type === 'warning' ? 'bg-amber-500 text-white' :
          'bg-blue-500 text-white'
        }`}>
          {toastMessage.message}
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Seat Map */}
        <div className="flex-1 bg-slate-50 p-6 rounded-2xl border border-slate-200 overflow-x-auto">
          
          {/* Legend */}
          <div className="flex justify-center flex-wrap gap-6 mb-8 pb-4 border-b border-slate-200 text-[10px] font-bold uppercase tracking-widest text-slate-400">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-lg border-2 border-slate-200 bg-white"></div>
              <span>Available</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-lg border-2 border-emerald-200 bg-emerald-50"></div>
              <span>Free Seat</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-lg bg-primary shadow-md"></div>
              <span>Your Selection</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-lg bg-amber-100 border-2 border-amber-300"></div>
              <span>Locked</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-lg bg-slate-100 border border-slate-100"></div>
              <span>Booked</span>
            </div>
          </div>

          <div className="min-w-max mx-auto">
            {/* Column Headers */}
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-10 text-center text-[10px] font-black text-slate-300">ROW</div>
              <div className="flex gap-1.5">
                {columns.map((col, idx) => (
                  <div key={`h-${col}`} className="flex items-center gap-1.5">
                    <div className="w-11 text-center font-black text-slate-400 text-[11px]">{col}</div>
                    {idx === middleIdx - 1 && <div className="w-6"></div>}
                  </div>
                ))}
              </div>
            </div>

            {/* Rows */}
            <div className="space-y-2">
              {rowNumbers.map(rowNum => {
                const firstSeat = rows[rowNum]?.[0];
                const seatClass = firstSeat?.Seat?.class;
                
                return (
                  <div key={`r-${rowNum}`} className="flex items-center justify-center gap-3">
                    <div className="w-10 text-center flex flex-col items-center">
                      <span className="font-black text-slate-300 text-xs">{rowNum}</span>
                      {seatClass && (
                        <span className={`text-[7px] font-bold uppercase px-1 py-0.5 rounded mt-0.5 ${getClassBadge(seatClass)}`}>
                          {seatClass === 'FIRST' ? 'F' : seatClass === 'BUSINESS' ? 'B' : 'E'}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-1.5">
                      {columns.map((col, idx) => {
                        const seatInDB = rows[rowNum]?.find(s => s.Seat?.column_letter === col);
                        const isLocking = lockingSeatId !== null && String(lockingSeatId) === String(seatInDB?.Seat?.seat_id);
                        const hasError = lockErrors[seatInDB?.Seat?.seat_id];
                        
                        return (
                          <div key={`c-${col}`} className="flex items-center gap-1.5">
                            {seatInDB ? (
                              <button
                                onClick={() => {
                                  const isSelected = selectedSeats.some(s => s.flight_seat_id === seatInDB.flight_seat_id);
                                  if (isSelected) {
                                    handleSeatRelease(seatInDB);
                                  } else {
                                    handleSeatClick(seatInDB);
                                  }
                                }}
                                disabled={(!selectedSeats.some(s => s.flight_seat_id === seatInDB.flight_seat_id) && 
                                         (seatInDB.status !== 'AVAILABLE' || isLocking || hasError || getIsDowngrade(seatInDB)))}
                                className={`w-11 h-11 rounded-xl border-2 flex items-center justify-center transition-all duration-200 ${getSeatStyle(seatInDB)}`}
                                title={`${seatInDB.Seat?.seat_number} — ${parseFloat(seatInDB.price) === 0 ? 'Free' : formatCurrency(seatInDB.price)} (${seatInDB.Seat?.class})${getIsDowngrade(seatInDB) ? ' - Downgrade Not Allowed' : ''}`}
                              >
                                {isLocking ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : hasError ? (
                                  <XCircle className="w-4 h-4" />
                                ) : selectedSeats.some(s => s.flight_seat_id === seatInDB.flight_seat_id) ? (
                                  <CheckCircle2 className="w-5 h-5" />
                                ) : (
                                  <span className="text-[10px] font-bold">{col}</span>
                                )}
                              </button>
                            ) : (
                              <div className="w-11 h-11"></div>
                            )}
                            {idx === middleIdx - 1 && <div className="w-6"></div>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Info Note */}
          <div className="mt-6 p-3 bg-blue-50 rounded-lg border border-blue-100 text-xs text-blue-600">
            <p className="font-medium">💡 When you select a seat, it will be locked for 10 minutes to complete your booking.</p>
          </div>
        </div>

        {/* Selected Seats Panel */}
        <div className="w-full lg:w-72 shrink-0">
          <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm sticky top-24">
            <h4 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
              <Armchair className="w-5 h-5 text-primary" />
              Your Seats
            </h4>
            <p className="text-xs text-slate-400 mb-5 pb-4 border-b border-slate-100">
              Selected <span className="font-bold text-primary">{selectedSeats.length}</span> of <span className="font-bold text-primary">{maxSelectable}</span> seat(s)
            </p>
            
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
              {Array.from({ length: parseInt(maxSelectable) || 1 }).map((_, idx) => {
                const seat = selectedSeats[idx];
                return (
                  <div key={idx} className={`p-3 rounded-xl border-2 transition-all duration-300 ${
                    seat 
                      ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' 
                      : 'bg-slate-50 border-dashed border-slate-200 text-slate-300'
                  }`}>
                    {seat ? (
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-black text-lg leading-none">{seat.Seat?.seat_number}</p>
                          <p className="text-[9px] font-bold text-white/70 uppercase tracking-widest mt-1">{seat.Seat?.class}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-emerald-100">{parseFloat(seat.price) === 0 ? 'Free' : formatCurrency(seat.price)}</p>
                          <button
                            onClick={() => handleSeatRelease(seat)}
                            className="text-[9px] text-white/70 hover:text-white underline mt-1"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-1 text-[10px] font-bold uppercase tracking-widest">
                        Tap a seat to select
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100">
              <div className="flex justify-between items-end">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Seat Subtotal</span>
                <span className="text-xl font-black text-slate-900">
                  {formatCurrency(selectedSeats.reduce((sum, s) => sum + parseFloat(s.price || 0), 0))}
                </span>
              </div>
            </div>
            
            {selectedSeats.length !== parseInt(maxSelectable) && (
              <div className="mt-4 p-2 bg-amber-50 rounded-lg border border-amber-100">
                <p className="text-[10px] text-amber-600 text-center">
                  ⚠️ Please select {maxSelectable - selectedSeats.length} more seat(s) to continue
                </p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default SeatSelection;