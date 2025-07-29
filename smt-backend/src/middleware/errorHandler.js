const mongoose = require('mongoose');

// Middleware de gestion globale des erreurs
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log de l'erreur pour le développement
  if (process.env.NODE_ENV === 'development') {
    console.error('Error Stack:', err.stack);
  }

  // Erreur de validation Mongoose
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = {
      statusCode: 400,
      message: 'Erreur de validation',
      details: message
    };
  }

  // Erreur de duplication Mongoose (code 11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const value = err.keyValue[field];
    error = {
      statusCode: 400,
      message: `Duplication détectée`,
      details: `${field}: "${value}" existe déjà`
    };
  }

  // Erreur CastError Mongoose (ObjectId invalide)
  if (err.name === 'CastError') {
    error = {
      statusCode: 400,
      message: 'Ressource non trouvée',
      details: 'ID invalide'
    };
  }

  // Erreur JWT
  if (err.name === 'JsonWebTokenError') {
    error = {
      statusCode: 401,
      message: 'Token invalide'
    };
  }

  // Erreur JWT expiré
  if (err.name === 'TokenExpiredError') {
    error = {
      statusCode: 401,
      message: 'Token expiré'
    };
  }

  // Erreur de limite de taille de fichier
  if (err.code === 'LIMIT_FILE_SIZE') {
    error = {
      statusCode: 400,
      message: 'Fichier trop volumineux',
      details: 'La taille du fichier dépasse la limite autorisée'
    };
  }

  // Erreur de type de fichier non autorisé
  if (err.code === 'INVALID_FILE_TYPE') {
    error = {
      statusCode: 400,
      message: 'Type de fichier non autorisé',
      details: err.message
    };
  }

  // Erreur de connexion à la base de données
  if (err.name === 'MongoNetworkError' || err.name === 'MongoTimeoutError') {
    error = {
      statusCode: 500,
      message: 'Erreur de connexion à la base de données'
    };
  }

  // Erreur de référence non trouvée
  if (err.message && err.message.includes('Cast to ObjectId failed')) {
    error = {
      statusCode: 404,
      message: 'Ressource non trouvée'
    };
  }

  // Erreur de permission insuffisante
  if (err.message && err.message.includes('permission')) {
    error = {
      statusCode: 403,
      message: 'Permissions insuffisantes'
    };
  }

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Erreur interne du serveur',
    details: error.details,
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack,
      originalError: err.name
    })
  });
};

// Middleware pour les routes non trouvées
const notFound = (req, res, next) => {
  const error = new Error(`Route non trouvée - ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    message: error.message,
    requestedUrl: req.originalUrl,
    method: req.method
  });
};

// Middleware pour logger les erreurs
const errorLogger = (err, req, res, next) => {
  const errorLog = {
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id,
    error: {
      name: err.name,
      message: err.message,
      stack: err.stack
    }
  };

  // En production, vous pourriez vouloir envoyer ceci à un service de logging
  if (process.env.NODE_ENV === 'production') {
    console.error('Error Log:', JSON.stringify(errorLog, null, 2));
  } else {
    console.error('Error:', err);
  }

  next(err);
};

// Wrapper pour les fonctions async (évite les try/catch répétitifs)
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Middleware pour valider les types de contenu
const validateContentType = (allowedTypes = ['application/json']) => {
  return (req, res, next) => {
    if (req.method === 'GET' || req.method === 'DELETE') {
      return next();
    }

    const contentType = req.get('Content-Type');
    const isValidType = allowedTypes.some(type => 
      contentType && contentType.includes(type)
    );

    if (!isValidType && Object.keys(req.body).length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Type de contenu non supporté',
        allowedTypes: allowedTypes,
        receivedType: contentType
      });
    }

    next();
  };
};

// Classe d'erreur personnalisée
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = {
  errorHandler,
  notFound,
  errorLogger,
  asyncHandler,
  validateContentType,
  AppError
};