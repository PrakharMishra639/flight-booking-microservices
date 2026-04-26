const pricingService = require('../services/pricingService');

const calculate = (req, res) => {
  try {
    const { legs } = req.body;
    if (!legs || !Array.isArray(legs)) {
      return res.status(400).json({ error: 'legs array is required' });
    }
    const result = pricingService.calculateBookingFare(legs);
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getClassMultiplier = (req, res) => {
  const { seatClass } = req.params;
  const multiplier = pricingService.getClassMultiplier(seatClass);
  res.json({ success: true, seatClass: seatClass.toUpperCase(), multiplier });
};

const seatChangeDiff = (req, res) => {
  try {
    const { baseFare, oldClass, newClass, oldSeatPrice, newSeatPrice } = req.body;
    if (!baseFare || !oldClass || !newClass) {
      return res.status(400).json({ error: 'baseFare, oldClass, newClass are required' });
    }
    const result = pricingService.calculateSeatChangeDiff(baseFare, oldClass, newClass, oldSeatPrice, newSeatPrice);
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const calculatePassengerFare = (req, res) => {
  try {
    const { baseFare, seatClass, seatPrice } = req.body;
    if (!baseFare || !seatClass) {
      return res.status(400).json({ error: 'baseFare and seatClass are required' });
    }
    const result = pricingService.calculatePassengerFare(parseFloat(baseFare), seatClass, seatPrice || 0);
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { calculate, getClassMultiplier, seatChangeDiff, calculatePassengerFare };
