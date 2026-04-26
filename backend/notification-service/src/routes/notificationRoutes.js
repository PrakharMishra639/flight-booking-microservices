const express = require('express');
const router = express.Router();
const c = require('../controllers/notificationController');

router.post('/send', c.send);
router.post('/email', c.sendEmail);
router.get('/logs', c.getLogs);

module.exports = router;
