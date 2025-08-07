const { Transaction, Account, Settings } = require('../models');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

// @desc    Obtenir la liste des rapports disponibles
// @route   GET /api/reports
// @access  Private
const getReports = asyncHandler(async (req, res) => {
  const availableReports = [
    {
      id: 'balance-sheet',
      name: 'Bilan comptable',
      description: 'État de la situation financière à une date donnée',
      category: 'financier'
    },
    {
      id: 'income-statement',
      name: 'Compte de résultat',
      description: 'Revenus et charges sur une période',
      category: 'financier'
    },
    {
      id: 'cash-flow',
      name: 'Flux de trésorerie',
      description: 'Mouvements de trésorerie sur une période',
      category: 'financier'
    },
    {
      id: 'trial-balance',
      name: 'Balance comptable',
      description: 'Soldes de tous les comptes',
      category: 'comptable'
    },
    {
      id: 'general-ledger',
      name: 'Grand livre',
      description: 'Détail des mouvements par compte',
      category: 'comptable'
    },
    {
      id: 'ageing-report',
      name: 'Balance âgée',
      description: 'Analyse des créances et dettes par ancienneté',
      category: 'analytique'
    }
  ];

  res.json({
    success: true,
    data: { reports: availableReports }
  });
});

// @desc    Générer un bilan comptable
// @route   POST /api/reports/balance-sheet
// @access  Private
const generateBalanceSheet = asyncHandler(async (req, res) => {
  const { dateAt } = req.body;
  const reportDate = dateAt ? new Date(dateAt) : new Date();

  // Obtenir tous les comptes avec leurs soldes
  const accounts = await Account.find({ isActive: true });
  
  const balanceSheet = {
    date: reportDate,
    actif: {
      immobilise: {
        total: 0,
        comptes: []
      },
      circulant: {
        total: 0,
        comptes: []
      }
    },
    passif: {
      capitaux: {
        total: 0,
        comptes: []
      },
      dettes: {
        total: 0,
        comptes: []
      }
    }
  };

  for (const account of accounts) {
    const balance = await calculateAccountBalance(account._id, reportDate);
    
    if (balance !== 0) {
      const accountData = {
        numero: account.numero,
        nom: account.nom,
        solde: balance
      };

      // Classification des comptes selon le plan comptable
      if (account.numero.startsWith('2')) {
        // Comptes d'immobilisations
        balanceSheet.actif.immobilise.comptes.push(accountData);
        balanceSheet.actif.immobilise.total += balance;
      } else if (account.numero.startsWith('3') || account.numero.startsWith('4') || account.numero.startsWith('5')) {
        // Comptes de stocks, tiers et trésorerie
        balanceSheet.actif.circulant.comptes.push(accountData);
        balanceSheet.actif.circulant.total += balance;
      } else if (account.numero.startsWith('1')) {
        // Comptes de capitaux
        balanceSheet.passif.capitaux.comptes.push(accountData);
        balanceSheet.passif.capitaux.total += Math.abs(balance);
      } else if (account.numero.startsWith('4') && balance < 0) {
        // Dettes fournisseurs
        balanceSheet.passif.dettes.comptes.push({
          ...accountData,
          solde: Math.abs(balance)
        });
        balanceSheet.passif.dettes.total += Math.abs(balance);
      }
    }
  }

  res.json({
    success: true,
    data: { balanceSheet }
  });
});

