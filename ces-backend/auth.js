const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendProfileUpdateEmail,
} = require('./email');
const { authenticate } = require('./middleware');
const { encryptValue, decryptValue } = require('./dataCrypto');

function validateNewPassword(password) {
  if (!password || password.length < 8) {
    return 'Password must be at least 8 characters.';
  }
  if (!/[a-z]/.test(password)) return 'Password must contain a lowercase letter.';
  if (!/[A-Z]/.test(password)) return 'Password must contain an uppercase letter.';
  if (!/\d/.test(password)) return 'Password must contain a number.';
  if (!/[^A-Za-z0-9]/.test(password)) {
    return 'Password must contain a special character.';
  }
  return null;
}

async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

module.exports = function createAuthRoutes(pool) {
  const router = express.Router();

  router.post('/register', async (req, res) => {
    const { firstName, lastName, email, phone, password, subscribeToPromotions } = req.body;

    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({
        error: 'First name, last name, email, and password are required.',
      });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }
    const passwordError = validateNewPassword(password);
    if (passwordError) return res.status(400).json({ error: passwordError });

    try {
      const existing = await pool.query(
        'SELECT user_id FROM users WHERE email = $1',
        [email]
      );
      if (existing.rows.length > 0) {
        return res.status(409).json({
          error: 'An account with this email already exists.',
        });
      }

      const passwordHash = await hashPassword(password);
      const verifyToken = crypto.randomBytes(32).toString('hex');
      await pool.query(
        `INSERT INTO users
           (email, password_hash, first_name, last_name, phone_number,
            role, status, promotional_emails, email_confirmation_token)
         VALUES ($1, $2, $3, $4, $5, 'customer', 'Inactive', $6, $7)`,
        [
          email,
          passwordHash,
          firstName,
          lastName,
          phone || null,
          subscribeToPromotions === true,
          verifyToken,
        ]
      );

      await sendVerificationEmail(email, verifyToken);
      res.status(201).json({
        message: 'Account created! Please check your email to verify your account before logging in.',
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ error: 'Registration failed. Please try again.' });
    }
  });

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
        return res.status(400).json({
          error: 'Invalid or already-used verification link.',
        });
      }
      res.json({ message: 'Account verified! You can now log in.' });
    } catch (error) {
      console.error('Verification error:', error);
      res.status(500).json({ error: 'Verification failed.' });
    }
  });

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
      if (!(await bcrypt.compare(password, user.password_hash))) {
        return res.status(401).json({ error: 'Invalid email or password.' });
      }
      if (user.status !== 'Active') {
        return res.status(403).json({
          error: user.status === 'Suspended'
            ? 'This account has been suspended.'
            : 'Account is not verified. Please check your email to verify your account.',
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
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Login failed. Please try again.' });
    }
  });

  router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;
    const genericMessage = {
      message: 'If that email is registered, a reset link has been sent.',
    };

    try {
      const result = await pool.query('SELECT user_id FROM users WHERE email = $1', [email]);
      if (result.rows.length === 0) return res.json(genericMessage);

      const rawToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
      await pool.query(
        `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
         VALUES ($1, $2, CURRENT_TIMESTAMP + INTERVAL '1 hour')`,
        [result.rows[0].user_id, tokenHash]
      );
      await sendPasswordResetEmail(email, rawToken);
      res.json(genericMessage);
    } catch (error) {
      console.error('Forgot-password error:', error);
      res.status(500).json({ error: 'Could not process request.' });
    }
  });

  router.post('/reset-password', async (req, res) => {
    const { token, newPassword } = req.body;
    const passwordError = validateNewPassword(newPassword);
    if (passwordError) return res.status(400).json({ error: passwordError });

    try {
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      const result = await pool.query(
        `SELECT token_id, user_id
           FROM password_reset_tokens
          WHERE token_hash = $1
            AND expires_at > CURRENT_TIMESTAMP
            AND used_at IS NULL`,
        [tokenHash]
      );
      if (result.rows.length === 0) {
        return res.status(400).json({ error: 'Reset link is invalid or has expired.' });
      }

      const passwordHash = await hashPassword(newPassword);
      await pool.query(
        `UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP
          WHERE user_id = $2`,
        [passwordHash, result.rows[0].user_id]
      );
      await pool.query(
        'UPDATE password_reset_tokens SET used_at = CURRENT_TIMESTAMP WHERE token_id = $1',
        [result.rows[0].token_id]
      );
      res.json({ message: 'Password updated! You can now log in with your new password.' });
    } catch (error) {
      console.error('Reset-password error:', error);
      res.status(500).json({ error: 'Could not reset password.' });
    }
  });

  router.put('/change-password', authenticate, async (req, res) => {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ error: 'All password fields are required.' });
    }
    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        error: 'New password and confirmation do not match.',
      });
    }
    const passwordError = validateNewPassword(newPassword);
    if (passwordError) return res.status(400).json({ error: passwordError });

    try {
      const result = await pool.query(
        'SELECT password_hash FROM users WHERE user_id = $1',
        [req.user.userId]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'User not found.' });
      }
      if (!(await bcrypt.compare(currentPassword, result.rows[0].password_hash))) {
        return res.status(401).json({ error: 'Current password is incorrect.' });
      }
      if (await bcrypt.compare(newPassword, result.rows[0].password_hash)) {
        return res.status(400).json({
          error: 'New password must be different from the current password.',
        });
      }

      await pool.query(
        `UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP
          WHERE user_id = $2`,
        [await hashPassword(newPassword), req.user.userId]
      );
      res.json({ message: 'Password changed successfully!' });
    } catch (error) {
      console.error('Change-password error:', error);
      res.status(500).json({ error: 'Could not change password.' });
    }
  });

  router.get('/profile', authenticate, async (req, res) => {
    try {
      const result = await pool.query(
        `SELECT first_name, last_name, email, phone_number,
                promotional_emails, mailing_address
           FROM users WHERE user_id = $1`,
        [req.user.userId]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'User not found.' });
      }

      const user = result.rows[0];
      let address = '';
      if (user.mailing_address) {
        try {
          address = decryptValue(user.mailing_address) || '';
        } catch (error) {
          console.error('Legacy address could not be decrypted:', error.message);
        }
      }

      res.json({
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        phone: user.phone_number || '',
        subscribe_to_promotions: user.promotional_emails,
        address,
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
      res.status(500).json({ error: 'Server error.' });
    }
  });

  router.put('/profile', authenticate, async (req, res) => {
    const { firstName, lastName, phone, subscribeToPromotions, address } = req.body;

    if (!firstName || !String(firstName).trim()) {
      return res.status(400).json({ error: 'First name is required.' });
    }
    if (!lastName || !String(lastName).trim()) {
      return res.status(400).json({ error: 'Last name is required.' });
    }
    if (phone && !/^[0-9()+\-\s]{7,20}$/.test(String(phone))) {
      return res.status(400).json({ error: 'Please enter a valid phone number.' });
    }

    try {
      const result = await pool.query(
        `UPDATE users
            SET first_name = $1,
                last_name = $2,
                phone_number = $3,
                promotional_emails = $4,
                mailing_address = $5,
                updated_at = CURRENT_TIMESTAMP
          WHERE user_id = $6
          RETURNING email`,
        [
          String(firstName).trim(),
          String(lastName).trim(),
          phone && String(phone).trim() ? String(phone).trim() : null,
          subscribeToPromotions === true,
          address && String(address).trim()
            ? encryptValue(String(address).trim())
            : null,
          req.user.userId,
        ]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'User not found.' });
      }

      let notificationSent = true;
      try {
        await sendProfileUpdateEmail(result.rows[0].email);
      } catch (emailError) {
        notificationSent = false;
        console.error('Profile notification email error:', emailError);
      }

      res.json({
        message: notificationSent
          ? 'Profile updated successfully! A notification email was sent.'
          : 'Profile updated successfully, but the notification email could not be sent.',
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      res.status(500).json({ error: 'Could not update profile.' });
    }
  });

  return router;
};
