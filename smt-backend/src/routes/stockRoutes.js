const express = require('express');
const {
  getStocks,
  getStock,
  createStock,
  updateStock,
  deleteStock,
  updateStockQuantity,
  getStockMovements,
  addStockMovement,
  getStocksByCategory,
  getLowStockItems,
  getStockValuation,
  exportStocks,
  importStocks,
  generateStockReport
} = require('../controllers/stockController');
const { protect, restrictTo } = require('../middleware/auth');
const { validateStock, validateStockUpdate, validateStockMovement } = require('../middleware/validation');
const { upload } = require('../middleware/upload');

const router = express.Router();

// Toutes les routes nécessitent une authentification
router.use(protect);

// Routes principales
router.route('/')
  .get(getStocks)
  .post(validateStock, createStock);

router.route('/:id')
  .get(getStock)
  .put(validateStockUpdate, updateStock)
  .delete(restrictTo('admin', 'manager'), deleteStock);

// Gestion des mouvements de stock
router.get('/:id/movements', getStockMovements);
router.post('/:id/movements', validateStockMovement, addStockMovement);
router.put('/:id/quantity', updateStockQuantity);

// Routes spécialisées
router.get('/category/:category', getStocksByCategory);
router.get('/alerts/low-stock', getLowStockItems);
router.get('/valuation/total', getStockValuation);
router.get('/reports/complete', generateStockReport);

// Import/Export
router.post('/import', 
  restrictTo('admin', 'manager'), 
  upload.single('file'), 
  importStocks
);

router.get('/export', exportStocks);

module.exports = router;