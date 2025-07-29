const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const helmet = require('helmet');

// Rate limiting global
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limite de 100 requêtes par IP
  message: {
    success: false,
    message: 'Trop de requêtes depuis cette IP, réessayez dans 15 minutes.'
  },
  standardHeaders: true, // Retourne les headers `RateLimit-*`
  legacyHeaders: false, // Désactive les headers `X-RateLimit-*`
});

// Rate limiting strict pour les routes d'authentification
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limite de 5 tentatives de connexion par IP
  message: {
    success: false,
    message: 'Trop de tentatives de connexion, réessayez dans 15 minutes.'
  },
  skipSuccessfulRequests: true, // Ne pas compter les requêtes réussies
});

// Rate limiting pour les endpoints API
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limite plus élevée pour les API
  message: {
    success: false,
    message: 'Limite de requêtes API atteinte, réessayez plus tard.'
  }
});

// Rate limiting pour les uploads de fichiers
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 heure
  max: 20, // limite de 20 uploads par heure
  message: {
    success: false,
    message: 'Limite d\'upload atteinte, réessayez dans une heure.'
  }
});

// Configuration de sécurité Helmet
const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false, // Désactiver COEP pour l'instant
});

// Middleware de nettoyage des données MongoDB
const sanitizeData = mongoSanitize({
  replaceWith: '_', // Remplacer les caractères dangereux par '_'
});

// Middleware pour bloquer les requêtes suspectes
const securityFilter = (req, res, next) => {
  const suspiciousPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /document\.cookie/gi,
    /document\.write/gi,
    /eval\s*\(/gi,
    /alert\s*\(/gi,
    /<iframe/gi,
    /<object/gi,
    /<embed/gi
  ];

  const requestData = JSON.stringify(req.body) + JSON.stringify(req.query) + JSON.stringify(req.params);
  
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(requestData)) {
      console.warn(`Requête suspecte détectée de ${req.ip}: ${pattern}`);
      return res.status(400).json({
        success: false,
        message: 'Requête invalide détectée'
      });
    }
  }

  next();
};

// Middleware pour valider les User-Agent
const validateUserAgent = (req, res, next) => {
  const userAgent = req.get('User-Agent');
  
  if (!userAgent) {
    return res.status(400).json({
      success: false,
      message: 'User-Agent requis'
    });
  }

  // Bloquer certains User-Agents suspicieux
  const blockedAgents = [
    /curl/i,
    /wget/i,
    /python-requests/i,
    /bot/i,
    /spider/i,
    /crawler/i
  ];

  // En production, vous pourriez vouloir être plus restrictif
  if (process.env.NODE_ENV === 'production') {
    for (const pattern of blockedAgents) {
      if (pattern.test(userAgent)) {
        return res.status(403).json({
          success: false,
          message: 'Accès non autorisé'
        });
      }
    }
  }

  next();
};

// Middleware pour enregistrer les tentatives de sécurité
const securityLogger = (req, res, next) => {
  const securityHeaders = {
    userAgent: req.get('User-Agent'),
    origin: req.get('Origin'),
    referer: req.get('Referer'),
    xForwardedFor: req.get('X-Forwarded-For'),
    xRealIp: req.get('X-Real-IP'),
    ip: req.ip,
    method: req.method,
    url: req.originalUrl
  };

  // Log des requêtes sensibles
  const sensitiveRoutes = ['/api/auth/', '/api/users/', '/api/settings/'];
  const isSensitive = sensitiveRoutes.some(route => req.originalUrl.includes(route));

  if (isSensitive) {
    console.log('Security Log:', {
      timestamp: new Date().toISOString(),
      ...securityHeaders,
      userId: req.user?.id
    });
  }

  next();
};

// Middleware pour vérifier l'origine des requêtes
const validateOrigin = (req, res, next) => {
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'];
  const origin = req.get('Origin');

  // Autoriser les requêtes sans origine (mobile apps, etc.)
  if (!origin) {
    return next();
  }

  if (!allowedOrigins.includes(origin)) {
    return res.status(403).json({
      success: false,
      message: 'Origine non autorisée'
    });
  }

  next();
};

// Middleware pour ajouter des headers de sécurité personnalisés
const addSecurityHeaders = (req, res, next) => {
  // Prévenir le sniffing MIME
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Prévenir le clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Activer la protection XSS du navigateur
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Forcer HTTPS en production
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  
  // Contrôler les référents
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Header personnalisé pour identifier l'API
  res.setHeader('X-API-Version', process.env.APP_VERSION || '1.0.0');
  
  next();
};

// Middleware pour détecter et bloquer les attaques par force brute
const bruteForceProtection = () => {
  const attempts = new Map();
  
  return (req, res, next) => {
    const key = req.ip;
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minute
    const maxAttempts = 10;
    
    if (!attempts.has(key)) {
      attempts.set(key, { count: 1, firstAttempt: now });
      return next();
    }
    
    const record = attempts.get(key);
    
    // Réinitialiser si la fenêtre de temps est écoulée
    if (now - record.firstAttempt > windowMs) {
      attempts.set(key, { count: 1, firstAttempt: now });
      return next();
    }
    
    record.count++;
    
    if (record.count > maxAttempts) {
      return res.status(429).json({
        success: false,
        message: 'Trop de requêtes. Veuillez patienter avant de réessayer.'
      });
    }
    
    next();
  };
};

module.exports = {
  globalLimiter,
  authLimiter,
  apiLimiter,
  uploadLimiter,
  helmetConfig,
  sanitizeData,
  securityFilter,
  validateUserAgent,
  securityLogger,
  validateOrigin,
  addSecurityHeaders,
  bruteForceProtection
};