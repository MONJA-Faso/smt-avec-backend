const express = require('express');
const {
  getDocuments,
  getDocument,
  uploadDocument,
  updateDocument,
  deleteDocument,
  downloadDocument,
  getDocumentsByType,
  getDocumentsByEntity,
  searchDocuments,
  getDocumentPreview
} = require('../controllers/documentController');
const { protect, restrictTo } = require('../middleware/auth');
const { validateDocument, validateDocumentUpdate } = require('../middleware/validation');
const { upload, uploadMultiple } = require('../middleware/upload');

const router = express.Router();

// Toutes les routes nécessitent une authentification
router.use(protect);

// Routes principales
router.route('/')
  .get(getDocuments)
  .post(upload.single('file'), validateDocument, uploadDocument);

// Upload multiple
router.post('/upload-multiple', 
  uploadMultiple.array('files', 10), 
  uploadDocument
);

router.route('/:id')
  .get(getDocument)
  .put(validateDocumentUpdate, updateDocument)
  .delete(restrictTo('admin', 'manager'), deleteDocument);

// Routes spécialisées
router.get('/:id/download', downloadDocument);
router.get('/:id/preview', getDocumentPreview);
router.get('/search/:query', searchDocuments);
router.get('/type/:type', getDocumentsByType);
router.get('/entity/:entityType/:entityId', getDocumentsByEntity);

module.exports = router;