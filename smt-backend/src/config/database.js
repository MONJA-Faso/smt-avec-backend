const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      maxPoolSize: 10,
      bufferCommands: false,
      // bufferMaxEntries: 0
    });

    console.log(`MongoDB connecté: ${conn.connection.host}`);
    
    // Gestion des événements de connexion
    mongoose.connection.on('error', (err) => {
      console.error('Erreur MongoDB:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB déconnecté');
    });

    mongoose.connection.on('connected', () => {
      console.log('MongoDB connecté avec succès');
    });

    // Gestion de la fermeture gracieuse
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('Connexion MongoDB fermée via SIGINT');
      process.exit(0);
    });

    return conn;
  } catch (error) {
    console.error('Erreur de connexion à MongoDB:', error);
    console.log('Tentative de continuer sans MongoDB...');
    return null;
  }
};

module.exports = connectDB;