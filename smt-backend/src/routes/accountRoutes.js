const express = require('express');
const router = express.Router();

// Import des contrôleurs
const {
  getAccounts,
  getAccount,
  createAccount,
  updateAccount,
  deleteAccount,
  getBalanceByType,
  getTreasuryBalance,
  getBalanceHistory,
  reconcileAccount,
  getAccountStats,
  transferBetweenAccounts
} = require('../controllers/accountController');

// Import des middlewares
const { authenticate, authorize } = require('../middleware/auth');
const { validate, accountValidation, validateObjectId } = require('../middleware/validation');

// Toutes les routes nécessitent une authentification
router.use(authenticate);

// Routes publiques pour tous les utilisateurs authentifiés
router.get('/', getAccounts);
router.get('/balance/by-type', getBalanceByType);
router.get('/treasury', getTreasuryBalance);
router.get('/stats', getAccountStats);
router.get('/:id', validateObjectId(), getAccount);
router.get('/:id/balance-history', validateObjectId(), getBalanceHistory);

// Route pour les virements (accessible à tous les utilisateurs authentifiés)
router.post('/transfer', transferBetweenAccounts);

// Routes nécessitant des privilèges admin
router.post('/', authorize('admin'), validate(accountValidation.create), createAccount);
router.put('/:id', authorize('admin'), validateObjectId(), validate(accountValidation.update), updateAccount);
router.delete('/:id', authorize('admin'), validateObjectId(), deleteAccount);
router.post('/:id/reconcile', authorize('admin'), validateObjectId(), reconcileAccount);

module.exports = router;