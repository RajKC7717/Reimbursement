/**
 * Express Application Setup
 * Registers all middleware and routes.
 */
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const rateLimit = require('express-rate-limit');

const errorHandler = require('./middleware/errorHandler');
const logger = require('./config/logger');

// Import routes
const authRoutes = require('./modules/auth/auth.routes');
const userRoutes = require('./modules/users/users.routes');
const companyRoutes = require('./modules/company/company.routes');
const categoryRoutes = require('./modules/categories/categories.routes');
const expenseRoutes = require('./modules/expenses/expenses.routes');
const ruleRoutes = require('./modules/rules/rules.routes');
const ocrRoutes = require('./modules/ocr/ocr.routes');
const dashboardRoutes = require('./modules/dashboard/dashboard.routes');
const auditRoutes = require('./modules/audit/audit.routes');

// Additional route handlers for countries and currencies
const authenticate = require('./middleware/authenticate');
const companyController = require('./modules/company/company.controller');

const app = express();

// ─── Security Headers ───────────────────────────────────────────
app.use(helmet());

// ─── CORS ────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? process.env.FRONTEND_URL
    : ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'],
  credentials: true,
}));

// ─── Body Parsing ────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── HTTP Request Logging ────────────────────────────────────────
const morganStream = { write: (message) => logger.info(message.trim()) };
app.use(morgan('short', { stream: morganStream }));

// ─── Static Files (uploaded receipts) ────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// ─── Rate Limiting (auth routes only) ────────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,                   // 20 requests per window
  message: {
    success: false,
    message: 'Too many requests, please try again later',
    errors: [],
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// ─── Routes ──────────────────────────────────────────────────────
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/company', companyRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/rules', ruleRoutes);
app.use('/api/expenses/ocr', ocrRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/audit-logs', auditRoutes);

// Countries (PUBLIC — needed by signup page before auth)
app.get('/api/countries', companyController.listCountries);
// Currencies (authenticated)
app.get('/api/currencies/rates', authenticate, companyController.getExchangeRates);

// ─── Health Check ────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Server is running', timestamp: new Date().toISOString() });
});

// ─── 404 Handler ─────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.path} not found`,
    errors: [],
  });
});

// ─── Global Error Handler (MUST be last) ─────────────────────────
app.use(errorHandler);

module.exports = app;
