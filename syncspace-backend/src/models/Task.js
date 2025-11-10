/**
 * Task Model
 * Defines schema for Kanban board tasks
 */

const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Task title is required'],
    trim: true,
    minlength: [3, 'Task title must be at least 3 characters'],
    maxlength: [200, 'Task title cannot exceed 200 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [2000, 'Description cannot exceed 2000 characters'],
    default: ''
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  workspaceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workspace',
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  status: {
    type: String,
    enum: ['todo', 'inProgress', 'done'],
    default: 'todo'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  dueDate: {
    type: Date,
    default: null
  },
  completedAt: {
    type: Date,
    default: null
  },
  tags: [{
    type: String,
    trim: true
  }],
  attachments: [{
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
    }
  }],
  comments: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    text: {
      type: String,
      required: true,
      maxlength: [1000, 'Comment cannot exceed 1000 characters']
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  }],
  position: {
    type: Number,
    default: 0
  },
  estimatedHours: {
    type: Number,
    min: 0,
    default: null
  },
  actualHours: {
    type: Number,
    min: 0,
    default: null
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ==================== INDEXES ====================
taskSchema.index({ projectId: 1, status: 1 });
taskSchema.index({ workspaceId: 1 });
taskSchema.index({ assignee: 1 });
taskSchema.index({ dueDate: 1 });
taskSchema.index({ createdAt: -1 });
taskSchema.index({ title: 'text', description: 'text' });

// ==================== MIDDLEWARE ====================

// Update completedAt when status changes to done
taskSchema.pre('save', function(next) {
  if (this.isModified('status')) {
    if (this.status === 'done' && !this.completedAt) {
      this.completedAt = new Date();
    } else if (this.status !== 'done') {
      this.completedAt = null;
    }
  }
  next();
});

// Update project progress when task status changes
taskSchema.post('save', async function() {
  try {
    const Project = require('./Project');
    const project = await Project.findById(this.projectId);
    if (project) {
      await project.calculateProgress();
    }
  } catch (error) {
    console.error('Error updating project progress:', error);
  }
});

// ==================== METHODS ====================

// Add comment to task
taskSchema.methods.addComment = async function(userId, text) {
  this.comments.push({
    userId,
    text,
    createdAt: new Date(),
    updatedAt: new Date()
  });
  
  await this.save();
  return this.comments[this.comments.length - 1];
};

// Update comment
taskSchema.methods.updateComment = async function(commentId, text) {
  const comment = this.comments.id(commentId);
  
  if (!comment) {
    throw new Error('Comment not found');
  }
  
  comment.text = text;
  comment.updatedAt = new Date();
  
  await this.save();
  return comment;
};

// Delete comment
taskSchema.methods.deleteComment = async function(commentId) {
  this.comments.pull(commentId);
  await this.save();
  return this;
};

// Check if task is overdue
taskSchema.methods.isOverdue = function() {
  if (!this.dueDate || this.status === 'done') {
    return false;
  }
  return new Date() > this.dueDate;
};

// Add attachment
taskSchema.methods.addAttachment = async function(fileData) {
  this.attachments.push(fileData);
  await this.save();
  return this.attachments[this.attachments.length - 1];
};

// ==================== VIRTUAL FIELDS ====================

// Virtual for comment count
taskSchema.virtual('commentCount').get(function() {
  return this.comments ? this.comments.length : 0;
});

// Virtual for attachment count
taskSchema.virtual('attachmentCount').get(function() {
  return this.attachments ? this.attachments.length : 0;
});

// Virtual for days until due
taskSchema.virtual('daysUntilDue').get(function() {
  if (!this.dueDate) return null;
  
  const now = new Date();
  const due = new Date(this.dueDate);
  const diffTime = due - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
});

module.exports = mongoose.model('Task', taskSchema);