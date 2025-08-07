const Joi = require('joi');

// Schémas de validation Joi

// Validation pour l'utilisateur
const userValidation = {
  register: Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'L\'email doit être valide',
      'any.required': 'L\'email est requis'
    }),
    name: Joi.string().min(2).max(100).required().messages({
      'string.min': 'Le nom doit faire au moins 2 caractères',
      'string.max': 'Le nom ne peut pas dépasser 100 caractères',
      'any.required': 'Le nom est requis'
    }),
    password: Joi.string().min(6).required().messages({
      'string.min': 'Le mot de passe doit faire au moins 6 caractères',
      'any.required': 'Le mot de passe est requis'
    }),
    role: Joi.string().valid('admin', 'user').default('user')
  }),
  
  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  }),
  
  update: Joi.object({
    name: Joi.string().min(2).max(100),
    email: Joi.string().email(),
    role: Joi.string().valid('admin', 'user'),
    isActive: Joi.boolean()
  })
};

// Validation pour les comptes
const accountValidation = {
  create: Joi.object({
    name: Joi.string().min(2).max(100).required(),
    type: Joi.string().valid('caisse', 'banque', 'ccp', 'capital').required(),
    balance: Joi.number().min(0).default(0),
    currency: Joi.string().length(3).uppercase().default('MGA'),
    accountNumber: Joi.string().max(50),
    bankName: Joi.string().max(100),
    bankBranch: Joi.string().max(100),
    description: Joi.string().max(500)
  }),
  
  update: Joi.object({
    name: Joi.string().min(2).max(100),
    accountNumber: Joi.string().max(50),
    bankName: Joi.string().max(100),
    bankBranch: Joi.string().max(100),
    description: Joi.string().max(500),
    isActive: Joi.boolean()
  })
};

// Validation pour les transactions
const transactionValidation = {
  create: Joi.object({
    date: Joi.date().default(Date.now),
    type: Joi.string().valid('recette', 'depense').required(),
    amount: Joi.number().min(0.01).required(),
    description: Joi.string().min(5).max(500).required(),
    accountId: Joi.string().required(),
    category: Joi.string().min(2).max(100).required(),
    subcategory: Joi.string().max(100),
    reference: Joi.string().max(50),
    paymentMethod: Joi.string().valid('especes', 'cheque', 'virement', 'carte', 'autre').default('especes'),
    vatAmount: Joi.number().min(0).default(0),
    vatRate: Joi.number().min(0).max(100).default(0),
    isVatIncluded: Joi.boolean().default(false),
    thirdParty: Joi.object({
      name: Joi.string().max(200),
      contact: Joi.string().max(100),
      address: Joi.string().max(300)
    }),
    notes: Joi.string().max(1000)
  }),
  
  update: Joi.object({
    date: Joi.date(),
    amount: Joi.number().min(0.01),
    description: Joi.string().min(5).max(500),
    category: Joi.string().min(2).max(100),
    subcategory: Joi.string().max(100),
    reference: Joi.string().max(50),
    paymentMethod: Joi.string().valid('especes', 'cheque', 'virement', 'carte', 'autre'),
    vatAmount: Joi.number().min(0),
    vatRate: Joi.number().min(0).max(100),
    isVatIncluded: Joi.boolean(),
    thirdParty: Joi.object({
      name: Joi.string().max(200),
      contact: Joi.string().max(100),
      address: Joi.string().max(300)
    }),
    notes: Joi.string().max(1000)
  }),
  
  filters: Joi.object({
    search: Joi.string().max(200),
    dateFrom: Joi.date(),
    dateTo: Joi.date(),
    type: Joi.string().valid('recette', 'depense', 'all'),
    accountId: Joi.string(),
    category: Joi.string(),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20)
  })
};

