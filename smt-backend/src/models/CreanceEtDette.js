const mongoose = require('mongoose');

const creanceEtDetteSchema = new mongoose.Schema({
  type: {
    type: String,
    required: [true, 'Le type est requis'],
    enum: {
      values: ['creance', 'dette'],
      message: 'Le type doit être: creance ou dette'
    }
  },
  name: {
    type: String,
    required: [true, 'Le nom du tiers est requis'],
    trim: true,
    maxlength: [200, 'Le nom ne peut pas dépasser 200 caractères']
  },
  amount: {
    type: Number,
    required: [true, 'Le montant est requis'],
    min: [0.01, 'Le montant doit être positif']
  },
  date: {
    type: Date,
    required: [true, 'La date est requise'],
    default: Date.now
  },
  dueDate: {
    type: Date,
    required: [true, 'La date d\'échéance est requise']
  },
  status: {
    type: String,
    enum: ['en_cours', 'regle', 'en_retard', 'partiellement_regle', 'annule'],
    default: 'en_cours'
  },
  // Informations détaillées du tiers
  contact: {
    email: String,
    phone: String,
    address: String,
    city: String,
    postalCode: String,
    country: {
      type: String,
      default: 'Madagascar'
    }
  },
  // Informations commerciales
  company: {
    name: String,
    registrationNumber: String,
    vatNumber: String,
    industry: String
  },
  // Détails de la créance/dette
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'La description ne peut pas dépasser 1000 caractères']
  },
  reference: {
    type: String,
    trim: true,
    maxlength: [50, 'La référence ne peut pas dépasser 50 caractères']
  },
  originalAmount: {
    type: Number
    // Calculé automatiquement par le hook pre-save : égal à amount lors de la création
  },
  paidAmount: {
    type: Number,
    default: 0,
    min: [0, 'Le montant payé ne peut pas être négatif']
  },
  remainingAmount: {
    type: Number,
    min: [0, 'Le montant restant ne peut pas être négatif']
  },
  // Conditions de paiement
  paymentTerms: {
    type: String,
    maxlength: [200, 'Les conditions de paiement ne peuvent pas dépasser 200 caractères']
  },
  interestRate: {
    type: Number,
    default: 0,
    min: [0, 'Le taux d\'intérêt ne peut pas être négatif'],
    max: [100, 'Le taux d\'intérêt ne peut pas dépasser 100%']
  },
  lateFees: {
    type: Number,
    default: 0,
    min: [0, 'Les pénalités ne peuvent pas être négatives']
  },
  // Historique des paiements
  payments: [{
    amount: {
      type: Number,
      required: true,
      min: [0.01, 'Le montant du paiement doit être positif']
    },
    date: {
      type: Date,
      required: true,
      default: Date.now
    },
    method: {
      type: String,
      enum: ['especes', 'cheque', 'virement', 'carte', 'compensation', 'autre'],
      default: 'especes'
    },
    reference: String,
    notes: String,
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  // Échéancier (pour les paiements échelonnés)
  schedule: [{
    dueDate: {
      type: Date,
      required: true
    },
    amount: {
      type: Number,
      required: true,
      min: [0.01, 'Le montant de l\'échéance doit être positif']
    },
    status: {
      type: String,
      enum: ['en_attente', 'paye', 'en_retard'],
      default: 'en_attente'
    },
    paidDate: Date,
    paidAmount: {
      type: Number,
      default: 0
    }
  }],
  // Garanties et sûretés
  guarantees: [{
    type: {
      type: String,
      enum: ['caution', 'hypotheque', 'nantissement', 'gage', 'autre']
    },
    description: String,
    amount: Number,
    guarantor: String
  }],
  // Correspondances et documents
  documents: [{
    name: String,
    type: String,
    url: String,
    uploadDate: {
      type: Date,
      default: Date.now
    }
  }],
  // Suivi et rappels
  lastReminderDate: Date,
  nextReminderDate: Date,
  reminderCount: {
    type: Number,
    default: 0
  },
  notes: {
    type: String,
    maxlength: [2000, 'Les notes ne peuvent pas dépasser 2000 caractères']
  },
  // Informations de recouvrement
  recoveryAction: {
    status: {
      type: String,
      enum: ['aucune', 'mise_en_demeure', 'procedure_judiciaire', 'recouvrement_amiable'],
      default: 'aucune'
    },
    startDate: Date,
    lawyer: String,
    costs: {
      type: Number,
      default: 0
    }
  },
  // Lien avec les transactions
  relatedTransactions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction'
  }],
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
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  collection: 'creances_et_dettes'
});

// Index pour améliorer les performances
creanceEtDetteSchema.index({ type: 1, status: 1 });
creanceEtDetteSchema.index({ dueDate: 1, status: 1 });
creanceEtDetteSchema.index({ name: 1, type: 1 });
creanceEtDetteSchema.index({ reference: 1 });
creanceEtDetteSchema.index({ amount: -1 });

