/**
 * Server Entry Point
 * Starts the Express server, runs migrations, seeds countries.
 */
const app = require('./src/app');
const env = require('./src/config/env');
const logger = require('./src/config/logger');
const { testConnection } = require('./src/config/db');
const { runMigrations } = require('./src/db/migrate');
const { seedCountries } = require('./src/db/seeds/seedCountries');

async function startServer() {
  try {
    // 1. Test database connection
    await testConnection();

    // 2. Run migrations
    await runMigrations();

    // 3. Seed countries (only if table is empty)
    await seedCountries();

    // 4. Start HTTP server
    app.listen(env.PORT, () => {
      logger.info(`🚀 Server running on http://localhost:${env.PORT}`);
      logger.info(`📋 Environment: ${env.NODE_ENV}`);
      logger.info(`🗄️  Database: ${env.DB_HOST}:${env.DB_PORT}/${env.DB_NAME}`);
    });
  } catch (err) {
    logger.error('Failed to start server', { error: err.message, stack: err.stack });
    process.exit(1);
  }
}

// Handle uncaught errors
process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Rejection', { error: reason });
});

process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception', { error: err.message, stack: err.stack });
  process.exit(1);
});

startServer();
