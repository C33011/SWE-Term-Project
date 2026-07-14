const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendVerificationEmail, sendPasswordResetEmail } = require('./email');

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

      const passwordHash = await bcrypt.hash(password, 10); // SECURITY: never store plaintext
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

      // TC2 exact message from the demo instructions:
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

  return router;
};