const mongoose = require('mongoose');
const path = require('path');

const documentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Le nom du document est requis'],
    trim: true,
    maxlength: [255, 'Le nom ne peut pas dépasser 255 caractères']
  },
  originalName: {
    type: String,
    required: [true, 'Le nom original est requis']
  },
  type: {
    type: String,
    required: [true, 'Le type de fichier est requis']
  },
  size: {
    type: Number,
    required: [true, 'La taille du fichier est requise'],
    min: [1, 'La taille doit être positive']
  },
  url: {
    type: String,
    required: [true, 'L\'URL du document est requise']
  },
  uploadDate: {
    type: Date,
    required: [true, 'La date d\'upload est requise'],
    default: Date.now
  },
  // Relations avec d'autres entités
  transactionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction'
  },
  creanceDetteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CreanceEtDette'
  },
  immobilisationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Immobilisation'
  },
  stockId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Stock'
  },
  // Catégorisation des documents
  category: {
    type: String,
    enum: [
      'facture',
      'recu',
      'bon_commande',
      'contrat',
      'justificatif',
      'photo',
      'rapport',
      'correspondance',
      'legal',
      'fiscal',
      'autre'
    ],
    default: 'autre'
  },
  subcategory: {
    type: String,
    trim: true,
    maxlength: [100, 'La sous-catégorie ne peut pas dépasser 100 caractères']
  },
  // Métadonnées du document
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'La description ne peut pas dépasser 1000 caractères']
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [50, 'Un tag ne peut pas dépasser 50 caractères']
  }],
  // Informations de fichier
  encoding: String,
  mimetype: String,
  path: {
    type: String,
    required: [true, 'Le chemin du fichier est requis']
  },
  filename: {
    type: String,
    required: [true, 'Le nom de fichier est requis']
  },
  // Sécurité et accès
  isPublic: {
    type: Boolean,
    default: false
  },
  accessLevel: {
    type: String,
    enum: ['public', 'internal', 'restricted', 'confidential'],
    default: 'internal'
  },
  allowedUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  // Versioning
  version: {
    type: Number,
    default: 1,
    min: [1, 'La version doit être au moins 1']
  },
  parentDocument: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document'
  },
  isLatestVersion: {
    type: Boolean,
    default: true
  },
  // Statut et cycle de vie
  status: {
    type: String,
    enum: ['actif', 'archive', 'supprime', 'en_revision'],
    default: 'actif'
  },
  expiryDate: Date,
  isArchived: {
    type: Boolean,
    default: false
  },
  archivedDate: Date,
  // Informations de traitement
  isProcessed: {
    type: Boolean,
    default: false
  },
  ocrText: {
    type: String,
    maxlength: [10000, 'Le texte OCR ne peut pas dépasser 10000 caractères']
  },
  extractedData: {
    amount: Number,
    date: Date,
    vendor: String,
    invoiceNumber: String,
    vatAmount: Number,
    totalAmount: Number
  },
  // Checksums pour vérifier l'intégrité
  checksum: {
    type: String,
    maxlength: [128, 'Le checksum ne peut pas dépasser 128 caractères']
  },
  // Audit trail
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  modifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  downloadCount: {
    type: Number,
    default: 0,
    min: [0, 'Le nombre de téléchargements ne peut pas être négatif']
  },
  lastAccessDate: Date,
  // Historique des actions
  accessHistory: [{
    action: {
      type: String,
      enum: ['view', 'download', 'edit', 'share', 'delete'],
      required: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    date: {
      type: Date,
      default: Date.now
    },
    ipAddress: String,
    userAgent: String
  }]
}, {
  timestamps: true,
  collection: 'documents'
});

// Index pour améliorer les performances
documentSchema.index({ category: 1, status: 1 });
documentSchema.index({ uploadDate: -1 });
documentSchema.index({ transactionId: 1 });
documentSchema.index({ creanceDetteId: 1 });
documentSchema.index({ immobilisationId: 1 });
documentSchema.index({ stockId: 1 });
documentSchema.index({ uploadedBy: 1 });
documentSchema.index({ tags: 1 });

// Index de recherche textuelle
documentSchema.index({
  name: 'text',
  description: 'text',
  tags: 'text',
  ocrText: 'text',
  'extractedData.vendor': 'text'
});

// Index pour les documents expirés
documentSchema.index({ expiryDate: 1, status: 1 });

// Méthode virtuelle pour obtenir l'extension du fichier
documentSchema.virtual('extension').get(function() {
  return path.extname(this.name);
});

