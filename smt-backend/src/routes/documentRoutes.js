const express = require('express');
const {
  getDocuments,
  getDocument,
  uploadDocument,
  updateDocument,
  deleteDocument,
  downloadDocument,
  getDocumentPreview,
  searchDocuments,
  getDocumentsByType,
  getDocumentsByEntity
} = require('../controllers/documentController');
const { protect, restrictTo } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const { uploadConfigs } = require('../middleware/upload');

const router = express.Router();

// Toutes les routes nécessitent une authentification
router.use(protect);

// Routes principales
router.route('/')
  .get(getDocuments);

router.post('/upload', uploadConfigs.documents.single('file'), uploadDocument);

// Upload multiple
router.post('/upload-multiple', 
  uploadConfigs.documents.array('files', 10), 
  uploadDocument
);

router.route('/:id')
  .get(getDocument)
  .put(updateDocument)
  .delete(restrictTo('admin', 'user'), deleteDocument);

// Routes spécialisées
router.get('/:id/download', downloadDocument);
router.get('/:id/preview', getDocumentPreview);
router.get('/search/:query', searchDocuments);
router.get('/type/:type', getDocumentsByType);
router.get('/entity/:entityType/:entityId', getDocumentsByEntity);

module.exports = router;