// @desc    Générer un compte de résultat
// @route   POST /api/reports/income-statement
// @access  Private
const generateIncomeStatement = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.body;
  
  if (!startDate || !endDate) {
    throw new AppError('Dates de début et de fin requises', 400);
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  // Obtenir les comptes de charges et produits
  const accounts = await Account.find({
    isActive: true,
    $or: [
      { numero: { $regex: '^6' } }, // Comptes de charges
      { numero: { $regex: '^7' } }  // Comptes de produits
    ]
  });

  const incomeStatement = {
    periode: { startDate: start, endDate: end },
    produits: {
      total: 0,
      comptes: []
    },
    charges: {
      total: 0,
      comptes: []
    },
    resultat: 0
  };

  for (const account of accounts) {
    const movements = await Transaction.find({
      $or: [
        { compteDebit: account._id },
        { compteCredit: account._id }
      ],
      date: { $gte: start, $lte: end },
      statut: 'validee'
    });

    let totalMouvement = 0;
    movements.forEach(transaction => {
      if (transaction.compteDebit.toString() === account._id.toString()) {
        totalMouvement += transaction.montant;
      } else {
        totalMouvement -= transaction.montant;
      }
    });

    if (totalMouvement !== 0) {
      const accountData = {
        numero: account.numero,
        nom: account.nom,
        montant: Math.abs(totalMouvement)
      };

      if (account.numero.startsWith('7')) {
        // Comptes de produits
        incomeStatement.produits.comptes.push(accountData);
        incomeStatement.produits.total += Math.abs(totalMouvement);
      } else if (account.numero.startsWith('6')) {
        // Comptes de charges
        incomeStatement.charges.comptes.push(accountData);
        incomeStatement.charges.total += Math.abs(totalMouvement);
      }
    }
  }

  incomeStatement.resultat = incomeStatement.produits.total - incomeStatement.charges.total;

  res.json({
    success: true,
    data: { incomeStatement }
  });
});

// @desc    Générer un rapport de flux de trésorerie
// @route   POST /api/reports/cash-flow
// @access  Private
const generateCashFlowStatement = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.body;
  
  if (!startDate || !endDate) {
    throw new AppError('Dates de début et de fin requises', 400);
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  // Obtenir les comptes de trésorerie
  const treasuryAccounts = await Account.find({
    isActive: true,
    numero: { $regex: '^5' } // Comptes de trésorerie
  });

  const cashFlow = {
    periode: { startDate: start, endDate: end },
    entrees: {
      total: 0,
      transactions: []
    },
    sorties: {
      total: 0,
      transactions: []
    },
    soldeDebut: 0,
    soldeFin: 0,
    variation: 0
  };

  // Calculer le solde de début
  for (const account of treasuryAccounts) {
    cashFlow.soldeDebut += await calculateAccountBalance(account._id, start);
  }

  // Obtenir les mouvements de trésorerie
  const transactions = await Transaction.find({
    $or: [
      { compteDebit: { $in: treasuryAccounts.map(a => a._id) } },
      { compteCredit: { $in: treasuryAccounts.map(a => a._id) } }
    ],
    date: { $gte: start, $lte: end },
    statut: 'validee'
  }).populate('compteDebit compteCredit');

  for (const transaction of transactions) {
    const isTreasuryDebit = treasuryAccounts.some(acc => 
      acc._id.toString() === transaction.compteDebit._id.toString()
    );
    const isTreasuryCredit = treasuryAccounts.some(acc => 
      acc._id.toString() === transaction.compteCredit._id.toString()
    );

    const transactionData = {
      date: transaction.date,
      libelle: transaction.libelle,
      montant: transaction.montant,
      compteContrepartie: isTreasuryDebit ? 
        transaction.compteCredit.nom : 
        transaction.compteDebit.nom
    };

    if (isTreasuryDebit && !isTreasuryCredit) {
      // Sortie de trésorerie
      cashFlow.sorties.transactions.push(transactionData);
      cashFlow.sorties.total += transaction.montant;
    } else if (isTreasuryCredit && !isTreasuryDebit) {
      // Entrée de trésorerie
      cashFlow.entrees.transactions.push(transactionData);
      cashFlow.entrees.total += transaction.montant;
    }
  }

  // Calculer le solde de fin
  for (const account of treasuryAccounts) {
    cashFlow.soldeFin += await calculateAccountBalance(account._id, end);
  }

  cashFlow.variation = cashFlow.soldeFin - cashFlow.soldeDebut;

  res.json({
    success: true,
    data: { cashFlow }
  });
});

// Fonction helper pour calculer le solde d'un compte à une date donnée
const calculateAccountBalance = async (accountId, date) => {
  const transactions = await Transaction.find({
    $or: [
      { compteDebit: accountId },
      { compteCredit: accountId }
    ],
    date: { $lte: date },
    statut: 'validee'
  });

  let balance = 0;
  transactions.forEach(transaction => {
    if (transaction.compteDebit.toString() === accountId.toString()) {
      balance += transaction.montant;
    } else {
      balance -= transaction.montant;
    }
  });

  return balance;
};

