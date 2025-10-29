import { io } from 'socket.io-client';

// Socket.IO configuration
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
const RECONNECTION_ATTEMPTS = parseInt(import.meta.env.VITE_SOCKET_RECONNECTION_ATTEMPTS) || 5;
const RECONNECTION_DELAY = parseInt(import.meta.env.VITE_SOCKET_RECONNECTION_DELAY) || 3000;

// Create socket instance
let socket = null;

// Initialize socket connection
export const initializeSocket = (token) => {
  if (socket && socket.connected) {
    return socket;
  }

  socket = io(SOCKET_URL, {
    auth: {
      token: token || localStorage.getItem('syncspace_token'),
    },
    reconnection: true,
    reconnectionAttempts: RECONNECTION_ATTEMPTS,
    reconnectionDelay: RECONNECTION_DELAY,
    transports: ['websocket', 'polling'],
  });

  // Connection event handlers
  socket.on('connect', () => {
    console.log('✅ Socket connected:', socket.id);
  });

  socket.on('disconnect', (reason) => {
    console.log('❌ Socket disconnected:', reason);
  });

  socket.on('connect_error', (error) => {
    console.error('❌ Socket connection error:', error.message);
  });

  socket.on('reconnect', (attemptNumber) => {
    console.log('🔄 Socket reconnected after', attemptNumber, 'attempts');
  });

  socket.on('reconnect_error', (error) => {
    console.error('❌ Socket reconnection error:', error.message);
  });

  socket.on('reconnect_failed', () => {
    console.error('❌ Socket reconnection failed');
  });

  return socket;
};

// Get socket instance
export const getSocket = () => {
  if (!socket) {
    console.warn('⚠️ Socket not initialized. Call initializeSocket() first.');
    return null;
  }
  return socket;
};

// Disconnect socket
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    console.log('🔌 Socket disconnected');
  }
};

// ==================== WORKSPACE EVENTS ====================
export const joinWorkspace = (workspaceId) => {
  if (socket) {
    socket.emit('workspace:join', { workspaceId });
    console.log('📂 Joined workspace:', workspaceId);
  }
};

export const leaveWorkspace = (workspaceId) => {
  if (socket) {
    socket.emit('workspace:leave', { workspaceId });
    console.log('📂 Left workspace:', workspaceId);
  }
};

// ==================== TASK EVENTS ====================
export const subscribeToTaskUpdates = (callback) => {
  if (socket) {
    socket.on('task:created', callback);
    socket.on('task:updated', callback);
    socket.on('task:deleted', callback);
    socket.on('task:moved', callback);
  }
};

export const unsubscribeFromTaskUpdates = () => {
  if (socket) {
    socket.off('task:created');
    socket.off('task:updated');
    socket.off('task:deleted');
    socket.off('task:moved');
  }
};

export const emitTaskMove = (taskId, fromColumn, toColumn) => {
  if (socket) {
    socket.emit('task:move', { taskId, fromColumn, toColumn });
  }
};

export const emitTaskUpdate = (taskId, updates) => {
  if (socket) {
    socket.emit('task:update', { taskId, updates });
  }
};

// ==================== DOCUMENT EVENTS ====================
export const joinDocument = (documentId) => {
  if (socket) {
    socket.emit('document:join', { documentId });
    console.log('📄 Joined document:', documentId);
  }
};

export const leaveDocument = (documentId) => {
  if (socket) {
    socket.emit('document:leave', { documentId });
    console.log('📄 Left document:', documentId);
  }
};

export const emitDocumentUpdate = (documentId, content, cursorPosition) => {
  if (socket) {
    socket.emit('document:update', { documentId, content, cursorPosition });
  }
};

export const subscribeToDocumentUpdates = (callback) => {
  if (socket) {
    socket.on('document:update', callback);
    socket.on('document:cursor', callback);
  }
};

export const unsubscribeFromDocumentUpdates = () => {
  if (socket) {
    socket.off('document:update');
    socket.off('document:cursor');
  }
};

export const emitCursorPosition = (documentId, position, userId) => {
  if (socket) {
    socket.emit('document:cursor', { documentId, position, userId });
  }
};

// ==================== CHAT EVENTS ====================
export const emitChatMessage = (workspaceId, message) => {
  if (socket) {
    socket.emit('chat:message', { workspaceId, message });
  }
};

export const emitTypingIndicator = (workspaceId, isTyping) => {
  if (socket) {
    socket.emit('chat:typing', { workspaceId, isTyping });
  }
};

export const subscribeToChatMessages = (callback) => {
  if (socket) {
    socket.on('chat:message', callback);
  }
};

export const subscribeToTypingIndicators = (callback) => {
  if (socket) {
    socket.on('chat:typing', callback);
  }
};

export const unsubscribeFromChatMessages = () => {
  if (socket) {
    socket.off('chat:message');
  }
};

export const unsubscribeFromTypingIndicators = () => {
  if (socket) {
    socket.off('chat:typing');
  }
};

// ==================== NOTIFICATION EVENTS ====================
export const subscribeToNotifications = (callback) => {
  if (socket) {
    socket.on('notification:new', callback);
  }
};

export const unsubscribeFromNotifications = () => {
  if (socket) {
    socket.off('notification:new');
  }
};

// ==================== USER PRESENCE EVENTS ====================
export const emitUserPresence = (workspaceId, status) => {
  if (socket) {
    socket.emit('user:presence', { workspaceId, status });
  }
};

export const subscribeToUserPresence = (callback) => {
  if (socket) {
    socket.on('user:online', callback);
    socket.on('user:offline', callback);
  }
};

export const unsubscribeFromUserPresence = () => {
  if (socket) {
    socket.off('user:online');
    socket.off('user:offline');
  }
};

// ==================== GENERIC EVENT HELPERS ====================
export const subscribeToEvent = (eventName, callback) => {
  if (socket) {
    socket.on(eventName, callback);
  }
};

export const unsubscribeFromEvent = (eventName) => {
  if (socket) {
    socket.off(eventName);
  }
};

export const emitEvent = (eventName, data) => {
  if (socket) {
    socket.emit(eventName, data);
  }
};

// Export socket instance getter as default
export default {
  initialize: initializeSocket,
  get: getSocket,
  disconnect: disconnectSocket,
  
  // Workspace
  joinWorkspace,
  leaveWorkspace,
  
  // Tasks
  subscribeToTaskUpdates,
  unsubscribeFromTaskUpdates,
  emitTaskMove,
  emitTaskUpdate,
  
  // Documents
  joinDocument,
  leaveDocument,
  emitDocumentUpdate,
  subscribeToDocumentUpdates,
  unsubscribeFromDocumentUpdates,
  emitCursorPosition,
  
  // Chat
  emitChatMessage,
  emitTypingIndicator,
  subscribeToChatMessages,
  subscribeToTypingIndicators,
  unsubscribeFromChatMessages,
  unsubscribeFromTypingIndicators,
  
  // Notifications
  subscribeToNotifications,
  unsubscribeFromNotifications,
  
  // User Presence
  emitUserPresence,
  subscribeToUserPresence,
  unsubscribeFromUserPresence,
  
  // Generic
  subscribeToEvent,
  unsubscribeFromEvent,
  emitEvent,
};