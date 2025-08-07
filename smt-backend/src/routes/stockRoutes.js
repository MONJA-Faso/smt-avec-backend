const express = require('express');
const {
  getStocks,
  getStock,
  createStock,
  updateStock,
  deleteStock,
  updateStockQuantity,
  getStockMovements,
  addStockMovement
} = require('../controllers/stockController');
const { protect, restrictTo } = require('../middleware/auth');
const { validate, stockValidation } = require('../middleware/validation');
const { upload } = require('../middleware/upload');

const router = express.Router();

// Toutes les routes nécessitent une authentification
router.use(protect);

// Routes principales
router.route('/')
  .get(getStocks)
  .post(validate(stockValidation.create), createStock);

router.route('/:id')
  .get(getStock)
  .put(validate(stockValidation.update), updateStock)
  .delete(restrictTo('admin', 'user'), deleteStock);

// Routes spécialisées
router.put('/:id/quantity', updateStockQuantity);
router.get('/:id/movements', getStockMovements);
router.post('/:id/movements', addStockMovement);

module.exports = router;