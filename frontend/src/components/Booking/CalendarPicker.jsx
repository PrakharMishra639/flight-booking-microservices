import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import flightService from '../../redux/services/flightService';
import { formatCurrency } from '../../utils/helpers';
import { motion, AnimatePresence } from 'framer-motion';

const CalendarPicker = ({ value, onChange, onFocus, source, destination }) => {
  const triggerRef = useRef(null);
  const calendarRef = useRef(null);
  const [currentDate, setCurrentDate] = useState(() => {
    const d = value ? new Date(value + 'T00:00:00') : new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [prices, setPrices] = useState({});
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });

  // Compute days grid
  const daysInMonth = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= totalDays; i++) {
      const date = new Date(year, month, i);
      const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      days.push({ day: i, date, dateKey });
    }
    return days;
  }, [currentDate]);

  // Compute dropdown position relative to trigger
  const computePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const calHeight = 380;
    let top = rect.bottom + window.scrollY + 8;
    if (spaceBelow < calHeight) {
      top = rect.top + window.scrollY - calHeight - 8;
    }
    setDropdownPos({
      top,
      left: rect.left + window.scrollX,
      width: Math.max(rect.width, 320),
    });
  }, []);

  const openCalendar = () => {
    computePosition();
    setIsOpen(true);
    if (onFocus) onFocus();
  };

  // Recalculate on scroll/resize
  useEffect(() => {
    if (!isOpen) return;
    const handler = () => computePosition();
    window.addEventListener('scroll', handler, true);
    window.addEventListener('resize', handler);
    return () => {
      window.removeEventListener('scroll', handler, true);
      window.removeEventListener('resize', handler);
    };
  }, [isOpen, computePosition]);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => {
      if (
        calendarRef.current && !calendarRef.current.contains(e.target) &&
        triggerRef.current && !triggerRef.current.contains(e.target)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  // Fetch prices
  useEffect(() => {
    if (!source || !destination || !isOpen) return;
    const fetchPrices = async () => {
      try {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
        const lastDay = new Date(year, month + 1, 0).getDate();
        const endDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
        const res = await flightService.getDatePrices(source, destination, startDate, endDate);
        setPrices(res);
      } catch (err) {
        console.error('Failed to fetch calendar prices:', err);
      }
    };
    fetchPrices();
  }, [source, destination, currentDate, isOpen]);

  const handleSelectDate = (dateKey) => {
    onChange(dateKey);
    setIsOpen(false);
  };

  const todayKey = new Date().toISOString().split('T')[0];
  const monthName = currentDate.toLocaleString('default', { month: 'long' });

  // Format display value
  const displayValue = value
    ? new Date(value + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
    : 'Select Date';

  const dropdown = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={calendarRef}
          initial={{ opacity: 0, y: 8, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.97 }}
          transition={{ duration: 0.18 }}
          style={{
            position: 'absolute',
            top: dropdownPos.top,
            left: dropdownPos.left,
            width: 320,
            zIndex: 99999,
          }}
          className="bg-white rounded-3xl shadow-2xl border border-slate-100 ring-1 ring-slate-900/5 overflow-hidden"
        >
          {/* Header */}
          <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
            <button
              type="button"
              onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}
              className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="font-bold text-sm">{monthName} {currentDate.getFullYear()}</span>
            <button
              type="button"
              onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}
              className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Day names */}
          <div className="grid grid-cols-7 px-3 pt-3">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
              <div key={d} className="text-center text-[10px] font-bold text-slate-400 uppercase py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Date grid */}
          <div className="grid grid-cols-7 gap-0.5 px-3 pb-4 pt-1">
            {daysInMonth.map((dayObj, i) => {
              if (!dayObj) return <div key={`e-${i}`} />;
              const { day, date, dateKey } = dayObj;
              const price = prices[dateKey];
              const isSelected = value === dateKey;
              const isToday = todayKey === dateKey;
              const isPast = date < new Date(new Date().setHours(0, 0, 0, 0));

              return (
                <button
                  key={dateKey}
                  type="button"
                  disabled={isPast}
                  onClick={() => handleSelectDate(dateKey)}
                  className={`
                    h-12 rounded-xl flex flex-col items-center justify-center transition-all text-center
                    ${isSelected ? 'bg-blue-600 text-white shadow-md shadow-blue-200' : 'hover:bg-slate-50'}
                    ${isPast ? 'opacity-25 cursor-not-allowed' : 'cursor-pointer'}
                  `}
                >
                  <span className={`text-xs font-bold leading-none ${isSelected ? 'text-white' : isToday ? 'text-blue-600' : 'text-slate-800'}`}>
                    {day}
                  </span>
                  {price && !isPast ? (
                    <span className={`text-[8px] font-black mt-0.5 leading-none ${isSelected ? 'text-blue-200' : 'text-emerald-500'}`}>
                      {formatCurrency(price).replace('.00', '')}
                    </span>
                  ) : (
                    <span className="text-[8px] mt-0.5 leading-none opacity-0">-</span>
                  )}
                </button>
              );
            })}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <>
      <div
        ref={triggerRef}
        onClick={openCalendar}
        className="flex items-center w-full pl-12 pr-4 h-14 bg-slate-800/50 border border-slate-700/50 rounded-2xl text-white cursor-pointer hover:bg-slate-800/80 transition-all select-none overflow-hidden"
      >
        <span className={`truncate text-sm ${value ? 'text-slate-200' : 'text-slate-400'}`}>{displayValue}</span>
      </div>
      {typeof document !== 'undefined' && createPortal(dropdown, document.body)}
    </>
  );
};

export default CalendarPicker;
