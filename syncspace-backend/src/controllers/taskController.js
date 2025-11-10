//taskController.js

/**
 * Task Controller
 * Handles Kanban board task CRUD operations and real-time updates
 */

const mongoose = require('mongoose');
const Task = require('../models/Task');
const Project = require('../models/Project');
const Workspace = require('../models/Workspace');
const Notification = require('../models/Notification');

// ------------------ Helpers ------------------
const getProjectIdFromParams = (params) => {
  // Accept either :projectId or :id depending on route
  return params.projectId || params.id || params.project_id;
};

// ------------------ Controllers ------------------

exports.getTasksByProject = async (req, res, next) => {
  try {
    const projectId = getProjectIdFromParams(req.params);

    // Validate projectId
    if (!projectId || !mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid project ID format'
      });
    }

    // Check if project exists
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      }); 
    }

    // Fetch tasks for the project
    const tasks = await Task.find({ projectId: project._id })
      .populate('createdBy', 'name email avatar')
      .populate('assignee', 'name email avatar')
      .populate('comments.userId', 'name email avatar')
      .sort('position');

    // Group tasks by status
    const groupedTasks = {
      todo: tasks.filter(task => task.status === 'todo'),
      inProgress: tasks.filter(task => task.status === 'inProgress'),
      done: tasks.filter(task => task.status === 'done')
    };

    return res.status(200).json({
      success: true,
      projectId: project._id,
      count: tasks.length,
      tasks: groupedTasks
    });
  } catch (error) {
    console.error('❌ Error in getTasksByProject:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching tasks'
    });
  }
};

exports.getTaskById = async (req, res, next) => {
  try {
    const id = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid task ID' });
    }

    const task = await Task.findById(id)
      .populate('createdBy', 'name email avatar')
      .populate('assignee', 'name email avatar')
      .populate('comments.userId', 'name email avatar')
      .populate('attachments.uploadedBy', 'name email avatar')
      .populate('projectId', 'name')
      .populate('workspaceId', 'name');

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    return res.status(200).json({ success: true, task });
  } catch (error) {
    console.error('❌ Error in getTaskById:', error);
    next(error);
  }
};

exports.createTask = async (req, res, next) => {
  try {
    const projectId = req.params.projectId || req.params.id;

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid project ID'
      });
    }

    const {
      title,
      description,
      status,
      priority,
      assignee,
      dueDate,
      tags,
      estimatedHours
    } = req.body;

    // Ensure required fields (title)
    if (!title || !String(title).trim()) {
      return res.status(400).json({ success: false, message: 'Task title is required' });
    }

    // Get project to obtain workspaceId and validate existence
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // Create the task using project._id (ObjectId)
    const task = await Task.create({
      title: title.trim(),
      description: description || '',
      projectId: project._id,
      workspaceId: project.workspaceId,
      createdBy: req.user._id,
      assignee: assignee || null,
      status: status || 'todo',
      priority: priority || 'medium',
      dueDate: dueDate || null,
      tags: Array.isArray(tags) ? tags : (tags ? [tags] : []),
      estimatedHours: estimatedHours || undefined
    });

    // Populate response-friendly fields
    await task.populate([
      { path: 'createdBy', select: 'name email avatar' },
      { path: 'assignee', select: 'name email avatar' }
    ]);

    // Notify assignee (if different from creator)
    if (assignee && assignee.toString() !== req.user._id.toString()) {
      try {
        await Notification.create({
          userId: assignee,
          type: 'task_assigned',
          title: 'New Task Assigned',
          message: `${req.user.name} assigned you a task: ${task.title}`,
          workspaceId: project.workspaceId,
          projectId: project._id,
          taskId: task._id,
          senderId: req.user._id,
          link: `/workspace/${project.workspaceId}/project/${project._id}/task/${task._id}`
        });

        const io = req.app.get('io');
        if (io) io.to(`user:${assignee}`).emit('notification:new', { type: 'task_assigned', task });
      } catch (notifyErr) {
        console.error('⚠️ Failed to create/send assignee notification:', notifyErr);
      }
    }

    // Emit socket event to workspace
    try {
      const io = req.app.get('io');
      if (io && project.workspaceId) {
        io.to(`workspace:${project.workspaceId}`).emit('task:created', task);
      }
    } catch (socketErr) {
      console.error('⚠️ Socket emit error (task:created):', socketErr);
    }

    return res.status(201).json({
      success: true,
      message: 'Task created successfully',
      task
    });
  } catch (error) {
    console.error('❌ Error in createTask:', error);
    return next(error);
  }
};

