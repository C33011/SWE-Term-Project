const crypto = require('crypto');
const { decryptValue, encryptValue } = require('../../dataCrypto');

function paymentError(message, status = 400) {
  return Object.assign(new Error(message), { status });
}

function normalizeCardNumber(value) {
  return String(value || '').replace(/\D/g, '');
}

function passesLuhnCheck(cardNumber) {
  let sum = 0;
  let doubleDigit = false;

  for (let index = cardNumber.length - 1; index >= 0; index -= 1) {
    let digit = Number(cardNumber[index]);
    if (doubleDigit) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    doubleDigit = !doubleDigit;
  }

  return sum % 10 === 0;
}

function validateExpiry(monthValue, yearValue) {
  const month = Number(monthValue);
  const year = Number(yearValue);
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    throw paymentError('Please enter a valid expiration month.');
  }
  if (!Number.isInteger(year) || year < 2000 || year > 2200) {
    throw paymentError('Please enter a valid expiration year.');
  }

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  if (year < currentYear || (year === currentYear && month < currentMonth)) {
    throw paymentError('The payment card is expired.');
  }

  return { month, year };
}

function makePaymentReference() {
  return `PAY-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
}

class SavedCardPaymentProcessor {
  constructor(client) {
    this.client = client;
  }

  async process({ userId, amountCents, cardId }) {
    const normalizedCardId = Number(cardId);
    if (!Number.isInteger(normalizedCardId) || normalizedCardId <= 0) {
      throw paymentError('Please select a valid saved payment card.');
    }

    const result = await this.client.query(
      `SELECT card_id, card_number, expiration_date
         FROM credit_cards
        WHERE card_id = $1 AND user_id = $2`,
      [normalizedCardId, userId]
    );
    if (result.rows.length === 0) {
      throw paymentError('The selected saved card was not found.', 404);
    }

    const row = result.rows[0];
    const expiry = new Date(row.expiration_date);
    validateExpiry(expiry.getUTCMonth() + 1, expiry.getUTCFullYear());
    const cardNumber = decryptValue(row.card_number);

    return {
      approved: true,
      amountCents,
      paymentReference: makePaymentReference(),
      paymentMethod: 'Saved Card',
      cardLastFour: cardNumber.slice(-4),
      savedCardId: normalizedCardId,
    };
  }
}

class NewCardPaymentProcessor {
  constructor(client) {
    this.client = client;
  }

  async process({ userId, amountCents, paymentDetails }) {
    const cardNumber = normalizeCardNumber(paymentDetails?.cardNumber);
    if (cardNumber.length < 13 || cardNumber.length > 19 || !passesLuhnCheck(cardNumber)) {
      throw paymentError('Please enter a valid card number.');
    }

    const expiry = validateExpiry(paymentDetails?.expiryMonth, paymentDetails?.expiryYear);
    const cvv = String(paymentDetails?.cvv || '').trim();
    if (!/^\d{3,4}$/.test(cvv)) {
      throw paymentError('Please enter a valid CVV.');
    }

    const billingAddress = String(paymentDetails?.billingAddress || '').trim();
    if (!billingAddress) {
      throw paymentError('Billing address is required.');
    }

    let savedCardId = null;
    if (paymentDetails?.saveCard) {
      const countResult = await this.client.query(
        'SELECT COUNT(*)::int AS count FROM credit_cards WHERE user_id = $1',
        [userId]
      );
      if (countResult.rows[0].count >= 3) {
        throw paymentError('You already have the maximum of 3 saved payment cards.', 409);
      }

      const inserted = await this.client.query(
        `INSERT INTO credit_cards
           (user_id, card_number, expiration_date, billing_address)
         VALUES ($1, $2, $3, $4)
         RETURNING card_id`,
        [
          userId,
          encryptValue(cardNumber),
          `${expiry.year}-${String(expiry.month).padStart(2, '0')}-01`,
          encryptValue(billingAddress),
        ]
      );
      savedCardId = inserted.rows[0].card_id;
    }

    // This project uses a deterministic mock gateway, obv CVV never stored (We could, for scamming purposes) (jk)
    return {
      approved: true,
      amountCents,
      paymentReference: makePaymentReference(),
      paymentMethod: 'New Card',
      cardLastFour: cardNumber.slice(-4),
      savedCardId,
    };
  }
}

class PaymentProcessorFactory {
  static create(paymentType, client) {
    if (paymentType === 'saved') return new SavedCardPaymentProcessor(client);
    if (paymentType === 'new') return new NewCardPaymentProcessor(client);
    throw paymentError('Please choose a payment method.');
  }
}

module.exports = { PaymentProcessorFactory };
