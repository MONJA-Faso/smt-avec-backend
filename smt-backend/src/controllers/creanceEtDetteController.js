const { CreanceEtDette } = require('../models');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

// @desc    Obtenir toutes les créances et dettes
// @route   GET /api/creances-dettes
// @access  Private
const getCreancesEtDettes = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, type, statut, search } = req.query;
  
  const query = {};
  
  if (type) query.type = type;
  if (statut) query.statut = statut;
  if (search) {
    query.$or = [
      { numeroFacture: { $regex: search, $options: 'i' } },
      { tiers: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];
  }

  const items = await CreanceEtDette.find(query)
    .sort({ dateEcheance: 1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await CreanceEtDette.countDocuments(query);

  res.json({
    success: true,
    data: {
      items,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
});

// @desc    Obtenir une créance/dette par ID
// @route   GET /api/creances-dettes/:id
// @access  Private
const getCreanceEtDette = asyncHandler(async (req, res) => {
  const item = await CreanceEtDette.findById(req.params.id);
  
  if (!item) {
    throw new AppError('Créance/Dette non trouvée', 404);
  }

  res.json({
    success: true,
    data: { item }
  });
});

// @desc    Créer une nouvelle créance/dette
// @route   POST /api/creances-dettes
// @access  Private
const createCreanceEtDette = asyncHandler(async (req, res) => {
  const itemData = { ...req.body, createdBy: req.user.id };
  
  const item = await CreanceEtDette.create(itemData);

  res.status(201).json({
    success: true,
    message: 'Créance/Dette créée avec succès',
    data: { item }
  });
});

// @desc    Mettre à jour une créance/dette
// @route   PUT /api/creances-dettes/:id
// @access  Private
const updateCreanceEtDette = asyncHandler(async (req, res) => {
  const item = await CreanceEtDette.findById(req.params.id);
  
  if (!item) {
    throw new AppError('Créance/Dette non trouvée', 404);
  }

  const updatedItem = await CreanceEtDette.findByIdAndUpdate(
    req.params.id,
    { ...req.body, updatedBy: req.user.id },
    { new: true, runValidators: true }
  );

  res.json({
    success: true,
    message: 'Créance/Dette mise à jour avec succès',
    data: { item: updatedItem }
  });
});

// @desc    Supprimer une créance/dette
// @route   DELETE /api/creances-dettes/:id
// @access  Private (Admin/Manager)
const deleteCreanceEtDette = asyncHandler(async (req, res) => {
  const item = await CreanceEtDette.findById(req.params.id);
  
  if (!item) {
    throw new AppError('Créance/Dette non trouvée', 404);
  }

  await CreanceEtDette.findByIdAndDelete(req.params.id);

  res.json({
    success: true,
    message: 'Créance/Dette supprimée avec succès'
  });
});

// @desc    Ajouter un paiement
// @route   POST /api/creances-dettes/:id/payments
// @access  Private
const addPayment = asyncHandler(async (req, res) => {
  const { montant, datePaiement, modePaiement, reference, notes } = req.body;
  
  const item = await CreanceEtDette.findById(req.params.id);
  
  if (!item) {
    throw new AppError('Créance/Dette non trouvée', 404);
  }

  if (montant <= 0) {
    throw new AppError('Le montant doit être positif', 400);
  }

  if (item.montantPaye + montant > item.montantTotal) {
    throw new AppError('Le montant du paiement dépasse le montant restant', 400);
  }

  const paiement = {
    montant,
    datePaiement: datePaiement || new Date(),
    modePaiement: modePaiement || 'especes',
    reference,
    notes,
    saisiePar: req.user.id
  };

  item.paiements.push(paiement);
  item.montantPaye += montant;

  // Mettre à jour le statut
  if (item.montantPaye >= item.montantTotal) {
    item.statut = 'soldee';
    item.dateSolde = new Date();
  } else if (item.montantPaye > 0) {
    item.statut = 'partielle';
  }

  item.updatedBy = req.user.id;
  await item.save();

  res.json({
    success: true,
    message: 'Paiement enregistré avec succès',
    data: { item }
  });
});

// @desc    Obtenir l'historique des paiements
// @route   GET /api/creances-dettes/:id/payments
// @access  Private
const getPaymentHistory = asyncHandler(async (req, res) => {
  const item = await CreanceEtDette.findById(req.params.id).populate('paiements.saisiePar', 'name');
  
  if (!item) {
    throw new AppError('Créance/Dette non trouvée', 404);
  }

  res.json({
    success: true,
    data: { payments: item.paiements }
  });
});

// @desc    Obtenir les éléments en retard
// @route   GET /api/creances-dettes/overdue/list
// @access  Private
const getOverdueItems = asyncHandler(async (req, res) => {
  const today = new Date();
  
  const overdueItems = await CreanceEtDette.find({
    dateEcheance: { $lt: today },
    statut: { $ne: 'soldee' }
  }).sort({ dateEcheance: 1 });

  res.json({
    success: true,
    data: { items: overdueItems }
  });
});

module.exports = {
  getCreancesEtDettes,
  getCreanceEtDette,
  createCreanceEtDette,
  updateCreanceEtDette,
  deleteCreanceEtDette,
  addPayment,
  getPaymentHistory,
  getOverdueItems
};