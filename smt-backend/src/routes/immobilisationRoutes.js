const express = require('express');
const {
  getImmobilisations,
  getImmobilisation,
  createImmobilisation,
  updateImmobilisation,
  deleteImmobilisation
} = require('../controllers/immobilisationController');
const { protect, restrictTo } = require('../middleware/auth');
const { validate, immobilisationValidation } = require('../middleware/validation');
const { upload } = require('../middleware/upload');

const router = express.Router();

// Toutes les routes nécessitent une authentification
router.use(protect);

// Routes principales
router.route('/')
  .get(getImmobilisations)
  .post(validate(immobilisationValidation.create), createImmobilisation);

router.route('/:id')
  .get(getImmobilisation)
  .put(validate(immobilisationValidation.update), updateImmobilisation)
  .delete(restrictTo('admin', 'user'), deleteImmobilisation);

module.exports = router;