// Validation pour les immobilisations
const immobilisationValidation = {
  create: Joi.object({
    name: Joi.string().min(2).max(200).required(),
    purchaseDate: Joi.date().required(),
    purchaseAmount: Joi.number().min(0.01).required(),
    duration: Joi.number().integer().min(1).max(50).required(),
    category: Joi.string().valid(
      'Matériel informatique',
      'Matériel de transport',
      'Mobilier de bureau',
      'Machines et équipements',
      'Installations techniques',
      'Constructions',
      'Terrains',
      'Autres immobilisations'
    ).required(),
    description: Joi.string().max(1000),
    serialNumber: Joi.string().max(100),
    supplier: Joi.object({
      name: Joi.string().max(200),
      contact: Joi.string().max(100),
      address: Joi.string().max(300)
    }),
    location: Joi.string().max(200),
    residualValue: Joi.number().min(0).default(0),
    // Champs optionnels calculés automatiquement si non fournis
    currentValue: Joi.number().min(0),
    amortisationRate: Joi.number().min(0).max(100),
    status: Joi.string().valid('en_service', 'hors_service', 'en_reparation', 'cede', 'detruit')
  }),
  
  update: Joi.object({
    name: Joi.string().min(2).max(200),
    description: Joi.string().max(1000),
    location: Joi.string().max(200),
    status: Joi.string().valid('en_service', 'hors_service', 'en_reparation', 'cede', 'detruit')
  })
};

// Validation pour les stocks
const stockValidation = {
  create: Joi.object({
    name: Joi.string().min(2).max(200).required(),
    category: Joi.string().valid('produits', 'marchandises', 'matieres_premieres').required(),
    quantity: Joi.number().min(0).required(),
    unitPrice: Joi.number().min(0).required(),
    unit: Joi.string().valid('piece', 'kg', 'litre', 'metre', 'tonne', 'carton', 'paquet', 'autre').default('piece'),
    description: Joi.string().max(1000),
    sku: Joi.string().max(50),
    barcode: Joi.string().max(50),
    minQuantity: Joi.number().min(0).default(0),
    maxQuantity: Joi.number().min(0),
    reorderPoint: Joi.number().min(0).default(0),
    supplier: Joi.object({
      name: Joi.string().max(200),
      contact: Joi.string().max(100),
      email: Joi.string().email(),
      phone: Joi.string().max(50),
      address: Joi.string().max(300)
    }),
    costPrice: Joi.number().min(0),
    sellingPrice: Joi.number().min(0),
    expiryDate: Joi.date(),
    manufactureDate: Joi.date(),
    // Champ calculé automatiquement si non fourni
    totalValue: Joi.number().min(0)
  }),
  
  update: Joi.object({
    name: Joi.string().min(2).max(200),
    quantity: Joi.number().min(0),
    unitPrice: Joi.number().min(0),
    description: Joi.string().max(1000),
    minQuantity: Joi.number().min(0),
    maxQuantity: Joi.number().min(0),
    reorderPoint: Joi.number().min(0),
    costPrice: Joi.number().min(0),
    sellingPrice: Joi.number().min(0),
    status: Joi.string().valid('actif', 'inactif', 'discontinue', 'en_commande')
  }),
  
  movement: Joi.object({
    type: Joi.string().valid('entree', 'sortie', 'ajustement').required(),
    quantity: Joi.number().required(),
    unitPrice: Joi.number().min(0),
    reason: Joi.string().max(200).required()
  })
};

