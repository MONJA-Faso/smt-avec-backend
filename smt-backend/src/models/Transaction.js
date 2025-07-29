const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: [true, 'La date est requise'],
    default: Date.now
  },
  type: {
    type: String,
    required: [true, 'Le type de transaction est requis'],
    enum: {
      values: ['recette', 'depense'],
      message: 'Le type doit être: recette ou depense'
    }
  },
  amount: {
    type: Number,
    required: [true, 'Le montant est requis'],
    min: [0.01, 'Le montant doit être positif']
  },
  description: {
    type: String,
    required: [true, 'La description est requise'],
    trim: true,
    maxlength: [500, 'La description ne peut pas dépasser 500 caractères']
  },
  accountId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
    required: [true, 'Le compte est requis']
  },
  category: {
    type: String,
    required: [true, 'La catégorie est requise'],
    trim: true,
    maxlength: [100, 'La catégorie ne peut pas dépasser 100 caractères']
  },
  subcategory: {
    type: String,
    trim: true,
    maxlength: [100, 'La sous-catégorie ne peut pas dépasser 100 caractères']
  },
  reference: {
    type: String,
    trim: true,
    maxlength: [50, 'La référence ne peut pas dépasser 50 caractères']
  },
  documentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document'
  },
  // Informations supplémentaires
  paymentMethod: {
    type: String,
    enum: ['especes', 'cheque', 'virement', 'carte', 'autre'],
    default: 'especes'
  },
  vatAmount: {
    type: Number,
    default: 0
  },
  vatRate: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  isVatIncluded: {
    type: Boolean,
    default: false
  },
  thirdParty: {
    name: String,
    contact: String,
    address: String
  },
  notes: {
    type: String,
    maxlength: [1000, 'Les notes ne peuvent pas dépasser 1000 caractères']
  },
  isReconciled: {
    type: Boolean,
    default: false
  },
  reconciledDate: Date,
  // Audit trail
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  modifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: Date,
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  collection: 'transactions'
});

// Index pour améliorer les performances
transactionSchema.index({ date: -1 });
transactionSchema.index({ type: 1, date: -1 });
transactionSchema.index({ accountId: 1, date: -1 });
transactionSchema.index({ category: 1, subcategory: 1 });
transactionSchema.index({ reference: 1 });
transactionSchema.index({ isDeleted: 1 });

// Index composé pour les requêtes de recherche
transactionSchema.index({ 
  description: 'text', 
  category: 'text', 
  subcategory: 'text', 
  reference: 'text',
  'thirdParty.name': 'text',
  notes: 'text'
});

// Méthode virtuelle pour formater le montant
transactionSchema.virtual('formattedAmount').get(function() {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'MGA',
    minimumFractionDigits: 0
  }).format(this.amount);
});

// Méthode virtuelle pour calculer le montant HT
transactionSchema.virtual('amountExcludingVat').get(function() {
  if (this.isVatIncluded && this.vatRate > 0) {
    return this.amount / (1 + this.vatRate / 100);
  }
  return this.amount;
});

// Méthode pour générer une référence automatique
transactionSchema.methods.generateReference = function() {
  const year = this.date.getFullYear();
  const month = String(this.date.getMonth() + 1).padStart(2, '0');
  const prefix = this.type === 'recette' ? 'REC' : 'DEP';
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  
  this.reference = `${prefix}-${year}${month}-${random}`;
  return this.reference;
};

// Méthode statique pour obtenir les statistiques par période
transactionSchema.statics.getStatsByPeriod = function(startDate, endDate, accountId = null) {
  const matchStage = {
    date: { $gte: new Date(startDate), $lte: new Date(endDate) },
    isDeleted: false
  };
  
  if (accountId) {
    matchStage.accountId = new mongoose.Types.ObjectId(accountId);
  }
  
  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$type',
        total: { $sum: '$amount' },
        count: { $sum: 1 },
        avgAmount: { $avg: '$amount' }
      }
    }
  ]);
};

// Méthode statique pour obtenir les transactions par catégorie
transactionSchema.statics.getByCategory = function(startDate, endDate, type = null) {
  const matchStage = {
    date: { $gte: new Date(startDate), $lte: new Date(endDate) },
    isDeleted: false
  };
  
  if (type) {
    matchStage.type = type;
  }
  
  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: { category: '$category', subcategory: '$subcategory' },
        total: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    },
    { $sort: { total: -1 } }
  ]);
};

// Middleware pour soft delete
transactionSchema.methods.softDelete = function(userId) {
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.deletedBy = userId;
  return this.save();
};

// Middleware pour mettre à jour le solde du compte
transactionSchema.post('save', async function(doc) {
  if (doc.isNew && !doc.isDeleted) {
    const Account = mongoose.model('Account');
    const account = await Account.findById(doc.accountId);
    
    if (account) {
      if (doc.type === 'recette') {
        account.balance += doc.amount;
      } else {
        account.balance -= doc.amount;
      }
      account.lastTransactionDate = doc.date;
      await account.save();
    }
  }
});

// Middleware pour restaurer le solde lors d'un soft delete
transactionSchema.post('save', async function(doc) {
  if (doc.isDeleted && doc.isModified('isDeleted')) {
    const Account = mongoose.model('Account');
    const account = await Account.findById(doc.accountId);
    
    if (account) {
      if (doc.type === 'recette') {
        account.balance -= doc.amount;
      } else {
        account.balance += doc.amount;
      }
      await account.save();
    }
  }
});

module.exports = mongoose.model('Transaction', transactionSchema);