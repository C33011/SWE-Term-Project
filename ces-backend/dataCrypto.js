const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const VERSION = 'v1';

function getEncryptionKey() {
  const keyHex = process.env.CARD_ENCRYPTION_KEY;
  if (!keyHex || !/^[a-fA-F0-9]{64}$/.test(keyHex)) {
    throw new Error(
      'CARD_ENCRYPTION_KEY must be a 64-character hexadecimal value.'
    );
  }
  return Buffer.from(keyHex, 'hex');
}

function encryptValue(value) {
  if (value === null || value === undefined || value === '') return null;

  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, getEncryptionKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(String(value), 'utf8'),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  return [
    VERSION,
    iv.toString('hex'),
    tag.toString('hex'),
    encrypted.toString('hex'),
  ].join(':');
}

function decryptValue(value) {
  if (!value) return null;

  const parts = String(value).split(':');
  if (parts.length !== 4 || parts[0] !== VERSION) {
    throw new Error('Unsupported encrypted-data format.');
  }

  const [, ivHex, tagHex, encryptedHex] = parts;
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    getEncryptionKey(),
    Buffer.from(ivHex, 'hex')
  );
  decipher.setAuthTag(Buffer.from(tagHex, 'hex'));

  return Buffer.concat([
    decipher.update(Buffer.from(encryptedHex, 'hex')),
    decipher.final(),
  ]).toString('utf8');
}

module.exports = { encryptValue, decryptValue };
