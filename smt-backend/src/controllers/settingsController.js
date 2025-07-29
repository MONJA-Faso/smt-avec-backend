const { Settings } = require('../models');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

// @desc    Obtenir tous les paramètres
// @route   GET /api/settings
// @access  Private
const getSettings = asyncHandler(async (req, res) => {
  let settings = await Settings.findOne();
  
  if (!settings) {
    // Créer les paramètres par défaut
    settings = await Settings.create({});
  }

  res.json({
    success: true,
    data: { settings }
  });
});

// @desc    Mettre à jour les paramètres
// @route   PUT /api/settings
// @access  Private (Admin/Manager)
const updateSettings = asyncHandler(async (req, res) => {
  let settings = await Settings.findOne();
  
  if (!settings) {
    settings = await Settings.create(req.body);
  } else {
    settings = await Settings.findOneAndUpdate(
      {},
      { ...req.body, updatedBy: req.user.id },
      { new: true, runValidators: true }
    );
  }

  res.json({
    success: true,
    message: 'Paramètres mis à jour avec succès',
    data: { settings }
  });
});

// @desc    Obtenir les informations de l'entreprise
// @route   GET /api/settings/company
// @access  Private
const getCompanyInfo = asyncHandler(async (req, res) => {
  let settings = await Settings.findOne();
  
  if (!settings) {
    settings = await Settings.create({});
  }

  res.json({
    success: true,
    data: { company: settings.company }
  });
});

// @desc    Mettre à jour les informations de l'entreprise
// @route   PUT /api/settings/company
// @access  Private (Admin/Manager)
const updateCompanyInfo = asyncHandler(async (req, res) => {
  let settings = await Settings.findOne();
  
  if (!settings) {
    settings = await Settings.create({
      company: req.body,
      updatedBy: req.user.id
    });
  } else {
    settings.company = { ...settings.company, ...req.body };
    settings.updatedBy = req.user.id;
    await settings.save();
  }

  res.json({
    success: true,
    message: 'Informations de l\'entreprise mises à jour avec succès',
    data: { company: settings.company }
  });
});

// @desc    Obtenir les paramètres comptables
// @route   GET /api/settings/accounting
// @access  Private
const getAccountingSettings = asyncHandler(async (req, res) => {
  let settings = await Settings.findOne();
  
  if (!settings) {
    settings = await Settings.create({});
  }

  res.json({
    success: true,
    data: { accounting: settings.accounting }
  });
});

// @desc    Mettre à jour les paramètres comptables
// @route   PUT /api/settings/accounting
// @access  Private (Admin/Manager)
const updateAccountingSettings = asyncHandler(async (req, res) => {
  let settings = await Settings.findOne();
  
  if (!settings) {
    settings = await Settings.create({
      accounting: req.body,
      updatedBy: req.user.id
    });
  } else {
    settings.accounting = { ...settings.accounting, ...req.body };
    settings.updatedBy = req.user.id;
    await settings.save();
  }

  res.json({
    success: true,
    message: 'Paramètres comptables mis à jour avec succès',
    data: { accounting: settings.accounting }
  });
});

// @desc    Obtenir les paramètres système
// @route   GET /api/settings/system
// @access  Private (Admin)
const getSystemSettings = asyncHandler(async (req, res) => {
  let settings = await Settings.findOne();
  
  if (!settings) {
    settings = await Settings.create({});
  }

  res.json({
    success: true,
    data: { system: settings.system }
  });
});

// @desc    Mettre à jour les paramètres système
// @route   PUT /api/settings/system
// @access  Private (Admin)
const updateSystemSettings = asyncHandler(async (req, res) => {
  let settings = await Settings.findOne();
  
  if (!settings) {
    settings = await Settings.create({
      system: req.body,
      updatedBy: req.user.id
    });
  } else {
    settings.system = { ...settings.system, ...req.body };
    settings.updatedBy = req.user.id;
    await settings.save();
  }

  res.json({
    success: true,
    message: 'Paramètres système mis à jour avec succès',
    data: { system: settings.system }
  });
});

// @desc    Réinitialiser aux paramètres par défaut
// @route   POST /api/settings/reset
// @access  Private (Admin)
const resetToDefaults = asyncHandler(async (req, res) => {
  await Settings.deleteMany({});
  const settings = await Settings.create({ updatedBy: req.user.id });

  res.json({
    success: true,
    message: 'Paramètres réinitialisés aux valeurs par défaut',
    data: { settings }
  });
});

// @desc    Exporter les paramètres
// @route   GET /api/settings/export
// @access  Private (Admin)
const exportSettings = asyncHandler(async (req, res) => {
  const settings = await Settings.findOne();
  
  if (!settings) {
    throw new AppError('Aucun paramètre trouvé', 404);
  }

  res.json({
    success: true,
    data: { settings }
  });
});

// @desc    Importer les paramètres
// @route   POST /api/settings/import
// @access  Private (Admin)
const importSettings = asyncHandler(async (req, res) => {
  const { settings: importedSettings } = req.body;
  
  if (!importedSettings) {
    throw new AppError('Données de paramètres manquantes', 400);
  }

  const settings = await Settings.findOneAndUpdate(
    {},
    { ...importedSettings, updatedBy: req.user.id },
    { new: true, upsert: true, runValidators: true }
  );

  res.json({
    success: true,
    message: 'Paramètres importés avec succès',
    data: { settings }
  });
});

module.exports = {
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
};