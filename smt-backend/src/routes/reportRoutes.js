const express = require('express');
const {
  getReports,
  generateBalanceSheet,
  generateIncomeStatement,
  generateCashFlowStatement,
  getDashboardStats
} = require('../controllers/reportController');
const { protect, restrictTo } = require('../middleware/auth');
const { validate } = require('../middleware/validation');

const router = express.Router();

// Toutes les routes nécessitent une authentification
router.use(protect);

// Routes principales
router.get('/', getReports);
router.get('/dashboard', getDashboardStats);

// Rapports financiers standards
router.get('/balance-sheet', generateBalanceSheet);
router.get('/income-statement', generateIncomeStatement);
router.get('/cash-flow', generateCashFlowStatement);

module.exports = router;