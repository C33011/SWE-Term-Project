const express = require('express');
const { authenticate, requireCustomer } = require('./middleware');
const { encryptValue, decryptValue } = require('./dataCrypto');

function normalizeCardNumber(value) {
  return String(value || '').replace(/\D/g, '');
}

function passesLuhnCheck(cardNumber) {
  let sum = 0;
  let doubleDigit = false;

  for (let i = cardNumber.length - 1; i >= 0; i -= 1) {
    let digit = Number(cardNumber[i]);
    if (doubleDigit) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    doubleDigit = !doubleDigit;
  }

  return sum % 10 === 0;
}

function validateCardNumber(value) {
  const cardNumber = normalizeCardNumber(value);
  if (
    cardNumber.length < 13 ||
    cardNumber.length > 19 ||
    !passesLuhnCheck(cardNumber)
  ) {
    return { error: 'Please enter a valid card number.' };
  }
  return { cardNumber };
}

function validateExpiry(monthValue, yearValue) {
  const month = Number(monthValue);
  const year = Number(yearValue);

  if (!Number.isInteger(month) || month < 1 || month > 12) {
    return { error: 'Please enter a valid expiration month.' };
  }
  if (!Number.isInteger(year) || year < 2000 || year > 2200) {
    return { error: 'Please enter a valid expiration year.' };
  }

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  if (year < currentYear || (year === currentYear && month < currentMonth)) {
    return { error: 'The payment card is expired.' };
  }

  return {
    month,
    year,
    date: `${year}-${String(month).padStart(2, '0')}-01`,
  };
}

function mapCard(row) {
  const number = decryptValue(row.card_number);
  const expiry = new Date(row.expiration_date);
  return {
    cardId: row.card_id,
    lastFour: number.slice(-4),
    expiryMonth: expiry.getUTCMonth() + 1,
    expiryYear: expiry.getUTCFullYear(),
    billingAddress: decryptValue(row.billing_address) || '',
  };
}

module.exports = function createCardRoutes(pool) {
  const router = express.Router();
  router.use(authenticate, requireCustomer);

  router.get('/', async (req, res) => {
    try {
      const result = await pool.query(
        `SELECT card_id, card_number, expiration_date,
                billing_address, created_at
           FROM credit_cards
          WHERE user_id = $1
          ORDER BY created_at ASC`,
        [req.user.userId]
      );
      res.json({
        cards: result.rows.map(mapCard),
        cardCount: result.rows.length,
        maximumCards: 3,
      });
    } catch (error) {
      console.error('Get cards error:', error);
      res.status(500).json({ error: 'Could not retrieve payment cards.' });
    }
  });

  router.post('/', async (req, res) => {
    const { cardNumber, expiryMonth, expiryYear, billingAddress } = req.body;
    const numberCheck = validateCardNumber(cardNumber);
    if (numberCheck.error) return res.status(400).json({ error: numberCheck.error });

    const expiryCheck = validateExpiry(expiryMonth, expiryYear);
    if (expiryCheck.error) return res.status(400).json({ error: expiryCheck.error });

    if (!billingAddress || !String(billingAddress).trim()) {
      return res.status(400).json({ error: 'Billing address is required.' });
    }

    try {
      const count = await pool.query(
        'SELECT COUNT(*)::int AS count FROM credit_cards WHERE user_id = $1',
        [req.user.userId]
      );
      if (count.rows[0].count >= 3) {
        return res.status(409).json({
          error: 'You may store a maximum of 3 payment cards.',
        });
      }

      const result = await pool.query(
        `INSERT INTO credit_cards
           (user_id, card_number, expiration_date, billing_address)
         VALUES ($1, $2, $3, $4)
         RETURNING card_id, card_number, expiration_date,
                   billing_address, created_at`,
        [
          req.user.userId,
          encryptValue(numberCheck.cardNumber),
          expiryCheck.date,
          encryptValue(String(billingAddress).trim()),
        ]
      );

      res.status(201).json({
        message: 'Payment card added successfully.',
        card: mapCard(result.rows[0]),
      });
    } catch (error) {
      console.error('Add card error:', error);
      if (String(error.message).includes('at most 3 credit cards')) {
        return res.status(409).json({
          error: 'You may store a maximum of 3 payment cards.',
        });
      }
      res.status(500).json({ error: 'Could not add payment card.' });
    }
  });

  router.put('/:cardId', async (req, res) => {
    const cardId = Number(req.params.cardId);
    const { cardNumber, expiryMonth, expiryYear, billingAddress } = req.body;

    if (!Number.isInteger(cardId) || cardId <= 0) {
      return res.status(400).json({ error: 'Invalid payment-card ID.' });
    }

    const expiryCheck = validateExpiry(expiryMonth, expiryYear);
    if (expiryCheck.error) return res.status(400).json({ error: expiryCheck.error });
    if (!billingAddress || !String(billingAddress).trim()) {
      return res.status(400).json({ error: 'Billing address is required.' });
    }

    try {
      const existing = await pool.query(
        `SELECT card_number FROM credit_cards
          WHERE card_id = $1 AND user_id = $2`,
        [cardId, req.user.userId]
      );
      if (existing.rows.length === 0) {
        return res.status(404).json({ error: 'Payment card not found.' });
      }

      let encryptedNumber = existing.rows[0].card_number;
      if (String(cardNumber || '').trim()) {
        const numberCheck = validateCardNumber(cardNumber);
        if (numberCheck.error) {
          return res.status(400).json({ error: numberCheck.error });
        }
        encryptedNumber = encryptValue(numberCheck.cardNumber);
      }

      const result = await pool.query(
        `UPDATE credit_cards
            SET card_number = $1,
                expiration_date = $2,
                billing_address = $3
          WHERE card_id = $4 AND user_id = $5
          RETURNING card_id, card_number, expiration_date,
                    billing_address, created_at`,
        [
          encryptedNumber,
          expiryCheck.date,
          encryptValue(String(billingAddress).trim()),
          cardId,
          req.user.userId,
        ]
      );

      res.json({
        message: 'Payment card updated successfully.',
        card: mapCard(result.rows[0]),
      });
    } catch (error) {
      console.error('Update card error:', error);
      res.status(500).json({ error: 'Could not update payment card.' });
    }
  });

  router.delete('/:cardId', async (req, res) => {
    const cardId = Number(req.params.cardId);
    if (!Number.isInteger(cardId) || cardId <= 0) {
      return res.status(400).json({ error: 'Invalid payment-card ID.' });
    }

    try {
      const result = await pool.query(
        `DELETE FROM credit_cards
          WHERE card_id = $1 AND user_id = $2
          RETURNING card_id`,
        [cardId, req.user.userId]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Payment card not found.' });
      }
      res.json({ message: 'Payment card deleted successfully.' });
    } catch (error) {
      console.error('Delete card error:', error);
      res.status(500).json({ error: 'Could not delete payment card.' });
    }
  });

  return router;
};
