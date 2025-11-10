// /**
//  * SyncSpace Backend - Main Server Entry Point
//  * Initializes Express app and Socket.IO server
//  */

// const dotenv = require('dotenv');
// const http = require('http');
// const { Server } = require('socket.io');

// // Load environment variables
// dotenv.config();

// // Import app
// const app = require('./src/app');

// // Import database connection
// const connectDatabase = require('./src/config/database');

// // Import socket configuration
// const initializeSocket = require('./src/config/socket');

// // Connect to database
// connectDatabase();

// // Create HTTP server
// const server = http.createServer(app);

// // Initialize Socket.IO
// const io = initializeSocket(server);

// // Make io accessible to routes
// app.set('io', io);

// // Define PORT
// const PORT = process.env.PORT || 5000;

// // Start server
// server.listen(PORT, () => {
//   console.log(`🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
//   console.log(`📡 Socket.IO server is ready for real-time connections`);
// });

// // Handle unhandled promise rejections
// process.on('unhandledRejection', (err) => {
//   console.error('❌ Unhandled Rejection:', err.message);
//   // Close server & exit process
//   server.close(() => {
//     process.exit(1);
//   });
// });

// // Handle uncaught exceptions
// process.on('uncaughtException', (err) => {
//   console.error('❌ Uncaught Exception:', err.message);
//   process.exit(1);
// });

// // Graceful shutdown
// process.on('SIGTERM', () => {
//   console.log('👋 SIGTERM received. Shutting down gracefully...');
//   server.close(() => {
//     console.log('✅ Process terminated');
//   });
// });

// module.exports = server;

//serve.js
/**
 * SyncSpace Backend - Main Server Entry Point
 * Initializes Express app, MongoDB, and Socket.IO
 */

const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');

// Load environment variables
dotenv.config();

// Import modules
const app = require('./src/app');
const connectDatabase = require('./src/config/database');
const initializeSocket = require('./src/config/socket');

// Connect to MongoDB
(async () => {
  try {
    await connectDatabase();
    console.log('✅ MongoDB connected successfully');
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  }
})();

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
const io = initializeSocket(server);

// Make io accessible to routes
app.set('io', io);

// Define PORT and NODE_ENV
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Server running in ${NODE_ENV} mode on port ${PORT}`);
  console.log(`📡 Socket.IO server is ready for real-time connections`);
});

// ====================== ERROR HANDLERS ======================

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err.message);
  server.close(() => process.exit(1));
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err.message);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed. Process terminated.');
  });
});

module.exports = server;
