import React, { useState } from 'react';
import { X, Folder } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import '../../styles/App.css';

function CreateWorkspaceModal({ onClose }) {
  const { createWorkspace } = useApp();
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

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
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Workspace name is required';
    } else if (formData.name.trim().length < 3) {
      newErrors.name = 'Workspace name must be at least 3 characters';
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
      const result = await createWorkspace(formData);
      if (result.success) {
        onClose();
      }
    } catch (error) {
      console.error('Error creating workspace:', error);
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
                  <Folder size={24} />
                </div>
                <h3 className="modal-header-title">Create New Workspace</h3>
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
                    {/* Workspace Name */}
                    <div className="col-12">
                      <div className="modal-form-group">
                        <label htmlFor="name" className="modal-form-label">
                          Workspace Name <span className="modal-form-required">*</span>
                        </label>
                        <input
                          id="name"
                          name="name"
                          type="text"
                          value={formData.name}
                          onChange={handleChange}
                          placeholder="e.g., Product Team"
                          className={`modal-form-input ${errors.name ? 'modal-form-input-error' : ''}`}
                          disabled={loading}
                        />
                        {errors.name && (
                          <span className="modal-form-error-text">{errors.name}</span>
                        )}
                      </div>
                    </div>

                    {/* Description */}
                    <div className="col-12">
                      <div className="modal-form-group">
                        <label htmlFor="description" className="modal-form-label">
                          Description
                        </label>
                        <textarea
                          id="description"
                          name="description"
                          value={formData.description}
                          onChange={handleChange}
                          placeholder="What's this workspace for?"
                          rows="3"
                          className="modal-form-textarea"
                          disabled={loading}
                        />
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
                        Creating...
                      </>
                    ) : (
                      'Create Workspace'
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

export default CreateWorkspaceModal;
