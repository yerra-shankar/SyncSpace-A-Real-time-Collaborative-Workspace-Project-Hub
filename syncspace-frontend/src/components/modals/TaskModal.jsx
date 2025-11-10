

// syncspace-frontend/src/components/modals/TaskModal.jsx

import React, { useState, useEffect } from 'react';
import { X, CheckSquare, Calendar, User, Tag } from 'lucide-react';
import api from '../../services/api';
import { toast } from 'react-toastify';
import '../../styles/App.css';

function TaskModal({ task, onClose, onSave, projectId }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assignee: '',
    dueDate: '',
    priority: 'medium',
    status: 'todo'
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Populate form when editing
  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title || '',
        description: task.description || '',
        assignee: task.assignee?.name || '',
        dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
        priority: task.priority || 'medium',
        status: task.status || 'todo'
      });
    } else {
      setFormData({
        title: '',
        description: '',
        assignee: '',
        dueDate: '',
        priority: 'medium',
        status: 'todo'
      });
    }
  }, [task]);

  // -------------------- HANDLE INPUT --------------------
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  // -------------------- VALIDATION --------------------
  const validateForm = () => {
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = 'Task title is required';
    if (formData.dueDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (new Date(formData.dueDate) < today)
        newErrors.dueDate = 'Due date cannot be in the past';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // -------------------- SUBMIT --------------------
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    if (!projectId || projectId.length !== 24) {
      toast.error('❌ Invalid Project ID. Please reload workspace.');
      console.error('❌ TaskModal Error: Invalid or missing projectId ->', projectId);
      return;
    }

    const payload = {
      ...formData,
      assignee: formData.assignee?.trim() ? formData.assignee.trim() : null,
    };

    console.log("📦 Submitting Task for Project:", projectId, "| Payload:", payload);

    setLoading(true);
    try {
      if (task) {
        await api.tasks.update(task._id || task.id, payload);
        toast.success('✅ Task updated successfully');
      } else {
        const res = await api.tasks.create(projectId, payload);
        if (!res || res.success === false) {
          throw new Error(res?.message || 'Failed to create task');
        }
        toast.success('✅ Task created successfully');
      }

      if (onSave) onSave();
    } catch (error) {
      console.error('❌ Error saving task:', error);
      toast.error(error?.response?.data?.message || 'Failed to save task');
    } finally {
      setLoading(false);
    }
  };

  // -------------------- RENDER --------------------
  return (
    <div className="modal-overlay-wrapper" onClick={onClose}>
      <div
        className="modal-content-container modal-content-large"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="container-fluid">
          {/* Modal Header */}
          <div className="row">
            <div className="col-12">
              <div className="modal-header-section">
                <div className="modal-header-icon"><CheckSquare size={24} /></div>
                <h3 className="modal-header-title">
                  {task ? 'Edit Task' : 'Create New Task'}
                </h3>
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
                    {/* Title */}
                    <div className="col-12">
                      <div className="modal-form-group">
                        <label htmlFor="title" className="modal-form-label">
                          <CheckSquare size={16} /> Task Title <span className="modal-form-required">*</span>
                        </label>
                        <input
                          id="title"
                          name="title"
                          type="text"
                          value={formData.title}
                          onChange={handleChange}
                          placeholder="e.g., Design homepage mockup"
                          className={`modal-form-input ${errors.title ? 'modal-form-input-error' : ''}`}
                          disabled={loading}
                        />
                        {errors.title && <span className="modal-form-error-text">{errors.title}</span>}
                      </div>
                    </div>

                    {/* Description */}
                    <div className="col-12">
                      <div className="modal-form-group">
                        <label htmlFor="description" className="modal-form-label">Description</label>
                        <textarea
                          id="description"
                          name="description"
                          value={formData.description}
                          onChange={handleChange}
                          placeholder="Add task details..."
                          rows="4"
                          className="modal-form-textarea"
                          disabled={loading}
                        />
                      </div>
                    </div>

                    {/* Assignee & Due Date */}
                    <div className="col-12 col-md-6">
                      <div className="modal-form-group">
                        <label htmlFor="assignee" className="modal-form-label">
                          <User size={16} /> Assignee
                        </label>
                        <input
                          id="assignee"
                          name="assignee"
                          type="text"
                          value={formData.assignee}
                          onChange={handleChange}
                          placeholder="Assign to..."
                          className="modal-form-input"
                          disabled={loading}
                        />
                      </div>
                    </div>

                    <div className="col-12 col-md-6">
                      <div className="modal-form-group">
                        <label htmlFor="dueDate" className="modal-form-label">
                          <Calendar size={16} /> Due Date
                        </label>
                        <input
                          id="dueDate"
                          name="dueDate"
                          type="date"
                          value={formData.dueDate}
                          onChange={handleChange}
                          className={`modal-form-input ${errors.dueDate ? 'modal-form-input-error' : ''}`}
                          disabled={loading}
                        />
                        {errors.dueDate && <span className="modal-form-error-text">{errors.dueDate}</span>}
                      </div>
                    </div>

                    {/* Priority & Status */}
                    <div className="col-12 col-md-6">
                      <div className="modal-form-group">
                        <label htmlFor="priority" className="modal-form-label"><Tag size={16} /> Priority</label>
                        <select
                          id="priority"
                          name="priority"
                          value={formData.priority}
                          onChange={handleChange}
                          className="modal-form-select"
                          disabled={loading}
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                        </select>
                      </div>
                    </div>

                    <div className="col-12 col-md-6">
                      <div className="modal-form-group">
                        <label htmlFor="status" className="modal-form-label">Status</label>
                        <select
                          id="status"
                          name="status"
                          value={formData.status}
                          onChange={handleChange}
                          className="modal-form-select"
                          disabled={loading}
                        >
                          <option value="todo">To Do</option>
                          <option value="inProgress">In Progress</option>
                          <option value="done">Done</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="row">
              <div className="col-12">
                <div className="modal-footer-section">
                  <button type="button" onClick={onClose} className="modal-btn-secondary" disabled={loading}>Cancel</button>
                  <button type="submit" className="modal-btn-primary" disabled={loading}>
                    {loading ? (<><span className="modal-btn-spinner"></span> Saving...</>) : (task ? 'Update Task' : 'Create Task')}
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

export default TaskModal;
