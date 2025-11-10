/**
 * File Model
 * Defines schema for file uploads with version control
 */

const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
  fileName: {
    type: String,
    required: [true, 'File name is required'],
    trim: true
  },
  originalName: {
    type: String,
    required: true,
    trim: true
  },
  fileUrl: {
    type: String,
    required: [true, 'File URL is required']
  },
  fileType: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  mimeType: {
    type: String,
    required: true
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
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters'],
    default: ''
  },
  tags: [{
    type: String,
    trim: true
  }],
  version: {
    type: Number,
    default: 1
  },
  versionHistory: [{
    version: Number,
    fileName: String,
    fileUrl: String,
    fileSize: Number,
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    },
    changes: String
  }],
  isPublic: {
    type: Boolean,
    default: false
  },
  downloadCount: {
    type: Number,
    default: 0
  },
  lastDownloadedAt: {
    type: Date,
    default: null
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
fileSchema.index({ workspaceId: 1 });
fileSchema.index({ projectId: 1 });
fileSchema.index({ uploadedBy: 1 });
fileSchema.index({ createdAt: -1 });
fileSchema.index({ fileName: 'text', originalName: 'text' });

// ==================== MIDDLEWARE ====================

// Save version history before updating
fileSchema.pre('save', function(next) {
  if (this.isModified('fileUrl') && !this.isNew) {
    this.versionHistory.push({
      version: this.version,
      fileName: this.fileName,
      fileUrl: this.fileUrl,
      fileSize: this.fileSize,
      uploadedBy: this.uploadedBy,
      uploadedAt: new Date(),
      changes: 'File updated'
    });

    this.version += 1;
  }
  next();
});

// ==================== METHODS ====================

// Increment download count
fileSchema.methods.incrementDownloadCount = async function() {
  this.downloadCount += 1;
  this.lastDownloadedAt = new Date();
  await this.save();
  return this;
};

// Create new version
fileSchema.methods.createNewVersion = async function(newFileData, userId) {
  // Save current version to history
  this.versionHistory.push({
    version: this.version,
    fileName: this.fileName,
    fileUrl: this.fileUrl,
    fileSize: this.fileSize,
    uploadedBy: this.uploadedBy,
    uploadedAt: new Date()
  });

  // Update file with new version
  this.fileName = newFileData.fileName;
  this.fileUrl = newFileData.fileUrl;
  this.fileSize = newFileData.fileSize;
  this.fileType = newFileData.fileType;
  this.mimeType = newFileData.mimeType;
  this.uploadedBy = userId;
  this.version += 1;

  await this.save();
  return this;
};

// Get specific version
fileSchema.methods.getVersion = function(versionNumber) {
  return this.versionHistory.find(v => v.version === versionNumber);
};

// Restore to specific version
fileSchema.methods.restoreVersion = async function(versionNumber, userId) {
  const version = this.getVersion(versionNumber);
  
  if (!version) {
    throw new Error('Version not found');
  }

  // Save current state to history
  this.versionHistory.push({
    version: this.version,
    fileName: this.fileName,
    fileUrl: this.fileUrl,
    fileSize: this.fileSize,
    uploadedBy: this.uploadedBy,
    uploadedAt: new Date()
  });

  // Restore to selected version
  this.fileName = version.fileName;
  this.fileUrl = version.fileUrl;
  this.fileSize = version.fileSize;
  this.uploadedBy = userId;
  this.version += 1;

  await this.save();
  return this;
};

// Archive file
fileSchema.methods.archive = async function() {
  this.isArchived = true;
  this.archivedAt = new Date();
  await this.save();
  return this;
};

// Unarchive file
fileSchema.methods.unarchive = async function() {
  this.isArchived = false;
  this.archivedAt = null;
  await this.save();
  return this;
};

// ==================== VIRTUAL FIELDS ====================

// Virtual for formatted file size
fileSchema.virtual('formattedSize').get(function() {
  const bytes = this.fileSize;
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
});

// Virtual for version count
fileSchema.virtual('versionCount').get(function() {
  return this.versionHistory ? this.versionHistory.length : 0;
});

module.exports = mongoose.model('File', fileSchema);