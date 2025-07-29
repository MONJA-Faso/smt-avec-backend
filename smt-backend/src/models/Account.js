const mongoose = require('mongoose');

const accountSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Le nom du compte est requis'],
    trim: true,
    maxlength: [100, 'Le nom ne peut pas dépasser 100 caractères']
  },
  type: {
    type: String,
    required: [true, 'Le type de compte est requis'],
    enum: {
      values: ['caisse', 'banque', 'ccp', 'capital'],
      message: 'Le type doit être: caisse, banque, ccp ou capital'
    }
  },
  balance: {
    type: Number,
    required: [true, 'Le solde est requis'],
    default: 0
  },
  currency: {
    type: String,
    required: [true, 'La devise est requise'],
    default: 'MGA',
    uppercase: true,
    maxlength: [3, 'La devise ne peut pas dépasser 3 caractères']
  },
  accountNumber: {
    type: String,
    trim: true,
    sparse: true // Permet d'avoir des valeurs null/undefined multiples
  },
  bankName: {
    type: String,
    trim: true
  },
  bankBranch: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'La description ne peut pas dépasser 500 caractères']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  openingDate: {
    type: Date,
    default: Date.now
  },
  closingDate: {
    type: Date
  },
  lastTransactionDate: {
    type: Date
  },
  // Informations pour la réconciliation bancaire
  lastReconciliationDate: {
    type: Date
  },
  reconciledBalance: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  collection: 'accounts'
});

// Index pour améliorer les performances
accountSchema.index({ type: 1, isActive: 1 });
accountSchema.index({ accountNumber: 1 }, { sparse: true });

// Méthode virtuelle pour calculer le solde formaté
accountSchema.virtual('formattedBalance').get(function() {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: this.currency || 'MGA',
    minimumFractionDigits: 0
  }).format(this.balance);
});

// Méthode pour mettre à jour le solde
accountSchema.methods.updateBalance = function(amount, isCredit = true) {
  if (isCredit) {
    this.balance += amount;
  } else {
    this.balance -= amount;
  }
  this.lastTransactionDate = new Date();
  return this.save();
};

// Méthode statique pour obtenir le total des soldes par type
accountSchema.statics.getTotalByType = function(type) {
  return this.aggregate([
    { $match: { type, isActive: true } },
    { $group: { _id: null, total: { $sum: '$balance' } } }
  ]);
};

// Méthode statique pour obtenir le solde total de trésorerie
accountSchema.statics.getTotalTreasury = function() {
  return this.aggregate([
    { 
      $match: { 
        type: { $in: ['caisse', 'banque', 'ccp'] }, 
        isActive: true 
      } 
    },
    { $group: { _id: null, total: { $sum: '$balance' } } }
  ]);
};

// Middleware pour valider les types de comptes spéciaux
accountSchema.pre('save', function(next) {
  // Validation spécifique pour les comptes bancaires
  if (this.type === 'banque' && !this.accountNumber) {
    next(new Error('Le numéro de compte est requis pour les comptes bancaires'));
  }
  
  // Validation pour s'assurer qu'il n'y a qu'un seul compte capital actif
  if (this.type === 'capital' && this.isActive) {
    this.constructor.findOne({ 
      type: 'capital', 
      isActive: true, 
      _id: { $ne: this._id } 
    })
    .then(existingCapital => {
      if (existingCapital) {
        next(new Error('Il ne peut y avoir qu\'un seul compte capital actif'));
      } else {
        next();
      }
    })
    .catch(next);
  } else {
    next();
  }
});

module.exports = mongoose.model('Account', accountSchema);