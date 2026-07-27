const { Pool } = require('pg');
require('dotenv').config();
const { encryptValue } = require('./dataCrypto');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function main() {
  const userResult = await pool.query(
    `SELECT user_id FROM users WHERE email = 'carduser@test.com' LIMIT 1`
  );
  if (userResult.rows.length === 0) {
    throw new Error('carduser@test.com does not exist. Run seed.sql first.');
  }

  const userId = userResult.rows[0].user_id;
  const countResult = await pool.query(
    'SELECT COUNT(*)::int AS count FROM credit_cards WHERE user_id = $1',
    [userId]
  );

  if (countResult.rows[0].count > 0) {
    console.log('carduser@test.com already has a saved card. Nothing changed.');
    return;
  }

  await pool.query(
    `INSERT INTO credit_cards
       (user_id, card_number, expiration_date, billing_address)
     VALUES ($1, $2, DATE '2030-12-01', $3)`,
    [
      userId,
      encryptValue('4242424242424242'),
      encryptValue('123 Demo Street, Athens, GA 30601'),
    ]
  );

  console.log('Added a masked demo Visa ending in 4242 to carduser@test.com.');
}

main()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
