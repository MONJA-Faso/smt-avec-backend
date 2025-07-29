const { Immobilisation } = require('../models');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

// @desc    Obtenir toutes les immobilisations
// @route   GET /api/immobilisations
// @access  Private
const getImmobilisations = asyncHandler(async (req, res) => {
  const {
    category,
    status,
    search,
    page = 1,
    limit = 20,
    sortBy = 'purchaseDate',
    sortOrder = 'desc'
  } = req.query;

  let filter = {};
  if (category) filter.category = category;
  if (status) filter.status = status;
  if (search) filter.$text = { $search: search };

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

  const immobilisations = await Immobilisation.find(filter)
    .populate('createdBy', 'name email')
    .populate('modifiedBy', 'name email')
    .sort(sort)
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Immobilisation.countDocuments(filter);

  res.json({
    success: true,
    count: immobilisations.length,
    total,
    pages: Math.ceil(total / parseInt(limit)),
    currentPage: parseInt(page),
    data: immobilisations
  });
});

// @desc    Obtenir une immobilisation par ID
// @route   GET /api/immobilisations/:id
// @access  Private
const getImmobilisation = asyncHandler(async (req, res) => {
  const immobilisation = await Immobilisation.findById(req.params.id)
    .populate('createdBy', 'name email')
    .populate('modifiedBy', 'name email');

  if (!immobilisation) {
    throw new AppError('Immobilisation non trouvée', 404);
  }

  res.json({
    success: true,
    data: immobilisation
  });
});

// @desc    Créer une nouvelle immobilisation
// @route   POST /api/immobilisations
// @access  Private
const createImmobilisation = asyncHandler(async (req, res) => {
  const immobilisationData = {
    ...req.body,
    createdBy: req.user._id
  };

  const immobilisation = await Immobilisation.create(immobilisationData);
  await immobilisation.populate('createdBy', 'name email');

  res.status(201).json({
    success: true,
    message: 'Immobilisation créée avec succès',
    data: immobilisation
  });
});

// @desc    Mettre à jour une immobilisation
// @route   PUT /api/immobilisations/:id
// @access  Private
const updateImmobilisation = asyncHandler(async (req, res) => {
  const immobilisation = await Immobilisation.findById(req.params.id);

  if (!immobilisation) {
    throw new AppError('Immobilisation non trouvée', 404);
  }

  if (req.user.role !== 'admin' && immobilisation.createdBy.toString() !== req.user._id.toString()) {
    throw new AppError('Non autorisé à modifier cette immobilisation', 403);
  }

  const updateData = {
    ...req.body,
    modifiedBy: req.user._id
  };

  delete updateData.createdBy;
  delete updateData.purchaseAmount;
  delete updateData.purchaseDate;

  Object.assign(immobilisation, updateData);
  await immobilisation.save();

  await immobilisation.populate('createdBy', 'name email');
  await immobilisation.populate('modifiedBy', 'name email');

  res.json({
    success: true,
    message: 'Immobilisation mise à jour avec succès',
    data: immobilisation
  });
});

// @desc    Supprimer une immobilisation
// @route   DELETE /api/immobilisations/:id
// @access  Private (Admin seulement)
const deleteImmobilisation = asyncHandler(async (req, res) => {
  const immobilisation = await Immobilisation.findById(req.params.id);

  if (!immobilisation) {
    throw new AppError('Immobilisation non trouvée', 404);
  }

  await immobilisation.deleteOne();

  res.json({
    success: true,
    message: 'Immobilisation supprimée avec succès'
  });
});

module.exports = {
  getImmobilisations,
  getImmobilisation,
  createImmobilisation,
  updateImmobilisation,
  deleteImmobilisation
};