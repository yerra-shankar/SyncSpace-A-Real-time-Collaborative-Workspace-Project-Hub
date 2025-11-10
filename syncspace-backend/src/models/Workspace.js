/**
 * Workspace Model
 * Defines schema for collaborative workspaces
 */

const mongoose = require('mongoose');

const workspaceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Workspace name is required'],
    trim: true,
    minlength: [3, 'Workspace name must be at least 3 characters'],
    maxlength: [100, 'Workspace name cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters'],
    default: ''
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['Admin', 'Member', 'Viewer'],
      default: 'Member'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],
  projects: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project'
  }],
  settings: {
    isPublic: {
      type: Boolean,
      default: false
    },
    allowMemberInvites: {
      type: Boolean,
      default: true
    },
    defaultProjectVisibility: {
      type: String,
      enum: ['public', 'private'],
      default: 'private'
    }
  },
  avatar: {
    type: String,
    default: null
  },
  color: {
    type: String,
    default: '#667eea'
  },
  isArchived: {
    type: Boolean,
    default: false
  },
  archivedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ==================== INDEXES ====================
workspaceSchema.index({ createdBy: 1 });
workspaceSchema.index({ 'members.userId': 1 });
workspaceSchema.index({ createdAt: -1 });
workspaceSchema.index({ name: 'text', description: 'text' });

// ==================== MIDDLEWARE ====================

// Add creator as admin member when workspace is created
workspaceSchema.pre('save', function(next) {
  if (this.isNew && this.members.length === 0) {
    this.members.push({
      userId: this.createdBy,
      role: 'Admin',
      joinedAt: new Date()
    });
  }
  next();
});

// Remove workspace references when deleted
workspaceSchema.pre('remove', async function(next) {
  try {
    // Remove workspace from all users
    await this.model('User').updateMany(
      { workspaces: this._id },
      { $pull: { workspaces: this._id } }
    );

    // Delete all projects in workspace
    await this.model('Project').deleteMany({ workspaceId: this._id });

    // Delete all messages in workspace
    await this.model('Message').deleteMany({ workspaceId: this._id });

    // Delete all files in workspace
    await this.model('File').deleteMany({ workspaceId: this._id });

    // Delete all notifications related to workspace
    await this.model('Notification').deleteMany({ workspaceId: this._id });

    next();
  } catch (error) {
    next(error);
  }
});

// ==================== METHODS ====================

// Check if user is a member
workspaceSchema.methods.isMember = function(userId) {
  return this.members.some(member => member.userId.toString() === userId.toString());
};

// Check if user is admin
workspaceSchema.methods.isAdmin = function(userId) {
  const member = this.members.find(m => m.userId.toString() === userId.toString());
  return member && member.role === 'Admin';
};

// Check if user is creator
workspaceSchema.methods.isCreator = function(userId) {
  return this.createdBy.toString() === userId.toString();
};

// Add member to workspace
workspaceSchema.methods.addMember = async function(userId, role = 'Member') {
  // Check if user is already a member
  if (this.isMember(userId)) {
    throw new Error('User is already a member of this workspace');
  }

  this.members.push({
    userId,
    role,
    joinedAt: new Date()
  });

  await this.save();
  return this;
};

// Remove member from workspace
workspaceSchema.methods.removeMember = async function(userId) {
  // Cannot remove creator
  if (this.isCreator(userId)) {
    throw new Error('Cannot remove workspace creator');
  }

  this.members = this.members.filter(
    member => member.userId.toString() !== userId.toString()
  );

  await this.save();
  return this;
};

// Update member role
workspaceSchema.methods.updateMemberRole = async function(userId, newRole) {
  const member = this.members.find(m => m.userId.toString() === userId.toString());
  
  if (!member) {
    throw new Error('User is not a member of this workspace');
  }

  member.role = newRole;
  await this.save();
  return this;
};

// ==================== VIRTUAL FIELDS ====================

// Virtual for member count
workspaceSchema.virtual('memberCount').get(function() {
  return this.members ? this.members.length : 0;
});

// Virtual for project count
workspaceSchema.virtual('projectCount').get(function() {
  return this.projects ? this.projects.length : 0;
});

module.exports = mongoose.model('Workspace', workspaceSchema);