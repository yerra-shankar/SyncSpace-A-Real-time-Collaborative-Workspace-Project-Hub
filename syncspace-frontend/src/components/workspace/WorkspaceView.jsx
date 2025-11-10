
// src/components/workspace/WorkspaceView.jsx

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import Navbar from '../../components/layout/Navbar';
import WorkspaceSidebar from './WorkspaceSidebar';
import KanbanBoard from '../../components/kanban/KanbanBoard';
import DocumentEditor from '../../components/documents/DocumentEditor';
import Chat from '../../components/chat/Chat';
import FileManager from '../../components/files/FileManager';
import Members from '../../components/members/Members';
import socketService from '../../socket/socket';
import '../../styles/App.css';

function WorkspaceView() {
  const { workspaceId } = useParams();
  const { selectedWorkspace, setSelectedWorkspace, workspaces } = useApp();
  const [activeTab, setActiveTab] = useState('kanban');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWorkspaceData();

    // Socket setup
    const socket = socketService.initialize();
    if (socket && workspaceId) {
      socketService.joinWorkspace(workspaceId);
    }

    return () => {
      if (socket && workspaceId) {
        socketService.leaveWorkspace(workspaceId);
      }
    };
  }, [workspaceId]);

  const loadWorkspaceData = async () => {
    setLoading(true);
    try {
      // Fix: don’t parse workspaceId — keep as string (MongoDB ObjectId)
      const workspace = workspaces.find(ws => ws.id === workspaceId || ws._id === workspaceId);
      if (workspace) {
        setSelectedWorkspace(workspace);
      } else {
        console.warn(`Workspace ${workspaceId} not found in context`);
      }
    } catch (error) {
      console.error('Error loading workspace:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab) => setActiveTab(tab);
  const handleSidebarToggle = () => setSidebarOpen(!sidebarOpen);

  if (loading) {
    return (
      <div className="workspace-loading-container">
        <div className="workspace-spinner"></div>
        <p>Loading workspace...</p>
      </div>
    );
  }

  if (!selectedWorkspace) {
    return (
      <div className="workspace-error-container">
        <h2>Workspace not found</h2>
        <p>The workspace you're looking for doesn't exist or you don't have access to it.</p>
      </div>
    );
  }

  return (
    <div className="workspace-view-container">
      <Navbar onMenuToggle={handleSidebarToggle} isSidebarOpen={sidebarOpen} />

      <div className="workspace-layout-wrapper">
        <WorkspaceSidebar
          workspace={selectedWorkspace}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          isOpen={sidebarOpen}
          onToggle={handleSidebarToggle}
        />

        <main className="workspace-main-content">
          <div className="workspace-content-container">
            {activeTab === 'kanban' && (
              <KanbanBoard workspaceId={workspaceId} />
            )}
            {activeTab === 'documents' && (
              <DocumentEditor workspaceId={workspaceId} />
            )}
            {activeTab === 'chat' && (
              <Chat workspaceId={workspaceId} />
            )}
            {activeTab === 'files' && (
              <FileManager workspaceId={workspaceId} />
            )}
            {activeTab === 'members' && (
              <Members workspaceId={workspaceId} />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default WorkspaceView;
