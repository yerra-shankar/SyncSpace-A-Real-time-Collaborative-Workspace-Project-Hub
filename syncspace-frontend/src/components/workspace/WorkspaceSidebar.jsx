import React from 'react';
import {
  CheckSquare,
  FileText,
  MessageSquare,
  Folder,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import '../../styles/App.css';

function WorkspaceSidebar({ workspace, activeTab, onTabChange, isOpen, onToggle }) {
  const navigationItems = [
    { id: 'kanban', label: 'Kanban Board', icon: <CheckSquare size={20} /> },
    { id: 'documents', label: 'Documents', icon: <FileText size={20} /> },
    { id: 'chat', label: 'Chat', icon: <MessageSquare size={20} /> },
    { id: 'files', label: 'Files', icon: <Folder size={20} /> },
    { id: 'members', label: 'Members', icon: <Users size={20} /> },
  ];

  return (
    <aside className={`workspace-sidebar-container ${isOpen ? 'workspace-sidebar-open' : 'workspace-sidebar-closed'}`}>
      {isOpen && (
        <>
          <div className="workspace-sidebar-header">
            <div className="workspace-sidebar-title-section">
              <h2 className="workspace-sidebar-title">{workspace.name}</h2>
              <p className="workspace-sidebar-subtitle">
                {workspace.description || 'No description'}
              </p>
            </div>
          </div>

          <nav className="workspace-sidebar-nav">
            {navigationItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`workspace-sidebar-nav-item ${activeTab === item.id ? 'workspace-sidebar-nav-item-active' : ''}`}
              >
                <span className="workspace-sidebar-nav-icon">{item.icon}</span>
                <span className="workspace-sidebar-nav-label">{item.label}</span>
              </button>
            ))}
          </nav>

          <div className="workspace-sidebar-footer">
            <button className="workspace-sidebar-settings-button">
              <Settings size={20} />
              <span>Workspace Settings</span>
            </button>
          </div>
        </>
      )}

      <button
        onClick={onToggle}
        className="workspace-sidebar-toggle-button"
        aria-label={isOpen ? 'Close sidebar' : 'Open sidebar'}
      >
        {isOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
      </button>
    </aside>
  );
}

export default WorkspaceSidebar;