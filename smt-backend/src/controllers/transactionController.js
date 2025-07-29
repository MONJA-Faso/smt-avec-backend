const { Transaction, Account, Document } = require('../models');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

// @desc    Obtenir toutes les transactions avec filtres
// @route   GET /api/transactions
// @access  Private
const getTransactions = asyncHandler(async (req, res) => {
  const {
    search,
    dateFrom,
    dateTo,
    type,
    accountId,
    category,
    page = 1,
    limit = 20,
    sortBy = 'date',
    sortOrder = 'desc'
  } = req.query;

  // Construire le filtre
  let filter = { isDeleted: false };

  if (search) {
    filter.$text = { $search: search };
  }

  if (dateFrom || dateTo) {
    filter.date = {};
    if (dateFrom) filter.date.$gte = new Date(dateFrom);
    if (dateTo) filter.date.$lte = new Date(dateTo);
  }

  if (type && type !== 'all') {
    filter.type = type;
  }

  if (accountId && accountId !== 'all') {
    filter.accountId = accountId;
  }

  if (category) {
    filter.category = category;
  }

  // Configuration de la pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

  // Exécuter la requête
  const transactions = await Transaction.find(filter)
    .populate('accountId', 'name type')
    .populate('createdBy', 'name email')
    .populate('documentId', 'name url type')
    .sort(sort)
    .skip(skip)
    .limit(parseInt(limit));

  // Compter le total pour la pagination
  const total = await Transaction.countDocuments(filter);

  res.json({
    success: true,
    count: transactions.length,
    total,
    pages: Math.ceil(total / parseInt(limit)),
    currentPage: parseInt(page),
    data: transactions
  });
});

// @desc    Obtenir une transaction par ID
// @route   GET /api/transactions/:id
// @access  Private
const getTransaction = asyncHandler(async (req, res) => {
  const transaction = await Transaction.findOne({
    _id: req.params.id,
    isDeleted: false
  })
    .populate('accountId', 'name type currency')
    .populate('createdBy', 'name email')
    .populate('modifiedBy', 'name email')
    .populate('documentId');

  if (!transaction) {
    throw new AppError('Transaction non trouvée', 404);
  }

  res.json({
    success: true,
    data: transaction
  });
});

// @desc    Créer une nouvelle transaction
// @route   POST /api/transactions
// @access  Private
const createTransaction = asyncHandler(async (req, res) => {
  const transactionData = {
    ...req.body,
    createdBy: req.user._id
  };

  // Vérifier que le compte existe
  const account = await Account.findById(transactionData.accountId);
  if (!account || !account.isActive) {
    throw new AppError('Compte non trouvé ou inactif', 404);
  }

  // Vérifier que le compte a suffisamment de fonds pour une dépense
  if (transactionData.type === 'depense' && account.balance < transactionData.amount) {
    throw new AppError('Solde insuffisant sur le compte', 400);
  }

  // Créer la transaction
  const transaction = await Transaction.create(transactionData);

  // Générer une référence si non fournie
  if (!transaction.reference) {
    transaction.generateReference();
    await transaction.save();
  }

  // Populer les champs pour la réponse
  await transaction.populate('accountId', 'name type currency');
  await transaction.populate('createdBy', 'name email');

  res.status(201).json({
    success: true,
    message: 'Transaction créée avec succès',
    data: transaction
  });
});

