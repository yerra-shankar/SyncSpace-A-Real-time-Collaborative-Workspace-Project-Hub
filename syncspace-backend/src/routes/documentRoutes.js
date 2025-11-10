// syncspace-backend/src/routes/documentRoutes.js

const express = require('express');
const router = express.Router();
const documentController = require('../controllers/documentController');
const { protect, verifyWorkspaceAccess } = require('../middlewares/authMiddleware');
const { validateDocumentCreate, validateDocumentUpdate } = require('../validators/documentValidator');
const validationMiddleware = require('../middlewares/validationMiddleware');

/* =========================================================================
   ✅ WORKSPACE-LEVEL DOCUMENT ROUTES
   These match frontend routes like:
   /api/workspaces/:workspaceId/documents
   ========================================================================= */

/**
 * @route   POST /api/workspaces/:workspaceId/documents
 * @desc    Create a new document in a workspace
 * @access  Private
 */
router.post(
  '/workspaces/:workspaceId/documents',
  protect,
  verifyWorkspaceAccess,
  validateDocumentCreate,
  validationMiddleware,
  documentController.createDocument
);

/**
 * @route   GET /api/workspaces/:workspaceId/documents
 * @desc    Get all documents for a workspace
 * @access  Private
 */
router.get(
  '/workspaces/:workspaceId/documents',
  protect,
  verifyWorkspaceAccess,
  documentController.getDocumentsByWorkspace
);

/* =========================================================================
   ✅ GENERIC DOCUMENT ROUTES
   ========================================================================= */

/**
 * @route   GET /api/documents
 * @desc    Get all documents for authenticated user
 * @access  Private
 */
router.get('/', protect, documentController.getUserDocuments);

/**
 * @route   GET /api/documents/:id
 * @desc    Get document by ID
 * @access  Private
 */
router.get('/:id', protect, verifyWorkspaceAccess, documentController.getDocumentById);

/**
 * @route   PUT /api/documents/:id
 * @desc    Update document details
 * @access  Private
 */
router.put(
  '/:id',
  protect,
  verifyWorkspaceAccess,
  validateDocumentUpdate,
  validationMiddleware,
  documentController.updateDocument
);

/**
 * @route   DELETE /api/documents/:id
 * @desc    Delete document
 * @access  Private
 */
router.delete('/:id', protect, verifyWorkspaceAccess, documentController.deleteDocument);

/**
 * @route   PATCH /api/documents/:id/content
 * @desc    Update document content (for real-time editing)
 * @access  Private
 */
router.patch('/:id/content', protect, verifyWorkspaceAccess, documentController.updateDocumentContent);

/**
 * @route   POST /api/documents/:id/share
 * @desc    Share document with users
 * @access  Private
 */
router.post('/:id/share', protect, verifyWorkspaceAccess, documentController.shareDocument);

/**
 * @route   DELETE /api/documents/:id/share/:userId
 * @desc    Remove user access from document
 * @access  Private
 */
router.delete('/:id/share/:userId', protect, verifyWorkspaceAccess, documentController.removeDocumentAccess);

/**
 * @route   GET /api/documents/:id/collaborators
 * @desc    Get all collaborators for document
 * @access  Private
 */
router.get('/:id/collaborators', protect, verifyWorkspaceAccess, documentController.getDocumentCollaborators);

/**
 * @route   GET /api/documents/:id/versions
 * @desc    Get document version history
 * @access  Private
 */
router.get('/:id/versions', protect, verifyWorkspaceAccess, documentController.getDocumentVersions);

/**
 * @route   POST /api/documents/:id/versions/:versionId/restore
 * @desc    Restore document to a specific version
 * @access  Private
 */
router.post('/:id/versions/:versionId/restore', protect, verifyWorkspaceAccess, documentController.restoreDocumentVersion);

/**
 * @route   POST /api/documents/:id/lock
 * @desc    Lock document for editing
 * @access  Private
 */
router.post('/:id/lock', protect, verifyWorkspaceAccess, documentController.lockDocument);

/**
 * @route   POST /api/documents/:id/unlock
 * @desc    Unlock document
 * @access  Private
 */
router.post('/:id/unlock', protect, verifyWorkspaceAccess, documentController.unlockDocument);

/**
 * @route   POST /api/documents/:id/duplicate
 * @desc    Duplicate document
 * @access  Private
 */
router.post('/:id/duplicate', protect, verifyWorkspaceAccess, documentController.duplicateDocument);

/**
 * @route   GET /api/documents/:id/export
 * @desc    Export document (PDF, DOCX, etc.)
 * @access  Private
 */
router.get('/:id/export', protect, verifyWorkspaceAccess, documentController.exportDocument);

/**
 * @route   POST /api/documents/:id/comments
 * @desc    Add comment to document
 * @access  Private
 */
router.post('/:id/comments', protect, verifyWorkspaceAccess, documentController.addDocumentComment);

/**
 * @route   DELETE /api/documents/:id/comments/:commentId
 * @desc    Delete comment from document
 * @access  Private
 */
router.delete('/:id/comments/:commentId', protect, verifyWorkspaceAccess, documentController.deleteDocumentComment);

module.exports = router;
