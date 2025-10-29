import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Context
import { useApp } from './context/AppContext';

// Auth Components
import Login from './components/auth/Login';
import Register from './components/auth/Register';

// Dashboard Components
import Dashboard from './components/dashboard/Dashboard';

// Workspace Components
import WorkspaceView from './components/workspace/WorkspaceView';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user } = useApp();
  return user ? children : <Navigate to="/login" replace />;
};

// Public Route Component (redirect if already logged in)
const PublicRoute = ({ children }) => {
  const { user } = useApp();
  return !user ? children : <Navigate to="/dashboard" replace />;
};

function App() {
  const { theme } = useApp();

  useEffect(() => {
    // Apply theme to body
    document.body.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <Router>
      <div className="app-container">
        <Routes>
          {/* Public Routes */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicRoute>
                <Register />
              </PublicRoute>
            }
          />

          {/* Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/workspace/:workspaceId"
            element={
              <ProtectedRoute>
                <WorkspaceView />
              </ProtectedRoute>
            }
          />

          {/* Default Route */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* 404 Route */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>

        {/* Toast Notifications */}
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={true}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme={theme === 'dark' ? 'dark' : 'light'}
        />
      </div>
    </Router>
  );
}

export default App;


