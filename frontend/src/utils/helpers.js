export const formatCurrency = (amount, currency = 'INR') => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0, // Common for INR in many apps, but I'll keep default if user didn't specify. Actually decimals are fine.
  }).format(amount);
};

export const formatDuration = (minutes) => {
  if (!minutes) return '0h 0m';
  const hours = Math.floor(minutes / 60);
  const mins = Math.floor(minutes % 60);
  return `${hours}h ${mins}m`;
};

export const formatDate = (dateString, options = {}) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const defaultOptions = { 
    weekday: 'short', 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  };
  return new Intl.DateTimeFormat('en-US', { ...defaultOptions, ...options }).format(date);
};

export const formatTime = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

export const generateSeatMatrix = (seats) => {
  // Groups seats by row for easier rendering
  const rows = {};
  seats.forEach(seat => {
    const rowNum = seat.Seat?.row_number || seat.row_number;
    if (!rows[rowNum]) rows[rowNum] = [];
    rows[rowNum].push(seat);
  });
  
  // Sort rows and columns within rows
  return Object.keys(rows)
    .sort((a,b) => a - b)
    .map(key => {
      return rows[key].sort((a,b) => {
        const colA = a.Seat?.column_letter || a.column_letter;
        const colB = b.Seat?.column_letter || b.column_letter;
        return colA.localeCompare(colB);
      });
    });
};
