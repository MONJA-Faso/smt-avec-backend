const jwt = require('jsonwebtoken');
const { User } = require('../models');

// Middleware d'authentification
const authenticate = async (req, res, next) => {
  console.log("🔹 Auth middleware called");
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token d\'accès requis'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('+password');
    
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non trouvé ou inactif'
      });
    }

    // Mettre à jour la dernière connexion
    user.lastLogin = new Date();
    await user.save();

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expiré'
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Token invalide'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Erreur d\'authentification',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Middleware d'autorisation basé sur les rôles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non authentifié'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé - Privilèges insuffisants'
      });
    }

    next();
  };
};

// Middleware pour vérifier si l'utilisateur peut accéder à ses propres données
const authorizeOwnerOrAdmin = (userIdField = 'userId') => {
  return async (req, res, next) => {
    try {
      const userId = req.params[userIdField] || req.body[userIdField] || req.query[userIdField];
      
      // Les admins peuvent accéder à toutes les données
      if (req.user.role === 'admin') {
        return next();
      }
      
      // Les utilisateurs ne peuvent accéder qu'à leurs propres données
      if (req.user._id.toString() === userId) {
        return next();
      }
      
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé - Vous ne pouvez accéder qu\'à vos propres données'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erreur d\'autorisation',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };
};

// Middleware optionnel d'authentification (n'échoue pas si pas de token)
const optionalAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      
      if (user && user.isActive) {
        req.user = user;
      }
    }
    
    next();
  } catch (error) {
    // Ne pas faire échouer la requête, juste continuer sans utilisateur
    next();
  }
};

// Middleware pour limiter les tentatives de connexion
const loginAttempts = {};

const rateLimitLogin = (req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress;
  const maxAttempts = 5;
  const windowMs = 15 * 60 * 1000; // 15 minutes
  
  if (!loginAttempts[ip]) {
    loginAttempts[ip] = { count: 0, lastAttempt: Date.now() };
  }
  
  const attempts = loginAttempts[ip];
  
  // Réinitialiser le compteur si la fenêtre de temps est écoulée
  if (Date.now() - attempts.lastAttempt > windowMs) {
    attempts.count = 0;
  }
  
  if (attempts.count >= maxAttempts) {
    return res.status(429).json({
      success: false,
      message: 'Trop de tentatives de connexion. Réessayez dans 15 minutes.'
    });
  }
  
  next();
};

// Fonction pour enregistrer une tentative de connexion échouée
const recordFailedLogin = (ip) => {
  if (!loginAttempts[ip]) {
    loginAttempts[ip] = { count: 0, lastAttempt: Date.now() };
  }
  
  loginAttempts[ip].count++;
  loginAttempts[ip].lastAttempt = Date.now();
};

// Fonction pour réinitialiser les tentatives après une connexion réussie
const resetLoginAttempts = (ip) => {
  if (loginAttempts[ip]) {
    delete loginAttempts[ip];
  }
};

// Middleware pour vérifier les permissions sur les ressources
const checkResourcePermission = (resourceType) => {
  return async (req, res, next) => {
    try {
      const resourceId = req.params.id;
      
      // Les admins ont accès à tout
      if (req.user.role === 'admin') {
        return next();
      }
      
      // Vérifier les permissions spécifiques selon le type de ressource
      const { Transaction, Document, Account } = require('../models');
      
      let resource;
      switch (resourceType) {
        case 'transaction':
          resource = await Transaction.findById(resourceId);
          if (resource && resource.createdBy.toString() === req.user._id.toString()) {
            return next();
          }
          break;
          
        case 'document':
          resource = await Document.findById(resourceId);
          if (resource && (
            resource.uploadedBy.toString() === req.user._id.toString() ||
            resource.allowedUsers.includes(req.user._id) ||
            resource.isPublic
          )) {
            return next();
          }
          break;
          
        case 'account':
          // Tous les utilisateurs authentifiés peuvent voir les comptes
          return next();
          
        default:
          return next();
      }
      
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé à cette ressource'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erreur de vérification des permissions',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };
};

module.exports = {
  authenticate,
  protect: authenticate,
  authorize,
  restrictTo: authorize,
  authorizeOwnerOrAdmin,
  optionalAuth,
  rateLimitLogin,
  recordFailedLogin,
  resetLoginAttempts,
  checkResourcePermission
};