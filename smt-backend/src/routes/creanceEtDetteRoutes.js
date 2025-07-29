const express = require('express');
const {
  getCreancesEtDettes,
  getCreanceEtDette,
  createCreanceEtDette,
  updateCreanceEtDette,
  deleteCreanceEtDette,
  addPayment,
  getPaymentHistory,
  getOverdueItems,
  getCreancesByClient,
  getDettesByFournisseur,
  calculateInterests,
  sendReminder,
  exportCreancesEtDettes,
  getAgeingReport
} = require('../controllers/creanceEtDetteController');
const { protect, restrictTo } = require('../middleware/auth');
const { validateCreanceEtDette, validateCreanceEtDetteUpdate, validatePayment } = require('../middleware/validation');

const router = express.Router();

// Toutes les routes nécessitent une authentification
router.use(protect);

// Routes principales
router.route('/')
  .get(getCreancesEtDettes)
  .post(validateCreanceEtDette, createCreanceEtDette);

router.route('/:id')
  .get(getCreanceEtDette)
  .put(validateCreanceEtDetteUpdate, updateCreanceEtDette)
  .delete(restrictTo('admin', 'manager'), deleteCreanceEtDette);

// Gestion des paiements
router.post('/:id/payments', validatePayment, addPayment);
router.get('/:id/payments', getPaymentHistory);

// Routes spécialisées
router.get('/overdue/list', getOverdueItems);
router.get('/client/:clientId', getCreancesByClient);
router.get('/fournisseur/:fournisseurId', getDettesByFournisseur);
router.get('/reports/ageing', getAgeingReport);

// Actions
router.post('/:id/calculate-interests', calculateInterests);
router.post('/:id/send-reminder', 
  restrictTo('admin', 'manager'), 
  sendReminder
);

// Export
router.get('/export', exportCreancesEtDettes);

module.exports = router;