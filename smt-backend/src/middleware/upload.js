const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// Configuration du stockage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = process.env.UPLOAD_PATH || './uploads';
    const subPath = getSubPath(req.route.path);
    const finalPath = path.join(uploadPath, subPath);
    
    // Créer le dossier s'il n'existe pas
    if (!fs.existsSync(finalPath)) {
      fs.mkdirSync(finalPath, { recursive: true });
    }
    
    cb(null, finalPath);
  },
  filename: (req, file, cb) => {
    // Générer un nom de fichier unique
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const hash = crypto.createHash('md5').update(file.originalname + uniqueSuffix).digest('hex').substring(0, 8);
    const ext = path.extname(file.originalname);
    const nameWithoutExt = path.basename(file.originalname, ext);
    const cleanName = nameWithoutExt.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 20);
    
    cb(null, `${cleanName}_${hash}_${uniqueSuffix}${ext}`);
  }
});

// Fonction pour déterminer le sous-dossier basé sur la route
function getSubPath(routePath) {
  if (routePath.includes('transaction')) return 'transactions';
  if (routePath.includes('immobilisation')) return 'immobilisations';
  if (routePath.includes('stock')) return 'stocks';
  if (routePath.includes('creance') || routePath.includes('dette')) return 'creances-dettes';
  if (routePath.includes('profile')) return 'profiles';
  return 'general';
}

// Filtres pour les types de fichiers
const fileFilters = {
  documents: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'text/csv'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Type de fichier non autorisé. Seuls les PDF, Word, Excel, TXT et CSV sont acceptés.'), false);
    }
  },
  
  images: (req, file, cb) => {
    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/bmp',
      'image/webp'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Type d\'image non autorisé. Seuls JPG, PNG, GIF, BMP et WebP sont acceptés.'), false);
    }
  },
  
  all: (req, file, cb) => {
    const allowedTypes = [
      // Documents
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'text/csv',
      // Images
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/bmp',
      'image/webp'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Type de fichier non autorisé.'), false);
    }
  }
};

// Configuration pour différents types d'uploads
const uploadConfigs = {
  // Upload de documents généraux
  documents: multer({
    storage: storage,
    fileFilter: fileFilters.documents,
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB
      files: 5 // Maximum 5 fichiers
    }
  }),
  
  // Upload d'images (pour les profils, logos, etc.)
  images: multer({
    storage: storage,
    fileFilter: fileFilters.images,
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB
      files: 1 // Une seule image
    }
  }),
  
  // Upload universel (documents et images)
  all: multer({
    storage: storage,
    fileFilter: fileFilters.all,
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB
      files: 10 // Maximum 10 fichiers
    }
  }),
  
  // Upload spécifique pour les transactions
  transaction: multer({
    storage: storage,
    fileFilter: fileFilters.all,
    limits: {
      fileSize: 15 * 1024 * 1024, // 15MB pour les justificatifs
      files: 3 // Maximum 3 fichiers par transaction
    }
  })
};

// Middleware pour valider la taille des fichiers
const validateFileSize = (req, res, next) => {
  if (!req.files && !req.file) {
    return next();
  }
  
  const files = req.files || [req.file];
  const maxSize = parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024; // 10MB par défaut
  
  for (const file of files) {
    if (file && file.size > maxSize) {
      return res.status(400).json({
        success: false,
        message: `Le fichier ${file.originalname} est trop volumineux`,
        maxSize: `${maxSize / (1024 * 1024)}MB`
      });
    }
  }
  
  next();
};

// Middleware pour scanner les fichiers (anti-virus basique)
const scanFile = (req, res, next) => {
  if (!req.files && !req.file) {
    return next();
  }
  
  const files = req.files || [req.file];
  
  // Patterns de fichiers suspects
  const suspiciousExtensions = ['.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.vbs', '.js'];
  const suspiciousContent = Buffer.from('MZ'); // Header des fichiers exécutables Windows
  
  for (const file of files) {
    if (file) {
      // Vérifier l'extension
      const ext = path.extname(file.originalname).toLowerCase();
      if (suspiciousExtensions.includes(ext)) {
        // Supprimer le fichier uploadé
        fs.unlinkSync(file.path);
        return res.status(400).json({
          success: false,
          message: `Type de fichier dangereux détecté: ${ext}`
        });
      }
      
      // Vérifier le contenu (basique)
      try {
        const buffer = fs.readFileSync(file.path, { encoding: null });
        if (buffer.indexOf(suspiciousContent) === 0) {
          fs.unlinkSync(file.path);
          return res.status(400).json({
            success: false,
            message: 'Fichier exécutable détecté et rejeté'
          });
        }
      } catch (error) {
        console.warn('Erreur lors du scan du fichier:', error.message);
      }
    }
  }
  
  next();
};

// Middleware pour nettoyer les fichiers temporaires en cas d'erreur
const cleanupFiles = (req, res, next) => {
  const originalSend = res.send;
  
  res.send = function(data) {
    // Si c'est une erreur et qu'il y a des fichiers uploadés
    if (res.statusCode >= 400 && (req.files || req.file)) {
      const files = req.files || [req.file];
      files.forEach(file => {
        if (file && file.path && fs.existsSync(file.path)) {
          try {
            fs.unlinkSync(file.path);
          } catch (error) {
            console.warn('Erreur lors de la suppression du fichier temporaire:', error.message);
          }
        }
      });
    }
    
    originalSend.call(this, data);
  };
  
  next();
};

// Middleware pour calculer le checksum des fichiers
const calculateChecksum = (req, res, next) => {
  if (!req.files && !req.file) {
    return next();
  }
  
  const files = req.files || [req.file];
  
  files.forEach(file => {
    if (file && file.path) {
      try {
        const buffer = fs.readFileSync(file.path);
        const hash = crypto.createHash('md5').update(buffer).digest('hex');
        file.checksum = hash;
      } catch (error) {
        console.warn('Erreur lors du calcul du checksum:', error.message);
      }
    }
  });
  
  next();
};

// Gestionnaire d'erreurs pour multer
const handleMulterError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    let message = 'Erreur lors de l\'upload';
    
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        message = 'Fichier trop volumineux';
        break;
      case 'LIMIT_FILE_COUNT':
        message = 'Trop de fichiers';
        break;
      case 'LIMIT_UNEXPECTED_FILE':
        message = 'Champ de fichier inattendu';
        break;
      case 'LIMIT_PART_COUNT':
        message = 'Trop de parties dans la requête';
        break;
      case 'LIMIT_FIELD_COUNT':
        message = 'Trop de champs dans la requête';
        break;
      case 'LIMIT_FIELD_KEY':
        message = 'Nom de champ trop long';
        break;
      case 'LIMIT_FIELD_VALUE':
        message = 'Valeur de champ trop longue';
        break;
    }
    
    return res.status(400).json({
      success: false,
      message: message,
      code: error.code
    });
  }
  
  next(error);
};

// Fonction utilitaire pour créer les dossiers d'upload
const createUploadDirs = () => {
  const baseUploadPath = process.env.UPLOAD_PATH || './uploads';
  const subDirs = ['transactions', 'immobilisations', 'stocks', 'creances-dettes', 'profiles', 'general'];
  
  if (!fs.existsSync(baseUploadPath)) {
    fs.mkdirSync(baseUploadPath, { recursive: true });
  }
  
  subDirs.forEach(dir => {
    const fullPath = path.join(baseUploadPath, dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
    }
  });
};

module.exports = {
  uploadConfigs,
  validateFileSize,
  scanFile,
  cleanupFiles,
  calculateChecksum,
  handleMulterError,
  createUploadDirs
};