// Validation pour les créances et dettes
const creanceDetteValidation = {
  create: Joi.object({
    type: Joi.string().valid('creance', 'dette').required(),
    name: Joi.string().min(2).max(200).required(),
    amount: Joi.number().min(0.01).required(),
    date: Joi.date().default(Date.now),
    dueDate: Joi.date().required(),
    description: Joi.string().max(1000),
    reference: Joi.string().max(50),
    contact: Joi.object({
      email: Joi.string().email(),
      phone: Joi.string().max(50),
      address: Joi.string().max(300),
      city: Joi.string().max(100),
      postalCode: Joi.string().max(20)
    }),
    company: Joi.object({
      name: Joi.string().max(200),
      registrationNumber: Joi.string().max(50),
      vatNumber: Joi.string().max(50),
      industry: Joi.string().max(100)
    }),
    paymentTerms: Joi.string().max(200),
    interestRate: Joi.number().min(0).max(100).default(0),
    // Champ calculé automatiquement si non fourni
    originalAmount: Joi.number().min(0)
  }),
  
  update: Joi.object({
    name: Joi.string().min(2).max(200),
    dueDate: Joi.date(),
    description: Joi.string().max(1000),
    status: Joi.string().valid('en_cours', 'regle', 'en_retard', 'partiellement_regle', 'annule'),
    contact: Joi.object({
      email: Joi.string().email(),
      phone: Joi.string().max(50),
      address: Joi.string().max(300),
      city: Joi.string().max(100),
      postalCode: Joi.string().max(20)
    }),
    paymentTerms: Joi.string().max(200),
    interestRate: Joi.number().min(0).max(100),
    notes: Joi.string().max(2000)
  }),
  
  payment: Joi.object({
    amount: Joi.number().min(0.01).required(),
    method: Joi.string().valid('especes', 'cheque', 'virement', 'carte', 'compensation', 'autre').default('especes'),
    reference: Joi.string().max(50),
    notes: Joi.string().max(500)
  })
};

// Validation pour les paramètres
const settingsValidation = {
  update: Joi.object({
    seuils: Joi.object({
      seuil30M: Joi.number().min(0),
      seuil20M: Joi.number().min(0),
      seuil10M: Joi.number().min(0)
    }),
    exercice: Joi.object({
      dateDebut: Joi.date(),
      dateFin: Joi.date()
    }),
    tva: Joi.object({
      taux: Joi.number().min(0).max(100),
      incluse: Joi.boolean(),
      numeroTva: Joi.string().max(50)
    }),
    entreprise: Joi.object({
      nom: Joi.string().min(2).max(200),
      adresse: Joi.string().min(5).max(500),
      ville: Joi.string().max(100),
      codePostal: Joi.string().max(20),
      pays: Joi.string().max(100),
      telephone: Joi.string().max(50),
      email: Joi.string().email(),
      siteWeb: Joi.string().max(200)
    }),
    legal: Joi.object({
      formeJuridique: Joi.string().valid('SARL', 'SA', 'SAS', 'EURL', 'Entreprise individuelle', 'Association', 'Autre'),
      numeroRegistre: Joi.string().max(50),
      capital: Joi.number().min(0),
      devise: Joi.string().length(3).uppercase()
    })
  })
};

// Middleware de validation générique
const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error } = schema.validate(req[property], { abortEarly: false });
    
    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));
      
      return res.status(400).json({
        success: false,
        message: 'Erreurs de validation',
        errors
      });
    }
    
    next();
  };
};

// Validation des paramètres d'ID MongoDB
const validateObjectId = (paramName = 'id') => {
  return (req, res, next) => {
    const id = req.params[paramName];
    
    if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: `ID ${paramName} invalide`
      });
    }
    
    next();
  };
};

// Validation personnalisée pour les dates
const validateDateRange = (req, res, next) => {
  const { dateFrom, dateTo } = req.query;
  
  if (dateFrom && dateTo) {
    const startDate = new Date(dateFrom);
    const endDate = new Date(dateTo);
    
    if (startDate > endDate) {
      return res.status(400).json({
        success: false,
        message: 'La date de début doit être antérieure à la date de fin'
      });
    }
  }
  
  next();
};

module.exports = {
  userValidation,
  accountValidation,
  transactionValidation,
  immobilisationValidation,
  stockValidation,
  creanceDetteValidation,
  settingsValidation,
  validate,
  validateObjectId,
  validateDateRange
};