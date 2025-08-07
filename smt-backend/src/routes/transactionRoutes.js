const express = require('express');
const {
  getTransactions,
  getTransaction,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getTransactionStats,
  getTransactionsByCategory,
  duplicateTransaction,
  exportTransactions
} = require('../controllers/transactionController');
const { protect, restrictTo } = require('../middleware/auth');
const { validate, transactionValidation } = require('../middleware/validation');
const { upload } = require('../middleware/upload');

const router = express.Router();

// Toutes les routes nécessitent une authentification
router.use(protect);

// Routes principales
router.route('/')
  .get(getTransactions)
  .post(validate(transactionValidation.create), createTransaction);

router.route('/:id')
  .get(getTransaction)
  .put(validate(transactionValidation.update), updateTransaction)
  .delete(restrictTo('admin', 'user'), deleteTransaction);

// Routes spécialisées
router.get('/stats', getTransactionStats);
router.get('/category/:category', getTransactionsByCategory);
router.post('/:id/duplicate', duplicateTransaction);
router.get('/export', exportTransactions);

module.exports = router;