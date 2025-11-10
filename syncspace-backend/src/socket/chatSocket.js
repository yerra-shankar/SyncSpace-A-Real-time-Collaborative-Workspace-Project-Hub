// /src/socket/chatSocket.js

const Message = require('../models/Message');
const User = require('../models/User');
const Workspace = require('../models/Workspace');
const Project = require('../models/Project');

// Store typing indicators
const typingUsers = new Map();

/**
 * Chat socket handler
 */
const chatSocket = (io, socket) => {

  /**
   * Join a chat room (workspace or project)
   */
  socket.on('chat:join', async (data) => {
    try {
      const { roomId, roomType } = data; // roomType: 'workspace' | 'project' | 'direct'

      // Verify access based on room type
      if (roomType === 'workspace') {
        const workspace = await Workspace.findById(roomId);
        if (!workspace) {
          return socket.emit('chat:error', { message: 'Workspace not found' });
        }

        const isMember = workspace.members.some(m => m.user.toString() === socket.userId);
        if (!isMember) {
          return socket.emit('chat:error', { message: 'Access denied to workspace chat' });
        }

        socket.join(`chat:workspace:${roomId}`);
      } else if (roomType === 'project') {
        const project = await Project.findById(roomId);
        if (!project) {
          return socket.emit('chat:error', { message: 'Project not found' });
        }

        const isMember = project.members.some(m => m.user.toString() === socket.userId);
        if (!isMember) {
          return socket.emit('chat:error', { message: 'Access denied to project chat' });
        }

        socket.join(`chat:project:${roomId}`);
      } else if (roomType === 'direct') {
        // For direct messages, create a consistent room ID
        const userIds = [socket.userId, roomId].sort();
        const directRoomId = `direct:${userIds[0]}:${userIds[1]}`;
        socket.join(directRoomId);
      }

      socket.emit('chat:joined', {
        roomId,
        roomType,
        timestamp: new Date()
      });

      console.log(`User ${socket.userId} joined chat room: ${roomType}:${roomId}`);
    } catch (error) {
      console.error('Error joining chat room:', error);
      socket.emit('chat:error', { message: 'Failed to join chat room' });
    }
  });

  /**
   * Leave a chat room
   */
  socket.on('chat:leave', (data) => {
    try {
      const { roomId, roomType } = data;

      if (roomType === 'workspace') {
        socket.leave(`chat:workspace:${roomId}`);
      } else if (roomType === 'project') {
        socket.leave(`chat:project:${roomId}`);
      } else if (roomType === 'direct') {
        const userIds = [socket.userId, roomId].sort();
        const directRoomId = `direct:${userIds[0]}:${userIds[1]}`;
        socket.leave(directRoomId);
      }

      console.log(`User ${socket.userId} left chat room: ${roomType}:${roomId}`);
    } catch (error) {
      console.error('Error leaving chat room:', error);
    }
  });

  /**
   * Send a message
   */
  socket.on('chat:message:send', async (data) => {
    try {
      const { roomId, roomType, content, attachments, mentions, replyTo } = data;

      // Create message in database
      const messageData = {
        sender: socket.userId,
        content,
        attachments: attachments || [],
        mentions: mentions || [],
        replyTo: replyTo || null,
        type: 'text',
        createdAt: new Date()
      };

      // Set room-specific fields
      if (roomType === 'workspace') {
        messageData.workspace = roomId;
      } else if (roomType === 'project') {
        messageData.project = roomId;
      } else if (roomType === 'direct') {
        messageData.receiver = roomId;
        messageData.type = 'direct';
      }

      const message = await Message.create(messageData);
      
      // Populate sender info
      await message.populate('sender', 'name email avatar');
      
      if (replyTo) {
        await message.populate('replyTo', 'content sender');
      }

      // Determine which room to broadcast to
      let targetRoom;
      if (roomType === 'workspace') {
        targetRoom = `chat:workspace:${roomId}`;
      } else if (roomType === 'project') {
        targetRoom = `chat:project:${roomId}`;
      } else if (roomType === 'direct') {
        const userIds = [socket.userId, roomId].sort();
        targetRoom = `direct:${userIds[0]}:${userIds[1]}`;
      }

      // Broadcast message to room
      io.to(targetRoom).emit('chat:message:received', {
        message,
        roomId,
        roomType,
        timestamp: new Date()
      });

      // Send notifications to mentioned users
      if (mentions && mentions.length > 0) {
        for (const mentionedUserId of mentions) {
          io.to(`user:${mentionedUserId}`).emit('chat:mention', {
            message,
            roomId,
            roomType,
            mentionedBy: socket.user.name,
            timestamp: new Date()
          });
        }
      }

      console.log(`Message sent by ${socket.userId} in ${roomType}:${roomId}`);
    } catch (error) {
      console.error('Error sending message:', error);
      socket.emit('chat:error', { message: 'Failed to send message' });
    }
  });

  /**
   * Edit a message
   */
  socket.on('chat:message:edit', async (data) => {
    try {
      const { messageId, content, roomId, roomType } = data;

      const message = await Message.findById(messageId);
      if (!message) {
        return socket.emit('chat:error', { message: 'Message not found' });
      }

      // Check if user is the sender
      if (message.sender.toString() !== socket.userId) {
        return socket.emit('chat:error', { message: 'Not authorized to edit this message' });
      }

      message.content = content;
      message.edited = true;
      message.editedAt = new Date();
      await message.save();

      await message.populate('sender', 'name email avatar');

      // Determine target room
      let targetRoom;
      if (roomType === 'workspace') {
        targetRoom = `chat:workspace:${roomId}`;
      } else if (roomType === 'project') {
        targetRoom = `chat:project:${roomId}`;
      } else if (roomType === 'direct') {
        const receiverId = message.receiver.toString();
        const userIds = [socket.userId, receiverId].sort();
        targetRoom = `direct:${userIds[0]}:${userIds[1]}`;
      }

      // Broadcast edited message
      io.to(targetRoom).emit('chat:message:edited', {
        message,
        timestamp: new Date()
      });

    } catch (error) {
      console.error('Error editing message:', error);
      socket.emit('chat:error', { message: 'Failed to edit message' });
    }
  });

  /**
   * Delete a message
   */
  socket.on('chat:message:delete', async (data) => {
    try {
      const { messageId, roomId, roomType } = data;

      const message = await Message.findById(messageId);
      if (!message) {
        return socket.emit('chat:error', { message: 'Message not found' });
      }

      // Check if user is the sender or admin
      if (message.sender.toString() !== socket.userId) {
        return socket.emit('chat:error', { message: 'Not authorized to delete this message' });
      }

      await message.deleteOne();

      // Determine target room
      let targetRoom;
      if (roomType === 'workspace') {
        targetRoom = `chat:workspace:${roomId}`;
      } else if (roomType === 'project') {
        targetRoom = `chat:project:${roomId}`;
      } else if (roomType === 'direct') {
        const receiverId = message.receiver.toString();
        const userIds = [socket.userId, receiverId].sort();
        targetRoom = `direct:${userIds[0]}:${userIds[1]}`;
      }

      // Broadcast deletion
      io.to(targetRoom).emit('chat:message:deleted', {
        messageId,
        roomId,
        roomType,
        timestamp: new Date()
      });

    } catch (error) {
      console.error('Error deleting message:', error);
      socket.emit('chat:error', { message: 'Failed to delete message' });
    }
  });

  /**
   * Add reaction to message
   */
  socket.on('chat:reaction:add', async (data) => {
    try {
      const { messageId, emoji, roomId, roomType } = data;

      const message = await Message.findById(messageId);
      if (!message) {
        return socket.emit('chat:error', { message: 'Message not found' });
      }

      // Initialize reactions array if not exists
      if (!message.reactions) {
        message.reactions = [];
      }

      // Check if user already reacted with this emoji
      const existingReaction = message.reactions.find(
        r => r.user.toString() === socket.userId && r.emoji === emoji
      );

      if (!existingReaction) {
        message.reactions.push({
          user: socket.userId,
          emoji,
          createdAt: new Date()
        });
        await message.save();
      }

      // Determine target room
      let targetRoom;
      if (roomType === 'workspace') {
        targetRoom = `chat:workspace:${roomId}`;
      } else if (roomType === 'project') {
        targetRoom = `chat:project:${roomId}`;
      } else if (roomType === 'direct') {
        const receiverId = message.receiver.toString();
        const userIds = [socket.userId, receiverId].sort();
        targetRoom = `direct:${userIds[0]}:${userIds[1]}`;
      }

      // Broadcast reaction
      io.to(targetRoom).emit('chat:reaction:added', {
        messageId,
        userId: socket.userId,
        userName: socket.user.name,
        emoji,
        timestamp: new Date()
      });

    } catch (error) {
      console.error('Error adding reaction:', error);
      socket.emit('chat:error', { message: 'Failed to add reaction' });
    }
  });

  /**
   * Remove reaction from message
   */
  socket.on('chat:reaction:remove', async (data) => {
    try {
      const { messageId, emoji, roomId, roomType } = data;

      const message = await Message.findById(messageId);
      if (!message) {
        return socket.emit('chat:error', { message: 'Message not found' });
      }

      if (message.reactions) {
        message.reactions = message.reactions.filter(
          r => !(r.user.toString() === socket.userId && r.emoji === emoji)
        );
        await message.save();
      }

      // Determine target room
      let targetRoom;
      if (roomType === 'workspace') {
        targetRoom = `chat:workspace:${roomId}`;
      } else if (roomType === 'project') {
        targetRoom = `chat:project:${roomId}`;
      } else if (roomType === 'direct') {
        const receiverId = message.receiver.toString();
        const userIds = [socket.userId, receiverId].sort();
        targetRoom = `direct:${userIds[0]}:${userIds[1]}`;
      }

      // Broadcast reaction removal
      io.to(targetRoom).emit('chat:reaction:removed', {
        messageId,
        userId: socket.userId,
        emoji,
        timestamp: new Date()
      });

    } catch (error) {
      console.error('Error removing reaction:', error);
      socket.emit('chat:error', { message: 'Failed to remove reaction' });
    }
  });

  /**
   * Typing indicator
   */
  socket.on('chat:typing:start', (data) => {
    try {
      const { roomId, roomType } = data;

      // Track typing user
      const typingKey = `${roomType}:${roomId}`;
      if (!typingUsers.has(typingKey)) {
        typingUsers.set(typingKey, new Set());
      }
      typingUsers.get(typingKey).add(socket.userId);

      // Determine target room
      let targetRoom;
      if (roomType === 'workspace') {
        targetRoom = `chat:workspace:${roomId}`;
      } else if (roomType === 'project') {
        targetRoom = `chat:project:${roomId}`;
      } else if (roomType === 'direct') {
        const userIds = [socket.userId, roomId].sort();
        targetRoom = `direct:${userIds[0]}:${userIds[1]}`;
      }

      // Broadcast typing indicator to others in room
      socket.to(targetRoom).emit('chat:typing', {
        userId: socket.userId,
        userName: socket.user.name,
        roomId,
        roomType
      });

    } catch (error) {
      console.error('Error handling typing indicator:', error);
    }
  });

  /**
   * Stop typing indicator
   */
  socket.on('chat:typing:stop', (data) => {
    try {
      const { roomId, roomType } = data;

      // Remove from typing users
      const typingKey = `${roomType}:${roomId}`;
      if (typingUsers.has(typingKey)) {
        typingUsers.get(typingKey).delete(socket.userId);
        
        // Clean up if empty
        if (typingUsers.get(typingKey).size === 0) {
          typingUsers.delete(typingKey);
        }
      }

      // Determine target room
      let targetRoom;
      if (roomType === 'workspace') {
        targetRoom = `chat:workspace:${roomId}`;
      } else if (roomType === 'project') {
        targetRoom = `chat:project:${roomId}`;
      } else if (roomType === 'direct') {
        const userIds = [socket.userId, roomId].sort();
        targetRoom = `direct:${userIds[0]}:${userIds[1]}`;
      }

      // Broadcast stop typing to others in room
      socket.to(targetRoom).emit('chat:typing:stopped', {
        userId: socket.userId,
        roomId,
        roomType
      });

    } catch (error) {
      console.error('Error handling stop typing:', error);
    }
  });

  /**
   * Mark message as read
   */
  socket.on('chat:message:read', async (data) => {
    try {
      const { messageId, roomId, roomType } = data;

      const message = await Message.findById(messageId);
      if (!message) {
        return socket.emit('chat:error', { message: 'Message not found' });
      }

      // Add user to readBy array if not already there
      if (!message.readBy) {
        message.readBy = [];
      }

      const alreadyRead = message.readBy.some(r => r.user.toString() === socket.userId);
      if (!alreadyRead) {
        message.readBy.push({
          user: socket.userId,
          readAt: new Date()
        });
        await message.save();

        // Notify sender that message was read
        io.to(`user:${message.sender}`).emit('chat:message:read:notify', {
          messageId,
          readBy: socket.userId,
          readByName: socket.user.name,
          timestamp: new Date()
        });
      }

    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  });

  /**
   * Pin message
   */
  socket.on('chat:message:pin', async (data) => {
    try {
      const { messageId, roomId, roomType } = data;

      const message = await Message.findById(messageId);
      if (!message) {
        return socket.emit('chat:error', { message: 'Message not found' });
      }

      message.pinned = true;
      message.pinnedBy = socket.userId;
      message.pinnedAt = new Date();
      await message.save();

      await message.populate('sender', 'name email avatar');

      // Determine target room
      let targetRoom;
      if (roomType === 'workspace') {
        targetRoom = `chat:workspace:${roomId}`;
      } else if (roomType === 'project') {
        targetRoom = `chat:project:${roomId}`;
      }

      // Broadcast pinned message
      io.to(targetRoom).emit('chat:message:pinned', {
        message,
        pinnedBy: socket.user.name,
        timestamp: new Date()
      });

    } catch (error) {
      console.error('Error pinning message:', error);
      socket.emit('chat:error', { message: 'Failed to pin message' });
    }
  });

  /**
   * Unpin message
   */
  socket.on('chat:message:unpin', async (data) => {
    try {
      const { messageId, roomId, roomType } = data;

      const message = await Message.findById(messageId);
      if (!message) {
        return socket.emit('chat:error', { message: 'Message not found' });
      }

      message.pinned = false;
      message.pinnedBy = null;
      message.pinnedAt = null;
      await message.save();

      // Determine target room
      let targetRoom;
      if (roomType === 'workspace') {
        targetRoom = `chat:workspace:${roomId}`;
      } else if (roomType === 'project') {
        targetRoom = `chat:project:${roomId}`;
      }

      // Broadcast unpinned message
      io.to(targetRoom).emit('chat:message:unpinned', {
        messageId,
        timestamp: new Date()
      });

    } catch (error) {
      console.error('Error unpinning message:', error);
      socket.emit('chat:error', { message: 'Failed to unpin message' });
    }
  });

};

module.exports = chatSocket;