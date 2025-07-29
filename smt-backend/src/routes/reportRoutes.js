const express = require('express');
const {
  getReports,
  generateBalanceSheet,
  generateIncomeStatement,
  generateCashFlowStatement,
  generateTrialBalance,
  generateGeneralLedger,
  generateAccountStatement,
  generateTaxReport,
  generateBudgetReport,
  generateAgeingReport,
  generateStockReport,
  generateCustomReport,
  getReportHistory,
  downloadReport,
  scheduleReport,
  getScheduledReports
} = require('../controllers/reportController');
const { protect, restrictTo } = require('../middleware/auth');
const { validateReportRequest, validateCustomReport } = require('../middleware/validation');

const router = express.Router();

// Toutes les routes nécessitent une authentification
router.use(protect);

// Routes principales
router.get('/', getReports);
router.get('/history', getReportHistory);

// Rapports financiers standards
router.post('/balance-sheet', validateReportRequest, generateBalanceSheet);
router.post('/income-statement', validateReportRequest, generateIncomeStatement);
router.post('/cash-flow', validateReportRequest, generateCashFlowStatement);
router.post('/trial-balance', validateReportRequest, generateTrialBalance);
router.post('/general-ledger', validateReportRequest, generateGeneralLedger);
router.post('/account-statement', validateReportRequest, generateAccountStatement);

// Rapports spécialisés
router.post('/tax-report', validateReportRequest, generateTaxReport);
router.post('/budget-report', validateReportRequest, generateBudgetReport);
router.post('/ageing-report', validateReportRequest, generateAgeingReport);
router.post('/stock-report', validateReportRequest, generateStockReport);

// Rapports personnalisés
router.post('/custom', 
  restrictTo('admin', 'manager'), 
  validateCustomReport, 
  generateCustomReport
);

// Téléchargement de rapports
router.get('/:id/download', downloadReport);

// Planification de rapports (admin/manager)
router.post('/schedule', 
  restrictTo('admin', 'manager'), 
  scheduleReport
);

router.get('/scheduled', 
  restrictTo('admin', 'manager'), 
  getScheduledReports
);

module.exports = router;