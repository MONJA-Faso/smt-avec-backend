const mongoose = require('mongoose');

const immobilisationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Le nom de l\'immobilisation est requis'],
    trim: true,
    maxlength: [200, 'Le nom ne peut pas dépasser 200 caractères']
  },
  purchaseDate: {
    type: Date,
    required: [true, 'La date d\'achat est requise']
  },
  purchaseAmount: {
    type: Number,
    required: [true, 'Le montant d\'achat est requis'],
    min: [0.01, 'Le montant d\'achat doit être positif']
  },
  duration: {
    type: Number,
    required: [true, 'La durée d\'amortissement est requise'],
    min: [1, 'La durée doit être d\'au moins 1 an'],
    max: [50, 'La durée ne peut pas dépasser 50 ans']
  },
  currentValue: {
    type: Number,
    required: [true, 'La valeur actuelle est requise'],
    min: [0, 'La valeur actuelle ne peut pas être négative']
  },
  amortisationRate: {
    type: Number,
    required: [true, 'Le taux d\'amortissement est requis'],
    min: [0, 'Le taux d\'amortissement ne peut pas être négatif'],
    max: [100, 'Le taux d\'amortissement ne peut pas dépasser 100%']
  },
  category: {
    type: String,
    required: [true, 'La catégorie est requise'],
    enum: {
      values: [
        'Matériel informatique',
        'Matériel de transport',
        'Mobilier de bureau',
        'Machines et équipements',
        'Installations techniques',
        'Constructions',
        'Terrains',
        'Autres immobilisations'
      ],
      message: 'Catégorie d\'immobilisation non valide'
    }
  },
  // Informations détaillées
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'La description ne peut pas dépasser 1000 caractères']
  },
  serialNumber: {
    type: String,
    trim: true,
    maxlength: [100, 'Le numéro de série ne peut pas dépasser 100 caractères']
  },
  supplier: {
    name: String,
    contact: String,
    address: String
  },
  location: {
    type: String,
    trim: true,
    maxlength: [200, 'L\'emplacement ne peut pas dépasser 200 caractères']
  },
  // Informations d'amortissement
  amortisationType: {
    type: String,
    enum: ['lineaire', 'degressif', 'progressif'],
    default: 'lineaire'
  },
  yearlyAmortisation: {
    type: Number,
    min: [0, 'L\'amortissement annuel ne peut pas être négatif']
  },
  accumulatedAmortisation: {
    type: Number,
    default: 0,
    min: [0, 'L\'amortissement cumulé ne peut pas être négatif']
  },
  residualValue: {
    type: Number,
    default: 0,
    min: [0, 'La valeur résiduelle ne peut pas être négative']
  },
  // État et statut
  status: {
    type: String,
    enum: ['en_service', 'hors_service', 'en_reparation', 'cede', 'detruit'],
    default: 'en_service'
  },
  isFullyAmortised: {
    type: Boolean,
    default: false
  },
  disposalDate: Date,
  disposalAmount: Number,
  disposalReason: String,
  // Informations fiscales
  fiscalCategory: String,
  fiscalRate: Number,
  // Assurance et maintenance
  insurance: {
    company: String,
    policyNumber: String,
    expiryDate: Date,
    coverage: Number
  },
  maintenance: {
    lastMaintenanceDate: Date,
    nextMaintenanceDate: Date,
    maintenanceContract: String,
    cost: Number
  },
  // Audit trail
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  modifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  collection: 'immobilisations'
});

// Index pour améliorer les performances
immobilisationSchema.index({ category: 1, status: 1 });
immobilisationSchema.index({ purchaseDate: -1 });
immobilisationSchema.index({ serialNumber: 1 }, { sparse: true });
immobilisationSchema.index({ isFullyAmortised: 1 });

// Index de recherche textuelle
immobilisationSchema.index({
  name: 'text',
  description: 'text',
  serialNumber: 'text',
  'supplier.name': 'text'
});

