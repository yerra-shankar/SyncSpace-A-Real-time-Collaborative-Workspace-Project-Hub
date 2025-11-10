
//api.js

import axios from "axios";

// ==================== BASE CONFIG ====================
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// ==================== INTERCEPTORS ====================
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("syncspace_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response) {
      const { status, data } = error.response;

      if (status === 401 && !window.location.pathname.includes("/login")) {
        localStorage.removeItem("syncspace_token");
        window.location.href = "/login";
      } else if (status === 403) {
        console.error("Access denied:", data.message);
      } else if (status === 404) {
        console.error("Resource not found:", data.message);
      } else if (status >= 500) {
        console.error("Server error:", data.message);
      }
    } else if (error.request) {
      console.error("Network error: No response from server");
    } else {
      console.error("Error:", error.message);
    }

    return Promise.reject(error);
  }
);

// ==================== API OBJECT ====================
const api = {
  get: apiClient.get.bind(apiClient),
  post: apiClient.post.bind(apiClient),
  put: apiClient.put.bind(apiClient),
  patch: apiClient.patch.bind(apiClient),
  delete: apiClient.delete.bind(apiClient),

  // ==================== AUTH ====================
  auth: {
    login: async (email, password) => {
      try {
        const res = await apiClient.post("/auth/login", { email, password });
        if (res && res.token && res.user) {
          return { success: true, token: res.token, user: res.user };
        }
        return { success: false, error: res?.message || "Login failed" };
      } catch (error) {
        return {
          success: false,
          error: error.response?.data?.message || "Login failed",
        };
      }
    },

    register: async (name, email, password, confirmPassword) => {
      try {
        const res = await apiClient.post("/auth/register", {
          name,
          email,
          password,
          confirmPassword,
        });
        if (res && res.token && res.user) {
          return { success: true, token: res.token, user: res.user };
        } else {
          return { success: false, error: res?.message || "Registration failed" };
        }
      } catch (error) {
        console.error("❌ Register API Error:", error);
        return {
          success: false,
          error: error.response?.data?.message || "Registration failed",
        };
      }
    },

    logout: async () => {
      try {
        return await apiClient.post("/auth/logout");
      } catch (error) {
        throw error;
      }
    },

    validateToken: async () => apiClient.get("/auth/validate"),
    forgotPassword: async (email) =>
      apiClient.post("/auth/forgot-password", { email }),
    resetPassword: async (token, newPassword) =>
      apiClient.post(`/auth/reset-password/${token}`, { password: newPassword }),
  },

  // ==================== WORKSPACES ====================
  workspaces: {
    getAll: async () => {
      const res = await apiClient.get("/workspaces");
      return res.workspaces || [];
    },

    getById: async (workspaceId) => {
      const res = await apiClient.get(`/workspaces/${workspaceId}`);
      return res.workspace;
    },

    create: async (data) => apiClient.post("/workspaces", data),
    update: async (id, data) => apiClient.put(`/workspaces/${id}`, data),
    delete: async (id) => apiClient.delete(`/workspaces/${id}`),
  },

  // ==================== PROJECTS ====================
  projects: {
    getByWorkspace: async (workspaceId) => {
      try {
        const res = await apiClient.get(`/workspaces/${workspaceId}/projects`);
        return res.projects || [];
      } catch (error) {
        console.error("❌ Failed to fetch workspace projects:", error);
        throw error;
      }
    },

    getById: async (projectId) => {
      const res = await apiClient.get(`/projects/${projectId}`);
      return res.project;
    },

    create: async (workspaceId, data) =>
      apiClient.post(`/workspaces/${workspaceId}/projects`, data),

    update: async (projectId, data) =>
      apiClient.put(`/projects/${projectId}`, data),

    delete: async (projectId) => apiClient.delete(`/projects/${projectId}`),
  },

  // ==================== TASKS ====================
  tasks: {
    getByWorkspace: async (workspaceId) => {
  try {
    if (!workspaceId || workspaceId.length !== 24) {
      console.warn("⚠️ Invalid workspaceId:", workspaceId);
      return [];
    }

    const res = await apiClient.get(`/workspaces/${workspaceId}/projects`);
    if (!res || !res.projects) {
      console.warn("⚠️ No projects returned from backend:", res);
      return [];
    }

    console.log("📦 Projects fetched:", res.projects);
    return res.projects;
  } catch (error) {
    console.error("❌ Failed to fetch workspace projects:", error);
    throw error;
  }
},

    getById: async (taskId) => {
      const res = await apiClient.get(`/tasks/${taskId}`);
      return res.task;
    },

    create: async (projectId, data) => {
      if (!projectId || projectId.length !== 24) {
        return {
          success: false,
          message: "Invalid project ID. Must be a 24-character string.",
        };
      }
      return await apiClient.post(`/projects/${projectId}/tasks`, data);
    },

    update: async (taskId, data) =>
      apiClient.put(`/tasks/${taskId}`, data),

    move: async (taskId, newStatus) =>
      apiClient.patch(`/tasks/${taskId}/move`, { status: newStatus }),

    delete: async (taskId) => apiClient.delete(`/tasks/${taskId}`),
  },


// ==================== TASKS ====================
// tasks: {
//   /**
//    * ✅ Get all tasks for a specific project (used in KanbanBoard)
//    */
//   getByProject: async (projectId) => {
//     try {
//       if (!projectId || projectId.length !== 24) {
//         console.warn("⚠️ Invalid projectId:", projectId);
//         return {
//           success: false,
//           message: "Invalid project ID. Must be a 24-character string.",
//         };
//       }

//       const res = await apiClient.get(`/projects/${projectId}/tasks`);

//       // If backend response has grouped tasks (todo, inProgress, done)
//       if (res && res.tasks) {
//         console.log("📋 Tasks loaded for project:", projectId, res.tasks);
//         return {
//           success: true,
//           tasks: res.tasks,
//         };
//       }

//       // Fallback: empty board structure
//       console.warn("⚠️ No tasks found for project:", projectId);
//       return {
//         success: true,
//         tasks: { todo: [], inProgress: [], done: [] },
//       };
//     } catch (error) {
//       console.error("❌ Failed to fetch project tasks:", error);
//       return {
//         success: false,
//         message: error.response?.data?.message || "Failed to fetch tasks",
//       };
//     }
//   },

//   /**
//    * ✅ Create a new task under a specific project
//    */
//   create: async (projectId, data) => {
//     try {
//       if (!projectId || projectId.length !== 24) {
//         return {
//           success: false,
//           message: "Invalid project ID. Must be a 24-character string.",
//         };
//       }

//       const res = await apiClient.post(`/projects/${projectId}/tasks`, data);
//       return {
//         success: true,
//         task: res.task,
//         message: res.message || "Task created successfully",
//       };
//     } catch (error) {
//       console.error("❌ Task creation failed:", error);
//       return {
//         success: false,
//         message:
//           error.response?.data?.message ||
//           "Server error while creating task.",
//       };
//     }
//   },

//   /**
//    * ✅ Update an existing task
//    */
//   update: async (taskId, data) => {
//     try {
//       const res = await apiClient.put(`/tasks/${taskId}`, data);
//       return { success: true, task: res.task };
//     } catch (error) {
//       console.error("❌ Task update failed:", error);
//       return {
//         success: false,
//         message: error.response?.data?.message || "Failed to update task",
//       };
//     }
//   },

//   /**
//    * ✅ Move a task (Kanban column change)
//    */
//   move: async (taskId, newStatus) => {
//     try {
//       const res = await apiClient.patch(`/tasks/${taskId}/move`, {
//         status: newStatus,
//       });
//       return { success: true, task: res.task };
//     } catch (error) {
//       console.error("❌ Task move failed:", error);
//       return {
//         success: false,
//         message: error.response?.data?.message || "Failed to move task",
//       };
//     }
//   },

//   /**
//    * ✅ Delete a task
//    */
//   delete: async (taskId) => {
//     try {
//       const res = await apiClient.delete(`/tasks/${taskId}`);
//       return { success: true, message: res.message || "Task deleted" };
//     } catch (error) {
//       console.error("❌ Task delete failed:", error);
//       return {
//         success: false,
//         message: error.response?.data?.message || "Failed to delete task",
//       };
//     }
//   },
// },


  // ==================== DOCUMENTS ====================
  documents: {
    getByWorkspace: async (workspaceId) => {
      const res = await apiClient.get(`/workspaces/${workspaceId}/documents`);
      return res.documents || [];
    },

    getById: async (documentId) => {
      const res = await apiClient.get(`/documents/${documentId}`);
      return res.document;
    },

    create: async (workspaceId, data) =>
      apiClient.post(`/workspaces/${workspaceId}/documents`, data),

    update: async (documentId, data) =>
      apiClient.put(`/documents/${documentId}`, data),

    delete: async (documentId) =>
      apiClient.delete(`/documents/${documentId}`),
  },

  // ==================== CHAT ====================
  chat: {
    getMessages: async (workspaceId, limit = 50, offset = 0) => {
      const res = await apiClient.get(`/workspaces/${workspaceId}/messages`, {
        params: { limit, offset },
      });
      return res.messages || [];
    },

    sendMessage: async (workspaceId, data) =>
      apiClient.post(`/workspaces/${workspaceId}/messages`, data),

    deleteMessage: async (messageId) =>
      apiClient.delete(`/messages/${messageId}`),
  },

  // ==================== FILES ====================
  files: {
    getByWorkspace: async (workspaceId) => {
      const res = await apiClient.get(`/workspaces/${workspaceId}/files`);
      return res.files || [];
    },

    upload: async (workspaceId, formData, onUploadProgress) =>
      apiClient.post(`/workspaces/${workspaceId}/files/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (event) => {
          if (onUploadProgress) {
            const percent = Math.round((event.loaded * 100) / event.total);
            onUploadProgress(percent);
          }
        },
      }),

    download: async (fileId) =>
      apiClient.get(`/files/${fileId}/download`, { responseType: "blob" }),

    delete: async (fileId) => apiClient.delete(`/files/${fileId}`),
  },

  // ==================== MEMBERS ====================
  members: {
    getByWorkspace: async (workspaceId) => {
      const res = await apiClient.get(`/workspaces/${workspaceId}/members`);
      return res.members || [];
    },

    invite: async (workspaceId, data) =>
      // ✅ Correct endpoint (backend uses /invite)
      apiClient.post(`/workspaces/${workspaceId}/invite`, data),

    updateRole: async (workspaceId, memberId, role) =>
      apiClient.patch(`/workspaces/${workspaceId}/members/${memberId}/role`, {
        role,
      }),

    remove: async (workspaceId, memberId) =>
      apiClient.delete(`/workspaces/${workspaceId}/members/${memberId}`),
  },

  // ==================== NOTIFICATIONS ====================
  notifications: {
    getAll: async () => {
      const res = await apiClient.get("/notifications");
      return res.notifications || [];
    },

    markAsRead: async (notificationId) =>
      apiClient.patch(`/notifications/${notificationId}/read`),

    markAllAsRead: async () =>
      apiClient.patch("/notifications/read-all"),

    delete: async (notificationId) =>
      apiClient.delete(`/notifications/${notificationId}`),
  },
};

export default api;


