const express = require('express');
const {
  getUsers,
  createUser
} = require('../controllers/userController');
const { protect, restrictTo } = require('../middleware/auth');
const { validate, userValidation } = require('../middleware/validation');

const router = express.Router();

// Toutes les routes nécessitent une authentification
router.use(protect);

// Routes pour les administrateurs uniquement
router.use(restrictTo('admin'));

// Routes principales
router.route('/')
  .get(getUsers)
  .post(validate(userValidation.register), createUser);

module.exports = router;