const nodemailer = require('nodemailer');
const PDFDocument = require('pdfkit');
const { NotificationLog } = require('../models');
const axios = require('axios');

const SEAT_SERVICE_URL = process.env.SEAT_SERVICE_URL || 'http://localhost:4004';

let transporter = null;
const initTransporter = () => {
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
    });
  }
};

const sendEmail = async (to, subject, html, attachments = []) => {
  if (!transporter) {
    console.log(`[notification-service] [MOCK EMAIL] To: ${to}, Subject: ${subject}`);
    return;
  }
  await transporter.sendMail({
    from: `"Flight Booking System" <${process.env.SMTP_USER}>`,
    to, subject, html, attachments
  });
};

const generateETicketPDF = (bookingData) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const chunks = [];
    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.fontSize(24).text('✈ E-TICKET', { align: 'center' });
    doc.moveDown();
    doc.fontSize(14).text(`PNR: ${bookingData.pnr}`, { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Passenger: ${bookingData.passengerName || 'Passenger'}`);
    doc.text(`Status: ${bookingData.status}`);
    doc.text(`Total: ₹${bookingData.totalPrice}`);
    doc.text(`Date: ${new Date().toLocaleDateString()}`);
    doc.moveDown();
    doc.fontSize(10).text('Thank you for booking with us!', { align: 'center' });
    doc.end();
  });
};

const generateBoardingPassPDF = (boardingData) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: [400, 250] });
    const chunks = [];
    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.fontSize(16).text('BOARDING PASS', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(12).text(`${boardingData.passengerName}`);
    doc.fontSize(10).text(`Flight: ${boardingData.flightNo}`);
    doc.text(`Seat: ${boardingData.seatNumber}`);
    doc.text(`Gate: ${boardingData.gate || 'TBD'}`);
    doc.text(`PNR: ${boardingData.pnr}`);
    doc.end();
  });
};

const processNotification = async (notificationData) => {
  const { type, bookingId, email, pnr, userId } = notificationData;

  try {
    let subject, html;
    const attachments = [];

    switch (type) {
      case 'booking_confirmation':
        subject = `Booking Confirmed - PNR: ${pnr}`;
        html = `<div style="font-family:Arial;max-width:600px;margin:0 auto;"><h1 style="color:#1e40af">✈ Booking Confirmed</h1><p>Your booking <strong>${pnr}</strong> has been confirmed!</p><p>Thank you for choosing our airline.</p></div>`;
        try {
          const pdfBuffer = await generateETicketPDF({ pnr, status: 'CONFIRMED', totalPrice: 'See details', passengerName: 'Valued Customer' });
          attachments.push({ filename: `eticket_${pnr}.pdf`, content: pdfBuffer, contentType: 'application/pdf' });
        } catch (err) { console.warn('[notification-service] PDF generation failed:', err.message); }
        break;

      case 'booking_cancellation':
        subject = `Booking Cancelled - PNR: ${pnr}`;
        html = `<div style="font-family:Arial;max-width:600px;margin:0 auto;"><h1 style="color:#dc2626">Booking Cancelled</h1><p>Your booking <strong>${pnr}</strong> has been cancelled.</p></div>`;
        break;

      case 'checkin_confirmation':
        subject = `Check-in Complete - PNR: ${pnr}`;
        html = `<div style="font-family:Arial;max-width:600px;margin:0 auto;"><h1 style="color:#059669">✅ Check-in Complete</h1><p>Check-in for booking <strong>${pnr}</strong> is complete. Your boarding pass is attached.</p></div>`;
        break;

      default:
        subject = 'Flight Booking Notification';
        html = `<p>Notification for booking ${pnr || bookingId}</p>`;
    }

    await sendEmail(email, subject, html, attachments);

    await NotificationLog.create({
      user_id: userId, type: 'EMAIL', category: type,
      subject, recipient: email, status: 'SENT', metadata: { bookingId, pnr }
    });

    // Emit real-time notification via seat-service
    if (userId) {
      try {
        await axios.post(`${SEAT_SERVICE_URL}/emit/notification`, {
          userId, notification: { type, message: subject, bookingId, pnr }
        });
      } catch (err) {}
    }

    return { success: true, message: 'Notification sent' };
  } catch (error) {
    await NotificationLog.create({
      user_id: userId, type: 'EMAIL', category: type,
      subject: `Failed: ${type}`, recipient: email,
      status: 'FAILED', error_message: error.message, metadata: { bookingId, pnr }
    });
    throw error;
  }
};

const getNotificationLogs = async (page = 1, limit = 20) => {
  const offset = (page - 1) * limit;
  const { count, rows } = await NotificationLog.findAndCountAll({
    limit, offset, order: [['created_at', 'DESC']]
  });
  return { data: rows, total: count, page, totalPages: Math.ceil(count / limit) };
};

initTransporter();

module.exports = { processNotification, getNotificationLogs, sendEmail, generateETicketPDF, generateBoardingPassPDF };
