require('dotenv').config();
const express = require('express');
const cors = require('cors');
const compression = require('compression');
const morgan = require('morgan');
const path = require('path');

// Importer la configuration de la base de données
const connectDB = require('./config/database');

// Importer les middlewares
const { errorHandler, notFound, errorLogger } = require('./middleware/errorHandler');
const { helmetConfig, sanitizeData, globalLimiter } = require('./middleware/security');
const { createUploadDirs } = require('./middleware/upload');

// Importer les routes
const authRoutes = require('./routes/authRoutes');
const accountRoutes = require('./routes/accountRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const userRoutes = require('./routes/userRoutes');
const immobilisationRoutes = require('./routes/immobilisationRoutes');
const stockRoutes = require('./routes/stockRoutes');
const creanceEtDetteRoutes = require('./routes/creanceEtDetteRoutes');
const documentRoutes = require('./routes/documentRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const reportRoutes = require('./routes/reportRoutes');

const app = express();

// Connecter à la base de données
connectDB();

// Créer les dossiers d'upload
createUploadDirs();

// Middleware de sécurité Helmet
app.use(helmetConfig);

// Configuration CORS
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Compression des réponses
app.use(compression());

// Logging des requêtes
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Rate limiting global
app.use(globalLimiter);

// Parser JSON avec limite de taille
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Nettoyage des données MongoDB
app.use(sanitizeData);

// Servir les fichiers statiques (uploads)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes de santé
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API SMT en fonctionnement',
    timestamp: new Date().toISOString(),
    version: process.env.APP_VERSION || '1.0.0'
  });
});

// Routes API
app.use('/api/auth', authRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/users', userRoutes);
app.use('/api/immobilisations', immobilisationRoutes);
app.use('/api/stocks', stockRoutes);
app.use('/api/creances-dettes', creanceEtDetteRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/reports', reportRoutes);

// Middleware de logging des erreurs
app.use(errorLogger);

// Middleware pour les routes non trouvées
app.use(notFound);

// Middleware de gestion globale des erreurs
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`🚀 Serveur SMT démarré sur le port ${PORT} en mode ${process.env.NODE_ENV || 'development'}`);
  console.log(`📡 API disponible sur: http://localhost:${PORT}`);
  console.log(`🔍 Health check: http://localhost:${PORT}/health`);
});

// Gestion gracieuse de l'arrêt du serveur
process.on('SIGTERM', () => {
  console.log('SIGTERM reçu, arrêt gracieux du serveur...');
  server.close(() => {
    console.log('Serveur fermé');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT reçu, arrêt gracieux du serveur...');
  server.close(() => {
    console.log('Serveur fermé');
    process.exit(0);
  });
});

// Gestion des erreurs non capturées
process.on('uncaughtException', (error) => {
  console.error('Erreur non capturée:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Promesse rejetée non gérée:', reason);
  server.close(() => {
    process.exit(1);
  });
});

module.exports = app;