exports.updateTask = async (req, res, next) => {
  try {
    const id = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid task ID' });
    }

    const {
      title,
      description,
      status,
      priority,
      assignee,
      dueDate,
      tags,
      estimatedHours,
      actualHours
    } = req.body;

    const task = await Task.findById(id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    const oldAssignee = task.assignee ? task.assignee.toString() : null;
    const oldStatus = task.status;

    // Update fields safely
    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (status !== undefined) task.status = status;
    if (priority !== undefined) task.priority = priority;
    if (assignee !== undefined) task.assignee = assignee || null;
    if (dueDate !== undefined) task.dueDate = dueDate;
    if (tags !== undefined) task.tags = tags;
    if (estimatedHours !== undefined) task.estimatedHours = estimatedHours;
    if (actualHours !== undefined) task.actualHours = actualHours;

    await task.save();

    await task.populate([
      { path: 'createdBy', select: 'name email avatar' },
      { path: 'assignee', select: 'name email avatar' }
    ]);

    // Notify new assignee
    if (assignee && assignee.toString() !== oldAssignee && assignee.toString() !== req.user._id.toString()) {
      await Notification.create({
        userId: assignee,
        type: 'task_assigned',
        title: 'Task Assigned',
        message: `${req.user.name} assigned you a task: ${task.title}`,
        workspaceId: task.workspaceId,
        projectId: task.projectId,
        taskId: task._id,
        senderId: req.user._id,
        link: `/workspace/${task.workspaceId}/project/${task.projectId}/task/${task._id}`
      });
    }

    // If task completed, notify creator
    if (status === 'done' && oldStatus !== 'done') {
      if (task.createdBy && task.createdBy.toString() !== req.user._id.toString()) {
        await Notification.create({
          userId: task.createdBy,
          type: 'task_completed',
          title: 'Task Completed',
          message: `${req.user.name} completed the task: ${task.title}`,
          workspaceId: task.workspaceId,
          projectId: task.projectId,
          taskId: task._id,
          senderId: req.user._id
        });
      }
    }

    // Emit socket event
    try {
      const io = req.app.get('io');
      if (io && task.workspaceId) io.to(`workspace:${task.workspaceId}`).emit('task:updated', task);
    } catch (socketErr) {
      console.error('⚠️ Socket emit error (task:updated):', socketErr);
    }

    return res.status(200).json({ success: true, message: 'Task updated successfully', task });
  } catch (error) {
    console.error('❌ Error in updateTask:', error);
    next(error);
  }
};

