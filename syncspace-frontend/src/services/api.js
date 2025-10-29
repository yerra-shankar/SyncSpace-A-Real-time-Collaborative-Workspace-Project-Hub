import axios from 'axios';

// Create axios instance with base configuration
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add auth token to requests
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('syncspace_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors globally
apiClient.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      
      if (status === 401) {
        // Only clear token if not on login page
        if (!window.location.pathname.includes('/login')) {
          localStorage.removeItem('syncspace_token');
          window.location.href = '/login';
        }
      } else if (status === 403) {
        // Forbidden
        console.error('Access denied:', data.message);
      } else if (status === 404) {
        // Not found
        console.error('Resource not found:', data.message);
      } else if (status >= 500) {
        // Server error
        console.error('Server error:', data.message);
      }
    } else if (error.request) {
      // Request was made but no response received
      console.error('Network error: No response from server');
    } else {
      // Something else happened
      console.error('Error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

// API Service Object
const api = {
  // ==================== AUTH API ====================
  auth: {
    // Login user
    login: async (email, password) => {
      try {
        const response = await apiClient.post('/auth/login', { email, password });
        if (response.token && response.user) {
          return {
            success: true,
            token: response.token,
            user: response.user
          };
        }
        return {
          success: false,
          error: response.message || 'Login failed. Please try again.'
        };
      } catch (error) {
        return {
          success: false,
          error: error.response?.data?.message || 'Login failed. Please try again.'
        };
      }
    },

    // Register new user
    register: async (name, email, password) => {
      try {
        const response = await apiClient.post('/auth/register', { name, email, password });
        return response;
      } catch (error) {
        throw error;
      }
    },

    // Logout user
    logout: async () => {
      try {
        const response = await apiClient.post('/auth/logout');
        return response;
      } catch (error) {
        throw error;
      }
    },

    // Validate token
    validateToken: async () => {
      try {
        const response = await apiClient.get('/auth/validate');
        return response;
      } catch (error) {
        throw error;
      }
    },

    // Forgot password
    forgotPassword: async (email) => {
      try {
        const response = await apiClient.post('/auth/forgot-password', { email });
        return response;
      } catch (error) {
        throw error;
      }
    },

    // Reset password
    resetPassword: async (token, newPassword) => {
      try {
        const response = await apiClient.post('/auth/reset-password', { token, newPassword });
        return response;
      } catch (error) {
        throw error;
      }
    },
  },

  // ==================== WORKSPACE API ====================
  workspaces: {
    // Get all workspaces
    getAll: async () => {
      try {
        const response = await apiClient.get('/workspaces');
        return response.workspaces || [];
      } catch (error) {
        throw error;
      }
    },

    // Get workspace by ID
    getById: async (workspaceId) => {
      try {
        const response = await apiClient.get(`/workspaces/${workspaceId}`);
        return response.workspace;
      } catch (error) {
        throw error;
      }
    },

    // Create new workspace
    create: async (workspaceData) => {
      try {
        const response = await apiClient.post('/workspaces', workspaceData);
        return response;
      } catch (error) {
        throw error;
      }
    },

    // Update workspace
    update: async (workspaceId, workspaceData) => {
      try {
        const response = await apiClient.put(`/workspaces/${workspaceId}`, workspaceData);
        return response;
      } catch (error) {
        throw error;
      }
    },

    // Delete workspace
    delete: async (workspaceId) => {
      try {
        const response = await apiClient.delete(`/workspaces/${workspaceId}`);
        return response;
      } catch (error) {
        throw error;
      }
    },
  },

  // ==================== PROJECT API ====================
  projects: {
    // Get projects by workspace
    getByWorkspace: async (workspaceId) => {
      try {
        const response = await apiClient.get(`/workspaces/${workspaceId}/projects`);
        return response.projects || [];
      } catch (error) {
        throw error;
      }
    },

    // Get project by ID
    getById: async (projectId) => {
      try {
        const response = await apiClient.get(`/projects/${projectId}`);
        return response.project;
      } catch (error) {
        throw error;
      }
    },

    // Create new project
    create: async (workspaceId, projectData) => {
      try {
        const response = await apiClient.post(`/workspaces/${workspaceId}/projects`, projectData);
        return response;
      } catch (error) {
        throw error;
      }
    },

    // Update project
    update: async (projectId, projectData) => {
      try {
        const response = await apiClient.put(`/projects/${projectId}`, projectData);
        return response;
      } catch (error) {
        throw error;
      }
    },

    // Delete project
    delete: async (projectId) => {
      try {
        const response = await apiClient.delete(`/projects/${projectId}`);
        return response;
      } catch (error) {
        throw error;
      }
    },
  },

  // ==================== TASK API ====================
  tasks: {
    // Get all tasks by project
    getByProject: async (projectId) => {
      try {
        const response = await apiClient.get(`/projects/${projectId}/tasks`);
        return response.tasks || { todo: [], inProgress: [], done: [] };
      } catch (error) {
        throw error;
      }
    },

    // Get task by ID
    getById: async (taskId) => {
      try {
        const response = await apiClient.get(`/tasks/${taskId}`);
        return response.task;
      } catch (error) {
        throw error;
      }
    },

    // Create new task
    create: async (projectId, taskData) => {
      try {
        const response = await apiClient.post(`/projects/${projectId}/tasks`, taskData);
        return response;
      } catch (error) {
        throw error;
      }
    },

    // Update task
    update: async (taskId, taskData) => {
      try {
        const response = await apiClient.put(`/tasks/${taskId}`, taskData);
        return response;
      } catch (error) {
        throw error;
      }
    },

    // Move task to different column
    move: async (taskId, newStatus) => {
      try {
        const response = await apiClient.patch(`/tasks/${taskId}/move`, { status: newStatus });
        return response;
      } catch (error) {
        throw error;
      }
    },

    // Delete task
    delete: async (taskId) => {
      try {
        const response = await apiClient.delete(`/tasks/${taskId}`);
        return response;
      } catch (error) {
        throw error;
      }
    },
  },

  // ==================== DOCUMENT API ====================
  documents: {
    // Get documents by workspace
    getByWorkspace: async (workspaceId) => {
      try {
        const response = await apiClient.get(`/workspaces/${workspaceId}/documents`);
        return response.documents || [];
      } catch (error) {
        throw error;
      }
    },

    // Get document by ID
    getById: async (documentId) => {
      try {
        const response = await apiClient.get(`/documents/${documentId}`);
        return response.document;
      } catch (error) {
        throw error;
      }
    },

    // Create new document
    create: async (workspaceId, documentData) => {
      try {
        const response = await apiClient.post(`/workspaces/${workspaceId}/documents`, documentData);
        return response;
      } catch (error) {
        throw error;
      }
    },

    // Update document
    update: async (documentId, documentData) => {
      try {
        const response = await apiClient.put(`/documents/${documentId}`, documentData);
        return response;
      } catch (error) {
        throw error;
      }
    },

    // Delete document
    delete: async (documentId) => {
      try {
        const response = await apiClient.delete(`/documents/${documentId}`);
        return response;
      } catch (error) {
        throw error;
      }
    },
  },

  // ==================== CHAT API ====================
  chat: {
    // Get chat messages by workspace
    getMessages: async (workspaceId, limit = 50, offset = 0) => {
      try {
        const response = await apiClient.get(`/workspaces/${workspaceId}/messages`, {
          params: { limit, offset }
        });
        return response.messages || [];
      } catch (error) {
        throw error;
      }
    },

    // Send chat message
    sendMessage: async (workspaceId, messageData) => {
      try {
        const response = await apiClient.post(`/workspaces/${workspaceId}/messages`, messageData);
        return response;
      } catch (error) {
        throw error;
      }
    },

    // Delete message
    deleteMessage: async (messageId) => {
      try {
        const response = await apiClient.delete(`/messages/${messageId}`);
        return response;
      } catch (error) {
        throw error;
      }
    },
  },

  // ==================== FILE API ====================
  files: {
    // Get files by workspace
    getByWorkspace: async (workspaceId) => {
      try {
        const response = await apiClient.get(`/workspaces/${workspaceId}/files`);
        return response.files || [];
      } catch (error) {
        throw error;
      }
    },

    // Get file by ID
    getById: async (fileId) => {
      try {
        const response = await apiClient.get(`/files/${fileId}`);
        return response.file;
      } catch (error) {
        throw error;
      }
    },

    // Upload file
    upload: async (workspaceId, formData, onUploadProgress) => {
      try {
        const response = await apiClient.post(`/workspaces/${workspaceId}/files/upload`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress: (progressEvent) => {
            if (onUploadProgress) {
              const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              onUploadProgress(percentCompleted);
            }
          },
        });
        return response;
      } catch (error) {
        throw error;
      }
    },

    // Download file
    download: async (fileId) => {
      try {
        const response = await apiClient.get(`/files/${fileId}/download`, {
          responseType: 'blob',
        });
        return response;
      } catch (error) {
        throw error;
      }
    },

    // Get file versions
    getVersions: async (fileId) => {
      try {
        const response = await apiClient.get(`/files/${fileId}/versions`);
        return response.versions || [];
      } catch (error) {
        throw error;
      }
    },

    // Delete file
    delete: async (fileId) => {
      try {
        const response = await apiClient.delete(`/files/${fileId}`);
        return response;
      } catch (error) {
        throw error;
      }
    },
  },

  // ==================== MEMBER API ====================
  members: {
    // Get workspace members
    getByWorkspace: async (workspaceId) => {
      try {
        const response = await apiClient.get(`/workspaces/${workspaceId}/members`);
        return response.members || [];
      } catch (error) {
        throw error;
      }
    },

    // Invite member to workspace
    invite: async (workspaceId, memberData) => {
      try {
        const response = await apiClient.post(`/workspaces/${workspaceId}/members/invite`, memberData);
        return response;
      } catch (error) {
        throw error;
      }
    },

    // Update member role
    updateRole: async (workspaceId, memberId, role) => {
      try {
        const response = await apiClient.patch(`/workspaces/${workspaceId}/members/${memberId}/role`, { role });
        return response;
      } catch (error) {
        throw error;
      }
    },

    // Remove member from workspace
    remove: async (workspaceId, memberId) => {
      try {
        const response = await apiClient.delete(`/workspaces/${workspaceId}/members/${memberId}`);
        return response;
      } catch (error) {
        throw error;
      }
    },
  },

  // ==================== NOTIFICATION API ====================
  notifications: {
    // Get all notifications
    getAll: async () => {
      try {
        const response = await apiClient.get('/notifications');
        return response.notifications || [];
      } catch (error) {
        throw error;
      }
    },

    // Mark notification as read
    markAsRead: async (notificationId) => {
      try {
        const response = await apiClient.patch(`/notifications/${notificationId}/read`);
        return response;
      } catch (error) {
        throw error;
      }
    },

    // Mark all notifications as read
    markAllAsRead: async () => {
      try {
        const response = await apiClient.patch('/notifications/read-all');
        return response;
      } catch (error) {
        throw error;
      }
    },

    // Delete notification
    delete: async (notificationId) => {
      try {
        const response = await apiClient.delete(`/notifications/${notificationId}`);
        return response;
      } catch (error) {
        throw error;
      }
    },
  },
};

export default api;