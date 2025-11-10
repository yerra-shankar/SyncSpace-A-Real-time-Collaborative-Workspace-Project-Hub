// TaskCard.jsx

import React, { useState } from 'react';
import { Calendar, MoreVertical, Edit, Trash2, User } from 'lucide-react';
import { format } from 'date-fns';
import '../../styles/App.css';

function TaskCard({ task, onEdit, isDragging }) {
  const [showMenu, setShowMenu] = useState(false);

  const handleMenuClick = (e) => {
    e.stopPropagation();
    setShowMenu(!showMenu);
  };

  const handleEdit = (e) => {
    e.stopPropagation();
    setShowMenu(false);
    onEdit(task);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    setShowMenu(false);
    // Handle delete
    console.log('Delete task:', task.id);
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'task-priority-high';
      case 'medium':
        return 'task-priority-medium';
      case 'low':
        return 'task-priority-low';
      default:
        return 'task-priority-medium';
    }
  };

  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), 'MMM dd');
    } catch (error) {
      return dateString;
    }
  };

  return (
    <div className={`task-card-wrapper ${isDragging ? 'task-card-dragging' : ''}`}>
      <div className="task-card-header-row">
        <div className={`task-priority-indicator ${getPriorityColor(task.priority)}`}></div>
        <div className="task-card-menu-container">
          <button
            onClick={handleMenuClick}
            className="task-card-menu-btn"
            aria-label="Task options"
          >
            <MoreVertical size={16} />
          </button>

          {showMenu && (
            <div className="task-card-dropdown-menu">
              <button onClick={handleEdit} className="task-card-dropdown-item">
                <Edit size={14} />
                <span>Edit</span>
              </button>
              <div className="task-card-dropdown-divider"></div>
              <button onClick={handleDelete} className="task-card-dropdown-item task-card-dropdown-item-danger">
                <Trash2 size={14} />
                <span>Delete</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <h4 className="task-card-title-text">{task.title}</h4>
      <p className="task-card-description-text">{task.description}</p>

      <div className="task-card-footer-row">
        <div className="task-card-assignee-section">
          <div className="task-card-avatar-small">
            {task.assignee ? task.assignee.charAt(0).toUpperCase() : 'U'}
          </div>
          <span className="task-card-assignee-name d-none d-sm-inline">
            {task.assignee || 'Unassigned'}
          </span>
        </div>

        {task.dueDate && (
          <div className="task-card-due-date-section">
            <Calendar size={14} />
            <span className="task-card-due-date-text">
              {formatDate(task.dueDate)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default TaskCard;