exports.moveTask = async (req, res, next) => {
  try {
    const id = req.params.id;
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid task ID' });
    }

    if (!['todo', 'inProgress', 'done'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status. Must be todo, inProgress, or done' });
    }

    const task = await Task.findById(id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    const oldStatus = task.status;
    task.status = status;
    await task.save();

    try {
      const io = req.app.get('io');
      if (io && task.workspaceId) {
        io.to(`workspace:${task.workspaceId}`).emit('task:moved', {
          taskId: task._id,
          fromColumn: oldStatus,
          toColumn: status,
          task
        });
      }
    } catch (socketErr) {
      console.error('⚠️ Socket emit error (task:moved):', socketErr);
    }

    return res.status(200).json({ success: true, message: 'Task moved successfully', task });
  } catch (error) {
    console.error('❌ Error in moveTask:', error);
    next(error);
  }
};

/**
 * @desc    Delete task
 * @route   DELETE /api/tasks/:id
 * @access  Private
 */
exports.deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    await task.remove();

    // Emit socket event
    const io = req.app.get('io');
    io.to(`workspace:${task.workspaceId}`).emit('task:deleted', {
      taskId: task._id
    });

    res.status(200).json({
      success: true,
      message: 'Task deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Add comment to task
 * @route   POST /api/tasks/:id/comments
 * @access  Private
 */
exports.addComment = async (req, res, next) => {
  try {
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Comment text is required'
      });
    }

    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    const comment = await task.addComment(req.user._id, text);

    // Populate comment
    await task.populate('comments.userId', 'name email avatar');

    // Notify task assignee and creator
    const notifyUserIds = [task.createdBy, task.assignee]
      .filter(id => id && id.toString() !== req.user._id.toString())
      .map(id => id.toString());

    if (notifyUserIds.length > 0) {
      await Notification.createForUsers(notifyUserIds, {
        type: 'comment',
        title: 'New Comment',
        message: `${req.user.name} commented on task: ${task.title}`,
        workspaceId: task.workspaceId,
        projectId: task.projectId,
        taskId: task._id,
        senderId: req.user._id,
        link: `/workspace/${task.workspaceId}/project/${task.projectId}/task/${task._id}`
      });
    }

    // Emit socket event
    const io = req.app.get('io');
    io.to(`workspace:${task.workspaceId}`).emit('task:comment:added', {
      taskId: task._id,
      comment
    });

    res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      comment
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update comment
 * @route   PUT /api/tasks/:id/comments/:commentId
 * @access  Private
 */
exports.updateComment = async (req, res, next) => {
  try {
    const { commentId } = req.params;
    const { text } = req.body;

    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    const comment = task.comments.id(commentId);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    // Check if user is comment owner
    if (comment.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only edit your own comments'
      });
    }

    await task.updateComment(commentId, text);

    // Emit socket event
    const io = req.app.get('io');
    io.to(`workspace:${task.workspaceId}`).emit('task:comment:updated', {
      taskId: task._id,
      commentId,
      text
    });

    res.status(200).json({
      success: true,
      message: 'Comment updated successfully',
      comment
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete comment
 * @route   DELETE /api/tasks/:id/comments/:commentId
 * @access  Private
 */
exports.deleteComment = async (req, res, next) => {
  try {
    const { commentId } = req.params;

    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    const comment = task.comments.id(commentId);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    // Check if user is comment owner
    if (comment.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own comments'
      });
    }

    await task.deleteComment(commentId);

    // Emit socket event
    const io = req.app.get('io');
    io.to(`workspace:${task.workspaceId}`).emit('task:comment:deleted', {
      taskId: task._id,
      commentId
    });

    res.status(200).json({
      success: true,
      message: 'Comment deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get tasks by user (assigned to user)
 * @route   GET /api/tasks/user/assigned
 * @access  Private
 */
exports.getAssignedTasks = async (req, res, next) => {
  try {
    const tasks = await Task.find({ 
      assignee: req.user._id,
      status: { $ne: 'done' }
    })
      .populate('projectId', 'name')
      .populate('workspaceId', 'name')
      .populate('createdBy', 'name email avatar')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: tasks.length,
      tasks
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get tasks relevant to the authenticated user
 * @route GET /api/tasks
 */
exports.getUserTasks = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const tasks = await Task.find({
      $or: [
        { createdBy: userId },
        { assignee: userId }
      ]
    })
      .populate('projectId', 'name')
      .populate('workspaceId', 'name')
      .populate('createdBy', 'name email avatar')
      .sort('-createdAt');

    res.status(200).json({ success: true, count: tasks.length, tasks });
  } catch (error) {
    next(error);
  }
};

// Update task status (alias for moveTask)
exports.updateTaskStatus = async (req, res, next) => {
  try {
    req.body = req.body || {};
    const { status } = req.body;
    req.body.status = status;
    return exports.moveTask(req, res, next);
  } catch (error) {
    next(error);
  }
};

// Update task priority
exports.updateTaskPriority = async (req, res, next) => {
  try {
    const { priority } = req.body;
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    task.priority = priority || task.priority;
    await task.save();
    const io = req.app.get('io');
    if (io) io.to(`workspace:${task.workspaceId}`).emit('task:priorityUpdated', task);
    res.status(200).json({ success: true, message: 'Task priority updated', task });
  } catch (error) {
    next(error);
  }
};

// Assign task to user(s) - accepts single userId or array
exports.assignTask = async (req, res, next) => {
  try {
    const { assignee } = req.body; // could be userId or array
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    // For simplicity support single assignee
    task.assignee = Array.isArray(assignee) ? assignee[0] : assignee;
    await task.save();

    // Notify assignee
    if (task.assignee) {
      await Notification.create({
        userId: task.assignee,
        type: 'task_assigned',
        title: 'Task Assigned',
        message: `${req.user.name} assigned you a task: ${task.title}`,
        workspaceId: task.workspaceId,
        projectId: task.projectId,
        taskId: task._id,
        senderId: req.user._id
      });
    }

    const io = req.app.get('io');
    if (io) io.to(`workspace:${task.workspaceId}`).emit('task:assigned', task);

    res.status(200).json({ success: true, message: 'Task assigned', task });
  } catch (error) {
    next(error);
  }
};

// Unassign task
exports.unassignTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    task.assignee = null;
    await task.save();
    const io = req.app.get('io');
    if (io) io.to(`workspace:${task.workspaceId}`).emit('task:unassigned', task);
    res.status(200).json({ success: true, message: 'Task unassigned', task });
  } catch (error) {
    next(error);
  }
};

// Get comments for a task
exports.getTaskComments = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id).populate('comments.userId', 'name email avatar');
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    res.status(200).json({ success: true, comments: task.comments || [] });
  } catch (error) {
    next(error);
  }
};

// Subtasks: add/update/delete
exports.addSubtask = async (req, res, next) => {
  try {
    const { title } = req.body;
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    task.subtasks = task.subtasks || [];
    const subtask = { title, completed: false };
    task.subtasks.push(subtask);
    await task.save();
    res.status(201).json({ success: true, message: 'Subtask added', subtask: task.subtasks[task.subtasks.length - 1] });
  } catch (error) {
    next(error);
  }
};

exports.updateSubtask = async (req, res, next) => {
  try {
    const { subtaskId } = req.params;
    const { title, completed } = req.body;
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    const sub = task.subtasks.id(subtaskId);
    if (!sub) return res.status(404).json({ success: false, message: 'Subtask not found' });
    if (title !== undefined) sub.title = title;
    if (completed !== undefined) sub.completed = completed;
    await task.save();
    res.status(200).json({ success: true, message: 'Subtask updated', subtask: sub });
  } catch (error) {
    next(error);
  }
};

exports.deleteSubtask = async (req, res, next) => {
  try {
    const { subtaskId } = req.params;
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    task.subtasks = (task.subtasks || []).filter(s => s._id.toString() !== subtaskId);
    await task.save();
    res.status(200).json({ success: true, message: 'Subtask deleted' });
  } catch (error) {
    next(error);
  }
};

// Attachments (basic placeholders)
exports.addAttachment = async (req, res, next) => {
  try {
    // This expects file upload middleware to populate req.file or req.files
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    const attachment = req.file || req.body.attachment;
    task.attachments = task.attachments || [];
    task.attachments.push({ url: attachment && attachment.path ? attachment.path : attachment, uploadedBy: req.user._id });
    await task.save();
    res.status(201).json({ success: true, message: 'Attachment added', attachments: task.attachments });
  } catch (error) {
    next(error);
  }
};

exports.deleteAttachment = async (req, res, next) => {
  try {
    const { attachmentId } = req.params;
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    task.attachments = (task.attachments || []).filter(a => a._id.toString() !== attachmentId);
    await task.save();
    res.status(200).json({ success: true, message: 'Attachment removed' });
  } catch (error) {
    next(error);
  }
};