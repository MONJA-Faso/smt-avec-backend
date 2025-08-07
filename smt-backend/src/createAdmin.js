require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User'); // adapte le chemin selon ton projet

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/smt_monja_faso';

async function createAdmin() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connecté à MongoDB');

    const existingUser = await User.findOne({ email: 'admin@smt.com' });
    if (existingUser) {
      console.log('⚠️ Un utilisateur avec cet email existe déjà.');
      return;
    }

    const admin = new User({
      name: 'Admin SMT',
      email: 'admin@smt.com',
      password: 'admin123*',
      role: 'admin'
    });

    await admin.save();
    console.log('✅ Administrateur créé avec succès');
    console.log(admin.getPublicProfile());

    mongoose.disconnect();
  } catch (err) {
    console.error('❌ Erreur lors de la création de l\'admin :', err);
    mongoose.disconnect();
  }
}

createAdmin();
