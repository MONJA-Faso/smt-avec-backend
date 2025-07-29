const express = require('express');
const {
  getSettings,
  updateSettings,
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
const { validateSettings, validateCompanyInfo, validateAccountingSettings } = require('../middleware/validation');
const { upload } = require('../middleware/upload');

const router = express.Router();

// Toutes les routes nécessitent une authentification
router.use(protect);

// Routes principales
router.route('/')
  .get(getSettings)
  .put(restrictTo('admin', 'manager'), validateSettings, updateSettings);

// Informations de l'entreprise
router.route('/company')
  .get(getCompanyInfo)
  .put(restrictTo('admin', 'manager'), validateCompanyInfo, updateCompanyInfo);

// Paramètres comptables
router.route('/accounting')
  .get(getAccountingSettings)
  .put(restrictTo('admin', 'manager'), validateAccountingSettings, updateAccountingSettings);

// Paramètres système (admin seulement)
router.route('/system')
  .get(restrictTo('admin'), getSystemSettings)
  .put(restrictTo('admin'), updateSystemSettings);

// Actions spéciales (admin seulement)
router.post('/reset', restrictTo('admin'), resetToDefaults);

// Import/Export (admin seulement)
router.post('/import', 
  restrictTo('admin'), 
  upload.single('file'), 
  importSettings
);

router.get('/export', restrictTo('admin'), exportSettings);

module.exports = router;