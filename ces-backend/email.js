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

const sendProfileUpdateEmail = async (email) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Your Cinema E-Booking Profile Was Updated',
    text: 'Hello! This is a confirmation that your profile information was recently updated. If you did not make these changes, please contact our support team immediately.',
    html: '<p>Hello!</p><p>This is a confirmation that your profile information was recently updated. If you did not make these changes, please contact our support team immediately.</p>'
  };

  try {
    await transporter.sendMail(mailOptions); // Make sure 'transporter' matches whatever variable you use in this file!
    console.log(`Profile update email sent to ${email}`);
  } catch (error) {
    console.error('Error sending profile update email:', error);
  }
};

async function sendPromotionEmail(toEmail, promo) {
  await transporter.sendMail({
    from: `"Cinema E-Booking" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: `New CES promo: ${promo.promo_code}`,
    html: `
      <h2>A new promotion is available!</h2>
      <p>Use code <strong>${promo.promo_code}</strong> for
      <strong>${promo.discount_percentage}% off</strong>.</p>
      <p>Valid until ${promo.valid_until}.</p>
    `,
  });
}

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendProfileUpdateEmail,
  sendPromotionEmail,
};