const express = require('express');
const {
  getTransactions,
  getTransaction,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getTransactionsByDateRange,
  getTransactionsByAccount,
  getTransactionsByType,
  validateTransaction,
  cancelTransaction,
  duplicateTransaction,
  importTransactions,
  exportTransactions,
  getTransactionSummary,
  getMonthlyReport
} = require('../controllers/transactionController');
const { protect, restrictTo } = require('../middleware/auth');
const { validateTransactionData, validateTransactionUpdate } = require('../middleware/validation');
const { upload } = require('../middleware/upload');

const router = express.Router();

// Toutes les routes nécessitent une authentification
router.use(protect);

// Routes principales
router.route('/')
  .get(getTransactions)
  .post(validateTransactionData, createTransaction);

router.route('/:id')
  .get(getTransaction)
  .put(validateTransactionUpdate, updateTransaction)
  .delete(restrictTo('admin', 'manager'), deleteTransaction);

// Routes spécialisées
router.get('/date-range/:startDate/:endDate', getTransactionsByDateRange);
router.get('/account/:accountId', getTransactionsByAccount);
router.get('/type/:type', getTransactionsByType);
router.get('/summary/monthly', getMonthlyReport);
router.get('/summary/overview', getTransactionSummary);

// Actions sur les transactions
router.post('/:id/validate', 
  restrictTo('admin', 'manager'), 
  validateTransaction
);

router.post('/:id/cancel', 
  restrictTo('admin', 'manager'), 
  cancelTransaction
);

router.post('/:id/duplicate', duplicateTransaction);

// Import/Export
router.post('/import', 
  restrictTo('admin', 'manager'), 
  upload.single('file'), 
  importTransactions
);

router.get('/export', exportTransactions);

module.exports = router;