// Index de recherche textuelle
creanceEtDetteSchema.index({
  name: 'text',
  description: 'text',
  reference: 'text',
  'company.name': 'text'
});

// Méthode virtuelle pour calculer les jours de retard
creanceEtDetteSchema.virtual('daysOverdue').get(function() {
  if (this.status === 'regle' || this.status === 'annule') return 0;
  const today = new Date();
  const dueDate = new Date(this.dueDate);
  if (today <= dueDate) return 0;
  
  const diffTime = today - dueDate;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Méthode virtuelle pour vérifier si c'est en retard
creanceEtDetteSchema.virtual('isOverdue').get(function() {
  return this.daysOverdue > 0 && this.status === 'en_cours';
});

// Méthode pour ajouter un paiement
creanceEtDetteSchema.methods.addPayment = function(amount, method = 'especes', reference = '', notes = '', userId) {
  if (amount <= 0) {
    throw new Error('Le montant du paiement doit être positif');
  }
  
  if (amount > this.remainingAmount) {
    throw new Error('Le montant du paiement ne peut pas dépasser le montant restant');
  }
  
  // Ajouter le paiement à l'historique
  this.payments.push({
    amount: amount,
    method: method,
    reference: reference,
    notes: notes,
    createdBy: userId
  });
  
  // Mettre à jour les montants
  this.paidAmount += amount;
  this.remainingAmount = this.originalAmount - this.paidAmount;
  
  // Mettre à jour le statut
  if (this.remainingAmount === 0) {
    this.status = 'regle';
  } else if (this.paidAmount > 0) {
    this.status = 'partiellement_regle';
  }
  
  return this.save();
};

// Méthode pour calculer les intérêts de retard
creanceEtDetteSchema.methods.calculateLateFees = function() {
  if (this.interestRate === 0 || !this.isOverdue) return 0;
  
  const daysOverdue = this.daysOverdue;
  const dailyRate = this.interestRate / 365 / 100;
  return this.remainingAmount * dailyRate * daysOverdue;
};

// Méthode pour programmer un rappel
creanceEtDetteSchema.methods.scheduleReminder = function(reminderDate) {
  this.nextReminderDate = reminderDate;
  this.reminderCount += 1;
  this.lastReminderDate = new Date();
  return this.save();
};

// Méthode statique pour obtenir les créances/dettes en retard
creanceEtDetteSchema.statics.getOverdueItems = function(type = null) {
  const query = {
    dueDate: { $lt: new Date() },
    status: { $in: ['en_cours', 'partiellement_regle'] },
    isActive: true
  };
  
  if (type) {
    query.type = type;
  }
  
  return this.find(query)
    .populate('createdBy', 'name email')
    .sort({ dueDate: 1 });
};

// Méthode statique pour obtenir les statistiques par type
creanceEtDetteSchema.statics.getStatsByType = function() {
  return this.aggregate([
    { $match: { isActive: true } },
    {
      $group: {
        _id: { type: '$type', status: '$status' },
        totalAmount: { $sum: '$amount' },
        remainingAmount: { $sum: '$remainingAmount' },
        count: { $sum: 1 }
      }
    },
    { $sort: { '_id.type': 1, '_id.status': 1 } }
  ]);
};

// Méthode statique pour obtenir les échéances à venir
creanceEtDetteSchema.statics.getUpcomingDueDates = function(days = 7) {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);
  
  return this.find({
    dueDate: { $gte: new Date(), $lte: futureDate },
    status: { $in: ['en_cours', 'partiellement_regle'] },
    isActive: true
  }).sort({ dueDate: 1 });
};

// Middleware pour calculer automatiquement le montant restant
creanceEtDetteSchema.pre('save', function(next) {
  if (this.isNew) {
    this.originalAmount = this.amount;
    this.remainingAmount = this.amount;
  } else if (this.isModified('paidAmount')) {
    this.remainingAmount = this.originalAmount - this.paidAmount;
  }
  
  // Mettre à jour le statut automatiquement
  if (this.remainingAmount === 0 && this.status !== 'regle') {
    this.status = 'regle';
  } else if (this.daysOverdue > 0 && this.status === 'en_cours') {
    this.status = 'en_retard';
  }
  
  next();
});

// Middleware pour générer une référence automatique
creanceEtDetteSchema.pre('save', function(next) {
  if (this.isNew && !this.reference) {
    const year = this.date.getFullYear();
    const month = String(this.date.getMonth() + 1).padStart(2, '0');
    const prefix = this.type === 'creance' ? 'CR' : 'DT';
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    
    this.reference = `${prefix}-${year}${month}-${random}`;
  }
  next();
});

module.exports = mongoose.model('CreanceEtDette', creanceEtDetteSchema);