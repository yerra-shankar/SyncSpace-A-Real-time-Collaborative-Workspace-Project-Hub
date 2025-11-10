
// src/controllers/workspaceController.js
const mongoose = require('mongoose');
const Workspace = require('../models/Workspace');
const User = require('../models/User');
const Project = require('../models/Project');
const Document = require('../models/Document');
const File = require('../models/File');
const Message = require('../models/Message');
const Notification = require('../models/Notification');

/**
 * @desc Get all workspaces for current user
 */
exports.getAllWorkspaces = async (req, res) => {
  try {
    const workspaces = await Workspace.find({
      $or: [{ createdBy: req.user._id }, { 'members.userId': req.user._id }],
      isArchived: false,
    })
      .populate('createdBy', 'name email avatar')
      .populate('members.userId', 'name email avatar')
      .populate('projects', 'name status')
      .sort('-createdAt');

    res.status(200).json({ success: true, workspaces });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * @desc Get single workspace
 */
exports.getWorkspaceById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id))
      return res.status(400).json({ success: false, message: 'Invalid ID' });

    const workspace = await Workspace.findById(req.params.id)
      .populate('createdBy', 'name email avatar')
      .populate('members.userId', 'name email avatar lastActive')
      .populate('projects');

    if (!workspace)
      return res.status(404).json({ success: false, message: 'Workspace not found' });

    if (!workspace.isMember(req.user._id) && !workspace.isCreator(req.user._id))
      return res.status(403).json({ success: false, message: 'Access denied' });

    res.status(200).json({ success: true, workspace });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * @desc Create workspace (auto-add default project)
 */
exports.createWorkspace = async (req, res) => {
  try {
    const { name, description, settings, color } = req.body;

    const workspace = await Workspace.create({
      name,
      description,
      createdBy: req.user._id,
      settings: settings || {},
      color: color || '#667eea',
    });

    await User.findByIdAndUpdate(req.user._id, { $push: { workspaces: workspace._id } });

    const defaultProject = await Project.create({
      name: `${name} Project`,
      description: 'Default Kanban board project',
      workspaceId: workspace._id,
      createdBy: req.user._id,
    });

    workspace.projects.push(defaultProject._id);
    await workspace.save();

    res.status(201).json({ success: true, workspace });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to create workspace' });
  }
};

/**
 * @desc Update workspace
 */
exports.updateWorkspace = async (req, res) => {
  try {
    const { name, description, settings, color, avatar } = req.body;
    const workspace = await Workspace.findById(req.params.id);

    if (!workspace)
      return res.status(404).json({ success: false, message: 'Workspace not found' });

    if (!workspace.isAdmin(req.user._id) && !workspace.isCreator(req.user._id))
      return res.status(403).json({ success: false, message: 'Access denied' });

    if (name) workspace.name = name;
    if (description !== undefined) workspace.description = description;
    if (settings) workspace.settings = { ...workspace.settings, ...settings };
    if (color) workspace.color = color;
    if (avatar !== undefined) workspace.avatar = avatar;

    await workspace.save();
    res.status(200).json({ success: true, workspace });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update workspace' });
  }
};

/**
 * @desc Delete workspace
 */
exports.deleteWorkspace = async (req, res) => {
  try {
    const workspace = await Workspace.findById(req.params.id);

    if (!workspace)
      return res.status(404).json({ success: false, message: 'Workspace not found' });

    if (!workspace.isCreator(req.user._id))
      return res.status(403).json({ success: false, message: 'Only creator can delete' });

    await User.updateMany({ workspaces: workspace._id }, { $pull: { workspaces: workspace._id } });
    await workspace.deleteOne();

    res.status(200).json({ success: true, message: 'Workspace deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete workspace' });
  }
};

/**
 * @desc Add member
 */
