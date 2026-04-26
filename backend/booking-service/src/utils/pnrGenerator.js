const crypto = require('crypto');
const { Booking } = require('../models');

const generatePNR = async () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let pnr;
  let exists = true;
  while (exists) {
    pnr = '';
    for (let i = 0; i < 6; i++) pnr += chars.charAt(Math.floor(Math.random() * chars.length));
    const existing = await Booking.findOne({ where: { pnr } });
    exists = !!existing;
  }
  return pnr;
};

module.exports = generatePNR;
