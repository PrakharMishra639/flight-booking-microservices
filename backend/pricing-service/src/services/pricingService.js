const CLASS_MULTIPLIERS = {
  ECONOMY: 1.0,
  BUSINESS: 2.5,
  FIRST: 4.0
};

const BOOKING_FEE_RATE = 0.05; // 5% of adjusted base fare
const SEAT_SELECTION_FEE_RATE = 0.10; // 10% of base fare

/**
 * Calculate fare for a single passenger on a single leg.
 */
const calculatePassengerFare = (baseFare, seatClass, seatPrice = 0) => {
  const multiplier = CLASS_MULTIPLIERS[seatClass] || 1.0;
  const adjustedBaseFare = baseFare * multiplier;
  const bookingFee = adjustedBaseFare * BOOKING_FEE_RATE;
  const seatFee = parseFloat(seatPrice);
  const totalPerPassenger = adjustedBaseFare + bookingFee + seatFee;

  return {
    baseFare,
    classMultiplier: multiplier,
    adjustedBaseFare: Math.round(adjustedBaseFare * 100) / 100,
    bookingFee: Math.round(bookingFee * 100) / 100,
    seatFee: Math.round(seatFee * 100) / 100,
    total: Math.round(totalPerPassenger * 100) / 100
  };
};

/**
 * Calculate total fare for a full booking (multiple legs, multiple passengers).
 */
const calculateBookingFare = (legs) => {
  let totalPrice = 0;
  const breakdown = [];

  for (const leg of legs) {
    const legBreakdown = {
      scheduleId: leg.scheduleId,
      baseFare: leg.baseFare,
      passengers: []
    };

    for (const pax of leg.passengers) {
      const fare = calculatePassengerFare(leg.baseFare, pax.seatClass, pax.seatPrice);
      totalPrice += fare.total;
      legBreakdown.passengers.push({
        name: pax.name,
        ...fare
      });
    }

    breakdown.push(legBreakdown);
  }

  return {
    totalPrice: Math.round(totalPrice * 100) / 100,
    breakdown
  };
};

/**
 * Calculate price difference when changing seats.
 */
const calculateSeatChangeDiff = (baseFare, oldClass, newClass, oldSeatPrice, newSeatPrice) => {
  const oldMultiplier = CLASS_MULTIPLIERS[oldClass] || 1.0;
  const newMultiplier = CLASS_MULTIPLIERS[newClass] || 1.0;

  const oldTotal = (baseFare * oldMultiplier) + parseFloat(oldSeatPrice || 0);
  const newTotal = (baseFare * newMultiplier) + parseFloat(newSeatPrice || 0);

  let diff = newTotal - oldTotal;
  if (diff < 0) diff = 0; // No refund for downgrade

  return {
    oldTotal: Math.round(oldTotal * 100) / 100,
    newTotal: Math.round(newTotal * 100) / 100,
    difference: Math.round(diff * 100) / 100,
    requiresPayment: diff > 0
  };
};

/**
 * Get class multiplier.
 */
const getClassMultiplier = (seatClass) => {
  return CLASS_MULTIPLIERS[seatClass?.toUpperCase()] || 1.0;
};

/**
 * Calculate seat selection fee.
 */
const calculateSeatSelectionFee = (basePrice, isMiddleSeat) => {
  if (isMiddleSeat) return 0;
  return Math.round(basePrice * SEAT_SELECTION_FEE_RATE);
};

module.exports = {
  calculatePassengerFare,
  calculateBookingFare,
  calculateSeatChangeDiff,
  getClassMultiplier,
  calculateSeatSelectionFee,
  CLASS_MULTIPLIERS,
  BOOKING_FEE_RATE,
  SEAT_SELECTION_FEE_RATE
};
