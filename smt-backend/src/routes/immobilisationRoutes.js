const express = require('express');
const {
  getImmobilisations,
  getImmobilisation,
  createImmobilisation,
  updateImmobilisation,
  deleteImmobilisation,
  calculateAmortissement,
  getAmortissementPlan,
  updateAmortissement,
  getImmobilisationsByCategory,
  exportImmobilisations,
  importImmobilisations
} = require('../controllers/immobilisationController');
const { protect, restrictTo } = require('../middleware/auth');
const { validateImmobilisation, validateImmobilisationUpdate } = require('../middleware/validation');
const { upload } = require('../middleware/upload');

const router = express.Router();

// Toutes les routes nécessitent une authentification
router.use(protect);

// Routes principales
router.route('/')
  .get(getImmobilisations)
  .post(validateImmobilisation, createImmobilisation);

router.route('/:id')
  .get(getImmobilisation)
  .put(validateImmobilisationUpdate, updateImmobilisation)
  .delete(restrictTo('admin', 'manager'), deleteImmobilisation);

// Routes spécialisées pour l'amortissement
router.get('/:id/amortissement', getAmortissementPlan);
router.put('/:id/amortissement', updateAmortissement);
router.post('/:id/calculate-amortissement', calculateAmortissement);

// Routes par catégorie
router.get('/category/:category', getImmobilisationsByCategory);

// Import/Export
router.post('/import', 
  restrictTo('admin', 'manager'), 
  upload.single('file'), 
  importImmobilisations
);

router.get('/export', exportImmobilisations);

module.exports = router;