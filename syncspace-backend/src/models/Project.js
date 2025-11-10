/**
 * Project Model
 * Defines schema for projects within workspaces
 */

const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Project name is required'],
    trim: true,
    minlength: [3, 'Project name must be at least 3 characters'],
    maxlength: [100, 'Project name cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters'],
    default: ''
  },
  // ✅ Make sure workspaceId always references a valid Workspace
  workspaceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workspace',
    required: [true, 'Workspace ID is required'],
    // index: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['Planning', 'Active', 'On Hold', 'Completed', 'Cancelled'],
    default: 'Active'
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Urgent'],
    default: 'Medium'
  },
  startDate: {
    type: Date,
    default: null
  },
  dueDate: {
    type: Date,
    default: null
  },
  completedAt: {
    type: Date,
    default: null
  },
  progress: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  tags: [{
    type: String,
    trim: true
  }],
  color: {
    type: String,
    default: '#3b82f6'
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
projectSchema.index({ workspaceId: 1 });
projectSchema.index({ createdBy: 1 });
projectSchema.index({ status: 1 });
projectSchema.index({ dueDate: 1 });
projectSchema.index({ createdAt: -1 });
projectSchema.index({ name: 'text', description: 'text' });

// ==================== MIDDLEWARE ====================

// Automatically set completedAt when status = Completed
projectSchema.pre('save', function(next) {
  if (this.isModified('status')) {
    if (this.status === 'Completed' && !this.completedAt) {
      this.completedAt = new Date();
      this.progress = 100;
    } else if (this.status !== 'Completed') {
      this.completedAt = null;
      if (this.progress === 100) this.progress = 0;
    }
  }
  next();
});

// ✅ Cascade delete tasks & documents when project is deleted
projectSchema.pre('remove', async function(next) {
  try {
    await mongoose.model('Task').deleteMany({ projectId: this._id });
    await mongoose.model('Document').deleteMany({ projectId: this._id });
    next();
  } catch (error) {
    console.error('❌ Cascade delete error:', error.message);
    next(error);
  }
});

// ==================== METHODS ====================

// ✅ Calculate project progress based on tasks
projectSchema.methods.calculateProgress = async function() {
  const Task = mongoose.model('Task');
  const tasks = await Task.find({ projectId: this._id });

  if (!tasks.length) {
    this.progress = 0;
  } else {
    // 🔧 Standardize to lowercase statuses from Task model
    const completedTasks = tasks.filter(t => t.status === 'done').length;
    this.progress = Math.round((completedTasks / tasks.length) * 100);
  }

  await this.save();
  return this.progress;
};

// ✅ Check if project is overdue
projectSchema.methods.isOverdue = function() {
  if (!this.dueDate || this.status === 'Completed') return false;
  return new Date() > this.dueDate;
};

// ✅ Archive / Unarchive helpers
projectSchema.methods.archive = async function() {
  this.isArchived = true;
  this.archivedAt = new Date();
  await this.save();
  return this;
};

projectSchema.methods.unarchive = async function() {
  this.isArchived = false;
  this.archivedAt = null;
  await this.save();
  return this;
};

// ==================== VIRTUAL FIELDS ====================

// ✅ Days until due date
projectSchema.virtual('daysUntilDue').get(function() {
  if (!this.dueDate) return null;
  const now = new Date();
  const due = new Date(this.dueDate);
  const diff = due - now;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
});

// ✅ Duration between start & end
projectSchema.virtual('duration').get(function() {
  if (!this.startDate || !this.dueDate) return null;
  const diff = new Date(this.dueDate) - new Date(this.startDate);
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
});

module.exports = mongoose.model('Project', projectSchema);
