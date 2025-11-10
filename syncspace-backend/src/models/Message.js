/**
 * Message Model
 * Defines schema for workspace chat messages
 */

const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  workspaceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workspace',
    required: true
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  text: {
    type: String,
    required: [true, 'Message text is required'],
    trim: true,
    maxlength: [2000, 'Message cannot exceed 2000 characters']
  },
  type: {
    type: String,
    enum: ['text', 'file', 'system', 'code'],
    default: 'text'
  },
  attachments: [{
    fileName: String,
    fileUrl: String,
    fileType: String,
    fileSize: Number,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  mentions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
    default: null
  },
  reactions: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    emoji: {
      type: String,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  isEdited: {
    type: Boolean,
    default: false
  },
  editedAt: {
    type: Date,
    default: null
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date,
    default: null
  },
  readBy: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ==================== INDEXES ====================
messageSchema.index({ workspaceId: 1, createdAt: -1 });
messageSchema.index({ senderId: 1 });
messageSchema.index({ mentions: 1 });
messageSchema.index({ createdAt: -1 });

// ==================== METHODS ====================

// Mark message as edited
messageSchema.methods.markAsEdited = async function() {
  this.isEdited = true;
  this.editedAt = new Date();
  await this.save();
  return this;
};

// Soft delete message
messageSchema.methods.softDelete = async function() {
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.text = 'This message has been deleted';
  await this.save();
  return this;
};

// Add reaction
messageSchema.methods.addReaction = async function(userId, emoji) {
  // Check if user already reacted with this emoji
  const existingReaction = this.reactions.find(
    r => r.userId.toString() === userId.toString() && r.emoji === emoji
  );

  if (existingReaction) {
    return this; // Already reacted
  }

  this.reactions.push({
    userId,
    emoji,
    createdAt: new Date()
  });

  await this.save();
  return this;
};

// Remove reaction
messageSchema.methods.removeReaction = async function(userId, emoji) {
  this.reactions = this.reactions.filter(
    r => !(r.userId.toString() === userId.toString() && r.emoji === emoji)
  );

  await this.save();
  return this;
};

// Mark as read by user
messageSchema.methods.markAsRead = async function(userId) {
  // Check if already read by this user
  const alreadyRead = this.readBy.some(
    r => r.userId.toString() === userId.toString()
  );

  if (!alreadyRead) {
    this.readBy.push({
      userId,
      readAt: new Date()
    });
    await this.save();
  }

  return this;
};

// Get unread count for workspace
messageSchema.statics.getUnreadCount = async function(workspaceId, userId) {
  return await this.countDocuments({
    workspaceId,
    'readBy.userId': { $ne: userId },
    senderId: { $ne: userId },
    isDeleted: false
  });
};

// ==================== VIRTUAL FIELDS ====================

// Virtual for attachment count
messageSchema.virtual('attachmentCount').get(function() {
  return this.attachments ? this.attachments.length : 0;
});

// Virtual for reaction count
messageSchema.virtual('reactionCount').get(function() {
  return this.reactions ? this.reactions.length : 0;
});

module.exports = mongoose.model('Message', messageSchema);