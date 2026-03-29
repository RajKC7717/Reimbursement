const dotenv = require('dotenv');
const path = require('path');

// Load .env from backend root
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

const env = {
  // Server
  PORT: parseInt(process.env.PORT, 10) || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',

  // Database
  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_PORT: parseInt(process.env.DB_PORT, 10) || 5432,
  DB_NAME: process.env.DB_NAME || 'reimbursement_db',
  DB_USER: process.env.DB_USER || 'postgres',
  DB_PASSWORD: process.env.DB_PASSWORD || 'postgres',

  // JWT
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
  JWT_EXPIRY: process.env.JWT_EXPIRY || '15m',
  JWT_REFRESH_EXPIRY: process.env.JWT_REFRESH_EXPIRY || '7d',

  // File Uploads
  UPLOAD_DIR: process.env.UPLOAD_DIR || 'uploads',

  // External APIs
  EXCHANGE_RATE_API_URL: process.env.EXCHANGE_RATE_API_URL || 'https://api.exchangerate-api.com/v4/latest',
  COUNTRIES_API_URL: process.env.COUNTRIES_API_URL || 'https://restcountries.com/v3.1/all?fields=name,currencies',
};

// Validate required env vars
const required = ['JWT_SECRET', 'JWT_REFRESH_SECRET'];
for (const key of required) {
  if (!env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

module.exports = env;
