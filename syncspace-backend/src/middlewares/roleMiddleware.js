// syncspace-backend/src/middlewares/roleMiddleware.js

/**
 * Role-Based Access Control Middleware
 * Restricts access based on user roles
 */

// ✅ Core authorization middleware
const authorize = (...roles) => {
  // Normalize when first arg is an array
  const allowedRoles = Array.isArray(roles[0]) ? roles[0] : roles;

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role '${req.user.role}' is not authorized to access this route`,
      });
    }

    next();
  };
};

// ✅ Check if user is workspace admin
const isWorkspaceAdmin = async (req, res, next) => {
  try {
    const Workspace = require('../models/Workspace');
    const workspaceId = req.params.workspaceId || req.body.workspaceId;

    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      return res.status(404).json({
        success: false,
        message: 'Workspace not found',
      });
    }

    const isCreator = workspace.createdBy.toString() === req.user._id.toString();
    const member = workspace.members.find(
      (m) => m.userId.toString() === req.user._id.toString()
    );
    const isAdmin = member && member.role === 'Admin';

    if (!isCreator && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.',
      });
    }

    next();
  } catch (error) {
    next(error);
  }
};

// ✅ Default export as callable middleware factory
const roleMiddleware = (...args) => {
  const allowedRoles = Array.isArray(args[0]) ? args[0] : args;
  return authorize(...allowedRoles);
};

// Attach helper
roleMiddleware.isWorkspaceAdmin = isWorkspaceAdmin;

// ✅ Final Export
module.exports = roleMiddleware;
