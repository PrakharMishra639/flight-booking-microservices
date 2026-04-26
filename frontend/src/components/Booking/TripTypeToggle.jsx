import { motion } from 'framer-motion';

const TripTypeToggle = ({ value, onChange }) => {
  return (
    <div className="flex p-1 bg-slate-800/30 backdrop-blur-sm rounded-xl w-fit border border-slate-700/30">
      <div className="relative flex">
        {/* Animated Background */}
        <motion.div
          initial={false}
          animate={{ x: value === 'one-way' ? 0 : '100%' }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className="absolute h-full w-1/2 bg-white/10 rounded-lg shadow-sm"
        />
        
        <button
          onClick={() => onChange('one-way')}
          className={`relative z-10 px-6 py-2 text-xs font-bold uppercase tracking-widest transition-colors duration-200 ${
            value === 'one-way' ? 'text-white' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          One Way
        </button>
        
        <button
          onClick={() => onChange('round-trip')}
          className={`relative z-10 px-6 py-2 text-xs font-bold uppercase tracking-widest transition-colors duration-200 ${
            value === 'round-trip' ? 'text-white' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Round Trip
        </button>
      </div>
    </div>
  );
};

export default TripTypeToggle;
