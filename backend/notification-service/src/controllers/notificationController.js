const notificationService = require('../services/notificationService');

const send = async (req, res, next) => {
  try { res.json(await notificationService.processNotification(req.body)); }
  catch (e) { next(e); }
};

const sendEmail = async (req, res, next) => {
  try {
    const { to, subject, html } = req.body;
    await notificationService.sendEmail(to, subject, html);
    res.json({ success: true });
  } catch (e) { next(e); }
};

const getLogs = async (req, res, next) => {
  try { res.json(await notificationService.getNotificationLogs(req.query.page, req.query.limit)); }
  catch (e) { next(e); }
};

module.exports = { send, sendEmail, getLogs };
