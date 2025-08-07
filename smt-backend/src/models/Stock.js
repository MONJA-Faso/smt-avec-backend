const mongoose = require('mongoose');

const stockSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Le nom du produit est requis'],
    trim: true,
    maxlength: [200, 'Le nom ne peut pas dépasser 200 caractères']
  },
  category: {
    type: String,
    required: [true, 'La catégorie est requise'],
    enum: {
      values: ['produits', 'marchandises', 'matieres_premieres'],
      message: 'La catégorie doit être: produits, marchandises ou matieres_premieres'
    }
  },
  quantity: {
    type: Number,
    required: [true, 'La quantité est requise'],
    min: [0, 'La quantité ne peut pas être négative']
  },
  unitPrice: {
    type: Number,
    required: [true, 'Le prix unitaire est requis'],
    min: [0, 'Le prix unitaire ne peut pas être négatif']
  },
  totalValue: {
    type: Number,
    required: [true, 'La valeur totale est requise'],
    min: [0, 'La valeur totale ne peut pas être négative']
  },
  date: {
    type: Date,
    required: [true, 'La date est requise'],
    default: Date.now
  },
  // Informations détaillées du produit
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'La description ne peut pas dépasser 1000 caractères']
  },
  sku: {
    type: String,
    trim: true,
    unique: true,
    sparse: true,
    maxlength: [50, 'Le SKU ne peut pas dépasser 50 caractères']
  },
  barcode: {
    type: String,
    trim: true,
    sparse: true,
    maxlength: [50, 'Le code-barres ne peut pas dépasser 50 caractères']
  },
  unit: {
    type: String,
    required: [true, 'L\'unité de mesure est requise'],
    enum: ['piece', 'kg', 'litre', 'metre', 'tonne', 'carton', 'paquet', 'autre'],
    default: 'piece'
  },
  // Gestion des stocks
  minQuantity: {
    type: Number,
    default: 0,
    min: [0, 'La quantité minimale ne peut pas être négative']
  },
  maxQuantity: {
    type: Number,
    min: [0, 'La quantité maximale ne peut pas être négative']
  },
  reorderPoint: {
    type: Number,
    default: 0,
    min: [0, 'Le point de réapprovisionnement ne peut pas être négatif']
  },
  // Localisation
  location: {
    warehouse: String,
    aisle: String,
    shelf: String,
    bin: String
  },
  // Informations fournisseur
  supplier: {
    name: String,
    contact: String,
    email: String,
    phone: String,
    address: String
  },
  // Coûts et prix
  costPrice: {
    type: Number,
    min: [0, 'Le prix de revient ne peut pas être négatif']
  },
  sellingPrice: {
    type: Number,
    min: [0, 'Le prix de vente ne peut pas être négatif']
  },
  lastPurchasePrice: {
    type: Number,
    min: [0, 'Le dernier prix d\'achat ne peut pas être négatif']
  },
  lastPurchaseDate: Date,
  // Dates importantes
  expiryDate: Date,
  manufactureDate: Date,
  lastSaleDate: Date,
  lastStockDate: Date,
  // État et statut
  status: {
    type: String,
    enum: ['actif', 'inactif', 'discontinue', 'en_commande'],
    default: 'actif'
  },
  isTracked: {
    type: Boolean,
    default: true
  },
  // Informations fiscales
  vatRate: {
    type: Number,
    default: 0,
    min: [0, 'Le taux de TVA ne peut pas être négatif'],
    max: [100, 'Le taux de TVA ne peut pas dépasser 100%']
  },
  // Mouvements de stock récents (sous-document)
  recentMovements: [{
    type: {
      type: String,
      enum: ['entree', 'sortie', 'ajustement', 'inventaire'],
      required: true
    },
    quantity: {
      type: Number,
      required: true
    },
    unitPrice: Number,
    date: {
      type: Date,
      default: Date.now
    },
    reason: String,
    reference: String,
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
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
  }
}, {
  timestamps: true,
  collection: 'stocks'
});

// Index pour améliorer les performances
stockSchema.index({ category: 1, status: 1 });
stockSchema.index({ quantity: 1 });
// Suppression de l'index sku pour éviter doublon
// stockSchema.index({ sku: 1 }, { sparse: true });
stockSchema.index({ barcode: 1 }, { sparse: true });
stockSchema.index({ 'supplier.name': 1 });

// Index de recherche textuelle
stockSchema.index({
  name: 'text',
  description: 'text',
  sku: 'text',
  'supplier.name': 'text'
});

// Index pour les alertes de stock
stockSchema.index({ quantity: 1, reorderPoint: 1 });

// Méthode virtuelle pour calculer la marge
stockSchema.virtual('margin').get(function() {
  if (!this.costPrice || !this.sellingPrice) return 0;
  return ((this.sellingPrice - this.costPrice) / this.sellingPrice) * 100;
});

