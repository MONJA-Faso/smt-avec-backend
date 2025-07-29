const { Stock } = require('../models');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

// @desc    Obtenir tous les stocks
// @route   GET /api/stocks
// @access  Private
const getStocks = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search, category } = req.query;
  
  const query = {};
  
  if (search) {
    query.$or = [
      { nom: { $regex: search, $options: 'i' } },
      { reference: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];
  }
  
  if (category) query.categorie = category;

  const stocks = await Stock.find(query)
    .sort({ nom: 1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await Stock.countDocuments(query);

  res.json({
    success: true,
    data: {
      stocks,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
});

// @desc    Obtenir un stock par ID
// @route   GET /api/stocks/:id
// @access  Private
const getStock = asyncHandler(async (req, res) => {
  const stock = await Stock.findById(req.params.id);
  
  if (!stock) {
    throw new AppError('Article non trouvé', 404);
  }

  res.json({
    success: true,
    data: { stock }
  });
});

// @desc    Créer un nouvel article en stock
// @route   POST /api/stocks
// @access  Private
const createStock = asyncHandler(async (req, res) => {
  const stockData = { ...req.body, createdBy: req.user.id };
  
  const stock = await Stock.create(stockData);

  res.status(201).json({
    success: true,
    message: 'Article créé avec succès',
    data: { stock }
  });
});

// @desc    Mettre à jour un stock
// @route   PUT /api/stocks/:id
// @access  Private
const updateStock = asyncHandler(async (req, res) => {
  const stock = await Stock.findById(req.params.id);
  
  if (!stock) {
    throw new AppError('Article non trouvé', 404);
  }

  const updatedStock = await Stock.findByIdAndUpdate(
    req.params.id,
    { ...req.body, updatedBy: req.user.id },
    { new: true, runValidators: true }
  );

  res.json({
    success: true,
    message: 'Article mis à jour avec succès',
    data: { stock: updatedStock }
  });
});

// @desc    Supprimer un stock
// @route   DELETE /api/stocks/:id
// @access  Private (Admin/Manager)
const deleteStock = asyncHandler(async (req, res) => {
  const stock = await Stock.findById(req.params.id);
  
  if (!stock) {
    throw new AppError('Article non trouvé', 404);
  }

  await Stock.findByIdAndDelete(req.params.id);

  res.json({
    success: true,
    message: 'Article supprimé avec succès'
  });
});

// @desc    Mettre à jour la quantité en stock
// @route   PUT /api/stocks/:id/quantity
// @access  Private
const updateStockQuantity = asyncHandler(async (req, res) => {
  const { quantite, typeOperation, raison } = req.body;
  
  const stock = await Stock.findById(req.params.id);
  
  if (!stock) {
    throw new AppError('Article non trouvé', 404);
  }

  // Calculer la nouvelle quantité
  let nouvelleQuantite = stock.quantiteEnStock;
  
  if (typeOperation === 'entree') {
    nouvelleQuantite += quantite;
  } else if (typeOperation === 'sortie') {
    if (quantite > stock.quantiteEnStock) {
      throw new AppError('Quantité insuffisante en stock', 400);
    }
    nouvelleQuantite -= quantite;
  } else {
    nouvelleQuantite = quantite; // Ajustement direct
  }

  // Enregistrer le mouvement
  const mouvement = {
    type: typeOperation || 'ajustement',
    quantite,
    quantiteAvant: stock.quantiteEnStock,
    quantiteApres: nouvelleQuantite,
    raison: raison || 'Ajustement manuel',
    date: new Date(),
    utilisateur: req.user.id
  };

  stock.quantiteEnStock = nouvelleQuantite;
  stock.mouvements.push(mouvement);
  stock.updatedBy = req.user.id;

  await stock.save();

  res.json({
    success: true,
    message: 'Quantité mise à jour avec succès',
    data: { stock }
  });
});

// @desc    Obtenir les mouvements d'un stock
// @route   GET /api/stocks/:id/movements
// @access  Private
const getStockMovements = asyncHandler(async (req, res) => {
  const stock = await Stock.findById(req.params.id).populate('mouvements.utilisateur', 'name');
  
  if (!stock) {
    throw new AppError('Article non trouvé', 404);
  }

  res.json({
    success: true,
    data: { movements: stock.mouvements }
  });
});

// @desc    Ajouter un mouvement de stock
// @route   POST /api/stocks/:id/movements
// @access  Private
const addStockMovement = asyncHandler(async (req, res) => {
  const { type, quantite, raison } = req.body;
  
  const stock = await Stock.findById(req.params.id);
  
  if (!stock) {
    throw new AppError('Article non trouvé', 404);
  }

  let nouvelleQuantite = stock.quantiteEnStock;
  
  if (type === 'entree') {
    nouvelleQuantite += quantite;
  } else if (type === 'sortie') {
    if (quantite > stock.quantiteEnStock) {
      throw new AppError('Quantité insuffisante en stock', 400);
    }
    nouvelleQuantite -= quantite;
  }

  const mouvement = {
    type,
    quantite,
    quantiteAvant: stock.quantiteEnStock,
    quantiteApres: nouvelleQuantite,
    raison,
    date: new Date(),
    utilisateur: req.user.id
  };

  stock.quantiteEnStock = nouvelleQuantite;
  stock.mouvements.push(mouvement);
  stock.updatedBy = req.user.id;

  await stock.save();

  res.json({
    success: true,
    message: 'Mouvement de stock enregistré avec succès',
    data: { stock }
  });
});

module.exports = {
  getStocks,
  getStock,
  createStock,
  updateStock,
  deleteStock,
  updateStockQuantity,
  getStockMovements,
  addStockMovement
};