require('dotenv').config();
const mongoose = require('mongoose');
const { Account, Transaction, Stock, CreanceEtDette, User } = require('./models');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/smt_monja_faso';

// Fonction pour générer une date aléatoire entre deux dates
function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

// Fonction pour générer un nombre aléatoire entre min et max
function randomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

// Fonction pour générer un élément aléatoire d'un tableau
function randomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

async function seedSampleData() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connecté à MongoDB');

    // Trouver un utilisateur admin pour l'associer aux données
    const admin = await User.findOne({ role: 'admin' });
    if (!admin) {
      console.log('❌ Aucun utilisateur admin trouvé. Veuillez d\'abord créer un admin.');
      return;
    }

    // 1. Créer des comptes
    console.log('🏦 Création des comptes...');
    await Account.deleteMany({});
    
    const accounts = [
      {
        name: 'Caisse principale',
        type: 'caisse',
        balance: 2500000,
        currency: 'MGA',
        description: 'Caisse pour les paiements espèces'
      },
      {
        name: 'BOA Compte courant',
        type: 'banque',
        balance: 15000000,
        currency: 'MGA',
        accountNumber: '000123456789',
        bankName: 'Bank of Africa',
        bankBranch: 'Antananarivo Analakely',
        description: 'Compte principal BOA'
      },
      {
        name: 'BFV Business',
        type: 'banque',
        balance: 8500000,
        currency: 'MGA',
        accountNumber: '001987654321',
        bankName: 'Banky Fampandrosoana ny Varotra',
        bankBranch: 'Antananarivo Centre',
        description: 'Compte BFV pour opérations commerciales'
      },
      {
        name: 'CCP Postepargne',
        type: 'ccp',
        balance: 1200000,
        currency: 'MGA',
        accountNumber: '555666777',
        description: 'Compte chèques postaux'
      },
      {
        name: 'Capital social',
        type: 'capital',
        balance: 20000000,
        currency: 'MGA',
        description: 'Apports en capital de l\'entreprise'
      }
    ];

    const createdAccounts = await Account.insertMany(accounts);
    console.log(`✅ ${createdAccounts.length} comptes créés`);

    // 2. Créer des transactions
    console.log('💰 Création des transactions...');
    await Transaction.deleteMany({});

    const transactionCategories = {
      recettes: [
        { value: 'ventes', label: 'Ventes de marchandises', subcategories: ['Vente directe', 'Vente en ligne', 'Vente grossiste'] },
        { value: 'prestations', label: 'Prestations de services', subcategories: ['Conseil', 'Formation', 'Maintenance'] },
        { value: 'autres_produits', label: 'Autres produits', subcategories: ['Loyers perçus', 'Produits financiers', 'Subventions'] }
      ],
      depenses: [
        { value: 'achats', label: 'Achats de marchandises', subcategories: ['Matières premières', 'Produits finis', 'Fournitures'] },
        { value: 'frais_generaux', label: 'Frais généraux', subcategories: ['Loyer', 'Électricité', 'Télécommunications', 'Assurances'] },
        { value: 'personnel', label: 'Charges de personnel', subcategories: ['Salaires', 'Charges sociales', 'Formation'] },
        { value: 'transport', label: 'Transport et déplacements', subcategories: ['Carburant', 'Entretien véhicules', 'Missions'] }
      ]
    };

    const transactions = [];
    const accountIds = createdAccounts.map(acc => acc._id);

    // Générer 100 transactions
    for (let i = 0; i < 100; i++) {
      const type = randomElement(['recette', 'depense']);
      const categories = type === 'recette' ? transactionCategories.recettes : transactionCategories.depenses;
      const category = randomElement(categories);
      const subcategory = randomElement(category.subcategories);
      
      const transaction = {
        type,
        amount: randomNumber(50000, 5000000),
        description: `${category.label} - ${subcategory}`,
        category: category.value,
        subcategory,
        accountId: randomElement(accountIds),
        date: randomDate(new Date(2024, 0, 1), new Date()),
        reference: `${type === 'recette' ? 'R' : 'D'}-2024-${String(i + 1).padStart(3, '0')}`,
        createdBy: admin._id
      };

      transactions.push(transaction);
    }

    await Transaction.insertMany(transactions);
    console.log(`✅ ${transactions.length} transactions créées`);

    // 3. Créer des stocks
    console.log('📦 Création des stocks...');
    await Stock.deleteMany({});

    const stockCategories = ['Marchandises', 'Matières premières', 'Produits finis', 'Fournitures', 'Emballages'];
    const stockItems = [
      'Article A', 'Article B', 'Article C', 'Matière première X', 'Matière première Y',
      'Produit fini Alpha', 'Produit fini Beta', 'Fourniture bureau', 'Emballage carton',
      'Composant électronique', 'Pièce détachée', 'Consommable informatique'
    ];

    const stocks = [];
    for (let i = 0; i < 30; i++) {
      const quantity = randomNumber(10, 1000);
      const unitPrice = randomNumber(1000, 100000);
      
      const stock = {
        name: `${randomElement(stockItems)} #${i + 1}`,
        category: randomElement(stockCategories),
        quantity,
        unitPrice,
        totalValue: quantity * unitPrice,
        unit: randomElement(['Pièces', 'Kg', 'Litres', 'Mètres', 'Lots']),
        supplier: randomElement(['Fournisseur A', 'Fournisseur B', 'Fournisseur C', 'Fournisseur D']),
        date: randomDate(new Date(2024, 0, 1), new Date()).toISOString()
      };

      stocks.push(stock);
    }

    await Stock.insertMany(stocks);
    console.log(`✅ ${stocks.length} articles de stock créés`);

    // 4. Créer des créances et dettes
    console.log('💳 Création des créances et dettes...');
    await CreanceEtDette.deleteMany({});

    const clients = [
      'SARL TECH SOLUTIONS', 'ENTREPRISE MAMADOU & FILS', 'COOPERATIVE AGRICOLE', 
      'SOCIETE IMPORT-EXPORT', 'BUREAU CONSEIL BUSINESS', 'ASSOCIATION DEVELOPPEMENT'
    ];

    const fournisseurs = [
      'FOURNISSEUR ABC', 'ELECTRICITE NATIONALE', 'GARAGE MODERNE', 
      'BUREAU COMPTABLE EXPERT', 'TELECOM MALAGASY', 'ASSURANCE GENERALE'
    ];

    const creancesEtDettes = [];

    // Créer des créances
    for (let i = 0; i < 15; i++) {
      const amount = randomNumber(500000, 5000000);
      const dueDate = randomDate(new Date(), new Date(2025, 11, 31));
      const isPaid = Math.random() > 0.7; // 30% de chances d'être payé
      const isOverdue = dueDate < new Date() && !isPaid;
      
      let status = 'en_cours';
      if (isPaid) status = 'paye';
      else if (isOverdue) status = 'echu';
      else if (Math.random() > 0.9) status = 'litigieux';

      const creance = {
        type: 'creance',
        name: `Facture client ${String(i + 1).padStart(3, '0')}`,
        amount,
        thirdParty: randomElement(clients),
        dueDate: dueDate.toISOString(),
        status,
        description: `Prestation de services ou vente de marchandises à ${randomElement(clients)}`
      };

      creancesEtDettes.push(creance);
    }

    // Créer des dettes
    for (let i = 0; i < 12; i++) {
      const amount = randomNumber(300000, 3000000);
      const dueDate = randomDate(new Date(), new Date(2025, 11, 31));
      const isPaid = Math.random() > 0.6; // 40% de chances d'être payé
      const isOverdue = dueDate < new Date() && !isPaid;
      
      let status = 'en_cours';
      if (isPaid) status = 'paye';
      else if (isOverdue) status = 'echu';

      const dette = {
        type: 'dette',
        name: `Facture fournisseur ${String(i + 1).padStart(3, '0')}`,
        amount,
        thirdParty: randomElement(fournisseurs),
        dueDate: dueDate.toISOString(),
        status,
        description: `Achat de marchandises ou prestation de services de ${randomElement(fournisseurs)}`
      };

      creancesEtDettes.push(dette);
    }

    await CreanceEtDette.insertMany(creancesEtDettes);
    console.log(`✅ ${creancesEtDettes.length} créances et dettes créées`);

    // 5. Mettre à jour les soldes des comptes selon les transactions
    console.log('🔄 Mise à jour des soldes des comptes...');
    
    for (const account of createdAccounts) {
      const accountTransactions = transactions.filter(t => t.accountId.toString() === account._id.toString());
      
      let balance = account.balance;
      for (const transaction of accountTransactions) {
        if (transaction.type === 'recette') {
          balance += transaction.amount;
        } else {
          balance -= transaction.amount;
        }
      }
      
      await Account.findByIdAndUpdate(account._id, { 
        balance,
        lastTransactionDate: accountTransactions.length > 0 ? 
          Math.max(...accountTransactions.map(t => new Date(t.date))) : undefined
      });
    }

    // Afficher les statistiques finales
    console.log('\n📊 Statistiques des données créées:');
    console.log(`- Comptes: ${createdAccounts.length}`);
    console.log(`- Transactions: ${transactions.length}`);
    console.log(`- Articles de stock: ${stocks.length}`);
    console.log(`- Créances et dettes: ${creancesEtDettes.length}`);

    const totalBalance = await Account.aggregate([
      { $match: { type: { $in: ['caisse', 'banque', 'ccp'] } } },
      { $group: { _id: null, total: { $sum: '$balance' } } }
    ]);

    if (totalBalance.length > 0) {
      console.log(`- Solde total de trésorerie: ${totalBalance[0].total.toLocaleString()} MGA`);
    }

    const totalStock = stocks.reduce((sum, stock) => sum + stock.totalValue, 0);
    console.log(`- Valeur totale du stock: ${totalStock.toLocaleString()} MGA`);

    const totalCreances = creancesEtDettes
      .filter(item => item.type === 'creance' && item.status !== 'paye')
      .reduce((sum, item) => sum + item.amount, 0);
    
    const totalDettes = creancesEtDettes
      .filter(item => item.type === 'dette' && item.status !== 'paye')
      .reduce((sum, item) => sum + item.amount, 0);
    
    console.log(`- Total créances impayées: ${totalCreances.toLocaleString()} MGA`);
    console.log(`- Total dettes impayées: ${totalDettes.toLocaleString()} MGA`);

    console.log('\n✅ Données d\'exemple créées avec succès !');
    
    mongoose.disconnect();
  } catch (err) {
    console.error('❌ Erreur lors de la création des données :', err);
    mongoose.disconnect();
  }
}

seedSampleData();