// Méthode virtuelle pour vérifier si le stock est bas
stockSchema.virtual('isLowStock').get(function() {
  return this.quantity <= this.reorderPoint;
});

// Méthode virtuelle pour vérifier si le produit est périmé
stockSchema.virtual('isExpired').get(function() {
  return this.expiryDate && this.expiryDate < new Date();
});

// Méthode pour ajouter du stock
stockSchema.methods.addStock = function(quantity, unitPrice, reason = 'Approvisionnement', userId) {
  const oldQuantity = this.quantity;
  const oldTotalValue = this.totalValue;
  
  // Calcul du prix moyen pondéré
  const newTotalValue = oldTotalValue + (quantity * unitPrice);
  const newQuantity = oldQuantity + quantity;
  
  this.quantity = newQuantity;
  this.totalValue = newTotalValue;
  this.unitPrice = newTotalValue / newQuantity;
  this.lastStockDate = new Date();
  
  if (unitPrice) {
    this.lastPurchasePrice = unitPrice;
    this.lastPurchaseDate = new Date();
  }
  
  // Ajouter le mouvement
  this.recentMovements.unshift({
    type: 'entree',
    quantity: quantity,
    unitPrice: unitPrice,
    reason: reason,
    createdBy: userId
  });
  
  // Garder seulement les 20 derniers mouvements
  if (this.recentMovements.length > 20) {
    this.recentMovements = this.recentMovements.slice(0, 20);
  }
  
  return this.save();
};

// Méthode pour retirer du stock
stockSchema.methods.removeStock = function(quantity, reason = 'Vente', userId) {
  if (quantity > this.quantity) {
    throw new Error('Quantité insuffisante en stock');
  }
  
  const oldQuantity = this.quantity;
  const newQuantity = oldQuantity - quantity;
  
  // Calcul de la nouvelle valeur totale (prix moyen)
  const unitCost = this.totalValue / this.quantity;
  const newTotalValue = newQuantity * unitCost;
  
  this.quantity = newQuantity;
  this.totalValue = newTotalValue;
  this.lastSaleDate = new Date();
  
  // Ajouter le mouvement
  this.recentMovements.unshift({
    type: 'sortie',
    quantity: -quantity,
    unitPrice: unitCost,
    reason: reason,
    createdBy: userId
  });
  
  // Garder seulement les 20 derniers mouvements
  if (this.recentMovements.length > 20) {
    this.recentMovements = this.recentMovements.slice(0, 20);
  }
  
  return this.save();
};

// Méthode pour ajuster le stock (inventaire)
stockSchema.methods.adjustStock = function(newQuantity, reason = 'Ajustement inventaire', userId) {
  const difference = newQuantity - this.quantity;
  
  this.quantity = newQuantity;
  this.totalValue = newQuantity * this.unitPrice;
  
  // Ajouter le mouvement
  this.recentMovements.unshift({
    type: 'ajustement',
    quantity: difference,
    unitPrice: this.unitPrice,
    reason: reason,
    createdBy: userId
  });
  
  return this.save();
};

// Méthode statique pour obtenir les stocks faibles
stockSchema.statics.getLowStockItems = function() {
  return this.find({
    $expr: { $lte: ['$quantity', '$reorderPoint'] },
    status: 'actif'
  }).populate('createdBy', 'name email');
};

// Méthode statique pour obtenir les produits expirés
stockSchema.statics.getExpiredItems = function() {
  return this.find({
    expiryDate: { $lt: new Date() },
    status: 'actif'
  }).populate('createdBy', 'name email');
};

// Méthode statique pour obtenir la valeur totale du stock par catégorie
stockSchema.statics.getTotalValueByCategory = function() {
  return this.aggregate([
    { $match: { status: 'actif' } },
    {
      $group: {
        _id: '$category',
        totalValue: { $sum: '$totalValue' },
        totalQuantity: { $sum: '$quantity' },
        count: { $sum: 1 }
      }
    },
    { $sort: { totalValue: -1 } }
  ]);
};

// Middleware pour calculer automatiquement la valeur totale
stockSchema.pre('save', function(next) {
  if (this.isModified('quantity') || this.isModified('unitPrice')) {
    this.totalValue = this.quantity * this.unitPrice;
  }
  next();
});

// Middleware pour générer un SKU automatique si non fourni
stockSchema.pre('save', function(next) {
  if (this.isNew && !this.sku) {
    const prefix = this.category.substring(0, 3).toUpperCase();
    const timestamp = Date.now().toString().slice(-6);
    this.sku = `${prefix}-${timestamp}`;
  }
  next();
});

module.exports = mongoose.model('Stock', stockSchema);
