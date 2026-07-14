const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function sendVerificationEmail(toEmail, token) {
  const link = `${process.env.FRONTEND_URL}/verify/${token}`;
  await transporter.sendMail({
    from: `"Cinema E-Booking" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: 'Verify your CES account',
    html: `
      <h2>Welcome to Cinema E-Booking!</h2>
      <p>Click the link below to verify your account:</p>
      <a href="${link}">${link}</a>
      <p>If you didn't create this account, ignore this email.</p>
    `,
  });
}

async function sendPasswordResetEmail(toEmail, token) {
  const link = `${process.env.FRONTEND_URL}/reset-password/${token}`;
  await transporter.sendMail({
    from: `"Cinema E-Booking" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: 'Reset your CES password',
    html: `
      <h2>Password Reset Request</h2>
      <p>Click the link below to set a new password (valid for 1 hour):</p>
      <a href="${link}">${link}</a>
      <p>If you didn't request this, ignore this email.</p>
    `,
  });
}

module.exports = { sendVerificationEmail, sendPasswordResetEmail };