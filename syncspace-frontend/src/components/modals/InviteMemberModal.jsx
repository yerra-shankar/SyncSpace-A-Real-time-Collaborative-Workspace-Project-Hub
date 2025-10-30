import React, { useState } from 'react';
import { X, UserPlus, Mail } from 'lucide-react';
import api from '../../services/api';
import { toast } from 'react-toastify';
import '../../styles/App.css';

function InviteMemberModal({ workspaceId, onClose, onInvite }) {
  const [formData, setFormData] = useState({
    email: '',
    role: 'Member'
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
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
    try {
      await api.members.invite(workspaceId, formData);
      toast.success('Invitation sent successfully!');
      onInvite();
    } catch (error) {
      console.error('Error inviting member:', error);
      toast.error('Failed to send invitation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay-wrapper" onClick={onClose}>
      <div className="modal-content-container" onClick={(e) => e.stopPropagation()}>
        <div className="container-fluid">
          {/* Modal Header */}
          <div className="row">
            <div className="col-12">
              <div className="modal-header-section">
                <div className="modal-header-icon">
                  <UserPlus size={24} />
                </div>
                <h3 className="modal-header-title">Invite Team Member</h3>
                <button onClick={onClose} className="modal-close-btn" aria-label="Close">
                  <X size={20} />
                </button>
              </div>
            </div>
          </div>

          {/* Modal Body */}
          <form onSubmit={handleSubmit}>
            <div className="row">
              <div className="col-12">
                <div className="modal-body-section">
                  <div className="row g-3">
                    {/* Email Address */}
                    <div className="col-12">
                      <div className="modal-form-group">
                        <label htmlFor="email" className="modal-form-label">
                          <Mail size={16} />
                          Email Address <span className="modal-form-required">*</span>
                        </label>
                        <input
                          id="email"
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleChange}
                          placeholder="member@example.com"
                          className={`modal-form-input ${errors.email ? 'modal-form-input-error' : ''}`}
                          disabled={loading}
                        />
                        {errors.email && (
                          <span className="modal-form-error-text">{errors.email}</span>
                        )}
                      </div>
                    </div>

                    {/* Role */}
                    <div className="col-12">
                      <div className="modal-form-group">
                        <label htmlFor="role" className="modal-form-label">
                          Role
                        </label>
                        <select
                          id="role"
                          name="role"
                          value={formData.role}
                          onChange={handleChange}
                          className="modal-form-select"
                          disabled={loading}
                        >
                          <option value="Admin">Admin</option>
                          <option value="Member">Member</option>
                          <option value="Viewer">Viewer</option>
                        </select>
                        <p className="modal-form-help-text">
                          {formData.role === 'Admin' && 'Can manage workspace settings and members'}
                          {formData.role === 'Member' && 'Can create and edit content'}
                          {formData.role === 'Viewer' && 'Can only view content'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="row">
              <div className="col-12">
                <div className="modal-footer-section">
                  <button
                    type="button"
                    onClick={onClose}
                    className="modal-btn-secondary"
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="modal-btn-primary"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="modal-btn-spinner"></span>
                        Sending...
                      </>
                    ) : (
                      'Send Invitation'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default InviteMemberModal;