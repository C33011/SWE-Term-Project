const { Pool } = require("pg");
//load env file
require("dotenv").config();

//connection pool to PostgreSQL database  with environment variables
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});


//testing connection
//export at end of file
pool.connect((err) => {
  if (err) {
    console.error("Failed to connect to PostgreSQL:", err.message);
  } else {
    console.log("Connected to PostgreSQL database.");
  }
});


module.exports = pool;