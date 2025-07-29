const express = require('express');
const {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  updateUserStatus,
  resetUserPassword,
  getUserActivity,
  getUserPermissions,
  updateUserPermissions
} = require('../controllers/userController');
const { protect, restrictTo } = require('../middleware/auth');
const { validateUser, validateUserUpdate } = require('../middleware/validation');

const router = express.Router();

// Toutes les routes nécessitent une authentification
router.use(protect);

// Routes pour les administrateurs uniquement
router.use(restrictTo('admin'));

// Routes principales
router.route('/')
  .get(getUsers)
  .post(validateUser, createUser);

router.route('/:id')
  .get(getUser)
  .put(validateUserUpdate, updateUser)
  .delete(deleteUser);

// Routes spécialisées
router.patch('/:id/status', updateUserStatus);
router.post('/:id/reset-password', resetUserPassword);
router.get('/:id/activity', getUserActivity);
router.get('/:id/permissions', getUserPermissions);
router.put('/:id/permissions', updateUserPermissions);

module.exports = router;