/**
 * Express Application Setup
 * Configures middleware, routes, and error handling
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');
const path = require('path');

// ==================== IMPORT ROUTES ====================

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const workspaceRoutes = require('./routes/workspaceRoutes');
const projectRoutes = require('./routes/projectRoutes');
const taskRoutes = require('./routes/taskRoutes'); // ✅ includes both /api/tasks and /api/projects/:projectId/tasks
const documentRoutes = require('./routes/documentRoutes');
const chatRoutes = require('./routes/chatRoutes');
const fileRoutes = require('./routes/fileRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

// Error handling middleware
const errorMiddleware = require('./middlewares/errorMiddleware');

// ==================== INITIALIZE EXPRESS APP ====================

const app = express();

// ==================== SECURITY MIDDLEWARE ====================

// Secure HTTP headers
app.use(helmet());

// Enable CORS (optimized for Vite frontend)
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Disable caching globally to prevent stale 304 responses
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  next();
});

// ==================== RATE LIMITING & SANITIZATION ====================

const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 min
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // 100 requests per IP
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);
app.use(mongoSanitize());

// ==================== BODY PARSERS ====================

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ==================== LOGGING ====================

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// ==================== STATIC FILES ====================

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ==================== HEALTH CHECK ====================

app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: '✅ SyncSpace API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// ==================== ROUTES ====================

// Auth & Users
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// Workspaces & Projects
app.use('/api/workspaces', workspaceRoutes);
app.use('/api/projects', projectRoutes);

// ✅ Notifications route must come BEFORE /api (to avoid task route conflicts)
app.use('/api/notifications', notificationRoutes);

// Documents, Chat, Files
app.use('/api/documents', documentRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/files', fileRoutes);

// ✅ Mount the unified task routes last
// This handles both /api/tasks and /api/projects/:projectId/tasks
app.use('/api', taskRoutes);

// ==================== ERROR HANDLERS ====================

// Handle 404 - Route not found
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

// Global error middleware
app.use(errorMiddleware);

module.exports = app;
