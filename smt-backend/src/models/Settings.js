const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  // Seuils SMT (Système Minimal de Trésorerie)
  seuils: {
    seuil30M: {
      type: Number,
      required: [true, 'Le seuil 30M est requis'],
      default: 30000000,
      min: [0, 'Le seuil ne peut pas être négatif']
    },
    seuil20M: {
      type: Number,
      required: [true, 'Le seuil 20M est requis'],
      default: 20000000,
      min: [0, 'Le seuil ne peut pas être négatif']
    },
    seuil10M: {
      type: Number,
      required: [true, 'Le seuil 10M est requis'],
      default: 10000000,
      min: [0, 'Le seuil ne peut pas être négatif']
    }
  },
  
  // Exercice comptable
  exercice: {
    dateDebut: {
      type: Date,
      required: [true, 'La date de début d\'exercice est requise'],
      default: () => new Date(new Date().getFullYear(), 0, 1) // 1er janvier de l'année courante
    },
    dateFin: {
      type: Date,
      required: [true, 'La date de fin d\'exercice est requise'],
      default: () => new Date(new Date().getFullYear(), 11, 31) // 31 décembre de l'année courante
    }
  },
  
  // Configuration TVA
  tva: {
    taux: {
      type: Number,
      required: [true, 'Le taux de TVA est requis'],
      default: 18,
      min: [0, 'Le taux de TVA ne peut pas être négatif'],
      max: [100, 'Le taux de TVA ne peut pas dépasser 100%']
    },
    incluse: {
      type: Boolean,
      default: false
    },
    numeroTva: {
      type: String,
      trim: true,
      maxlength: [50, 'Le numéro TVA ne peut pas dépasser 50 caractères']
    }
  },
  
  // Informations de l'entreprise
  entreprise: {
    nom: {
      type: String,
      required: [true, 'Le nom de l\'entreprise est requis'],
      trim: true,
      maxlength: [200, 'Le nom ne peut pas dépasser 200 caractères']
    },
    adresse: {
      type: String,
      required: [true, 'L\'adresse est requise'],
      trim: true,
      maxlength: [500, 'L\'adresse ne peut pas dépasser 500 caractères']
    },
    ville: {
      type: String,
      trim: true,
      maxlength: [100, 'La ville ne peut pas dépasser 100 caractères']
    },
    codePostal: {
      type: String,
      trim: true,
      maxlength: [20, 'Le code postal ne peut pas dépasser 20 caractères']
    },
    pays: {
      type: String,
      default: 'Madagascar',
      trim: true,
      maxlength: [100, 'Le pays ne peut pas dépasser 100 caractères']
    },
    telephone: {
      type: String,
      required: [true, 'Le téléphone est requis'],
      trim: true,
      maxlength: [50, 'Le téléphone ne peut pas dépasser 50 caractères']
    },
    email: {
      type: String,
      required: [true, 'L\'email est requis'],
      trim: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Veuillez entrer un email valide'
      ]
    },
    siteWeb: {
      type: String,
      trim: true,
      maxlength: [200, 'Le site web ne peut pas dépasser 200 caractères']
    },
    logo: {
      type: String,
      trim: true
    }
  },
  
  // Informations légales
  legal: {
    formeJuridique: {
      type: String,
      enum: ['SARL', 'SA', 'SAS', 'EURL', 'Entreprise individuelle', 'Association', 'Autre'],
      default: 'SARL'
    },
    numeroRegistre: {
      type: String,
      trim: true,
      maxlength: [50, 'Le numéro de registre ne peut pas dépasser 50 caractères']
    },
    capital: {
      type: Number,
      min: [0, 'Le capital ne peut pas être négatif']
    },
    devise: {
      type: String,
      default: 'MGA',
      uppercase: true,
      maxlength: [3, 'La devise ne peut pas dépasser 3 caractères']
    }
  },
  
  // Configuration de la numérotation
  numerotation: {
    prefixeTransaction: {
      recette: {
        type: String,
        default: 'REC',
        maxlength: [10, 'Le préfixe ne peut pas dépasser 10 caractères']
      },
      depense: {
        type: String,
        default: 'DEP',
        maxlength: [10, 'Le préfixe ne peut pas dépasser 10 caractères']
      }
    },
    prefixeDocument: {
      type: String,
      default: 'DOC',
      maxlength: [10, 'Le préfixe ne peut pas dépasser 10 caractères']
    },
    formatDate: {
      type: String,
      enum: ['YYYYMM', 'YYYY', 'MMYYYY'],
      default: 'YYYYMM'
    },
    longueurCompteur: {
      type: Number,
      default: 4,
      min: [3, 'La longueur du compteur doit être au moins 3'],
      max: [8, 'La longueur du compteur ne peut pas dépasser 8']
    }
  },
  
  // Configuration des notifications
  notifications: {
    email: {
      enabled: {
        type: Boolean,
        default: true
      },
      alertes: {
        stockFaible: {
          type: Boolean,
          default: true
        },
        echeancesProches: {
          type: Boolean,
          default: true
        },
        retardsReglements: {
          type: Boolean,
          default: true
        },
        seuilsDepasses: {
          type: Boolean,
          default: true
        }
      },
      destinataires: [{
        type: String,
        trim: true,
        lowercase: true
      }]
    },
    dashboard: {
      alertesActives: {
        type: Boolean,
        default: true
      },
      delaiRappel: {
        type: Number,
        default: 7, // jours
        min: [1, 'Le délai de rappel doit être au moins 1 jour']
      }
    }
  },
  
  // Configuration des sauvegardes
  sauvegarde: {
    automatique: {
      type: Boolean,
      default: true
    },
    frequence: {
      type: String,
      enum: ['quotidienne', 'hebdomadaire', 'mensuelle'],
      default: 'hebdomadaire'
    },
    conservation: {
      type: Number,
      default: 30, // jours
      min: [7, 'La durée de conservation doit être au moins 7 jours']
    },
    destination: {
      type: String,
      enum: ['local', 'cloud', 'email'],
      default: 'local'
    }
  },
  
  // Configuration de sécurité
  securite: {
    sessionTimeout: {
      type: Number,
      default: 3600, // secondes (1 heure)
      min: [300, 'Le timeout de session doit être au moins 5 minutes']
    },
    tentativesConnexionMax: {
      type: Number,
      default: 5,
      min: [3, 'Le nombre de tentatives doit être au moins 3']
    },
    dureeVerrouillage: {
      type: Number,
      default: 900, // secondes (15 minutes)
      min: [300, 'La durée de verrouillage doit être au moins 5 minutes']
    },
    motDePasseComplexe: {
      type: Boolean,
      default: true
    },
    auditLog: {
      type: Boolean,
      default: true
    }
  },
  
  // Configuration d'affichage
  affichage: {
    langue: {
      type: String,
      enum: ['fr', 'en', 'mg'],
      default: 'fr'
    },
    fuseau: {
      type: String,
      default: 'Indian/Antananarivo'
    },
    formatDate: {
      type: String,
      enum: ['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'],
      default: 'DD/MM/YYYY'
    },
    formatNombre: {
      type: String,
      enum: ['1,234.56', '1.234,56', '1 234,56'],
      default: '1 234,56'
    },
    theme: {
      type: String,
      enum: ['light', 'dark', 'auto'],
      default: 'light'
    }
  },
  
  // Configuration des rapports
  rapports: {
    formatDefaut: {
      type: String,
      enum: ['PDF', 'Excel', 'CSV'],
      default: 'PDF'
    },
    enTete: {
      type: Boolean,
      default: true
    },
    piedPage: {
      type: Boolean,
      default: true
    },
    logoSurRapports: {
      type: Boolean,
      default: true
    }
  },
  
  // Configuration des intégrations
  integrations: {
    comptabilite: {
      logiciel: String,
      enabled: {
        type: Boolean,
        default: false
      },
      config: mongoose.Schema.Types.Mixed
    },
    banque: {
      enabled: {
        type: Boolean,
        default: false
      },
      config: mongoose.Schema.Types.Mixed
    },
    facturation: {
      enabled: {
        type: Boolean,
        default: false
      },
      config: mongoose.Schema.Types.Mixed
    }
  },
  
  // Métadonnées
  version: {
    type: String,
    default: '1.0.0'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  modifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  collection: 'settings'
});

