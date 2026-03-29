/**
 * Country Seeder
 * Fetches country and currency data from REST Countries API
 * and seeds the countries table. Only runs if table is empty.
 */
const axios = require('axios');
const { query } = require('../config/db');
const env = require('../config/env');
const logger = require('../config/logger');

async function seedCountries() {
  try {
    // Check if countries already seeded
    const { rows } = await query('SELECT COUNT(*) as count FROM countries');
    const count = parseInt(rows[0].count, 10);

    if (count > 0) {
      logger.info(`Countries table already has ${count} records, skipping seed`);
      return;
    }

    logger.info('Seeding countries from REST Countries API...');
    const response = await axios.get(env.COUNTRIES_API_URL, { timeout: 15000 });
    const countries = response.data;

    let inserted = 0;

    for (const country of countries) {
      const countryName = country.name?.common;
      if (!countryName || !country.currencies) continue;

      // A country can have multiple currencies; insert one row per currency
      const currencyEntries = Object.entries(country.currencies);
      for (const [code, info] of currencyEntries) {
        await query(
          `INSERT INTO countries (name, currency_code, currency_name, currency_symbol)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT DO NOTHING`,
          [countryName, code, info.name || '', info.symbol || '']
        );
        inserted++;
      }
    }

    logger.info(`Seeded ${inserted} country-currency records`);
  } catch (err) {
    // Non-fatal: if API is down, the app can still start
    logger.warn('Failed to seed countries from API, will retry on next restart', {
      error: err.message,
    });
  }
}

module.exports = { seedCountries };
