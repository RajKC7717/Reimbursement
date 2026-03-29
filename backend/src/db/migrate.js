/**
 * Database Migration Runner
 * Reads SQL files from the migrations directory and executes them in order.
 * Tracks applied migrations in the schema_migrations table.
 */
const fs = require('fs');
const path = require('path');
const { pool } = require('../config/db');
const logger = require('../config/logger');
// Note: these paths are correct — src/db/../config = src/config

const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

async function runMigrations() {
  const client = await pool.connect();

  try {
    // Get all .sql files sorted by filename
    const files = fs.readdirSync(MIGRATIONS_DIR)
      .filter(f => f.endsWith('.sql'))
      .sort();

    if (files.length === 0) {
      logger.info('No migration files found');
      return;
    }

    // Run the setup migration first (creates schema_migrations table)
    const setupFile = files.find(f => f.startsWith('000_'));
    if (setupFile) {
      const setupSQL = fs.readFileSync(path.join(MIGRATIONS_DIR, setupFile), 'utf8');
      await client.query(setupSQL);
      logger.info(`Executed setup migration: ${setupFile}`);
    }

    // Check which migrations have already been applied
    const { rows: applied } = await client.query(
      'SELECT filename FROM schema_migrations'
    );
    const appliedSet = new Set(applied.map(r => r.filename));

    // Run each migration that hasn't been applied yet
    for (const file of files) {
      if (file.startsWith('000_')) continue; // already ran setup
      if (appliedSet.has(file)) {
        logger.debug(`Skipping already applied migration: ${file}`);
        continue;
      }

      const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');

      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query(
          'INSERT INTO schema_migrations (filename) VALUES ($1)',
          [file]
        );
        await client.query('COMMIT');
        logger.info(`Applied migration: ${file}`);
      } catch (err) {
        await client.query('ROLLBACK');
        logger.error(`Migration failed: ${file}`, { error: err.message });
        throw err;
      }
    }

    logger.info('All migrations completed successfully');
  } finally {
    client.release();
  }
}

// Run directly if called as script
if (require.main === module) {
  runMigrations()
    .then(() => {
      logger.info('Migration script finished');
      process.exit(0);
    })
    .catch((err) => {
      logger.error('Migration script failed', { error: err.message });
      process.exit(1);
    });
}

module.exports = { runMigrations };