// S'assurer qu'il n'y a qu'un seul document de paramètres actif
settingsSchema.index({ isActive: 1 }, { unique: true, partialFilterExpression: { isActive: true } });

// Méthode statique pour obtenir les paramètres actifs
settingsSchema.statics.getActiveSettings = function() {
  return this.findOne({ isActive: true });
};

// Méthode statique pour créer les paramètres par défaut
settingsSchema.statics.createDefaultSettings = function() {
  return this.create({
    isActive: true
  });
};

// Méthode pour valider les seuils SMT
settingsSchema.methods.validateSeuils = function() {
  const { seuil10M, seuil20M, seuil30M } = this.seuils;
  
  if (seuil10M >= seuil20M) {
    throw new Error('Le seuil 10M doit être inférieur au seuil 20M');
  }
  
  if (seuil20M >= seuil30M) {
    throw new Error('Le seuil 20M doit être inférieur au seuil 30M');
  }
  
  return true;
};

// Méthode pour déterminer le régime SMT applicable
settingsSchema.methods.getRegimeSMT = function(chiffreAffaires) {
  const { seuil10M, seuil20M, seuil30M } = this.seuils;
  
  if (chiffreAffaires <= seuil10M) {
    return 'SMT_SIMPLE';
  } else if (chiffreAffaires <= seuil20M) {
    return 'SMT_COMPLET';
  } else if (chiffreAffaires <= seuil30M) {
    return 'COMPTABILITE_SIMPLIFIEE';
  } else {
    return 'COMPTABILITE_COMPLETE';
  }
};

// Méthode pour générer un numéro de transaction
settingsSchema.methods.generateTransactionNumber = function(type) {
  const now = new Date();
  const prefix = this.numerotation.prefixeTransaction[type] || type.toUpperCase();
  
  let dateFormat = '';
  switch (this.numerotation.formatDate) {
    case 'YYYY':
      dateFormat = now.getFullYear().toString();
      break;
    case 'MMYYYY':
      dateFormat = String(now.getMonth() + 1).padStart(2, '0') + now.getFullYear();
      break;
    default: // YYYYMM
      dateFormat = now.getFullYear() + String(now.getMonth() + 1).padStart(2, '0');
  }
  
  const random = Math.floor(Math.random() * Math.pow(10, this.numerotation.longueurCompteur))
    .toString()
    .padStart(this.numerotation.longueurCompteur, '0');
  
  return `${prefix}-${dateFormat}-${random}`;
};

// Middleware pour valider les seuils avant sauvegarde
settingsSchema.pre('save', function(next) {
  try {
    this.validateSeuils();
    next();
  } catch (error) {
    next(error);
  }
});

// Middleware pour s'assurer qu'il n'y a qu'un seul paramètre actif
settingsSchema.pre('save', async function(next) {
  if (this.isActive && this.isNew) {
    await this.constructor.updateMany(
      { _id: { $ne: this._id } },
      { isActive: false }
    );
  }
  next();
});

module.exports = mongoose.model('Settings', settingsSchema);