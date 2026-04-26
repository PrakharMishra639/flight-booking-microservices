import { useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setSearchParams } from '../../redux/slices/flightSlice';
import { formatCurrency } from '../../utils/helpers';
import { motion } from 'framer-motion';

const DateStrip = () => {
  const dispatch = useDispatch();
  const { searchParams, availablePrices, returnPrices, searchPhase } = useSelector((state) => state.flight);
  const scrollRef = useRef(null);

  // Generate 15 days from currently selected date (7 before, 1 today, 7 after)
  const dates = [];
  const baseDate = searchPhase === 'outward' ? searchParams.date : searchParams.returnDate;
  const start = new Date(baseDate || new Date());
  
  for (let i = -7; i <= 7; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    const dateKey = d.toISOString().split('T')[0];
    dates.push({
      date: d,
      dateKey,
      dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
      dayNum: d.getDate(),
      month: d.toLocaleDateString('en-US', { month: 'short' })
    });
  }

  const handleSelectDate = (dateKey) => {
    const field = searchPhase === 'outward' ? 'date' : 'returnDate';
    dispatch(setSearchParams({ [field]: dateKey }));
  };

  // Scroll active date into view
  useEffect(() => {
    if (scrollRef.current) {
      const activeElement = scrollRef.current.querySelector('.active-date');
      if (activeElement) {
        activeElement.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [searchParams.date, searchParams.returnDate, searchPhase]);

  return (
    <div className="w-full bg-white rounded-3xl border border-slate-100 p-2 shadow-sm overflow-hidden mb-6">
      <div 
        ref={scrollRef}
        className="flex items-center gap-2 overflow-x-auto no-scrollbar py-2 px-1 scroll-smooth"
      >
        {dates.map(({ dateKey, dayName, dayNum, month, date }) => {
          const activeDate = searchPhase === 'outward' ? searchParams.date : searchParams.returnDate;
          const isActive = activeDate === dateKey;
          const currentPrices = searchPhase === 'outward' ? availablePrices : returnPrices;
          const price = currentPrices[dateKey];
          const isPast = date < new Date(new Date().setHours(0,0,0,0));

          return (
            <button
              key={dateKey}
              onClick={() => !isPast && handleSelectDate(dateKey)}
              disabled={isPast}
              className={`
                flex-shrink-0 min-w-[80px] h-20 rounded-2xl flex flex-col items-center justify-center transition-all border
                ${isActive ? 'active-date bg-slate-900 border-slate-900 shadow-xl' : 'bg-slate-50 border-transparent hover:border-slate-200'}
                ${isPast ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              <span className={`text-[10px] uppercase font-bold tracking-widest ${isActive ? 'text-slate-400' : 'text-slate-500'}`}>
                {dayName}
              </span>
              <span className={`text-lg font-black leading-tight ${isActive ? 'text-white' : 'text-slate-900'}`}>
                {dayNum} {month}
              </span>
              {price ? (
                <span className={`text-[10px] font-bold mt-1 ${isActive ? 'text-primary' : 'text-emerald-500'}`}>
                  {formatCurrency(price).replace('.00', '')}
                </span>
              ) : (
                <div className="h-[14px]"></div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default DateStrip;