// @desc    Mettre à jour une transaction
// @route   PUT /api/transactions/:id
// @access  Private
const updateTransaction = asyncHandler(async (req, res) => {
  const transaction = await Transaction.findOne({
    _id: req.params.id,
    isDeleted: false
  });

  if (!transaction) {
    throw new AppError('Transaction non trouvée', 404);
  }

  // Vérifier les permissions
  if (req.user.role !== 'admin' && transaction.createdBy.toString() !== req.user._id.toString()) {
    throw new AppError('Non autorisé à modifier cette transaction', 403);
  }

  // Sauvegarder les anciennes valeurs pour ajuster le solde
  const oldAccountId = transaction.accountId;
  const oldAmount = transaction.amount;
  const oldType = transaction.type;

  // Mettre à jour la transaction
  const updateData = {
    ...req.body,
    modifiedBy: req.user._id
  };

  // Ne pas permettre la modification de certains champs sensibles
  delete updateData.createdBy;
  delete updateData.isDeleted;

  Object.assign(transaction, updateData);
  await transaction.save();

  // Ajuster les soldes des comptes si nécessaire
  if (req.body.accountId && req.body.accountId !== oldAccountId.toString()) {
    // Restaurer l'ancien solde
    const oldAccount = await Account.findById(oldAccountId);
    if (oldAccount) {
      if (oldType === 'recette') {
        oldAccount.balance -= oldAmount;
      } else {
        oldAccount.balance += oldAmount;
      }
      await oldAccount.save();
    }

    // Appliquer au nouveau compte
    const newAccount = await Account.findById(req.body.accountId);
    if (newAccount) {
      if (transaction.type === 'recette') {
        newAccount.balance += transaction.amount;
      } else {
        newAccount.balance -= transaction.amount;
      }
      await newAccount.save();
    }
  } else if (req.body.amount && req.body.amount !== oldAmount) {
    // Ajuster le solde si le montant a changé
    const account = await Account.findById(transaction.accountId);
    if (account) {
      const difference = transaction.amount - oldAmount;
      if (transaction.type === 'recette') {
        account.balance += difference;
      } else {
        account.balance -= difference;
      }
      await account.save();
    }
  }

  await transaction.populate('accountId', 'name type currency');
  await transaction.populate('createdBy', 'name email');
  await transaction.populate('modifiedBy', 'name email');

  res.json({
    success: true,
    message: 'Transaction mise à jour avec succès',
    data: transaction
  });
});

// @desc    Supprimer une transaction (soft delete)
// @route   DELETE /api/transactions/:id
// @access  Private
const deleteTransaction = asyncHandler(async (req, res) => {
  const transaction = await Transaction.findOne({
    _id: req.params.id,
    isDeleted: false
  });

  if (!transaction) {
    throw new AppError('Transaction non trouvée', 404);
  }

  // Vérifier les permissions
  if (req.user.role !== 'admin' && transaction.createdBy.toString() !== req.user._id.toString()) {
    throw new AppError('Non autorisé à supprimer cette transaction', 403);
  }

  // Soft delete
  await transaction.softDelete(req.user._id);

  res.json({
    success: true,
    message: 'Transaction supprimée avec succès'
  });
});

// @desc    Obtenir les statistiques des transactions
// @route   GET /api/transactions/stats
// @access  Private
const getTransactionStats = asyncHandler(async (req, res) => {
  const { dateFrom, dateTo, accountId } = req.query;

  let matchStage = { isDeleted: false };

  if (dateFrom || dateTo) {
    matchStage.date = {};
    if (dateFrom) matchStage.date.$gte = new Date(dateFrom);
    if (dateTo) matchStage.date.$lte = new Date(dateTo);
  }

  if (accountId) {
    matchStage.accountId = accountId;
  }

  const stats = await Transaction.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$type',
        total: { $sum: '$amount' },
        count: { $sum: 1 },
        avgAmount: { $avg: '$amount' },
        minAmount: { $min: '$amount' },
        maxAmount: { $max: '$amount' }
      }
    }
  ]);

  const categoryStats = await Transaction.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: { type: '$type', category: '$category' },
        total: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    },
    { $sort: { '_id.type': 1, total: -1 } }
  ]);

  // Calculer le solde net
  const recettes = stats.find(s => s._id === 'recette')?.total || 0;
  const depenses = stats.find(s => s._id === 'depense')?.total || 0;
  const soldeNet = recettes - depenses;

  res.json({
    success: true,
    data: {
      summary: {
        recettes,
        depenses,
        soldeNet,
        totalTransactions: stats.reduce((sum, s) => sum + s.count, 0)
      },
      byType: stats,
      byCategory: categoryStats
    }
  });
});

