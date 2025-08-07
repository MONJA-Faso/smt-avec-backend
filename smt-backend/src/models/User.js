const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'L\'email est requis'],
    unique: true,
    lowercase: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Veuillez entrer un email valide'
    ]
  },
  name: {
    type: String,
    required: [true, 'Le nom est requis'],
    trim: true,
    maxlength: [100, 'Le nom ne peut pas dépasser 100 caractères']
  },
  password: {
    type: String,
    required: [true, 'Le mot de passe est requis'],
    minlength: [6, 'Le mot de passe doit avoir au moins 6 caractères'],
    select: false
  },
  role: {
    type: String,
    enum: ['admin', 'user'],
    default: 'user'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  },
  profileImage: {
    type: String
  },
  preferences: {
    language: {
      type: String,
      default: 'fr'
    },
    timezone: {
      type: String,
      default: 'Africa/Abidjan'
    },
    currency: {
      type: String,
      default: 'MGA'
    }
  }
}, {
  timestamps: true,
  collection: 'users'
});

// ⚠️ Supprimer cet index redondant (déjà couvert par `unique: true`)
// userSchema.index({ email: 1 });

// Index utile conservé
userSchema.index({ role: 1 });

// Middleware pour hasher le mot de passe
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_ROUNDS) || 12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Méthode pour comparer les mots de passe
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Méthode pour retourner un profil public sans mot de passe
userSchema.methods.getPublicProfile = function() {
  const userObject = this.toObject();
  delete userObject.password;
  return userObject;
};

// Méthode statique pour trouver un utilisateur actif par email
userSchema.statics.findActiveUserByEmail = function(email) {
  return this.findOne({ email, isActive: true }).select('+password');
};

module.exports = mongoose.model('User', userSchema);
