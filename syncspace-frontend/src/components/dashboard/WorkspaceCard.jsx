import React, { useState } from 'react';
import { Users, Folder, MoreVertical, Edit, Trash2, Settings } from 'lucide-react';
import '../../styles/App.css';

function WorkspaceCard({ workspace, onClick }) {
  const [showMenu, setShowMenu] = useState(false);

  const handleMenuClick = (e) => {
    e.stopPropagation();
    setShowMenu(!showMenu);
  };

  const handleEdit = (e) => {
    e.stopPropagation();
    setShowMenu(false);
    // Handle edit
    console.log('Edit workspace:', workspace.id);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    setShowMenu(false);
    // Handle delete
    console.log('Delete workspace:', workspace.id);
  };

  const handleSettings = (e) => {
    e.stopPropagation();
    setShowMenu(false);
    // Handle settings
    console.log('Workspace settings:', workspace.id);
  };

  return (
    <div className="workspace-card-container" onClick={onClick}>
      <div className="workspace-card-header">
        <div className="workspace-card-icon-wrapper">
          <div className="workspace-card-icon">
            <Folder size={24} />
          </div>
        </div>
        
        <div className="workspace-card-menu-wrapper">
          <button
            onClick={handleMenuClick}
            className="workspace-card-menu-button"
            aria-label="Workspace options"
          >
            <MoreVertical size={18} />
          </button>

          {showMenu && (
            <div className="workspace-card-dropdown">
              <button onClick={handleEdit} className="workspace-card-dropdown-item">
                <Edit size={16} />
                <span>Edit</span>
              </button>
              <button onClick={handleSettings} className="workspace-card-dropdown-item">
                <Settings size={16} />
                <span>Settings</span>
              </button>
              <div className="workspace-card-dropdown-divider"></div>
              <button onClick={handleDelete} className="workspace-card-dropdown-item workspace-card-dropdown-item-danger">
                <Trash2 size={16} />
                <span>Delete</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="workspace-card-body">
        <h3 className="workspace-card-title">{workspace.name}</h3>
        <p className="workspace-card-description">
          {workspace.description || 'No description provided'}
        </p>
      </div>

      <div className="workspace-card-footer">
        <div className="workspace-card-stat">
          <Users size={16} />
          <span>{workspace.members || 0} members</span>
        </div>
        <div className="workspace-card-stat">
          <Folder size={16} />
          <span>{workspace.projects || 0} projects</span>
        </div>
      </div>

      {workspace.progress !== undefined && (
        <div className="workspace-card-progress">
          <div className="workspace-card-progress-bar">
            <div
              className="workspace-card-progress-fill"
              style={{ width: `${workspace.progress}%` }}
            ></div>
          </div>
          <span className="workspace-card-progress-text">
            {workspace.progress}% complete
          </span>
        </div>
      )}
    </div>
  );
}

export default WorkspaceCard;