// Méthode virtuelle pour vérifier si le document est une image
documentSchema.virtual('isImage').get(function() {
  const imageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/bmp', 'image/webp'];
  return imageTypes.includes(this.mimetype);
});

// Méthode virtuelle pour vérifier si le document est un PDF
documentSchema.virtual('isPdf').get(function() {
  return this.mimetype === 'application/pdf';
});

// Méthode virtuelle pour formater la taille
documentSchema.virtual('formattedSize').get(function() {
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  if (this.size === 0) return '0 Byte';
  const i = Math.floor(Math.log(this.size) / Math.log(1024));
  return Math.round((this.size / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i];
});

// Méthode pour enregistrer un accès au document
documentSchema.methods.recordAccess = function(action, userId, ipAddress = '', userAgent = '') {
  this.accessHistory.unshift({
    action: action,
    user: userId,
    ipAddress: ipAddress,
    userAgent: userAgent
  });
  
  // Garder seulement les 50 derniers accès
  if (this.accessHistory.length > 50) {
    this.accessHistory = this.accessHistory.slice(0, 50);
  }
  
  this.lastAccessDate = new Date();
  
  if (action === 'download') {
    this.downloadCount += 1;
  }
  
  return this.save();
};

// Méthode pour créer une nouvelle version du document
documentSchema.methods.createNewVersion = function(newDocumentData) {
  // Marquer la version actuelle comme non-latest
  this.isLatestVersion = false;
  
  // Créer le nouveau document avec version incrémentée
  const newDocument = new this.constructor({
    ...newDocumentData,
    version: this.version + 1,
    parentDocument: this._id,
    isLatestVersion: true
  });
  
  return Promise.all([this.save(), newDocument.save()]);
};

// Méthode pour archiver le document
documentSchema.methods.archive = function() {
  this.status = 'archive';
  this.isArchived = true;
  this.archivedDate = new Date();
  return this.save();
};

// Méthode statique pour obtenir les documents par entité
documentSchema.statics.getByEntity = function(entityType, entityId) {
  const query = { status: 'actif' };
  query[`${entityType}Id`] = entityId;
  return this.find(query).populate('uploadedBy', 'name email');
};

// Méthode statique pour rechercher des documents
documentSchema.statics.search = function(searchTerm, filters = {}) {
  let query = { status: 'actif' };
  
  if (searchTerm) {
    query.$text = { $search: searchTerm };
  }
  
  // Appliquer les filtres
  if (filters.category) query.category = filters.category;
  if (filters.type) query.type = { $regex: filters.type, $options: 'i' };
  if (filters.uploadedBy) query.uploadedBy = filters.uploadedBy;
  if (filters.dateFrom) query.uploadDate = { $gte: new Date(filters.dateFrom) };
  if (filters.dateTo) {
    query.uploadDate = query.uploadDate || {};
    query.uploadDate.$lte = new Date(filters.dateTo);
  }
  
  return this.find(query)
    .populate('uploadedBy', 'name email')
    .populate('transactionId', 'reference description')
    .sort({ uploadDate: -1 });
};

// Méthode statique pour obtenir les documents expirés
documentSchema.statics.getExpiredDocuments = function() {
  return this.find({
    expiryDate: { $lt: new Date() },
    status: 'actif'
  }).populate('uploadedBy', 'name email');
};

// Méthode statique pour obtenir les statistiques de stockage
documentSchema.statics.getStorageStats = function() {
  return this.aggregate([
    { $match: { status: 'actif' } },
    {
      $group: {
        _id: '$category',
        totalSize: { $sum: '$size' },
        count: { $sum: 1 },
        avgSize: { $avg: '$size' }
      }
    },
    { $sort: { totalSize: -1 } }
  ]);
};

// Middleware pour générer l'URL automatiquement
documentSchema.pre('save', function(next) {
  if (this.isNew && !this.url) {
    this.url = `/api/documents/${this._id}/download`;
  }
  next();
});

// Middleware pour maintenir les relations de versioning
documentSchema.pre('save', function(next) {
  if (this.isNew && this.parentDocument) {
    // Si c'est une nouvelle version, s'assurer que les autres versions ne sont plus "latest"
    this.constructor.updateMany(
      { parentDocument: this.parentDocument, _id: { $ne: this._id } },
      { isLatestVersion: false }
    ).exec();
  }
  next();
});

module.exports = mongoose.model('Document', documentSchema);