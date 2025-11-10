/**
 * Socket.IO Server Configuration
 * Initializes Socket.IO with CORS and authentication
 */

const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

// Import socket handlers
const documentSocket = require('../socket/documentSocket');
const chatSocket = require('../socket/chatSocket');
const kanbanSocket = require('../socket/kanbanSocket');
const notificationSocket = require('../socket/notificationSocket');

const initializeSocket = (server) => {
  // Create Socket.IO server with CORS configuration
  const io = new Server(server, {
    cors: {
      origin: process.env.SOCKET_CORS_ORIGIN || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true
    },
    pingTimeout: 60000,
    pingInterval: 25000
  });

  // Middleware for Socket.IO authentication
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error('Authentication error: Token not provided'));
      }

      // Verify JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Attach user info to socket
      socket.userId = decoded.id;
      socket.userEmail = decoded.email;
      socket.userRole = decoded.role;

      console.log(`✅ User authenticated: ${socket.userEmail} (${socket.id})`);
      next();
    } catch (error) {
      console.error('❌ Socket authentication error:', error.message);
      next(new Error('Authentication error: Invalid token'));
    }
  });

  // Handle connections
  io.on('connection', (socket) => {
    console.log(`🔌 New socket connection: ${socket.id} | User: ${socket.userEmail}`);

    // Join user to their personal room
    socket.join(`user:${socket.userId}`);

    // Initialize socket handlers
    documentSocket(io, socket);
    chatSocket(io, socket);
    kanbanSocket(io, socket);
    notificationSocket(io, socket);

    // Handle workspace join
    socket.on('workspace:join', (workspaceId) => {
      socket.join(`workspace:${workspaceId}`);
      console.log(`📂 User ${socket.userEmail} joined workspace: ${workspaceId}`);
      
      // Notify others in workspace
      socket.to(`workspace:${workspaceId}`).emit('user:online', {
        userId: socket.userId,
        userEmail: socket.userEmail
      });
    });

    // Handle workspace leave
    socket.on('workspace:leave', (workspaceId) => {
      socket.leave(`workspace:${workspaceId}`);
      console.log(`📂 User ${socket.userEmail} left workspace: ${workspaceId}`);
      
      // Notify others in workspace
      socket.to(`workspace:${workspaceId}`).emit('user:offline', {
        userId: socket.userId,
        userEmail: socket.userEmail
      });
    });

    // Handle disconnect
    socket.on('disconnect', (reason) => {
      console.log(`🔌 Socket disconnected: ${socket.id} | Reason: ${reason}`);
      
      // Notify all rooms about user going offline
      io.emit('user:disconnect', {
        userId: socket.userId,
        timestamp: new Date()
      });
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error(`❌ Socket error for ${socket.id}:`, error);
    });
  });

  console.log('✅ Socket.IO initialized successfully');
  return io;
};

module.exports = initializeSocket;