const express = require('express');
const router = express.Router();
const pricingController = require('../controllers/pricingController');

router.post('/calculate', pricingController.calculate);
router.get('/class-multiplier/:seatClass', pricingController.getClassMultiplier);
router.post('/seat-change-diff', pricingController.seatChangeDiff);
router.post('/passenger-fare', pricingController.calculatePassengerFare);

module.exports = router;
