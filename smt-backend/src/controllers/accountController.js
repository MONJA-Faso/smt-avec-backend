const { Account, Transaction } = require('../models');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

// @desc    Obtenir tous les comptes
// @route   GET /api/accounts
// @access  Private
const getAccounts = asyncHandler(async (req, res) => {
  const { type, isActive } = req.query;
  
  let filter = {};
  if (type) filter.type = type;
  if (isActive !== undefined) filter.isActive = isActive === 'true';

  const accounts = await Account.find(filter).sort({ type: 1, name: 1 });

  res.json({
    success: true,
    count: accounts.length,
    data: accounts
  });
});

// @desc    Obtenir un compte par ID
// @route   GET /api/accounts/:id
// @access  Private
const getAccount = asyncHandler(async (req, res) => {
  const account = await Account.findById(req.params.id);

  if (!account) {
    throw new AppError('Compte non trouvé', 404);
  }

  res.json({
    success: true,
    data: account
  });
});

// @desc    Créer un nouveau compte
// @route   POST /api/accounts
// @access  Private (Admin seulement)
const createAccount = asyncHandler(async (req, res) => {
  const accountData = req.body;

  // Vérifier si le type capital est unique s'il est actif
  if (accountData.type === 'capital' && accountData.isActive !== false) {
    const existingCapital = await Account.findOne({ type: 'capital', isActive: true });
    if (existingCapital) {
      throw new AppError('Il ne peut y avoir qu\'un seul compte capital actif', 400);
    }
  }

  const account = await Account.create(accountData);

  res.status(201).json({
    success: true,
    message: 'Compte créé avec succès',
    data: account
  });
});

// @desc    Mettre à jour un compte
// @route   PUT /api/accounts/:id
// @access  Private (Admin seulement)
const updateAccount = asyncHandler(async (req, res) => {
  const account = await Account.findById(req.params.id);

  if (!account) {
    throw new AppError('Compte non trouvé', 404);
  }

  // Ne pas permettre la modification du type et du solde via cette route
  const { type, balance, ...updateData } = req.body;

  const updatedAccount = await Account.findByIdAndUpdate(
    req.params.id,
    updateData,
    { new: true, runValidators: true }
  );

  res.json({
    success: true,
    message: 'Compte mis à jour avec succès',
    data: updatedAccount
  });
});

// @desc    Supprimer un compte (soft delete)
// @route   DELETE /api/accounts/:id
// @access  Private (Admin seulement)
const deleteAccount = asyncHandler(async (req, res) => {
  const account = await Account.findById(req.params.id);

  if (!account) {
    throw new AppError('Compte non trouvé', 404);
  }

  // Vérifier s'il y a des transactions liées
  const transactionCount = await Transaction.countDocuments({ 
    accountId: req.params.id,
    isDeleted: false 
  });

  if (transactionCount > 0) {
    throw new AppError('Impossible de supprimer un compte avec des transactions actives', 400);
  }

  // Soft delete
  account.isActive = false;
  account.closingDate = new Date();
  await account.save();

  res.json({
    success: true,
    message: 'Compte désactivé avec succès'
  });
});

