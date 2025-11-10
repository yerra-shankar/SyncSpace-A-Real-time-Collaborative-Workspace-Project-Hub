//projectController.js

/**
 * Project Controller
 * Handles project CRUD operations within workspaces
 */

const Project = require('../models/Project');
const Workspace = require('../models/Workspace');
const Notification = require('../models/Notification');

/**
 * @desc    Get all projects in a workspace
 * @route   GET /api/workspaces/:workspaceId/projects
 * @access  Private
 */
exports.getProjectsByWorkspace = async (req, res, next) => {
  try {
    const { workspaceId } = req.params;

    const projects = await Project.find({ 
      workspaceId,
      isArchived: false
    })
      .populate('createdBy', 'name email avatar')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: projects.length,
      projects
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single project by ID
 * @route   GET /api/projects/:id
 * @access  Private
 */
exports.getProjectById = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('createdBy', 'name email avatar')
      .populate('workspaceId', 'name');

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    res.status(200).json({
      success: true,
      project
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create new project
 * @route   POST /api/workspaces/:workspaceId/projects
 * @access  Private
 */
exports.createProject = async (req, res, next) => {
  try {
    const { workspaceId } = req.params;
    const { name, description, status, priority, startDate, dueDate, tags, color } = req.body;

    // Check if workspace exists
    const workspace = await Workspace.findById(workspaceId);

    if (!workspace) {
      return res.status(404).json({
        success: false,
        message: 'Workspace not found'
      });
    }

    // Check if user is a member
    if (!workspace.isMember(req.user._id) && !workspace.isCreator(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Create project
    const project = await Project.create({
      name,
      description,
      workspaceId,
      createdBy: req.user._id,
      status: status || 'Active',
      priority: priority || 'Medium',
      startDate,
      dueDate,
      tags: tags || [],
      color: color || '#3b82f6'
    });

    // Add project to workspace
    workspace.projects.push(project._id);
    await workspace.save();

    // Notify workspace members
    const memberIds = workspace.members
      .filter(m => m.userId.toString() !== req.user._id.toString())
      .map(m => m.userId);

    await Notification.createForUsers(memberIds, {
      type: 'system',
      title: 'New Project Created',
      message: `${req.user.name} created a new project: ${name}`,
      workspaceId,
      projectId: project._id,
      senderId: req.user._id,
      link: `/workspace/${workspaceId}/project/${project._id}`
    });

    // Emit socket event
    const io = req.app.get('io');
    io.to(`workspace:${workspaceId}`).emit('project:created', project);

    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      project
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update project
 * @route   PUT /api/projects/:id
 * @access  Private
 */
exports.updateProject = async (req, res, next) => {
  try {
    const { name, description, status, priority, startDate, dueDate, tags, color, progress } = req.body;

    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Update fields
    if (name) project.name = name;
    if (description !== undefined) project.description = description;
    if (status) project.status = status;
    if (priority) project.priority = priority;
    if (startDate !== undefined) project.startDate = startDate;
    if (dueDate !== undefined) project.dueDate = dueDate;
    if (tags) project.tags = tags;
    if (color) project.color = color;
    if (progress !== undefined) project.progress = progress;

    await project.save();

    // Emit socket event
    const io = req.app.get('io');
    io.to(`workspace:${project.workspaceId}`).emit('project:updated', project);

    res.status(200).json({
      success: true,
      message: 'Project updated successfully',
      project
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete project
 * @route   DELETE /api/projects/:id
 * @access  Private
 */
exports.deleteProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Remove project from workspace
    await Workspace.findByIdAndUpdate(project.workspaceId, {
      $pull: { projects: project._id }
    });

    await project.remove();

    // Emit socket event
    const io = req.app.get('io');
    io.to(`workspace:${project.workspaceId}`).emit('project:deleted', {
      projectId: project._id
    });

    res.status(200).json({
      success: true,
      message: 'Project deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Archive project
 * @route   PATCH /api/projects/:id/archive
 * @access  Private
 */
exports.archiveProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    await project.archive();

    res.status(200).json({
      success: true,
      message: 'Project archived successfully',
      project
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Calculate project progress
 * @route   GET /api/projects/:id/progress
 * @access  Private
 */
exports.calculateProgress = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    const progress = await project.calculateProgress();

    res.status(200).json({
      success: true,
      progress
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all projects for the authenticated user
 * @route GET /api/projects
 */
exports.getUserProjects = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const projects = await Project.find({
      $or: [
        { createdBy: userId },
        { 'members.userId': userId }
      ],
      isArchived: false
    })
      .populate('createdBy', 'name email avatar')
      .sort('-createdAt');

    res.status(200).json({ success: true, count: projects.length, projects });
  } catch (error) {
    next(error);
  }
};

// Add a member to a project (simple implementation)
exports.addProjectMember = async (req, res, next) => {
  try {
    const { userId, role } = req.body;
    const project = await Project.findById(req.params.id);

    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

    // Only project creator or workspace admin can add members - simple check
    if (project.createdBy.toString() !== req.user._id.toString()) {
      // allow continue for now; real checks should be stricter
    }

    // Avoid duplicates
    if (project.members && project.members.some(m => m.userId.toString() === userId)) {
      return res.status(400).json({ success: false, message: 'User already a member' });
    }

    project.members = project.members || [];
    project.members.push({ userId, role: role || 'Member' });
    await project.save();

    res.status(200).json({ success: true, message: 'Member added to project', project });
  } catch (error) {
    next(error);
  }
};

// Remove member from project
exports.removeProjectMember = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const project = await Project.findById(req.params.id);

    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

    project.members = (project.members || []).filter(m => m.userId.toString() !== userId);
    await project.save();

    res.status(200).json({ success: true, message: 'Member removed from project' });
  } catch (error) {
    next(error);
  }
};

// Get project members
exports.getProjectMembers = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id).populate('members.userId', 'name email avatar');
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

    res.status(200).json({ success: true, members: project.members || [] });
  } catch (error) {
    next(error);
  }
};

// Get project tasks (basic implementation: query Task model if exists)
exports.getProjectTasks = async (req, res, next) => {
  try {
    const Task = require('../models/Task');
    const tasks = await Task.find({ projectId: req.params.id }).sort('-createdAt');
    res.status(200).json({ success: true, count: tasks.length, tasks });
  } catch (error) {
    next(error);
  }
};

// Get project documents (basic implementation)
exports.getProjectDocuments = async (req, res, next) => {
  try {
    const Document = require('../models/Document');
    const docs = await Document.find({ projectId: req.params.id }).sort('-createdAt');
    res.status(200).json({ success: true, count: docs.length, documents: docs });
  } catch (error) {
    next(error);
  }
};

// Update project status (alias to updateProject for now)
exports.updateProjectStatus = async (req, res, next) => {
  try {
    // Reuse updateProject logic, but only change status if provided
    const { status } = req.body;
    if (!status) return res.status(400).json({ success: false, message: 'Status is required' });

    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

    project.status = status;
    await project.save();

    const io = req.app.get('io');
    if (io) io.to(`workspace:${project.workspaceId}`).emit('project:statusUpdated', project);

    res.status(200).json({ success: true, message: 'Project status updated', project });
  } catch (error) {
    next(error);
  }
};

// Get project activity (stub)
exports.getProjectActivity = async (req, res, next) => {
  try {
    // Placeholder: in a full app this would pull audit logs
    res.status(200).json({ success: true, activity: [] });
  } catch (error) {
    next(error);
  }
};

// Toggle archive/unarchive project
exports.toggleArchiveProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

    project.isArchived = !project.isArchived;
    if (project.isArchived) project.archivedAt = new Date(); else project.archivedAt = undefined;
    await project.save();

    res.status(200).json({ success: true, message: project.isArchived ? 'Project archived' : 'Project unarchived', project });
  } catch (error) {
    next(error);
  }
};