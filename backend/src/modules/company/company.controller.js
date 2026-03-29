/**
 * Company Controller
 */
const companyService = require('./company.service');
const { success, paginated } = require('../../utils/apiResponse');

async function getCompany(req, res, next) {
  try {
    const data = await companyService.getCompany(req.user.company_id);
    return success(res, data, 'Company retrieved');
  } catch (err) { next(err); }
}

async function updateCompany(req, res, next) {
  try {
    const data = await companyService.updateCompany(req.user.company_id, req.body, req.user.id);
    return success(res, data, 'Company updated');
  } catch (err) { next(err); }
}

async function listCountries(req, res, next) {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit, 10) || 250, 500);
    const { countries, total } = await companyService.listCountries({ page, limit });
    return paginated(res, countries, total, page, limit, 'Countries retrieved');
  } catch (err) { next(err); }
}

async function getExchangeRates(req, res, next) {
  try {
    const baseCurrency = req.query.base || 'USD';
    const rates = await companyService.getExchangeRates(baseCurrency);
    return success(res, { base: baseCurrency, rates }, 'Exchange rates retrieved');
  } catch (err) { next(err); }
}

module.exports = { getCompany, updateCompany, listCountries, getExchangeRates };
