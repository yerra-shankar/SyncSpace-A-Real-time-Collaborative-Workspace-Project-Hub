


import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { AlertCircle } from 'react-feather';
import '../../styles/App.css';

function Login() {
  const navigate = useNavigate();
  const { login } = useApp();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
    if (serverError) {
      setServerError('');
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setServerError('');

    try {
      const result = await login(formData.email, formData.password);
      
      if (result.success) {
        navigate('/dashboard');
      } else {
        setServerError(result.error || 'Login failed. Please try again.');
      }
    } catch (error) {
      setServerError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-container">
      <div className="auth-background-wrapper">
        <div className="auth-floating-shape auth-shape-1"></div>
        <div className="auth-floating-shape auth-shape-2"></div>
        <div className="auth-floating-shape auth-shape-3"></div>
      </div>

      <div className="auth-card-wrapper">
        <div className="auth-card-content">
          <div className="auth-header-section">
            <h1 className="auth-logo-text">SyncSpace</h1>
            <p className="auth-subtitle-text">Welcome back! Sign in to continue</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form-container">
            {serverError && (
              <div className="auth-error-message">
                <AlertCircle size={16} />
                <span>{serverError}</span>
              </div>
            )}

            <div className="form-field-group">
              <label htmlFor="email" className="form-field-label">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="john@example.com"
                className={`form-input-field ${errors.email ? 'form-input-error' : ''}`}
                disabled={loading}
              />
              {errors.email && (
                <span className="form-error-text">{errors.email}</span>
              )}
            </div>

            <div className="form-field-group">
              <label htmlFor="password" className="form-field-label">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className={`form-input-field ${errors.password ? 'form-input-error' : ''}`}
                disabled={loading}
              />
              {errors.password && (
                <span className="form-error-text">{errors.password}</span>
              )}
            </div>

            <button
              type="submit"
              className="btn-primary-auth"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="btn-spinner"></span>
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="auth-footer-section">
            <Link to="/forgot-password" className="auth-link-button">
              Forgot password?
            </Link>
            <div className="auth-footer-divider">
              <span>Don't have an account?</span>
              <Link to="/register" className="auth-link-button auth-link-primary">
                Sign up
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;