const { Pool } = require('pg');
const env = require('./env');
const logger = require('./logger');

const pool = new Pool({
  host: env.DB_HOST,
  port: env.DB_PORT,
  database: env.DB_NAME,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  max: 20,              // max connections in pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

// Log pool errors
pool.on('error', (err) => {
  logger.error('Unexpected PostgreSQL pool error', { error: err.message });
});

/**
 * Execute a SQL query with parameterized values.
 * @param {string} text - SQL query string with $1, $2, ... placeholders
 * @param {Array} params - Parameter values
 * @returns {Promise<import('pg').QueryResult>}
 */
const query = async (text, params) => {
  const start = Date.now();
  const result = await pool.query(text, params);
  const duration = Date.now() - start;

  if (env.NODE_ENV === 'development') {
    logger.debug('Executed query', {
      text: text.substring(0, 100),
      duration: `${duration}ms`,
      rows: result.rowCount,
    });
  }

  return result;
};

/**
 * Get a client from the pool for transactions.
 * IMPORTANT: Always release the client in a finally block.
 */
const getClient = async () => {
  const client = await pool.connect();
  return client;
};

/**
 * Test database connection
 */
const testConnection = async () => {
  try {
    const result = await pool.query('SELECT NOW()');
    logger.info(`PostgreSQL connected: ${result.rows[0].now}`);
    return true;
  } catch (err) {
    logger.error('PostgreSQL connection failed', { error: err.message });
    throw err;
  }
};

module.exports = {
  pool,
  query,
  getClient,
  testConnection,
};
