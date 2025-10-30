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
      {/* Background Decorations */}
      <div className="auth-background-wrapper">
        <div className="auth-floating-shape auth-shape-1"></div>
        <div className="auth-floating-shape auth-shape-2"></div>
        <div className="auth-floating-shape auth-shape-3"></div>
      </div>

      {/* Main Content */}
      <div className="container">
        <div className="row justify-content-center align-items-center min-vh-100 py-4 py-md-5">
          <div className="col-12 col-sm-10 col-md-8 col-lg-6 col-xl-5 col-xxl-4">
            <div className="auth-card-content">
              {/* Header */}
              <div className="auth-header-section">
                <div className="row">
                  <div className="col-12 text-center">
                    <h1 className="auth-logo-text mb-2">SyncSpace</h1>
                    <p className="auth-subtitle-text mb-0">Welcome back! Sign in to continue</p>
                  </div>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="auth-form-container">
                {/* Server Error */}
                {serverError && (
                  <div className="row">
                    <div className="col-12">
                      <div className="auth-error-message mb-3">
                        <AlertCircle size={16} />
                        <span className="ms-2">{serverError}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Email Field */}
                <div className="row">
                  <div className="col-12">
                    <div className="form-field-group mb-3">
                      <label htmlFor="email" className="form-field-label mb-2">
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
                        <span className="form-error-text d-block mt-1">{errors.email}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Password Field */}
                <div className="row">
                  <div className="col-12">
                    <div className="form-field-group mb-4">
                      <label htmlFor="password" className="form-field-label mb-2">
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
                        <span className="form-error-text d-block mt-1">{errors.password}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="row">
                  <div className="col-12">
                    <button
                      type="submit"
                      className="btn-primary-auth w-100"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <span className="btn-spinner"></span>
                          <span className="ms-2">Signing in...</span>
                        </>
                      ) : (
                        'Sign In'
                      )}
                    </button>
                  </div>
                </div>
              </form>
              
              {/* Footer */}
              <div className="auth-footer-section">
                <div className="row">
                  <div className="col-12 text-center">
                    <Link to="/forgot-password" className="auth-link-button d-inline-block mb-3">
                      Forgot password?
                    </Link>
                  </div>
                </div>
                <div className="row">
                  <div className="col-12">
                    <div className="auth-footer-divider">
                      <span className="d-block d-sm-inline mb-2 mb-sm-0">Don't have an account?</span>
                      <Link to="/register" className="auth-link-button auth-link-primary ms-sm-2">
                        Sign up
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;