import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CheckCircle, XCircle } from 'lucide-react';

const Alert = ({ message, type = 'info', onDismiss }) => {
  if (!message) return null;

  const typeConfig = {
    error: {
      icon: <XCircle className="w-5 h-5 text-red-500" />,
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-800'
    },
    success: {
      icon: <CheckCircle className="w-5 h-5 text-emerald-500" />,
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      text: 'text-emerald-800'
    },
    info: {
      icon: <AlertCircle className="w-5 h-5 text-blue-500" />,
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-800'
    }
  };

  const config = typeConfig[type];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className={`flex items-center p-4 mb-4 border rounded-xl ${config.bg} ${config.border}`}
      >
        <div className="flex-shrink-0">{config.icon}</div>
        <div className={`ml-3 mr-auto text-sm font-medium ${config.text}`}>
          {message}
        </div>
        {onDismiss && (
          <button onClick={onDismiss} className={`ml-3 ${config.text} hover:opacity-70 transition-opacity`}>
            <XCircle className="w-4 h-4" />
          </button>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default Alert;
