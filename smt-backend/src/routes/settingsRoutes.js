const express = require('express');
const {
  getCompanyInfo,
  updateCompanyInfo,
  getAccountingSettings,
  updateAccountingSettings,
  getSystemSettings,
  updateSystemSettings,
  resetToDefaults,
  exportSettings,
  importSettings
} = require('../controllers/settingsController');
const { protect, restrictTo } = require('../middleware/auth');
const { validate, settingsValidation } = require('../middleware/validation');
const { uploadConfigs } = require('../middleware/upload');

const router = express.Router();

// Toutes les routes nécessitent une authentification
router.use(protect);

// Routes principales - utiliser getCompanyInfo comme endpoint principal
router.route('/')
  .get(getCompanyInfo)
  .put(restrictTo('admin', 'user'), validate(settingsValidation.company), updateCompanyInfo);

// Informations de l'entreprise
router.route('/company')
  .get(getCompanyInfo)
  .put(restrictTo('admin', 'user'), validate(settingsValidation.company), updateCompanyInfo);

// Paramètres comptables
router.route('/accounting')
  .get(getAccountingSettings)
  .put(restrictTo('admin', 'user'), validate(settingsValidation.accounting), updateAccountingSettings);

// Paramètres système
router.route('/system')
  .get(getSystemSettings)
  .put(restrictTo('admin'), updateSystemSettings);

// Reset et import/export
router.post('/reset', restrictTo('admin'), resetToDefaults);
router.get('/export', restrictTo('admin'), exportSettings);
router.post('/import', restrictTo('admin'), uploadConfigs.documents.single('file'), importSettings);

module.exports = router;