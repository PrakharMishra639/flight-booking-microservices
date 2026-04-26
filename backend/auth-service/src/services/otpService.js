const Otp = require('../models/Otp');
const nodemailer = require('nodemailer');
const { Op } = require('sequelize');

let emailTransporter = null;

const initTransporter = () => {
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    emailTransporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
    });
  }
};

const generateOtpCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const sendOtpEmail = async (email, otpCode, purpose) => {
  if (!emailTransporter) {
    console.log(`[OTP MOCK] Email: ${email}, Code: ${otpCode}, Purpose: ${purpose}`);
    return;
  }
  const subjects = {
    registration: 'Verify Your Email - Flight Booking System',
    login: 'Login OTP - Flight Booking System',
    password_reset: 'Password Reset OTP - Flight Booking System'
  };
  await emailTransporter.sendMail({
    from: `"Flight Booking System" <${process.env.SMTP_USER}>`,
    to: email,
    subject: subjects[purpose] || 'OTP Verification',
    html: `<div><h1>Flight Booking System</h1><p>Your OTP is: <strong>${otpCode}</strong></p><p>Valid for 10 minutes.</p></div>`
  });
};

const createAndSendOtp = async (email, purpose) => {
  // Invalidate old OTPs
  await Otp.update({ is_used: true }, { where: { email, purpose, is_used: false } });

  const otpCode = generateOtpCode();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await Otp.create({ email, otp_code: otpCode, purpose, expires_at: expiresAt });
  await sendOtpEmail(email, otpCode, purpose);

  return { success: true, message: 'OTP sent successfully' };
};

const sendRegistrationOtp = async (email) => createAndSendOtp(email, 'registration');
const sendLoginOtp = async (email) => createAndSendOtp(email, 'login');
const sendPasswordResetOtp = async (email) => createAndSendOtp(email, 'password_reset');

const verifyOtp = async (email, otpCode) => {
  const otp = await Otp.findOne({
    where: {
      email,
      otp_code: otpCode,
      is_used: false,
      expires_at: { [Op.gt]: new Date() }
    },
    order: [['created_at', 'DESC']]
  });

  if (!otp) return { valid: false };

  await otp.update({ is_used: true });
  return { valid: true };
};

initTransporter();

module.exports = {
  sendRegistrationOtp,
  sendLoginOtp,
  sendPasswordResetOtp,
  verifyOtp,
  createAndSendOtp
};