exports.addMember = async (req, res) => {
  try {
    const { email, role } = req.body;
    const workspace = await Workspace.findById(req.params.id);
    if (!workspace)
      return res.status(404).json({ success: false, message: 'Workspace not found' });

    const userToAdd = await User.findOne({ email });
    if (!userToAdd)
      return res.status(404).json({ success: false, message: 'User not found' });

    await workspace.addMember(userToAdd._id, role || 'Member');
    if (!userToAdd.workspaces.includes(workspace._id)) {
      userToAdd.workspaces.push(workspace._id);
      await userToAdd.save();
    }

    res.status(200).json({ success: true, message: 'Member added' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to add member' });
  }
};

/**
 * @desc Remove member
 */
exports.removeMember = async (req, res) => {
  try {
    const { userId } = req.params;
    const workspace = await Workspace.findById(req.params.id);

    if (!workspace)
      return res.status(404).json({ success: false, message: 'Workspace not found' });

    await workspace.removeMember(userId);
    await User.findByIdAndUpdate(userId, { $pull: { workspaces: workspace._id } });

    res.status(200).json({ success: true, message: 'Member removed' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to remove member' });
  }
};


// ✅ Get all projects in a workspace (fixed version)
exports.getWorkspaceProjects = async (req, res, next) => {
  try {
    const { id } = req.params; // workspaceId
    const Project = require('../models/Project');

    // Validate workspaceId format
    if (!id || id.length !== 24) {
      return res.status(400).json({
        success: false,
        message: 'Invalid workspace ID format'
      });
    }

    // Fetch projects correctly linked to this workspace
    const projects = await Project.find({ workspaceId: id, isArchived: false })
      .populate('createdBy', 'name email avatar')
      .sort('-createdAt');

    if (!projects || projects.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No projects found for this workspace',
        projects: []
      });
    }

    console.log('✅ Loaded Projects for Workspace:', id, projects.map(p => p._id));

    res.status(200).json({
      success: true,
      count: projects.length,
      projects
    });
  } catch (error) {
    console.error('❌ Error loading workspace projects:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error while loading workspace projects'
    });
  }
};

/**
 * @desc Get workspace members
 */
exports.getWorkspaceMembers = async (req, res) => {
  try {
    const workspace = await Workspace.findById(req.params.id)
      .populate('members.userId', 'name email avatar');
    if (!workspace)
      return res.status(404).json({ success: false, message: 'Workspace not found' });

    res.status(200).json({ success: true, members: workspace.members });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to load members' });
  }
};

/**
 * @desc Get workspace documents
 */
exports.getWorkspaceDocuments = async (req, res) => {
  try {
    const docs = await Document.find({ workspaceId: req.params.id });
    res.status(200).json({ success: true, documents: docs });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to load documents' });
  }
};

/**
 * @desc Get workspace files
 */
exports.getWorkspaceFiles = async (req, res) => {
  try {
    const files = await File.find({ workspaceId: req.params.id });
    res.status(200).json({ success: true, files });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to load files' });
  }
};

/**
 * @desc Get workspace messages
 */
exports.getWorkspaceMessages = async (req, res) => {
  try {
    const messages = await Message.find({ workspaceId: req.params.id })
      .populate('sender', 'name email avatar')
      .sort('-createdAt')
      .limit(50);
    res.status(200).json({ success: true, messages });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to load messages' });
  }
};


/**
 * @desc    Update a member’s role in workspace
 * @route   PATCH /api/workspaces/:id/members/:userId/role
 * @access  Private (Admin/Owner)
 */
exports.updateMemberRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!['Admin', 'Member', 'Viewer'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role type' });
    }

    const workspace = await Workspace.findById(req.params.id);
    if (!workspace)
      return res.status(404).json({ success: false, message: 'Workspace not found' });

    // Only admin or creator can update roles
    if (!workspace.isAdmin(req.user._id) && !workspace.isCreator(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const member = workspace.members.find(
      (m) => m.userId.toString() === userId.toString()
    );
    if (!member)
      return res.status(404).json({ success: false, message: 'Member not found in workspace' });

    member.role = role;
    await workspace.save();

    res.status(200).json({
      success: true,
      message: 'Member role updated successfully',
      workspace,
    });
  } catch (err) {
    console.error('Error updating member role:', err);
    res.status(500).json({ success: false, message: 'Failed to update member role' });
  }
};

/**
 * @desc    Archive workspace
 * @route   PATCH /api/workspaces/:id/archive
 * @access  Private (Owner only)
 */
exports.archiveWorkspace = async (req, res) => {
  try {
    const workspace = await Workspace.findById(req.params.id);
    if (!workspace)
      return res.status(404).json({ success: false, message: 'Workspace not found' });

    if (!workspace.isCreator(req.user._id))
      return res.status(403).json({ success: false, message: 'Only creator can archive workspace' });

    workspace.isArchived = true;
    workspace.archivedAt = new Date();
    await workspace.save();

    res.status(200).json({ success: true, message: 'Workspace archived', workspace });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to archive workspace' });
  }
};

/**
 * @desc    Invite a member to workspace (Admin/Owner only)
 * @route   POST /api/workspaces/:id/invite
 * @access  Private
 */
exports.inviteMember = async (req, res) => {
  try {
    const { email, role } = req.body;
    const workspace = await Workspace.findById(req.params.id);

    if (!workspace) {
      return res.status(404).json({ success: false, message: 'Workspace not found' });
    }

    // Check permissions
    if (!workspace.isAdmin(req.user._id) && !workspace.isCreator(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Access denied. Admin privileges required.' });
    }

    // Find user to invite
    const invitedUser = await User.findOne({ email: email.toLowerCase() });
    if (!invitedUser) {
      return res.status(404).json({ success: false, message: 'User not found with this email' });
    }

    // Add them as member if not already
    const alreadyMember = workspace.members.find(
      (m) => m.userId.toString() === invitedUser._id.toString()
    );
    if (alreadyMember) {
      return res.status(400).json({ success: false, message: 'User already in workspace' });
    }

    await workspace.addMember(invitedUser._id, role || 'Member');
    await invitedUser.updateOne({ $push: { workspaces: workspace._id } });

    // Create notification
    await Notification.create({
      userId: invitedUser._id,
      type: 'workspace_invite',
      title: 'Workspace Invitation',
      message: `You have been added to the workspace "${workspace.name}"`,
      workspaceId: workspace._id,
      senderId: req.user._id,
      link: `/workspace/${workspace._id}`
    });

    // Emit real-time event
    const io = req.app.get('io');
    if (io) {
      io.to(`user:${invitedUser._id}`).emit('workspace:invited', {
        workspace: workspace,
        invitedBy: req.user.name,
      });
    }

    res.status(200).json({
      success: true,
      message: `Invitation sent successfully to ${invitedUser.email}`,
    });
  } catch (err) {
    console.error('Invite member error:', err);
    res.status(500).json({ success: false, message: 'Failed to invite member' });
  }
};


/**
 * @desc    Leave workspace
 * @route   POST /api/workspaces/:id/leave
 * @access  Private
 */
exports.leaveWorkspace = async (req, res) => {
  try {
    const userId = req.user._id;
    const workspaceId = req.params.id;

    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      return res.status(404).json({ success: false, message: 'Workspace not found' });
    }

    // Prevent creator from leaving
    if (workspace.createdBy.toString() === userId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'The workspace creator cannot leave their own workspace',
      });
    }

    // Check membership
    const isMember = workspace.members.some(
      (m) => m.userId.toString() === userId.toString()
    );
    if (!isMember) {
      return res
        .status(400)
        .json({ success: false, message: 'You are not a member of this workspace' });
    }

    // Remove member
    workspace.members = workspace.members.filter(
      (m) => m.userId.toString() !== userId.toString()
    );
    await workspace.save();

    // Remove workspace from user's list
    await User.findByIdAndUpdate(userId, { $pull: { workspaces: workspace._id } });

    // Optional: notify the user via Socket.IO
    const io = req.app.get('io');
    if (io) {
      io.to(`user:${userId}`).emit('workspace:left', {
        workspaceId: workspace._id,
        message: `You have left the workspace "${workspace.name}"`,
      });
    }

    res.status(200).json({
      success: true,
      message: 'You have left the workspace successfully',
    });
  } catch (err) {
    console.error('Error leaving workspace:', err);
    res.status(500).json({ success: false, message: 'Failed to leave workspace' });
  }
};


// Alias
exports.getUserWorkspaces = exports.getAllWorkspaces;

