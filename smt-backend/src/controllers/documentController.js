const { Document } = require('../models');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const path = require('path');
const fs = require('fs').promises;

// @desc    Obtenir tous les documents
// @route   GET /api/documents
// @access  Private
const getDocuments = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, type, entityType, search } = req.query;
  
  const query = {};
  
  if (type) query.type = type;
  if (entityType) query.entityType = entityType;
  if (search) {
    query.$or = [
      { nom: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { tags: { $in: [new RegExp(search, 'i')] } }
    ];
  }

  const documents = await Document.find(query)
    .populate('uploadedBy', 'name')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await Document.countDocuments(query);

  res.json({
    success: true,
    data: {
      documents,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
});

// @desc    Obtenir un document par ID
// @route   GET /api/documents/:id
// @access  Private
const getDocument = asyncHandler(async (req, res) => {
  const document = await Document.findById(req.params.id).populate('uploadedBy', 'name');
  
  if (!document) {
    throw new AppError('Document non trouvé', 404);
  }

  res.json({
    success: true,
    data: { document }
  });
});

// @desc    Uploader un ou plusieurs documents
// @route   POST /api/documents
// @access  Private
const uploadDocument = asyncHandler(async (req, res) => {
  const files = req.files || [req.file];
  
  if (!files || files.length === 0) {
    throw new AppError('Aucun fichier fourni', 400);
  }

  const uploadedDocuments = [];

  for (const file of files) {
    if (!file) continue;

    const documentData = {
      nom: req.body.nom || file.originalname,
      description: req.body.description,
      type: req.body.type || 'autre',
      entityType: req.body.entityType,
      entityId: req.body.entityId,
      fileName: file.filename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      path: file.path,
      tags: req.body.tags ? req.body.tags.split(',').map(tag => tag.trim()) : [],
      uploadedBy: req.user.id
    };

    const document = await Document.create(documentData);
    uploadedDocuments.push(document);
  }

  res.status(201).json({
    success: true,
    message: `${uploadedDocuments.length} document(s) uploadé(s) avec succès`,
    data: { documents: uploadedDocuments }
  });
});

// @desc    Mettre à jour un document
// @route   PUT /api/documents/:id
// @access  Private
const updateDocument = asyncHandler(async (req, res) => {
  const { nom, description, type, tags } = req.body;
  
  const document = await Document.findById(req.params.id);
  
  if (!document) {
    throw new AppError('Document non trouvé', 404);
  }

  const updatedDocument = await Document.findByIdAndUpdate(
    req.params.id,
    {
      nom: nom || document.nom,
      description: description || document.description,
      type: type || document.type,
      tags: tags ? tags.split(',').map(tag => tag.trim()) : document.tags,
      updatedBy: req.user.id
    },
    { new: true, runValidators: true }
  );

  res.json({
    success: true,
    message: 'Document mis à jour avec succès',
    data: { document: updatedDocument }
  });
});

// @desc    Supprimer un document
// @route   DELETE /api/documents/:id
// @access  Private (Admin/Manager)
const deleteDocument = asyncHandler(async (req, res) => {
  const document = await Document.findById(req.params.id);
  
  if (!document) {
    throw new AppError('Document non trouvé', 404);
  }

  // Supprimer le fichier physique
  try {
    await fs.unlink(document.path);
  } catch (error) {
    console.error('Erreur lors de la suppression du fichier:', error);
  }

  await Document.findByIdAndDelete(req.params.id);

  res.json({
    success: true,
    message: 'Document supprimé avec succès'
  });
});

// @desc    Télécharger un document
// @route   GET /api/documents/:id/download
// @access  Private
const downloadDocument = asyncHandler(async (req, res) => {
  const document = await Document.findById(req.params.id);
  
  if (!document) {
    throw new AppError('Document non trouvé', 404);
  }

  const filePath = path.resolve(document.path);
  
  try {
    await fs.access(filePath);
    res.download(filePath, document.originalName);
  } catch (error) {
    throw new AppError('Fichier non trouvé sur le serveur', 404);
  }
});

// @desc    Obtenir un aperçu du document
// @route   GET /api/documents/:id/preview
// @access  Private
const getDocumentPreview = asyncHandler(async (req, res) => {
  const document = await Document.findById(req.params.id);
  
  if (!document) {
    throw new AppError('Document non trouvé', 404);
  }

  const filePath = path.resolve(document.path);
  
  try {
    await fs.access(filePath);
    res.sendFile(filePath);
  } catch (error) {
    throw new AppError('Fichier non trouvé sur le serveur', 404);
  }
});

// @desc    Rechercher des documents
// @route   GET /api/documents/search/:query
// @access  Private
const searchDocuments = asyncHandler(async (req, res) => {
  const { query } = req.params;
  
  const documents = await Document.find({
    $or: [
      { nom: { $regex: query, $options: 'i' } },
      { description: { $regex: query, $options: 'i' } },
      { tags: { $in: [new RegExp(query, 'i')] } },
      { originalName: { $regex: query, $options: 'i' } }
    ]
  }).populate('uploadedBy', 'name').sort({ createdAt: -1 });

  res.json({
    success: true,
    data: { documents }
  });
});

// @desc    Obtenir les documents par type
// @route   GET /api/documents/type/:type
// @access  Private
const getDocumentsByType = asyncHandler(async (req, res) => {
  const { type } = req.params;
  
  const documents = await Document.find({ type })
    .populate('uploadedBy', 'name')
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    data: { documents }
  });
});

// @desc    Obtenir les documents liés à une entité
// @route   GET /api/documents/entity/:entityType/:entityId
// @access  Private
const getDocumentsByEntity = asyncHandler(async (req, res) => {
  const { entityType, entityId } = req.params;
  
  const documents = await Document.find({ entityType, entityId })
    .populate('uploadedBy', 'name')
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    data: { documents }
  });
});

module.exports = {
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
};