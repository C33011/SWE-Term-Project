require('dotenv').config();
const { sendVerificationEmail } = require('./email');
sendVerificationEmail('afrinahmed328@gmail.com', 'test123')
  .then(() => console.log('Email sent! Check your inbox.'))
  .catch((err) => console.error('FAILED:', err.message));