// @desc    Obtenir les statistiques du tableau de bord
// @route   GET /api/reports/dashboard
// @access  Private
const getDashboardStats = asyncHandler(async (req, res) => {
  // Récupérer l'utilisateur connecté
  const userId = req.user._id;
  
  // Obtenir le solde total des comptes de trésorerie
  const treasuryAccounts = await Account.find({
    isActive: true,
    numero: { $regex: '^5' } // Comptes de trésorerie
  });
  
  let totalBalance = 0;
  for (const account of treasuryAccounts) {
    totalBalance += await calculateAccountBalance(account._id, new Date());
  }
  
  // Calculer les revenus et dépenses du mois en cours
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  
  // Obtenir les comptes de charges et produits
  const revenueAccounts = await Account.find({
    isActive: true,
    numero: { $regex: '^7' } // Comptes de produits
  });
  
  const expenseAccounts = await Account.find({
    isActive: true,
    numero: { $regex: '^6' } // Comptes de charges
  });
  
  // Calculer les revenus du mois
  let monthlyRevenue = 0;
  for (const account of revenueAccounts) {
    const transactions = await Transaction.find({
      $or: [
        { compteDebit: account._id },
        { compteCredit: account._id }
      ],
      date: { $gte: startOfMonth, $lte: endOfMonth },
      statut: 'validee'
    });
    
    transactions.forEach(transaction => {
      if (transaction.compteCredit.toString() === account._id.toString()) {
        monthlyRevenue += transaction.montant;
      }
    });
  }
  
  // Calculer les dépenses du mois
  let monthlyExpenses = 0;
  for (const account of expenseAccounts) {
    const transactions = await Transaction.find({
      $or: [
        { compteDebit: account._id },
        { compteCredit: account._id }
      ],
      date: { $gte: startOfMonth, $lte: endOfMonth },
      statut: 'validee'
    });
    
    transactions.forEach(transaction => {
      if (transaction.compteDebit.toString() === account._id.toString()) {
        monthlyExpenses += transaction.montant;
      }
    });
  }
  
  // Calculer le résultat net
  const netResult = monthlyRevenue - monthlyExpenses;
  
  // Récupérer les transactions récentes
  const recentTransactions = await Transaction.find({
    statut: 'validee'
  })
  .sort({ date: -1 })
  .limit(5)
  .populate('compteDebit compteCredit');
  
  // Données mensuelles pour le graphique (6 derniers mois)
  const monthlyData = [];
  for (let i = 5; i >= 0; i--) {
    const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
    const monthName = month.toLocaleDateString('fr-FR', { month: 'short' });
    
    let recettes = 0;
    let depenses = 0;
    
    // Calculer les recettes du mois
    for (const account of revenueAccounts) {
      const transactions = await Transaction.find({
        $or: [
          { compteDebit: account._id },
          { compteCredit: account._id }
        ],
        date: { $gte: month, $lte: monthEnd },
        statut: 'validee'
      });
      
      transactions.forEach(transaction => {
        if (transaction.compteCredit.toString() === account._id.toString()) {
          recettes += transaction.montant;
        }
      });
    }
    
    // Calculer les dépenses du mois
    for (const account of expenseAccounts) {
      const transactions = await Transaction.find({
        $or: [
          { compteDebit: account._id },
          { compteCredit: account._id }
        ],
        date: { $gte: month, $lte: monthEnd },
        statut: 'validee'
      });
      
      transactions.forEach(transaction => {
        if (transaction.compteDebit.toString() === account._id.toString()) {
          depenses += transaction.montant;
        }
      });
    }
    
    monthlyData.push({
      month: monthName,
      recettes,
      depenses
    });
  }
  
  res.json({
    success: true,
    data: {
      totalBalance,
      monthlyRevenue,
      monthlyExpenses,
      netResult,
      recentTransactions,
      monthlyData
    }
  });
});

module.exports = {
  getReports,
  generateBalanceSheet,
  generateIncomeStatement,
  generateCashFlowStatement,
  getDashboardStats
};