//taskRoutes.js

/**
 * Task Routes
 * Handles all task-related API endpoints, including both global and project-specific routes
 */

const express = require('express');
const router = express.Router({ mergeParams: true }); // ✅ Enables :projectId param access
const taskController = require('../controllers/taskController');
const { protect, verifyWorkspaceAccess } = require('../middlewares/authMiddleware');
const { validateTaskCreate, validateTaskUpdate } = require('../validators/taskValidator');
const validationMiddleware = require('../middlewares/validationMiddleware');

/* ============================================================================
   PROJECT-BASED TASK ROUTES
   These routes handle requests like: /api/projects/:projectId/tasks
   ========================================================================== */

/**
 * @route   GET /api/projects/:projectId/tasks
 * @desc    Get all tasks for a project (Kanban board)
 * @access  Private
 */
// Handles requests like: /api/projects/:projectId/tasks
router.get(
  '/:projectId/tasks',
  protect,
  verifyWorkspaceAccess,
  taskController.getTasksByProject
);

router.post(
  '/:projectId/tasks',
  protect,
  verifyWorkspaceAccess,
  validateTaskCreate,
  validationMiddleware,
  taskController.createTask
);


/* ============================================================================
   GLOBAL TASK ROUTES
   These handle general operations across all tasks
   ========================================================================== */

/**
 * @route   GET /api/tasks
 * @desc    Get all tasks for the authenticated user
 * @access  Private
 */
router.get('/', protect, taskController.getUserTasks);

/**
 * @route   GET /api/tasks/:id
 * @desc    Get task by ID
 * @access  Private
 */
router.get('/:id', protect, verifyWorkspaceAccess, taskController.getTaskById);

/**
 * @route   POST /api/tasks
 * @desc    Create a new task (non-project specific)
 * @access  Private
 */
router.post(
  '/',
  protect,
  validateTaskCreate,
  validationMiddleware,
  taskController.createTask
);

/**
 * @route   PUT /api/tasks/:id
 * @desc    Update a task
 * @access  Private
 */
router.put(
  '/:id',
  protect,
  verifyWorkspaceAccess,
  validateTaskUpdate,
  validationMiddleware,
  taskController.updateTask
);

/**
 * @route   DELETE /api/tasks/:id
 * @desc    Delete a task
 * @access  Private
 */
router.delete('/:id', protect, verifyWorkspaceAccess, taskController.deleteTask);

/**
 * @route   PATCH /api/tasks/:id/move
 * @desc    Move task between columns/status (Kanban)
 * @access  Private
 */
router.patch('/:id/move', protect, verifyWorkspaceAccess, taskController.moveTask);

/**
 * @route   PATCH /api/tasks/:id/status
 * @desc    Update task status
 * @access  Private
 */
router.patch('/:id/status', protect, verifyWorkspaceAccess, taskController.updateTaskStatus);

/**
 * @route   PATCH /api/tasks/:id/priority
 * @desc    Update task priority
 * @access  Private
 */
router.patch('/:id/priority', protect, verifyWorkspaceAccess, taskController.updateTaskPriority);

/**
 * @route   PATCH /api/tasks/:id/assign
 * @desc    Assign task to user(s)
 * @access  Private
 */
router.patch('/:id/assign', protect, verifyWorkspaceAccess, taskController.assignTask);

/**
 * @route   PATCH /api/tasks/:id/unassign
 * @desc    Unassign user from task
 * @access  Private
 */
router.patch('/:id/unassign', protect, verifyWorkspaceAccess, taskController.unassignTask);

/**
 * @route   POST /api/tasks/:id/comments
 * @desc    Add comment to task
 * @access  Private
 */
router.post('/:id/comments', protect, verifyWorkspaceAccess, taskController.addComment);

/**
 * @route   GET /api/tasks/:id/comments
 * @desc    Get all comments for a task
 * @access  Private
 */
router.get('/:id/comments', protect, verifyWorkspaceAccess, taskController.getTaskComments);

/**
 * @route   DELETE /api/tasks/:id/comments/:commentId
 * @desc    Delete comment from task
 * @access  Private
 */
router.delete('/:id/comments/:commentId', protect, verifyWorkspaceAccess, taskController.deleteComment);

/**
 * @route   POST /api/tasks/:id/subtasks
 * @desc    Add subtask to a task
 * @access  Private
 */
router.post('/:id/subtasks', protect, verifyWorkspaceAccess, taskController.addSubtask);

/**
 * @route   PATCH /api/tasks/:id/subtasks/:subtaskId
 * @desc    Update a subtask
 * @access  Private
 */
router.patch('/:id/subtasks/:subtaskId', protect, verifyWorkspaceAccess, taskController.updateSubtask);

/**
 * @route   DELETE /api/tasks/:id/subtasks/:subtaskId
 * @desc    Delete a subtask
 * @access  Private
 */
router.delete('/:id/subtasks/:subtaskId', protect, verifyWorkspaceAccess, taskController.deleteSubtask);

/**
 * @route   POST /api/tasks/:id/attachments
 * @desc    Add attachment to a task
 * @access  Private
 */
router.post('/:id/attachments', protect, verifyWorkspaceAccess, taskController.addAttachment);

/**
 * @route   DELETE /api/tasks/:id/attachments/:attachmentId
 * @desc    Delete attachment from task
 * @access  Private
 */
router.delete('/:id/attachments/:attachmentId', protect, verifyWorkspaceAccess, taskController.deleteAttachment);

module.exports = router;
