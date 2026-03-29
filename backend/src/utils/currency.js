/**
 * Currency Exchange Rate Utility
 * Fetches and caches exchange rates with 1-hour TTL.
 * Falls back to last known rates if API is down.
 */
const axios = require('axios');
const NodeCache = require('node-cache');
const env = require('../config/env');
const logger = require('../config/logger');

// Cache with 1 hour TTL
const cache = new NodeCache({ stdTTL: 3600 });

// Fallback storage for when API is down
let fallbackRates = {};

/**
 * Get exchange rates for a base currency
 * @param {string} baseCurrency - e.g. "USD", "INR"
 * @returns {object} rates map e.g. { USD: 1, EUR: 0.85, INR: 83.1 }
 */
async function getRates(baseCurrency) {
  const cacheKey = `rates_${baseCurrency}`;
  const cached = cache.get(cacheKey);

  if (cached) {
    logger.debug(`Using cached exchange rates for ${baseCurrency}`);
    return cached;
  }

  try {
    logger.info(`Fetching exchange rates for ${baseCurrency} from API`);
    const response = await axios.get(
      `${env.EXCHANGE_RATE_API_URL}/${baseCurrency}`,
      { timeout: 10000 }
    );

    const rates = response.data.rates;
    cache.set(cacheKey, rates);

    // Store as fallback
    fallbackRates[baseCurrency] = rates;

    return rates;
  } catch (err) {
    logger.warn(`Exchange rate API failed for ${baseCurrency}, using fallback`, {
      error: err.message,
    });

    // Return fallback if available
    if (fallbackRates[baseCurrency]) {
      return fallbackRates[baseCurrency];
    }

    throw new Error(`Unable to fetch exchange rates for ${baseCurrency} and no fallback available`);
  }
}

/**
 * Convert an amount from one currency to another
 * @param {number} amount - Original amount
 * @param {string} fromCurrency - Source currency code
 * @param {string} toCurrency - Target currency code
 * @returns {{ convertedAmount: number, exchangeRate: number }}
 */
async function convertCurrency(amount, fromCurrency, toCurrency) {
  if (fromCurrency === toCurrency) {
    return { convertedAmount: amount, exchangeRate: 1 };
  }

  const rates = await getRates(fromCurrency);

  if (!rates[toCurrency]) {
    throw new Error(`Exchange rate not found for ${fromCurrency} → ${toCurrency}`);
  }

  const exchangeRate = rates[toCurrency];
  // Use precise decimal arithmetic — parseFloat to avoid floating point drift
  const convertedAmount = parseFloat((amount * exchangeRate).toFixed(4));

  return { convertedAmount, exchangeRate };
}

module.exports = { getRates, convertCurrency };
