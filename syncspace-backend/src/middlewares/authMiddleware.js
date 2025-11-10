// // syncspace-backend/src/middlewares/authMiddleware.js
/**
 * Authentication & Authorization Middleware
 * Handles user authentication (JWT) and workspace/project access validation
 */

const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');
const Workspace = require('../models/Workspace');
const Project = require('../models/Project');

/* ============================================================================ 
   PROTECT MIDDLEWARE
   Validates JWT token and attaches user to the request
============================================================================ */
const protect = async (req, res, next) => {
  try {
    let token;

    // ✅ Get token from header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // ❌ No token
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route. Please log in.',
      });
    }

    // ✅ Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ✅ Find user
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found. Token invalid.',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('❌ Auth Middleware Error:', error.message);
    return res.status(401).json({
      success: false,
      message: 'Not authorized. Token verification failed.',
    });
  }
};

/* ============================================================================ 
   VERIFY WORKSPACE ACCESS
   Ensures user has access to a workspace or project under that workspace
============================================================================ */
const verifyWorkspaceAccess = async (req, res, next) => {
  try {
    let workspaceId =
      req.params.workspaceId ||
      req.params.id ||
      req.body.workspaceId;

    // 🧠 Skip access check for global routes like /notifications or /auth/*
    const excludedPaths = ['/notifications', '/auth', '/files', '/messages'];
    if (excludedPaths.some(path => req.originalUrl.includes(path))) {
      return next(); // ✅ skip workspace verification safely
    }

    // 🧩 If workspaceId looks invalid (like 'notifications'), skip cast
    if (workspaceId && !mongoose.Types.ObjectId.isValid(workspaceId)) {
      console.warn(`⚠️ Skipping workspace verification - invalid ID (${workspaceId})`);
      return next();
    }

    // ✅ Handle project-based routes like /api/projects/:projectId/tasks
    if (!workspaceId && req.params.projectId) {
      const project = await Project.findById(req.params.projectId).select('workspaceId');
      if (project) {
        workspaceId = project.workspaceId;
      } else {
        return res.status(404).json({
          success: false,
          message: 'Project not found while verifying workspace access',
        });
      }
    }

    // ❌ Still missing workspace ID
    if (!workspaceId) {
      return res.status(400).json({
        success: false,
        message: 'Workspace ID is required for access verification',
      });
    }

    // ✅ Fetch workspace
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      return res.status(404).json({
        success: false,
        message: 'Workspace not found',
      });
    }

    // ✅ Check if user is creator or member
    const isCreator = workspace.createdBy.toString() === req.user._id.toString();
    const isMember = workspace.members.some(
      (m) => m.userId.toString() === req.user._id.toString()
    );

    if (!isCreator && !isMember) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You are not a member of this workspace.',
      });
    }

    req.workspace = workspace;
    next();
  } catch (error) {
    console.error('❌ Workspace Access Error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server error while verifying workspace access',
    });
  }
};

/* ============================================================================ 
   EXPORTS
============================================================================ */
module.exports = {
  protect,
  verifyWorkspaceAccess,
};
