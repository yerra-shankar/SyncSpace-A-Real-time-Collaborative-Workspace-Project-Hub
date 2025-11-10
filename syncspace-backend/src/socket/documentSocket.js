// /src/socket/documentSocket.js

const Document = require('../models/Document');
const User = require('../models/User');

// Store active document editing sessions
const documentSessions = new Map();

/**
 * Document collaboration socket handler
 */
const documentSocket = (io, socket) => {
  
  /**
   * Join a document editing session
   */
  socket.on('document:join', async (data) => {
    try {
      const { documentId } = data;

      // Verify user has access to document
      const document = await Document.findById(documentId);
      if (!document) {
        return socket.emit('document:error', {
          message: 'Document not found'
        });
      }

      // Check if user has access
      const hasAccess = document.owner.toString() === socket.userId ||
                       document.collaborators.some(c => c.user.toString() === socket.userId) ||
                       document.sharedWith.some(s => s.user.toString() === socket.userId);

      if (!hasAccess) {
        return socket.emit('document:error', {
          message: 'Access denied to document'
        });
      }

      // Join document room
      socket.join(`document:${documentId}`);

      // Track active editors
      if (!documentSessions.has(documentId)) {
        documentSessions.set(documentId, new Map());
      }

      documentSessions.get(documentId).set(socket.userId, {
        socketId: socket.id,
        userName: socket.user.name,
        avatar: socket.user.avatar,
        joinedAt: new Date(),
        cursor: null
      });

      // Get list of active editors
      const activeEditors = Array.from(documentSessions.get(documentId).values())
        .map(editor => ({
          userId: socket.userId,
          userName: editor.userName,
          avatar: editor.avatar,
          cursor: editor.cursor
        }));

      // Notify user of successful join
      socket.emit('document:joined', {
        documentId,
        content: document.content,
        version: document.version,
        activeEditors
      });

      // Notify other users that someone joined
      socket.to(`document:${documentId}`).emit('document:user:joined', {
        documentId,
        userId: socket.userId,
        userName: socket.user.name,
        avatar: socket.user.avatar,
        timestamp: new Date()
      });

      console.log(`User ${socket.userId} joined document ${documentId}`);
    } catch (error) {
      console.error('Error joining document:', error);
      socket.emit('document:error', {
        message: 'Failed to join document'
      });
    }
  });

  /**
   * Leave document editing session
   */
  socket.on('document:leave', async (data) => {
    try {
      const { documentId } = data;

      socket.leave(`document:${documentId}`);

      // Remove from active editors
      if (documentSessions.has(documentId)) {
        documentSessions.get(documentId).delete(socket.userId);
        
        // Clean up if no more editors
        if (documentSessions.get(documentId).size === 0) {
          documentSessions.delete(documentId);
        }
      }

      // Notify other users
      socket.to(`document:${documentId}`).emit('document:user:left', {
        documentId,
        userId: socket.userId,
        timestamp: new Date()
      });

      console.log(`User ${socket.userId} left document ${documentId}`);
    } catch (error) {
      console.error('Error leaving document:', error);
    }
  });

  /**
   * Handle real-time document content changes
   */
  socket.on('document:change', async (data) => {
    try {
      const { documentId, content, delta, version, selection } = data;

      // Verify document access
      const document = await Document.findById(documentId);
      if (!document) {
        return socket.emit('document:error', {
          message: 'Document not found'
        });
      }

      // Check version for conflict resolution
      if (version && document.version !== version) {
        return socket.emit('document:conflict', {
          documentId,
          currentVersion: document.version,
          serverContent: document.content
        });
      }

      // Update document in database
      document.content = content;
      document.version = (document.version || 0) + 1;
      document.lastModifiedBy = socket.userId;
      document.updatedAt = new Date();
      
      await document.save();

      // Broadcast changes to other users in the document
      socket.to(`document:${documentId}`).emit('document:changed', {
        documentId,
        content,
        delta,
        version: document.version,
        userId: socket.userId,
        userName: socket.user.name,
        timestamp: new Date()
      });

      // Acknowledge to sender
      socket.emit('document:change:ack', {
        documentId,
        version: document.version,
        timestamp: new Date()
      });

    } catch (error) {
      console.error('Error handling document change:', error);
      socket.emit('document:error', {
        message: 'Failed to save document changes'
      });
    }
  });

  /**
   * Handle cursor position updates
   */
  socket.on('document:cursor', (data) => {
    try {
      const { documentId, cursor } = data;

      // Update cursor position in session
      if (documentSessions.has(documentId) && documentSessions.get(documentId).has(socket.userId)) {
        documentSessions.get(documentId).get(socket.userId).cursor = cursor;
      }

      // Broadcast cursor position to other users
      socket.to(`document:${documentId}`).emit('document:cursor:update', {
        documentId,
        userId: socket.userId,
        userName: socket.user.name,
        cursor,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Error updating cursor:', error);
    }
  });

  /**
   * Handle text selection updates
   */
  socket.on('document:selection', (data) => {
    try {
      const { documentId, selection } = data;

      // Broadcast selection to other users
      socket.to(`document:${documentId}`).emit('document:selection:update', {
        documentId,
        userId: socket.userId,
        userName: socket.user.name,
        selection,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Error updating selection:', error);
    }
  });

  /**
   * Lock document for editing
   */
  socket.on('document:lock', async (data) => {
    try {
      const { documentId } = data;

      const document = await Document.findById(documentId);
      if (!document) {
        return socket.emit('document:error', {
          message: 'Document not found'
        });
      }

      if (document.lockedBy && document.lockedBy.toString() !== socket.userId) {
        return socket.emit('document:lock:failed', {
          message: 'Document is already locked by another user',
          lockedBy: document.lockedBy
        });
      }

      document.lockedBy = socket.userId;
      document.lockedAt = new Date();
      await document.save();

      socket.emit('document:locked', {
        documentId,
        lockedBy: socket.userId,
        timestamp: new Date()
      });

      socket.to(`document:${documentId}`).emit('document:locked:notify', {
        documentId,
        lockedBy: socket.userId,
        userName: socket.user.name,
        timestamp: new Date()
      });

    } catch (error) {
      console.error('Error locking document:', error);
      socket.emit('document:error', {
        message: 'Failed to lock document'
      });
    }
  });

  /**
   * Unlock document
   */
  socket.on('document:unlock', async (data) => {
    try {
      const { documentId } = data;

      const document = await Document.findById(documentId);
      if (!document) {
        return socket.emit('document:error', {
          message: 'Document not found'
        });
      }

      if (document.lockedBy && document.lockedBy.toString() !== socket.userId) {
        return socket.emit('document:error', {
          message: 'You cannot unlock a document locked by another user'
        });
      }

      document.lockedBy = null;
      document.lockedAt = null;
      await document.save();

      socket.emit('document:unlocked', {
        documentId,
        timestamp: new Date()
      });

      socket.to(`document:${documentId}`).emit('document:unlocked:notify', {
        documentId,
        timestamp: new Date()
      });

    } catch (error) {
      console.error('Error unlocking document:', error);
      socket.emit('document:error', {
        message: 'Failed to unlock document'
      });
    }
  });

  /**
   * Add comment to document
   */
  socket.on('document:comment:add', async (data) => {
    try {
      const { documentId, content, position } = data;

      const document = await Document.findById(documentId);
      if (!document) {
        return socket.emit('document:error', {
          message: 'Document not found'
        });
      }

      const comment = {
        user: socket.userId,
        content,
        position,
        createdAt: new Date()
      };

      document.comments.push(comment);
      await document.save();

      const populatedComment = {
        ...comment,
        user: {
          _id: socket.userId,
          name: socket.user.name,
          avatar: socket.user.avatar
        }
      };

      // Broadcast new comment to all users
      io.to(`document:${documentId}`).emit('document:comment:added', {
        documentId,
        comment: populatedComment,
        timestamp: new Date()
      });

    } catch (error) {
      console.error('Error adding comment:', error);
      socket.emit('document:error', {
        message: 'Failed to add comment'
      });
    }
  });

  /**
   * Save document version
   */
  socket.on('document:version:save', async (data) => {
    try {
      const { documentId, description } = data;

      const document = await Document.findById(documentId);
      if (!document) {
        return socket.emit('document:error', {
          message: 'Document not found'
        });
      }

      const versionData = {
        version: (document.version || 0) + 1,
        content: document.content,
        savedBy: socket.userId,
        description: description || `Version saved by ${socket.user.name}`,
        createdAt: new Date()
      };

      if (!document.versions) {
        document.versions = [];
      }
      
      document.versions.push(versionData);
      document.version = versionData.version;
      await document.save();

      socket.emit('document:version:saved', {
        documentId,
        version: versionData,
        timestamp: new Date()
      });

    } catch (error) {
      console.error('Error saving document version:', error);
      socket.emit('document:error', {
        message: 'Failed to save document version'
      });
    }
  });

  /**
   * Handle disconnect - cleanup document sessions
   */
  socket.on('disconnect', () => {
    // Remove user from all document sessions
    for (const [documentId, editors] of documentSessions.entries()) {
      if (editors.has(socket.userId)) {
        editors.delete(socket.userId);
        
        // Notify others in the document
        socket.to(`document:${documentId}`).emit('document:user:left', {
          documentId,
          userId: socket.userId,
          timestamp: new Date()
        });

        // Clean up empty sessions
        if (editors.size === 0) {
          documentSessions.delete(documentId);
        }
      }
    }
  });
};

module.exports = documentSocket;