// @desc    Obtenir le solde total par type
// @route   GET /api/accounts/balance/by-type
// @access  Private
const getBalanceByType = asyncHandler(async (req, res) => {
  const balancesByType = await Account.aggregate([
    { $match: { isActive: true } },
    {
      $group: {
        _id: '$type',
        totalBalance: { $sum: '$balance' },
        count: { $sum: 1 },
        accounts: {
          $push: {
            id: '$_id',
            name: '$name',
            balance: '$balance'
          }
        }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  res.json({
    success: true,
    data: balancesByType
  });
});

// @desc    Obtenir le solde total de trésorerie
// @route   GET /api/accounts/treasury
// @access  Private
const getTreasuryBalance = asyncHandler(async (req, res) => {
  const treasuryAccounts = await Account.find({
    type: { $in: ['caisse', 'banque', 'ccp'] },
    isActive: true
  });

  const totalTreasury = treasuryAccounts.reduce((sum, account) => sum + account.balance, 0);

  res.json({
    success: true,
    data: {
      totalTreasury,
      accounts: treasuryAccounts.map(account => ({
        id: account._id,
        name: account.name,
        type: account.type,
        balance: account.balance,
        formattedBalance: account.formattedBalance
      }))
    }
  });
});

// @desc    Obtenir l'historique des soldes
// @route   GET /api/accounts/:id/balance-history
// @access  Private
const getBalanceHistory = asyncHandler(async (req, res) => {
  const { dateFrom, dateTo } = req.query;
  const accountId = req.params.id;

  // Vérifier que le compte existe
  const account = await Account.findById(accountId);
  if (!account) {
    throw new AppError('Compte non trouvé', 404);
  }

  let dateFilter = { isDeleted: false };
  if (dateFrom || dateTo) {
    dateFilter.date = {};
    if (dateFrom) dateFilter.date.$gte = new Date(dateFrom);
    if (dateTo) dateFilter.date.$lte = new Date(dateTo);
  }

  // Obtenir les transactions pour calculer l'évolution du solde
  const transactions = await Transaction.find({
    accountId: accountId,
    ...dateFilter
  }).sort({ date: 1, createdAt: 1 });

  let runningBalance = account.balance;
  
  // Calculer le solde de départ en soustrayant toutes les transactions après la date de fin
  if (dateTo) {
    const laterTransactions = await Transaction.find({
      accountId: accountId,
      date: { $gt: new Date(dateTo) },
      isDeleted: false
    });
    
    laterTransactions.forEach(transaction => {
      if (transaction.type === 'recette') {
        runningBalance -= transaction.amount;
      } else {
        runningBalance += transaction.amount;
      }
    });
  }

  const balanceHistory = [];
  
  transactions.forEach(transaction => {
    if (transaction.type === 'recette') {
      runningBalance += transaction.amount;
    } else {
      runningBalance -= transaction.amount;
    }
    
    balanceHistory.push({
      date: transaction.date,
      transaction: {
        id: transaction._id,
        type: transaction.type,
        amount: transaction.amount,
        description: transaction.description
      },
      balance: runningBalance
    });
  });

  res.json({
    success: true,
    data: {
      account: {
        id: account._id,
        name: account.name,
        type: account.type,
        currentBalance: account.balance
      },
      history: balanceHistory
    }
  });
});

// @desc    Réconcilier un compte
// @route   POST /api/accounts/:id/reconcile
// @access  Private
const reconcileAccount = asyncHandler(async (req, res) => {
  const { reconciledBalance, reconciliationDate } = req.body;
  
  const account = await Account.findById(req.params.id);

  if (!account) {
    throw new AppError('Compte non trouvé', 404);
  }

  if (reconciledBalance === undefined) {
    throw new AppError('Solde de réconciliation requis', 400);
  }

  // Mettre à jour les informations de réconciliation
  account.reconciledBalance = reconciledBalance;
  account.lastReconciliationDate = reconciliationDate || new Date();
  await account.save();

  // Calculer l'écart
  const difference = account.balance - reconciledBalance;

  res.json({
    success: true,
    message: 'Réconciliation effectuée avec succès',
    data: {
      account: {
        id: account._id,
        name: account.name,
        bookBalance: account.balance,
        reconciledBalance: account.reconciledBalance,
        difference: difference,
        lastReconciliationDate: account.lastReconciliationDate
      }
    }
  });
});

// @desc    Obtenir les statistiques des comptes
// @route   GET /api/accounts/stats
// @access  Private
const getAccountStats = asyncHandler(async (req, res) => {
  const stats = await Account.aggregate([
    { $match: { isActive: true } },
    {
      $group: {
        _id: null,
        totalAccounts: { $sum: 1 },
        totalBalance: { $sum: '$balance' },
        avgBalance: { $avg: '$balance' },
        accountsByType: {
          $push: {
            type: '$type',
            balance: '$balance'
          }
        }
      }
    }
  ]);

  const typeStats = await Account.aggregate([
    { $match: { isActive: true } },
    {
      $group: {
        _id: '$type',
        count: { $sum: 1 },
        totalBalance: { $sum: '$balance' },
        avgBalance: { $avg: '$balance' },
        minBalance: { $min: '$balance' },
        maxBalance: { $max: '$balance' }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  res.json({
    success: true,
    data: {
      overall: stats[0] || { totalAccounts: 0, totalBalance: 0, avgBalance: 0 },
      byType: typeStats
    }
  });
});

module.exports = {
  getAccounts,
  getAccount,
  createAccount,
  updateAccount,
  deleteAccount,
  getBalanceByType,
  getTreasuryBalance,
  getBalanceHistory,
  reconcileAccount,
  getAccountStats
};