// syncspace-backend/src/routes/projectRoutes.js

const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const { protect, verifyWorkspaceAccess } = require('../middlewares/authMiddleware');
const { validateProjectCreate, validateProjectUpdate } = require('../validators/projectValidator');
const validationMiddleware = require('../middlewares/validationMiddleware');

/**
 * @route   POST /api/projects
 * @desc    Create a new project
 * @access  Private
 */
router.post(
  '/',
  protect,
  validateProjectCreate,
  validationMiddleware,
  projectController.createProject
);

/**
 * @route   GET /api/projects
 * @desc    Get all projects for authenticated user
 * @access  Private
 */
router.get('/', protect, projectController.getUserProjects);

/**
 * @route   GET /api/projects/:id
 * @desc    Get project by ID
 * @access  Private
 */
router.get('/:id', protect, verifyWorkspaceAccess, projectController.getProjectById);

/**
 * @route   PUT /api/projects/:id
 * @desc    Update project details
 * @access  Private (Project Admin/Owner only)
 */
router.put(
  '/:id',
  protect,
  verifyWorkspaceAccess,
  validateProjectUpdate,
  validationMiddleware,
  projectController.updateProject
);

/**
 * @route   DELETE /api/projects/:id
 * @desc    Delete a project
 * @access  Private (Project Owner only)
 */
router.delete('/:id', protect, verifyWorkspaceAccess, projectController.deleteProject);

/**
 * @route   POST /api/projects/:id/members
 * @desc    Add member to project
 * @access  Private (Project Admin only)
 */
router.post('/:id/members', protect, verifyWorkspaceAccess, projectController.addProjectMember);

/**
 * @route   DELETE /api/projects/:id/members/:userId
 * @desc    Remove member from project
 * @access  Private (Project Admin only)
 */
router.delete('/:id/members/:userId', protect, verifyWorkspaceAccess, projectController.removeProjectMember);

/**
 * @route   GET /api/projects/:id/members
 * @desc    Get all project members
 * @access  Private
 */
router.get('/:id/members', protect, verifyWorkspaceAccess, projectController.getProjectMembers);

/**
 * @route   GET /api/projects/:id/tasks
 * @desc    Get all tasks in the project
 * @access  Private
 */
// router.get('/:id/tasks', protect, verifyWorkspaceAccess, projectController.getProjectTasks);

/**
 * @route   GET /api/projects/:id/documents
 * @desc    Get all documents in the project
 * @access  Private
 */
router.get('/:id/documents', protect, verifyWorkspaceAccess, projectController.getProjectDocuments);

/**
 * @route   PATCH /api/projects/:id/status
 * @desc    Update project status
 * @access  Private (Project Admin only)
 */
router.patch('/:id/status', protect, verifyWorkspaceAccess, projectController.updateProjectStatus);

/**
 * @route   GET /api/projects/:id/activity
 * @desc    Get project activity log
 * @access  Private
 */
router.get('/:id/activity', protect, verifyWorkspaceAccess, projectController.getProjectActivity);

/**
 * @route   POST /api/projects/:id/archive
 * @desc    Archive or Unarchive project
 * @access  Private (Project Admin only)
 */
router.post('/:id/archive', protect, verifyWorkspaceAccess, projectController.toggleArchiveProject);

module.exports = router;
