// syncspace-backend/src/routes/fileRoutes.js

const express = require('express');
const router = express.Router();
const fileController = require('../controllers/fileController');
const { protect, verifyWorkspaceAccess } = require('../middlewares/authMiddleware');
const uploadMiddleware = require('../middlewares/uploadMiddleware');

// ==================== FILE ROUTES ====================

// Upload routes
router.post(
  '/upload',
  protect,
  uploadMiddleware.single('file'),
  verifyWorkspaceAccess,
  fileController.uploadFile
);

router.post(
  '/upload-multiple',
  protect,
  uploadMiddleware.array('files', 10),
  verifyWorkspaceAccess,
  fileController.uploadMultipleFiles
);

// Specific routes BEFORE parameterized routes
router.get('/search', protect, fileController.searchFiles);
router.get('/recent', protect, fileController.getRecentFiles);
router.get('/workspace/:workspaceId', protect, verifyWorkspaceAccess, fileController.getWorkspaceFiles);
router.get('/project/:projectId', protect, verifyWorkspaceAccess, fileController.getProjectFiles);
router.get('/task/:taskId', protect, verifyWorkspaceAccess, fileController.getTaskFiles);
router.get('/document/:documentId', protect, verifyWorkspaceAccess, fileController.getDocumentFiles);

// Generic ID routes LAST
router.get('/:id/download', protect, verifyWorkspaceAccess, fileController.downloadFile);
router.get('/:id/preview', protect, verifyWorkspaceAccess, fileController.getFilePreview);
router.get('/:id', protect, verifyWorkspaceAccess, fileController.getFileById);
router.patch('/:id', protect, verifyWorkspaceAccess, fileController.updateFileMetadata);
router.delete('/:id', protect, verifyWorkspaceAccess, fileController.deleteFile);

// Additional operations
router.post('/:id/share', protect, verifyWorkspaceAccess, fileController.shareFile);
router.post('/:id/move', protect, verifyWorkspaceAccess, fileController.moveFile);
router.post('/:id/copy', protect, verifyWorkspaceAccess, fileController.copyFile);

module.exports = router;
