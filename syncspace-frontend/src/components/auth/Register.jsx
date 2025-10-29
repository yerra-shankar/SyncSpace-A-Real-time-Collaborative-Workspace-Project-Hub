import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { AlertCircle, CheckCircle } from 'lucide-react';
import '../../styles/App.css';

function Register() {
  const navigate = useNavigate();
  const { register } = useApp();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
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

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password must contain uppercase, lowercase, and number';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
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
      const result = await register(formData.name, formData.email, formData.password);
      
      if (result.success) {
        navigate('/dashboard');
      } else {
        setServerError(result.error || 'Registration failed. Please try again.');
      }
    } catch (error) {
      setServerError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrength = () => {
    const password = formData.password;
    if (!password) return { strength: 0, label: '', color: '' };

    let strength = 0;
    if (password.length >= 6) strength++;
    if (password.length >= 10) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;

    if (strength <= 2) return { strength: 33, label: 'Weak', color: '#ef4444' };
    if (strength <= 3) return { strength: 66, label: 'Medium', color: '#f59e0b' };
    return { strength: 100, label: 'Strong', color: '#10b981' };
  };

  const passwordStrength = getPasswordStrength();

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
                    <p className="auth-subtitle-text mb-0">Create your account to get started</p>
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

                {/* Name Field */}
                <div className="row">
                  <div className="col-12">
                    <div className="form-field-group mb-3">
                      <label htmlFor="name" className="form-field-label mb-2">
                        Full Name
                      </label>
                      <input
                        id="name"
                        name="name"
                        type="text"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="John Doe"
                        className={`form-input-field ${errors.name ? 'form-input-error' : ''}`}
                        disabled={loading}
                      />
                      {errors.name && (
                        <span className="form-error-text d-block mt-1">{errors.name}</span>
                      )}
                    </div>
                  </div>
                </div>

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
                    <div className="form-field-group mb-3">
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
                      {formData.password && (
                        <div className="password-strength-container mt-2">
                          <div className="password-strength-bar">
                            <div
                              className="password-strength-fill"
                              style={{
                                width: `${passwordStrength.strength}%`,
                                backgroundColor: passwordStrength.color
                              }}
                            ></div>
                          </div>
                          <span
                            className="password-strength-label d-block mt-1"
                            style={{ color: passwordStrength.color }}
                          >
                            {passwordStrength.label}
                          </span>
                        </div>
                      )}
                      {errors.password && (
                        <span className="form-error-text d-block mt-1">{errors.password}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Confirm Password Field */}
                <div className="row">
                  <div className="col-12">
                    <div className="form-field-group mb-4">
                      <label htmlFor="confirmPassword" className="form-field-label mb-2">
                        Confirm Password
                      </label>
                      <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        placeholder="••••••••"
                        className={`form-input-field ${errors.confirmPassword ? 'form-input-error' : ''}`}
                        disabled={loading}
                      />
                      {!errors.confirmPassword && formData.confirmPassword && formData.password === formData.confirmPassword && (
                        <span className="form-success-text d-flex align-items-center mt-1">
                          <CheckCircle size={14} />
                          <span className="ms-1">Passwords match</span>
                        </span>
                      )}
                      {errors.confirmPassword && (
                        <span className="form-error-text d-block mt-1">{errors.confirmPassword}</span>
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
                          <span className="ms-2">Creating account...</span>
                        </>
                      ) : (
                        'Create Account'
                      )}
                    </button>
                  </div>
                </div>
              </form>

              {/* Footer */}
              <div className="auth-footer-section">
                <div className="row">
                  <div className="col-12">
                    <div className="auth-footer-divider text-center">
                      <span className="d-block d-sm-inline mb-2 mb-sm-0">Already have an account?</span>
                      <Link to="/login" className="auth-link-button auth-link-primary ms-sm-2">
                        Sign in
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

export default Register;