/**
 * Document Controller
 * Handles collaborative document CRUD and version control
 */

const Document = require('../models/Document');
const Workspace = require('../models/Workspace');
const Notification = require('../models/Notification');

/**
 * @desc    Get all documents in a workspace
 * @route   GET /api/workspaces/:workspaceId/documents
 * @access  Private
 */
exports.getDocumentsByWorkspace = async (req, res, next) => {
  try {
    const { workspaceId } = req.params;

    const documents = await Document.find({ 
      workspaceId,
      isLocked: false
    })
      .populate('createdBy', 'name email avatar')
      .populate('lastEditedBy', 'name email avatar')
      .populate('collaborators.userId', 'name email avatar')
      .sort('-updatedAt');

    res.status(200).json({
      success: true,
      count: documents.length,
      documents
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single document by ID
 * @route   GET /api/documents/:id
 * @access  Private
 */
exports.getDocumentById = async (req, res, next) => {
  try {
    const document = await Document.findById(req.params.id)
      .populate('createdBy', 'name email avatar')
      .populate('lastEditedBy', 'name email avatar')
      .populate('collaborators.userId', 'name email avatar')
      .populate('versionHistory.editedBy', 'name email avatar')
      .populate('workspaceId', 'name')
      .populate('projectId', 'name');

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    // Check if user can access
    const canAccess = document.isPublic || 
                     document.createdBy._id.toString() === req.user._id.toString() ||
                     document.collaborators.some(c => c.userId._id.toString() === req.user._id.toString());

    if (!canAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Update last accessed time for collaborator
    const collaborator = document.collaborators.find(
      c => c.userId._id.toString() === req.user._id.toString()
    );
    if (collaborator) {
      collaborator.lastAccessed = new Date();
      await document.save();
    }

    res.status(200).json({
      success: true,
      document
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create new document
 * @route   POST /api/workspaces/:workspaceId/documents
 * @access  Private
 */
exports.createDocument = async (req, res, next) => {
  try {
    const { workspaceId } = req.params;
    const { title, content, projectId, tags, isPublic } = req.body;

    // Create document
    const document = await Document.create({
      title,
      content: content || '',
      workspaceId,
      projectId,
      createdBy: req.user._id,
      lastEditedBy: req.user._id,
      tags: tags || [],
      isPublic: isPublic || false
    });

    // Populate document
    await document.populate([
      { path: 'createdBy', select: 'name email avatar' },
      { path: 'lastEditedBy', select: 'name email avatar' }
    ]);

    // Emit socket event
    const io = req.app.get('io');
    io.to(`workspace:${workspaceId}`).emit('document:created', document);

    res.status(201).json({
      success: true,
      message: 'Document created successfully',
      document
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update document
 * @route   PUT /api/documents/:id
 * @access  Private
 */
exports.updateDocument = async (req, res, next) => {
  try {
    const { title, content, tags, isPublic } = req.body;

    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    // Check if user can edit
    if (!document.canUserEdit(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to edit this document'
      });
    }

    // Update fields
    if (title) document.title = title;
    if (content !== undefined) {
      document.content = content;
      document.lastEditedBy = req.user._id;
    }
    if (tags) document.tags = tags;
    if (isPublic !== undefined) document.isPublic = isPublic;

    await document.save();

    // Emit socket event
    const io = req.app.get('io');
    io.to(`workspace:${document.workspaceId}`).emit('document:updated', {
      documentId: document._id,
      content: document.content,
      lastEditedBy: req.user._id
    });

    res.status(200).json({
      success: true,
      message: 'Document updated successfully',
      document
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete document
 * @route   DELETE /api/documents/:id
 * @access  Private
 */
exports.deleteDocument = async (req, res, next) => {
  try {
    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    // Only creator can delete
    if (document.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only document creator can delete the document'
      });
    }

    await document.remove();

    // Emit socket event
    const io = req.app.get('io');
    io.to(`workspace:${document.workspaceId}`).emit('document:deleted', {
      documentId: document._id
    });

    res.status(200).json({
      success: true,
      message: 'Document deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Add collaborator to document
 * @route   POST /api/documents/:id/collaborators
 * @access  Private
 */
exports.addCollaborator = async (req, res, next) => {
  try {
    const { userId, canEdit } = req.body;

    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    // Only creator can add collaborators
    if (document.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only document creator can add collaborators'
      });
    }

    await document.addCollaborator(userId, canEdit);

    // Create notification
    await Notification.create({
      userId,
      type: 'document_shared',
      title: 'Document Shared',
      message: `${req.user.name} shared a document with you: ${document.title}`,
      workspaceId: document.workspaceId,
      documentId: document._id,
      senderId: req.user._id,
      link: `/workspace/${document.workspaceId}/document/${document._id}`
    });

    res.status(200).json({
      success: true,
      message: 'Collaborator added successfully',
      document
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Remove collaborator from document
 * @route   DELETE /api/documents/:id/collaborators/:userId
 * @access  Private
 */
exports.removeCollaborator = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    // Only creator can remove collaborators
    if (document.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only document creator can remove collaborators'
      });
    }

    await document.removeCollaborator(userId);

    res.status(200).json({
      success: true,
      message: 'Collaborator removed successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get document version history
 * @route   GET /api/documents/:id/versions
 * @access  Private
 */
exports.getVersionHistory = async (req, res, next) => {
  try {
    const document = await Document.findById(req.params.id)
      .populate('versionHistory.editedBy', 'name email avatar')
      .select('versionHistory');

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    res.status(200).json({
      success: true,
      versionHistory: document.versionHistory
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Restore document to specific version
 * @route   POST /api/documents/:id/versions/:versionIndex/restore
 * @access  Private
 */
exports.restoreVersion = async (req, res, next) => {
  try {
    const { versionIndex } = req.params;

    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    // Check if user can edit
    if (!document.canUserEdit(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to edit this document'
      });
    }

    await document.restoreVersion(parseInt(versionIndex), req.user._id);

    // Emit socket event
    const io = req.app.get('io');
    io.to(`workspace:${document.workspaceId}`).emit('document:restored', {
      documentId: document._id,
      content: document.content
    });

    res.status(200).json({
      success: true,
      message: 'Document restored to selected version',
      document
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Lock document for editing
 * @route   POST /api/documents/:id/lock
 * @access  Private
 */
exports.lockDocument = async (req, res, next) => {
  try {
    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    if (document.isLocked) {
      return res.status(400).json({
        success: false,
        message: 'Document is already locked'
      });
    }

    await document.lock(req.user._id);

    // Emit socket event
    const io = req.app.get('io');
    io.to(`workspace:${document.workspaceId}`).emit('document:locked', {
      documentId: document._id,
      lockedBy: req.user._id
    });

    res.status(200).json({
      success: true,
      message: 'Document locked successfully',
      document
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Unlock document
 * @route   POST /api/documents/:id/unlock
 * @access  Private
 */
exports.unlockDocument = async (req, res, next) => {
  try {
    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    if (!document.isLocked) {
      return res.status(400).json({
        success: false,
        message: 'Document is not locked'
      });
    }

    // Only the user who locked it can unlock
    if (document.lockedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the user who locked the document can unlock it'
      });
    }

    await document.unlock();

    // Emit socket event
    const io = req.app.get('io');
    io.to(`workspace:${document.workspaceId}`).emit('document:unlocked', {
      documentId: document._id
    });

    res.status(200).json({
      success: true,
      message: 'Document unlocked successfully',
      document
    });
  } catch (error) {
    next(error);
  }
};

// --- Compatibility wrappers and additional route handlers ---

// Get documents relevant to the authenticated user
exports.getUserDocuments = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const documents = await Document.find({
      $or: [
        { createdBy: userId },
        { 'collaborators.userId': userId },
      ]
    })
      .populate('createdBy', 'name email avatar')
      .populate('lastEditedBy', 'name email avatar')
      .sort('-updatedAt');

    res.status(200).json({ success: true, count: documents.length, documents });
  } catch (error) {
    next(error);
  }
};

// Update document content (lightweight for collaborative updates)
exports.updateDocumentContent = async (req, res, next) => {
  try {
    const { content } = req.body;
    const document = await Document.findById(req.params.id);
    if (!document) return res.status(404).json({ success: false, message: 'Document not found' });
    if (!document.canUserEdit(req.user._id)) return res.status(403).json({ success: false, message: 'No edit permission' });

    // Save previous content to versionHistory
    document.versionHistory = document.versionHistory || [];
    document.versionHistory.push({
      content: document.content,
      editedBy: document.lastEditedBy || req.user._id,
      editedAt: new Date()
    });

    document.content = content;
    document.lastEditedBy = req.user._id;
    await document.save();

    const io = req.app.get('io');
    if (io) io.to(`workspace:${document.workspaceId}`).emit('document:contentUpdated', { documentId: document._id, content });

    res.status(200).json({ success: true, message: 'Content updated', document });
  } catch (error) {
    next(error);
  }
};

// Share document with users (alias to addCollaborator)
exports.shareDocument = async (req, res, next) => {
  try {
    return exports.addCollaborator(req, res, next);
  } catch (error) {
    next(error);
  }
};

// Remove access (alias)
exports.removeDocumentAccess = async (req, res, next) => {
  try {
    return exports.removeCollaborator(req, res, next);
  } catch (error) {
    next(error);
  }
};

// Get collaborators
exports.getDocumentCollaborators = async (req, res, next) => {
  try {
    const document = await Document.findById(req.params.id).populate('collaborators.userId', 'name email avatar');
    if (!document) return res.status(404).json({ success: false, message: 'Document not found' });
    res.status(200).json({ success: true, collaborators: document.collaborators || [] });
  } catch (error) {
    next(error);
  }
};

// Version history alias
exports.getDocumentVersions = exports.getVersionHistory;

// Restore specific version alias
exports.restoreDocumentVersion = exports.restoreVersion;

// Duplicate document
exports.duplicateDocument = async (req, res, next) => {
  try {
    const document = await Document.findById(req.params.id);
    if (!document) return res.status(404).json({ success: false, message: 'Document not found' });

    const dup = await Document.create({
      title: `${document.title} (Copy)`,
      content: document.content,
      workspaceId: document.workspaceId,
      projectId: document.projectId,
      createdBy: req.user._id,
      lastEditedBy: req.user._id,
      tags: document.tags,
      isPublic: document.isPublic
    });

    res.status(201).json({ success: true, message: 'Document duplicated', document: dup });
  } catch (error) {
    next(error);
  }
};

// Export document (not implemented)
exports.exportDocument = async (req, res, next) => {
  return res.status(501).json({ success: false, message: 'Export not implemented' });
};

// Comments
exports.addDocumentComment = async (req, res, next) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ success: false, message: 'Comment text is required' });
    const document = await Document.findById(req.params.id);
    if (!document) return res.status(404).json({ success: false, message: 'Document not found' });
    document.comments = document.comments || [];
    const comment = { userId: req.user._id, text, createdAt: new Date() };
    document.comments.push(comment);
    await document.save();
    res.status(201).json({ success: true, message: 'Comment added', comment });
  } catch (error) {
    next(error);
  }
};

exports.deleteDocumentComment = async (req, res, next) => {
  try {
    const { commentId } = req.params;
    const document = await Document.findById(req.params.id);
    if (!document) return res.status(404).json({ success: false, message: 'Document not found' });
    const comment = document.comments.id(commentId);
    if (!comment) return res.status(404).json({ success: false, message: 'Comment not found' });
    if (comment.userId.toString() !== req.user._id.toString()) return res.status(403).json({ success: false, message: 'Can only delete your own comments' });
    document.comments = (document.comments || []).filter(c => c._id.toString() !== commentId);
    await document.save();
    res.status(200).json({ success: true, message: 'Comment deleted' });
  } catch (error) {
    next(error);
  }
};