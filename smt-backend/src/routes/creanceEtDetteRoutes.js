const express = require('express');
const {
  getCreancesEtDettes,
  getCreanceEtDette,
  createCreanceEtDette,
  updateCreanceEtDette,
  deleteCreanceEtDette,
  addPayment,
  getPaymentHistory,
  getOverdueItems
} = require('../controllers/creanceEtDetteController');
const { protect, restrictTo } = require('../middleware/auth');
const { validate, creanceDetteValidation } = require('../middleware/validation');

const router = express.Router();

// Toutes les routes nécessitent une authentification
router.use(protect);

// Routes principales
router.route('/')
  .get(getCreancesEtDettes)
  .post(validate(creanceDetteValidation.create), createCreanceEtDette);

router.route('/:id')
  .get(getCreanceEtDette)
  .put(validate(creanceDetteValidation.update), updateCreanceEtDette)
  .delete(restrictTo('admin', 'user'), deleteCreanceEtDette);

// Routes pour les paiements
router.post('/:id/payments', addPayment);
router.get('/:id/payments', getPaymentHistory);
router.get('/overdue', getOverdueItems);

module.exports = router;