/**
 * Document Model
 * Defines schema for collaborative documents with version history
 */

const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Document title is required'],
    trim: true,
    minlength: [3, 'Document title must be at least 3 characters'],
    maxlength: [200, 'Document title cannot exceed 200 characters']
  },
  content: {
    type: String,
    default: ''
  },
  workspaceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workspace',
    required: true
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    default: null
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastEditedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  collaborators: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    canEdit: {
      type: Boolean,
      default: true
    },
    lastAccessed: {
      type: Date,
      default: Date.now
    }
  }],
  versionHistory: [{
    content: {
      type: String,
      required: true
    },
    editedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    editedAt: {
      type: Date,
      default: Date.now
    },
    changeDescription: {
      type: String,
      default: 'Document updated'
    },
    contentLength: {
      type: Number,
      default: 0
    }
  }],
  tags: [{
    type: String,
    trim: true
  }],
  isPublic: {
    type: Boolean,
    default: false
  },
  isLocked: {
    type: Boolean,
    default: false
  },
  lockedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  lockedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ==================== INDEXES ====================
documentSchema.index({ workspaceId: 1 });
documentSchema.index({ projectId: 1 });
documentSchema.index({ createdBy: 1 });
documentSchema.index({ createdAt: -1 });
documentSchema.index({ title: 'text', content: 'text' });

// ==================== MIDDLEWARE ====================

// Save version history before updating content
documentSchema.pre('save', function(next) {
  if (this.isModified('content') && !this.isNew) {
    // Add current version to history
    this.versionHistory.push({
      content: this.content,
      editedBy: this.lastEditedBy || this.createdBy,
      editedAt: new Date(),
      changeDescription: 'Document updated',
      contentLength: this.content.length
    });

    // Keep only last 50 versions
    if (this.versionHistory.length > 50) {
      this.versionHistory = this.versionHistory.slice(-50);
    }
  }
  next();
});

// ==================== METHODS ====================

// Add collaborator
documentSchema.methods.addCollaborator = async function(userId, canEdit = true) {
  // Check if user is already a collaborator
  const existingCollaborator = this.collaborators.find(
    c => c.userId.toString() === userId.toString()
  );

  if (existingCollaborator) {
    existingCollaborator.canEdit = canEdit;
    existingCollaborator.lastAccessed = new Date();
  } else {
    this.collaborators.push({
      userId,
      canEdit,
      lastAccessed: new Date()
    });
  }

  await this.save();
  return this;
};

// Remove collaborator
documentSchema.methods.removeCollaborator = async function(userId) {
  this.collaborators = this.collaborators.filter(
    c => c.userId.toString() !== userId.toString()
  );

  await this.save();
  return this;
};

// Check if user can edit
documentSchema.methods.canUserEdit = function(userId) {
  // Document is locked
  if (this.isLocked) {
    return this.lockedBy && this.lockedBy.toString() === userId.toString();
  }

  // Creator can always edit
  if (this.createdBy.toString() === userId.toString()) {
    return true;
  }

  // Check collaborator permissions
  const collaborator = this.collaborators.find(
    c => c.userId.toString() === userId.toString()
  );

  return collaborator && collaborator.canEdit;
};

// Lock document
documentSchema.methods.lock = async function(userId) {
  this.isLocked = true;
  this.lockedBy = userId;
  this.lockedAt = new Date();
  await this.save();
  return this;
};

// Unlock document
documentSchema.methods.unlock = async function() {
  this.isLocked = false;
  this.lockedBy = null;
  this.lockedAt = null;
  await this.save();
  return this;
};

// Get version by index
documentSchema.methods.getVersion = function(versionIndex) {
  if (versionIndex < 0 || versionIndex >= this.versionHistory.length) {
    throw new Error('Invalid version index');
  }
  return this.versionHistory[versionIndex];
};

// Restore to specific version
documentSchema.methods.restoreVersion = async function(versionIndex, userId) {
  const version = this.getVersion(versionIndex);
  
  this.content = version.content;
  this.lastEditedBy = userId;
  
  await this.save();
  return this;
};

// ==================== VIRTUAL FIELDS ====================

// Virtual for word count
documentSchema.virtual('wordCount').get(function() {
  if (!this.content) return 0;
  return this.content.split(/\s+/).filter(word => word.length > 0).length;
});

// Virtual for character count
documentSchema.virtual('characterCount').get(function() {
  return this.content ? this.content.length : 0;
});

// Virtual for version count
documentSchema.virtual('versionCount').get(function() {
  return this.versionHistory ? this.versionHistory.length : 0;
});

module.exports = mongoose.model('Document', documentSchema);