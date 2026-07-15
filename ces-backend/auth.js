const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendVerificationEmail, sendPasswordResetEmail, sendProfileUpdateEmail } = require('./email');
const { authenticate } = require('./middleware');

// ============ CRYPTOGRAPHY SETUP ============
// This uses AES-256-CBC to securely encrypt and decrypt credit card and address information.
const ALGORITHM = 'aes-256-cbc';
// Crucial: This key must be EXACTLY 32 characters long.
// If not defined in your environment (.env file), it defaults to a fallback key.
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'your-32-character-safe-secret-key'; 
const IV_LENGTH = 16; 

// Reversible encryption function
function encrypt(text) {
  if (!text) return null;
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

// Reversible decryption function
function decrypt(text) {
  if (!text) return null;
  try {
    const textParts = text.split(':');
    const iv = Buffer.from(textParts.shift(), 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  } catch (err) {
    console.error("Decryption failed. The value might be unencrypted text or corrupted:", err);
    return text; // Return the raw text if decryption fails to avoid breaking existing unencrypted profiles
  }
}

module.exports = function (pool) {
  const router = express.Router();

  // ============ 1. REGISTRATION ============
  router.post('/register', async (req, res) => {
    const { firstName, lastName, email, phone, password, subscribeToPromotions } = req.body;

    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ error: 'First name, last name, email, and password are required.' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters.' });
    }

    try {
      const existing = await pool.query('SELECT user_id FROM users WHERE email = $1', [email]);
      if (existing.rows.length > 0) {
        return res.status(409).json({ error: 'An account with this email already exists.' });
      }

      const passwordHash = await bcrypt.hash(password, 10); 
      const verifyToken = crypto.randomBytes(32).toString('hex');

      await pool.query(
        `INSERT INTO users
           (email, password_hash, first_name, last_name, phone, role, status,
            subscribe_to_promotions, email_confirmation_token)
         VALUES ($1, $2, $3, $4, $5, 'customer', 'Inactive', $6, $7)`,
        [email, passwordHash, firstName, lastName, phone || null,
         subscribeToPromotions === true, verifyToken]
      );

      await sendVerificationEmail(email, verifyToken);

      res.status(201).json({
        message: 'Account created! Please check your email to verify your account before logging in.',
      });
    } catch (err) {
      console.error('Registration error:', err);
      res.status(500).json({ error: 'Registration failed. Please try again.' });
    }
  });

  // ============ 2. EMAIL VERIFICATION ============
  router.post('/verify/:token', async (req, res) => {
    try {
      const result = await pool.query(
        `UPDATE users
            SET status = 'Active',
                email_confirmed_at = CURRENT_TIMESTAMP,
                email_confirmation_token = NULL,
                updated_at = CURRENT_TIMESTAMP
          WHERE email_confirmation_token = $1
          RETURNING user_id`,
        [req.params.token]
      );
      if (result.rows.length === 0) {
        return res.status(400).json({ error: 'Invalid or already-used verification link.' });
      }
      res.json({ message: 'Account verified! You can now log in.' });
    } catch (err) {
      console.error('Verification error:', err);
      res.status(500).json({ error: 'Verification failed.' });
    }
  });

  // ============ 3. LOGIN ============
  router.post('/login', async (req, res) => {
    const { email, password, rememberMe } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    try {
      const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

      if (result.rows.length === 0) {
        return res.status(401).json({ error: 'Invalid email or password.' });
      }
      const user = result.rows[0];

      const passwordOk = await bcrypt.compare(password, user.password_hash);
      if (!passwordOk) {
        return res.status(401).json({ error: 'Invalid email or password.' });
      }

      if (user.status !== 'Active') {
        return res.status(403).json({
          error: 'Account is not verified. Please check your email to verify your account.',
        });
      }

      const token = jwt.sign(
        { userId: user.user_id, role: user.role, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: rememberMe ? '30d' : '1d' }
      );

      res.json({
        token,
        user: {
          userId: user.user_id,
          firstName: user.first_name,
          email: user.email,
          role: user.role,
        },
      });
    } catch (err) {
      console.error('Login error:', err);
      res.status(500).json({ error: 'Login failed. Please try again.' });
    }
  });

  // ============ 4a. FORGOT PASSWORD ============
  router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;
    try {
      const result = await pool.query('SELECT user_id FROM users WHERE email = $1', [email]);

      const genericMsg = { message: 'If that email is registered, a reset link has been sent.' };
      if (result.rows.length === 0) return res.json(genericMsg);

      const userId = result.rows[0].user_id;
      const rawToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

      await pool.query(
        `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
         VALUES ($1, $2, CURRENT_TIMESTAMP + INTERVAL '1 hour')`,
        [userId, tokenHash]
      );

      await sendPasswordResetEmail(email, rawToken);
      res.json(genericMsg);
    } catch (err) {
      console.error('Forgot-password error:', err);
      res.status(500).json({ error: 'Could not process request.' });
    }
  });

  // ============ 4b. RESET PASSWORD ============
  router.post('/reset-password', async (req, res) => {
    const { token, newPassword } = req.body;
    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters.' });
    }
    try {
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      const result = await pool.query(
        `SELECT token_id, user_id FROM password_reset_tokens
          WHERE token_hash = $1
            AND expires_at > CURRENT_TIMESTAMP
            AND used_at IS NULL`,
        [tokenHash]
      );
      if (result.rows.length === 0) {
        return res.status(400).json({ error: 'Reset link is invalid or has expired.' });
      }

      const { token_id, user_id } = result.rows[0];
      const passwordHash = await bcrypt.hash(newPassword, 10);

      await pool.query(
        `UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2`,
        [passwordHash, user_id]
      );
      await pool.query(
        `UPDATE password_reset_tokens SET used_at = CURRENT_TIMESTAMP WHERE token_id = $1`,
        [token_id]
      );

      res.json({ message: 'Password updated! You can now log in with your new password.' });
    } catch (err) {
      console.error('Reset-password error:', err);
      res.status(500).json({ error: 'Could not reset password.' });
    }
  });

  // ============ 5. GET PROFILE (WITH DECRYPTION) ============
  router.get('/profile', authenticate, async (req, res) => {
    const userId = req.user.userId; 

    try {
      const result = await pool.query(
        `SELECT first_name, last_name, email, phone, subscribe_to_promotions,
                address, card1_num, card1_expiry, card2_num, card2_expiry, card3_num, card3_expiry 
         FROM users WHERE user_id = $1`,
        [userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      const user = result.rows[0];

      // Send the regular info normally, but run the decrypted fields through decrypt()
      res.json({
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        phone: user.phone,
        subscribe_to_promotions: user.subscribe_to_promotions,
        address: decrypt(user.address),
        card1_num: decrypt(user.card1_num),
        card1_expiry: decrypt(user.card1_expiry),
        card2_num: decrypt(user.card2_num),
        card2_expiry: decrypt(user.card2_expiry),
        card3_num: decrypt(user.card3_num),
        card3_expiry: decrypt(user.card3_expiry)
      });
    } catch (err) {
      console.error('Error fetching profile:', err);
      res.status(500).json({ error: 'Server error' });
    }
  });

  // ============ 6. EDIT PROFILE (WITH ENCRYPTION) ============
  router.put('/profile', authenticate, async (req, res) => {
    const { 
      firstName, lastName, phone, subscribeToPromotions, address,
      card1Num, card1Expiry, card2Num, card2Expiry, card3Num, card3Expiry
    } = req.body;
    const userId = req.user.userId;
    const email = req.user.email; 

    if (!firstName || !lastName) {
      return res.status(400).json({ error: 'First and last name are required.' });
    }

    try {
      // Encrypt sensitive fields before saving to SQL
      const encryptedAddress = encrypt(address);
      const encCard1Num = encrypt(card1Num);
      const encCard1Exp = encrypt(card1Expiry);
      const encCard2Num = encrypt(card2Num);
      const encCard2Exp = encrypt(card2Expiry);
      const encCard3Num = encrypt(card3Num);
      const encCard3Exp = encrypt(card3Expiry);

      await pool.query(
        `UPDATE users 
         SET first_name = $1, 
             last_name = $2, 
             phone = $3,
             subscribe_to_promotions = $4,
             address = $5,
             card1_num = $6, card1_expiry = $7,
             card2_num = $8, card2_expiry = $9,
             card3_num = $10, card3_expiry = $11,
             updated_at = CURRENT_TIMESTAMP 
         WHERE user_id = $12`,
        [
          firstName, lastName, phone || null, subscribeToPromotions === true, encryptedAddress,
          encCard1Num, encCard1Exp, 
          encCard2Num, encCard2Exp, 
          encCard3Num, encCard3Exp,
          userId
        ]
      );
      
      // Trigger the email notification
      await sendProfileUpdateEmail(email);
      
      res.json({ message: 'Profile updated successfully!' });
    } catch (err) {
      console.error('Error updating profile:', err);
      res.status(500).json({ error: 'Could not update profile' });
    }
  });

  return router;
};