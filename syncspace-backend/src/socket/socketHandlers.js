// /src/socket/socketHandlers.js

const documentSocket = require('./documentSocket');
const chatSocket = require('./chatSocket');
const kanbanSocket = require('./kanbanSocket');
const notificationSocket = require('./notificationSocket');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Store active users and their socket connections
const activeUsers = new Map();

/**
 * Socket.IO authentication middleware
 */
const authenticateSocket = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password -refreshToken');

    if (!user) {
      return next(new Error('Authentication error: User not found'));
    }

    socket.userId = user._id.toString();
    socket.user = user;
    next();
  } catch (error) {
    next(new Error('Authentication error: Invalid token'));
  }
};

/**
 * Initialize all socket handlers
 */
const initializeSocketHandlers = (io) => {
  // Apply authentication middleware
  io.use(authenticateSocket);

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.userId}`);

    // Add user to active users
    if (!activeUsers.has(socket.userId)) {
      activeUsers.set(socket.userId, new Set());
    }
    activeUsers.get(socket.userId).add(socket.id);

    // Emit user online status to all connected clients
    io.emit('user:online', {
      userId: socket.userId,
      status: 'online',
      timestamp: new Date()
    });

    // Update user status in database
    User.findByIdAndUpdate(socket.userId, {
      status: 'online',
      lastActive: new Date()
    }).catch(err => console.error('Error updating user status:', err));

    // Join user to their personal room
    socket.join(`user:${socket.userId}`);

    // Handle user joining workspaces and projects
    socket.on('join:workspace', (workspaceId) => {
      socket.join(`workspace:${workspaceId}`);
      console.log(`User ${socket.userId} joined workspace ${workspaceId}`);
      
      // Notify other users in workspace
      socket.to(`workspace:${workspaceId}`).emit('user:joined:workspace', {
        userId: socket.userId,
        workspaceId,
        timestamp: new Date()
      });
    });

    socket.on('leave:workspace', (workspaceId) => {
      socket.leave(`workspace:${workspaceId}`);
      console.log(`User ${socket.userId} left workspace ${workspaceId}`);
      
      // Notify other users in workspace
      socket.to(`workspace:${workspaceId}`).emit('user:left:workspace', {
        userId: socket.userId,
        workspaceId,
        timestamp: new Date()
      });
    });

    socket.on('join:project', (projectId) => {
      socket.join(`project:${projectId}`);
      console.log(`User ${socket.userId} joined project ${projectId}`);
      
      // Notify other users in project
      socket.to(`project:${projectId}`).emit('user:joined:project', {
        userId: socket.userId,
        projectId,
        timestamp: new Date()
      });
    });

    socket.on('leave:project', (projectId) => {
      socket.leave(`project:${projectId}`);
      console.log(`User ${socket.userId} left project ${projectId}`);
      
      // Notify other users in project
      socket.to(`project:${projectId}`).emit('user:left:project', {
        userId: socket.userId,
        projectId,
        timestamp: new Date()
      });
    });

    // Handle user status updates
    socket.on('user:status', async (status) => {
      try {
        await User.findByIdAndUpdate(socket.userId, { status });
        
        // Broadcast status change to all users
        io.emit('user:status:changed', {
          userId: socket.userId,
          status,
          timestamp: new Date()
        });
      } catch (error) {
        console.error('Error updating user status:', error);
      }
    });

    // Handle typing indicators
    socket.on('typing:start', ({ roomId, roomType }) => {
      const room = roomType === 'workspace' ? `workspace:${roomId}` : `project:${roomId}`;
      socket.to(room).emit('user:typing', {
        userId: socket.userId,
        userName: socket.user.name,
        roomId,
        roomType
      });
    });

    socket.on('typing:stop', ({ roomId, roomType }) => {
      const room = roomType === 'workspace' ? `workspace:${roomId}` : `project:${roomId}`;
      socket.to(room).emit('user:stopped:typing', {
        userId: socket.userId,
        roomId,
        roomType
      });
    });

    // Initialize feature-specific socket handlers
    documentSocket(io, socket);
    chatSocket(io, socket);
    kanbanSocket(io, socket);
    notificationSocket(io, socket);

    // Handle disconnection
    socket.on('disconnect', async () => {
      console.log(`User disconnected: ${socket.userId}`);

      // Remove socket from active users
      if (activeUsers.has(socket.userId)) {
        activeUsers.get(socket.userId).delete(socket.id);
        
        // If user has no more active connections, mark as offline
        if (activeUsers.get(socket.userId).size === 0) {
          activeUsers.delete(socket.userId);
          
          // Update user status to offline
          try {
            await User.findByIdAndUpdate(socket.userId, {
              status: 'offline',
              lastActive: new Date()
            });

            // Emit user offline status
            io.emit('user:offline', {
              userId: socket.userId,
              status: 'offline',
              lastActive: new Date()
            });
          } catch (error) {
            console.error('Error updating user status on disconnect:', error);
          }
        }
      }
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error(`Socket error for user ${socket.userId}:`, error);
    });
  });

  return io;
};

/**
 * Get all active users
 */
const getActiveUsers = () => {
  return Array.from(activeUsers.keys());
};

/**
 * Check if user is online
 */
const isUserOnline = (userId) => {
  return activeUsers.has(userId);
};

/**
 * Get user's socket IDs
 */
const getUserSockets = (userId) => {
  return activeUsers.get(userId) || new Set();
};

/**
 * Emit event to specific user
 */
const emitToUser = (io, userId, event, data) => {
  io.to(`user:${userId}`).emit(event, data);
};

/**
 * Emit event to workspace
 */
const emitToWorkspace = (io, workspaceId, event, data) => {
  io.to(`workspace:${workspaceId}`).emit(event, data);
};

/**
 * Emit event to project
 */
const emitToProject = (io, projectId, event, data) => {
  io.to(`project:${projectId}`).emit(event, data);
};

module.exports = {
  initializeSocketHandlers,
  authenticateSocket,
  getActiveUsers,
  isUserOnline,
  getUserSockets,
  emitToUser,
  emitToWorkspace,
  emitToProject,
  activeUsers
};