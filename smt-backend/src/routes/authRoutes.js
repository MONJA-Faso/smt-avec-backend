const express = require('express');
const router = express.Router();

// Import des contrôleurs
const {
  register,
  login,
  logout,
  getMe,
  updateProfile,
  changePassword,
  forgotPassword,
  verifyToken,
  refreshToken
} = require('../controllers/authController');

// Import des middlewares
const { authenticate, rateLimitLogin } = require('../middleware/auth');
const { validate, userValidation } = require('../middleware/validation');

console.log('AUTH MIDDLEWARES:', { authenticate, rateLimitLogin });


// Routes publiques
router.post('/register', validate(userValidation.register), register);
router.post('/login', rateLimitLogin, validate(userValidation.login), login);
router.post('/verify-token', verifyToken);
router.post('/forgot-password', forgotPassword);

// Routes protégées
router.use(authenticate);

router.get('/me', getMe);
router.post('/logout', logout);
router.put('/profile', validate(userValidation.update), updateProfile);
router.put('/change-password', changePassword);
router.post('/refresh-token', refreshToken);

module.exports = router;