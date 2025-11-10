// syncspace-backend/src/routes/workspaceRoutes.js

const express = require('express');
const router = express.Router();

// Controllers & Middleware
const workspaceController = require('../controllers/workspaceController');
const { protect, verifyWorkspaceAccess } = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const { validateWorkspaceCreate, validateWorkspaceUpdate } = require('../validators/workspaceValidator');
const validationMiddleware = require('../middlewares/validationMiddleware');

/**
 * @route   POST /api/workspaces
 * @desc    Create a new workspace
 * @access  Private
 */
router.post(
  '/',
  protect,
  validateWorkspaceCreate,
  validationMiddleware,
  workspaceController.createWorkspace
);

/**
 * @route   GET /api/workspaces
 * @desc    Get all workspaces for authenticated user
 * @access  Private
 */
router.get('/', protect, workspaceController.getUserWorkspaces);

/**
 * @route   GET /api/workspaces/:id
 * @desc    Get workspace by ID
 * @access  Private
 */
router.get('/:id', protect, verifyWorkspaceAccess, workspaceController.getWorkspaceById);

/**
 * @route   PUT /api/workspaces/:id
 * @desc    Update workspace
 * @access  Private (Owner/Admin only)
 */
router.put(
  '/:id',
  protect,
  verifyWorkspaceAccess,
  validateWorkspaceUpdate,
  validationMiddleware,
  workspaceController.updateWorkspace
);

/**
 * @route   DELETE /api/workspaces/:id
 * @desc    Delete workspace
 * @access  Private (Owner only)
 */
router.delete('/:id', protect, verifyWorkspaceAccess, workspaceController.deleteWorkspace);

/**
 * @route   POST /api/workspaces/:id/members
 * @desc    Add member to workspace
 * @access  Private (Owner/Admin only)
 */
router.post('/:id/members', protect, verifyWorkspaceAccess, workspaceController.addMember);

/**
 * @route   DELETE /api/workspaces/:id/members/:userId
 * @desc    Remove member from workspace
 * @access  Private (Owner/Admin only)
 */
router.delete('/:id/members/:userId', protect, verifyWorkspaceAccess, workspaceController.removeMember);

/**
 * @route   PATCH /api/workspaces/:id/members/:userId/role
 * @desc    Update member role in workspace
 * @access  Private (Owner only)
 */
router.patch('/:id/members/:userId/role', protect, verifyWorkspaceAccess, workspaceController.updateMemberRole);

/**
 * @route   GET /api/workspaces/:id/members
 * @desc    Get all workspace members
 * @access  Private
 */
router.get('/:id/members', protect, verifyWorkspaceAccess, workspaceController.getWorkspaceMembers);

/**
 * @route   GET /api/workspaces/:id/projects
 * @desc    Get all projects in workspace
 * @access  Private
 */
router.get('/:id/projects', protect, verifyWorkspaceAccess, workspaceController.getWorkspaceProjects);

/**
 * @route   POST /api/workspaces/:id/invite
 * @desc    Send workspace invitation via email
 * @access  Private (Owner/Admin only)
 */
router.post('/:id/invite', protect, verifyWorkspaceAccess, workspaceController.inviteMember);

/**
 * @route   POST /api/workspaces/:id/leave
 * @desc    Leave workspace
 * @access  Private
 */
router.post('/:id/leave', protect, verifyWorkspaceAccess, workspaceController.leaveWorkspace);



/**
 * @route   GET /api/workspaces/:id/files
 * @desc    Get all files in workspace
 */
router.get('/:id/files', protect, verifyWorkspaceAccess, workspaceController.getWorkspaceFiles);

/**
 * @route   GET /api/workspaces/:id/documents
 * @desc    Get all documents in workspace
 */
router.get('/:id/documents', protect, verifyWorkspaceAccess, workspaceController.getWorkspaceDocuments);

/**
 * @route   GET /api/workspaces/:id/messages
 * @desc    Get workspace messages
 */
router.get('/:id/messages', protect, verifyWorkspaceAccess, workspaceController.getWorkspaceMessages);


module.exports = router;