// @desc    Obtenir les transactions par catégorie
// @route   GET /api/transactions/by-category
// @access  Private
const getTransactionsByCategory = asyncHandler(async (req, res) => {
  const { dateFrom, dateTo, type } = req.query;

  let matchStage = { isDeleted: false };

  if (dateFrom || dateTo) {
    matchStage.date = {};
    if (dateFrom) matchStage.date.$gte = new Date(dateFrom);
    if (dateTo) matchStage.date.$lte = new Date(dateTo);
  }

  if (type) {
    matchStage.type = type;
  }

  const categoryData = await Transaction.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: {
          category: '$category',
          subcategory: '$subcategory'
        },
        total: { $sum: '$amount' },
        count: { $sum: 1 },
        transactions: {
          $push: {
            id: '$_id',
            date: '$date',
            amount: '$amount',
            description: '$description'
          }
        }
      }
    },
    { $sort: { total: -1 } }
  ]);

  res.json({
    success: true,
    data: categoryData
  });
});

// @desc    Dupliquer une transaction
// @route   POST /api/transactions/:id/duplicate
// @access  Private
const duplicateTransaction = asyncHandler(async (req, res) => {
  const originalTransaction = await Transaction.findOne({
    _id: req.params.id,
    isDeleted: false
  });

  if (!originalTransaction) {
    throw new AppError('Transaction non trouvée', 404);
  }

  // Créer une copie de la transaction
  const duplicateData = originalTransaction.toObject();
  delete duplicateData._id;
  delete duplicateData.reference;
  delete duplicateData.createdAt;
  delete duplicateData.updatedAt;
  
  duplicateData.date = new Date();
  duplicateData.createdBy = req.user._id;
  duplicateData.description = `${duplicateData.description} (Copie)`;

  const duplicatedTransaction = await Transaction.create(duplicateData);

  // Générer une nouvelle référence
  duplicatedTransaction.generateReference();
  await duplicatedTransaction.save();

  await duplicatedTransaction.populate('accountId', 'name type currency');
  await duplicatedTransaction.populate('createdBy', 'name email');

  res.status(201).json({
    success: true,
    message: 'Transaction dupliquée avec succès',
    data: duplicatedTransaction
  });
});

// @desc    Exporter les transactions
// @route   GET /api/transactions/export
// @access  Private
const exportTransactions = asyncHandler(async (req, res) => {
  const { format = 'csv', ...filters } = req.query;

  // Utiliser les mêmes filtres que getTransactions
  let filter = { isDeleted: false };

  if (filters.search) {
    filter.$text = { $search: filters.search };
  }

  if (filters.dateFrom || filters.dateTo) {
    filter.date = {};
    if (filters.dateFrom) filter.date.$gte = new Date(filters.dateFrom);
    if (filters.dateTo) filter.date.$lte = new Date(filters.dateTo);
  }

  if (filters.type && filters.type !== 'all') {
    filter.type = filters.type;
  }

  if (filters.accountId && filters.accountId !== 'all') {
    filter.accountId = filters.accountId;
  }

  const transactions = await Transaction.find(filter)
    .populate('accountId', 'name type')
    .populate('createdBy', 'name')
    .sort({ date: -1 });

  if (format === 'csv') {
    // Générer CSV
    const csvHeader = 'Date,Type,Montant,Description,Compte,Catégorie,Sous-catégorie,Référence\n';
    const csvData = transactions.map(t => 
      `${t.date.toISOString().split('T')[0]},${t.type},${t.amount},"${t.description}","${t.accountId?.name || ''}","${t.category}","${t.subcategory || ''}","${t.reference || ''}"`
    ).join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="transactions_${new Date().toISOString().split('T')[0]}.csv"`);
    res.send(csvHeader + csvData);
  } else {
    // JSON par défaut
    res.json({
      success: true,
      count: transactions.length,
      exportDate: new Date(),
      data: transactions
    });
  }
});

module.exports = {
  getTransactions,
  getTransaction,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getTransactionStats,
  getTransactionsByCategory,
  duplicateTransaction,
  exportTransactions
};