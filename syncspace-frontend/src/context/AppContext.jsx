import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '@services/api';

const AppContext = createContext();

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};

export function AppProvider({ children }) {
  // State Management
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [workspaces, setWorkspaces] = useState([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [theme, setTheme] = useState('light');
  // UI view state for components that toggle views (login/register) without router  -->main
  const [currentView, setCurrentView] = useState('login');

  // Initialize app
  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      // Check for stored token
      const token = localStorage.getItem('syncspace_token');
      
      if (token) {
        // Validate token and fetch user data
        const response = await api.auth.validateToken();
        if (response.success) {
          setUser(response.user);
          await loadUserData();
        } else {
          localStorage.removeItem('syncspace_token');
        }
      }
    } catch (error) {
      console.error('App initialization error:', error);
      localStorage.removeItem('syncspace_token');
    } finally {
      setLoading(false);
    }
  };

  const loadUserData = async () => {
    try {
      // Load workspaces
      const workspacesData = await api.workspaces.getAll();
      setWorkspaces(workspacesData);

      // Load notifications
      const notificationsData = await api.notifications.getAll();
      setNotifications(notificationsData);
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  // Authentication Methods
  const login = async (email, password) => {
    try {
      const response = await api.auth.login(email, password);
      
      if (response.success) {
        localStorage.setItem('syncspace_token', response.token);
        setUser(response.user);
        await loadUserData();
        toast.success('Welcome back!');
        return { success: true };
      } else {
        toast.error(response.message || 'Login failed');
        return { success: false, error: response.message };
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Login failed. Please try again.';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const register = async (name, email, password) => {
    try {
      const response = await api.auth.register(name, email, password);
      
      if (response.success) {
        localStorage.setItem('syncspace_token', response.token);
        setUser(response.user);
        toast.success('Account created successfully!');
        return { success: true };
      } else {
        toast.error(response.message || 'Registration failed');
        return { success: false, error: response.message };
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Registration failed. Please try again.';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const logout = async () => {
    try {
      await api.auth.logout();
      localStorage.removeItem('syncspace_token');
      setUser(null);
      setWorkspaces([]);
      setSelectedWorkspace(null);
      setNotifications([]);
      toast.info('Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      // Clear local data anyway
      localStorage.removeItem('syncspace_token');
      setUser(null);
    }
  };

  // Workspace Methods
  const createWorkspace = async (workspaceData) => {
    try {
      const response = await api.workspaces.create(workspaceData);
      
      if (response.success) {
        setWorkspaces([...workspaces, response.workspace]);
        toast.success('Workspace created successfully!');
        return { success: true, workspace: response.workspace };
      }
    } catch (error) {
      toast.error('Failed to create workspace');
      return { success: false, error: error.message };
    }
  };

  const updateWorkspace = async (workspaceId, workspaceData) => {
    try {
      const response = await api.workspaces.update(workspaceId, workspaceData);
      
      if (response.success) {
        setWorkspaces(workspaces.map(ws => 
          ws.id === workspaceId ? response.workspace : ws
        ));
        toast.success('Workspace updated successfully!');
        return { success: true };
      }
    } catch (error) {
      toast.error('Failed to update workspace');
      return { success: false, error: error.message };
    }
  };

  const deleteWorkspace = async (workspaceId) => {
    try {
      const response = await api.workspaces.delete(workspaceId);
      
      if (response.success) {
        setWorkspaces(workspaces.filter(ws => ws.id !== workspaceId));
        if (selectedWorkspace?.id === workspaceId) {
          setSelectedWorkspace(null);
        }
        toast.success('Workspace deleted successfully!');
        return { success: true };
      }
    } catch (error) {
      toast.error('Failed to delete workspace');
      return { success: false, error: error.message };
    }
  };

  // Notification Methods
  const addNotification = (notification) => {
    setNotifications([notification, ...notifications]);
  };

  const markNotificationAsRead = async (notificationId) => {
    try {
      await api.notifications.markAsRead(notificationId);
      setNotifications(notifications.map(notif =>
        notif.id === notificationId ? { ...notif, read: true } : notif
      ));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllNotificationsAsRead = async () => {
    try {
      await api.notifications.markAllAsRead();
      setNotifications(notifications.map(notif => ({ ...notif, read: true })));
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  // Theme Methods
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('syncspace_theme', newTheme);
  };

  // Context Value
  const value = {
    // State
    user,
    loading,
    workspaces,
    selectedWorkspace,
    notifications,
    theme,
    currentView,
    setCurrentView,
    
    // Setters
    setUser,
    setWorkspaces,
    setSelectedWorkspace,
    setNotifications,
    setTheme,
    
    // Auth Methods
    login,
    register,
    logout,
    
    // Workspace Methods
    createWorkspace,
    updateWorkspace,
    deleteWorkspace,
    
    // Notification Methods
    addNotification,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    clearNotifications,
    
    // Theme Methods
    toggleTheme,
  };

  if (loading) {
    return (
      <div className="spinner-container">
        <div className="spinner"></div>
      </div>
    );
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}