const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { recordFailedLogin, resetLoginAttempts } = require('../middleware/auth');

// Générer un token JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// @desc    Inscription d'un nouvel utilisateur
// @route   POST /api/auth/register
// @access  Public (mais peut être restreint aux admins)
const register = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  // Vérifier si l'utilisateur existe déjà
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new AppError('Un utilisateur avec cet email existe déjà', 400);
  }

  // Créer l'utilisateur
  const user = await User.create({
    name,
    email,
    password,
    role: role || 'user'
  });

  // Générer le token
  const token = generateToken(user._id);

  // Réponse sans le mot de passe
  const userResponse = user.getPublicProfile();

  res.status(201).json({
    success: true,
    message: 'Utilisateur créé avec succès',
    data: {
      user: userResponse,
      token
    }
  });
});

// @desc    Connexion utilisateur
// @route   POST /api/auth/login
// @access  Public
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const clientIp = req.ip || req.connection.remoteAddress;

  // Vérifier si l'email et le mot de passe sont fournis
  if (!email || !password) {
    throw new AppError('Email et mot de passe requis', 400);
  }

  // Chercher l'utilisateur avec le mot de passe inclus
  const user = await User.findActiveUserByEmail(email);

  if (!user) {
    recordFailedLogin(clientIp);
    throw new AppError('Identifiants invalides', 401);
  }

  // Vérifier le mot de passe
  const isPasswordValid = await user.comparePassword(password);

  if (!isPasswordValid) {
    recordFailedLogin(clientIp);
    throw new AppError('Identifiants invalides', 401);
  }

  // Réinitialiser les tentatives de connexion échouées
  resetLoginAttempts(clientIp);

  // Mettre à jour la dernière connexion
  user.lastLogin = new Date();
  await user.save();

  // Générer le token
  const token = generateToken(user._id);

  // Réponse sans le mot de passe
  const userResponse = user.getPublicProfile();

  res.json({
    success: true,
    message: 'Connexion réussie',
    data: {
      user: userResponse,
      token
    }
  });
});

// @desc    Déconnexion utilisateur
// @route   POST /api/auth/logout
// @access  Private
const logout = asyncHandler(async (req, res) => {
  // Pour JWT, il n'y a pas vraiment de déconnexion côté serveur
  // Le client doit juste supprimer le token
  
  res.json({
    success: true,
    message: 'Déconnexion réussie'
  });
});

// @desc    Obtenir les informations de l'utilisateur actuel
// @route   GET /api/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);

  if (!user) {
    throw new AppError('Utilisateur non trouvé', 404);
  }

  res.json({
    success: true,
    data: {
      user: user.getPublicProfile()
    }
  });
});

// @desc    Mettre à jour le profil de l'utilisateur actuel
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = asyncHandler(async (req, res) => {
  const { name, email, preferences } = req.body;
  
  const user = await User.findById(req.user.id);

  if (!user) {
    throw new AppError('Utilisateur non trouvé', 404);
  }

  // Vérifier si le nouvel email n'est pas déjà utilisé
  if (email && email !== user.email) {
    const emailExists = await User.findOne({ email, _id: { $ne: req.user.id } });
    if (emailExists) {
      throw new AppError('Cet email est déjà utilisé', 400);
    }
    user.email = email;
  }

  // Mettre à jour les champs modifiables
  if (name) user.name = name;
  if (preferences) user.preferences = { ...user.preferences, ...preferences };

  await user.save();

  res.json({
    success: true,
    message: 'Profil mis à jour avec succès',
    data: {
      user: user.getPublicProfile()
    }
  });
});

// @desc    Changer le mot de passe
// @route   PUT /api/auth/change-password
// @access  Private
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    throw new AppError('Mot de passe actuel et nouveau mot de passe requis', 400);
  }

  if (newPassword.length < 6) {
    throw new AppError('Le nouveau mot de passe doit faire au moins 6 caractères', 400);
  }

  // Obtenir l'utilisateur avec le mot de passe
  const user = await User.findById(req.user.id).select('+password');

  if (!user) {
    throw new AppError('Utilisateur non trouvé', 404);
  }

  // Vérifier le mot de passe actuel
  const isCurrentPasswordValid = await user.comparePassword(currentPassword);

  if (!isCurrentPasswordValid) {
    throw new AppError('Mot de passe actuel incorrect', 400);
  }

  // Mettre à jour le mot de passe
  user.password = newPassword;
  await user.save();

  res.json({
    success: true,
    message: 'Mot de passe changé avec succès'
  });
});

// @desc    Réinitialiser le mot de passe (demande)
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw new AppError('Email requis', 400);
  }

  const user = await User.findOne({ email, isActive: true });

  if (!user) {
    // Ne pas révéler si l'email existe ou non pour des raisons de sécurité
    return res.json({
      success: true,
      message: 'Si cet email existe, un lien de réinitialisation a été envoyé'
    });
  }

  // TODO: Implémenter l'envoi d'email avec un token de réinitialisation
  // Pour l'instant, on retourne juste un message
  
  console.log(`Demande de réinitialisation de mot de passe pour: ${email}`);

  res.json({
    success: true,
    message: 'Si cet email existe, un lien de réinitialisation a été envoyé'
  });
});

// @desc    Vérifier la validité du token
// @route   POST /api/auth/verify-token
// @access  Public
const verifyToken = asyncHandler(async (req, res) => {
  const { token } = req.body;

  if (!token) {
    throw new AppError('Token requis', 400);
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user || !user.isActive) {
      throw new AppError('Token invalide', 401);
    }

    res.json({
      success: true,
      message: 'Token valide',
      data: {
        user: user.getPublicProfile()
      }
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new AppError('Token expiré', 401);
    }
    throw new AppError('Token invalide', 401);
  }
});

// @desc    Rafraîchir le token
// @route   POST /api/auth/refresh-token
// @access  Private
const refreshToken = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);

  if (!user || !user.isActive) {
    throw new AppError('Utilisateur non trouvé', 404);
  }

  // Générer un nouveau token
  const token = generateToken(user._id);

  res.json({
    success: true,
    message: 'Token rafraîchi avec succès',
    data: {
      token,
      user: user.getPublicProfile()
    }
  });
});

module.exports = {
  register,
  login,
  logout,
  getMe,
  updateProfile,
  changePassword,
  forgotPassword,
  verifyToken,
  refreshToken
};