// Méthode virtuelle pour calculer l'âge en années
immobilisationSchema.virtual('ageInYears').get(function() {
  const now = new Date();
  const purchaseDate = new Date(this.purchaseDate);
  return Math.floor((now - purchaseDate) / (365.25 * 24 * 60 * 60 * 1000));
});

// Méthode virtuelle pour calculer le pourcentage d'amortissement
immobilisationSchema.virtual('amortisationPercentage').get(function() {
  if (this.purchaseAmount === 0) return 0;
  return (this.accumulatedAmortisation / this.purchaseAmount) * 100;
});

// Méthode pour calculer l'amortissement annuel
immobilisationSchema.methods.calculateYearlyAmortisation = function() {
  switch (this.amortisationType) {
    case 'lineaire':
      this.yearlyAmortisation = (this.purchaseAmount - this.residualValue) / this.duration;
      break;
    case 'degressif':
      // Calcul d'amortissement dégressif simplifié
      const remainingValue = this.currentValue - this.residualValue;
      this.yearlyAmortisation = remainingValue * (this.amortisationRate / 100);
      break;
    default:
      this.yearlyAmortisation = (this.purchaseAmount - this.residualValue) / this.duration;
  }
  return this.yearlyAmortisation;
};

// Méthode pour mettre à jour la valeur actuelle
immobilisationSchema.methods.updateCurrentValue = function() {
  const ageInYears = this.ageInYears;
  const totalAmortisation = Math.min(
    this.yearlyAmortisation * ageInYears,
    this.purchaseAmount - this.residualValue
  );
  
  this.accumulatedAmortisation = totalAmortisation;
  this.currentValue = this.purchaseAmount - totalAmortisation;
  
  // Vérifier si l'immobilisation est complètement amortie
  this.isFullyAmortised = this.currentValue <= this.residualValue;
  
  return this.save();
};

// Méthode statique pour calculer la valeur totale par catégorie
immobilisationSchema.statics.getTotalValueByCategory = function() {
  return this.aggregate([
    { $match: { status: { $in: ['en_service', 'en_reparation'] } } },
    {
      $group: {
        _id: '$category',
        totalPurchaseValue: { $sum: '$purchaseAmount' },
        totalCurrentValue: { $sum: '$currentValue' },
        count: { $sum: 1 }
      }
    },
    { $sort: { totalCurrentValue: -1 } }
  ]);
};

// Méthode statique pour obtenir les immobilisations nécessitant une maintenance
immobilisationSchema.statics.getMaintenanceDue = function() {
  const today = new Date();
  return this.find({
    status: 'en_service',
    'maintenance.nextMaintenanceDate': { $lte: today }
  }).populate('createdBy', 'name email');
};

// Middleware pour calculer automatiquement certains champs
immobilisationSchema.pre('save', function(next) {
  // Calculer le taux d'amortissement si non fourni
  if (!this.amortisationRate && this.duration) {
    this.amortisationRate = 100 / this.duration;
  }
  
  // Calculer l'amortissement annuel si non fourni
  if (!this.yearlyAmortisation) {
    this.calculateYearlyAmortisation();
  }
  
  // Calculer la valeur actuelle si c'est une nouvelle immobilisation
  if (this.isNew) {
    this.currentValue = this.purchaseAmount;
    this.accumulatedAmortisation = 0;
  }
  
  next();
});

// Méthode pour céder une immobilisation
immobilisationSchema.methods.dispose = function(disposalAmount, reason) {
  this.status = 'cede';
  this.disposalDate = new Date();
  this.disposalAmount = disposalAmount;
  this.disposalReason = reason;
  
  // Calculer la plus-value ou moins-value
  const gainOrLoss = disposalAmount - this.currentValue;
  
  return {
    asset: this.save(),
    gainOrLoss: gainOrLoss
  };
};

module.exports = mongoose.model('Immobilisation', immobilisationSchema);