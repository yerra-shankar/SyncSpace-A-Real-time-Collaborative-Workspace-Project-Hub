import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import Navbar from '../../components/layout/Navbar';
import StatsCard from './StatsCard';
import WorkspaceCard from './WorkspaceCard';
import CreateWorkspaceModal from '../../components/modals/CreateWorkspaceModal';
import {
  Plus,
  Folder,
  CheckSquare,
  Users,
  FileText,
  TrendingUp,
  Clock
} from 'lucide-react';
import '../../styles/App.css';

function Dashboard() {
  const navigate = useNavigate();
  const { user, workspaces, setSelectedWorkspace } = useApp();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    activeWorkspaces: 0,
    tasksCompleted: 0,
    teamMembers: 0,
    documents: 0,
    recentActivity: [],
  });

  useEffect(() => {
    loadDashboardData();
  }, [workspaces]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Calculate stats from workspaces
      const activeWorkspaces = workspaces.length;
      const totalMembers = workspaces.reduce((sum, ws) => sum + (ws.members || 0), 0);
      const totalProjects = workspaces.reduce((sum, ws) => sum + (ws.projects || 0), 0);
      
      setStats({
        activeWorkspaces,
        tasksCompleted: 24, // This would come from API
        teamMembers: totalMembers,
        documents: 48, // This would come from API
        recentActivity: [
          { id: 1, action: 'Task completed', workspace: 'Product Team', time: '2 hours ago' },
          { id: 2, action: 'New member added', workspace: 'Marketing', time: '4 hours ago' },
          { id: 3, action: 'Document updated', workspace: 'Product Team', time: '5 hours ago' },
        ],
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleWorkspaceClick = (workspace) => {
    setSelectedWorkspace(workspace);
    navigate(`/workspace/${workspace.id}`);
  };

  const handleCreateWorkspace = () => {
    setShowCreateModal(true);
  };

  return (
    <div className="dashboard-page-container">
      <Navbar />

      <div className="dashboard-main-content">
        <div className="dashboard-content-wrapper">
          {/* Header Section */}
          <div className="dashboard-header-section">
            <div className="dashboard-header-text">
              <h1 className="dashboard-page-title">
                Welcome back, {user?.name?.split(' ')[0] || 'User'}! 👋
              </h1>
              <p className="dashboard-page-subtitle">
                Here's what's happening with your projects today
              </p>
            </div>
            <button
              onClick={handleCreateWorkspace}
              className="dashboard-create-button"
            >
              <Plus size={20} />
              <span>New Workspace</span>
            </button>
          </div>

          {/* Stats Grid */}
          <div className="dashboard-stats-grid">
            <StatsCard
              icon={<Folder size={24} />}
              label="Active Workspaces"
              value={stats.activeWorkspaces}
              color="blue"
              trend="+12%"
              trendUp={true}
            />
            <StatsCard
              icon={<CheckSquare size={24} />}
              label="Tasks Completed"
              value={stats.tasksCompleted}
              color="green"
              trend="+8%"
              trendUp={true}
            />
            <StatsCard
              icon={<Users size={24} />}
              label="Team Members"
              value={stats.teamMembers}
              color="purple"
              trend="+3"
              trendUp={true}
            />
            <StatsCard
              icon={<FileText size={24} />}
              label="Documents"
              value={stats.documents}
              color="orange"
              trend="+15%"
              trendUp={true}
            />
          </div>

          {/* Main Content Grid */}
          <div className="dashboard-content-grid">
            {/* Workspaces Section */}
            <div className="dashboard-section-container">
              <div className="dashboard-section-header">
                <h2 className="dashboard-section-title">Your Workspaces</h2>
                <span className="dashboard-section-count">
                  {workspaces.length} {workspaces.length === 1 ? 'workspace' : 'workspaces'}
                </span>
              </div>

              {loading ? (
                <div className="dashboard-loading-state">
                  <div className="dashboard-skeleton-grid">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="dashboard-skeleton-card">
                        <div className="skeleton-line skeleton-line-title"></div>
                        <div className="skeleton-line skeleton-line-text"></div>
                        <div className="skeleton-line skeleton-line-text"></div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : workspaces.length === 0 ? (
                <div className="dashboard-empty-state">
                  <div className="dashboard-empty-icon">
                    <Folder size={48} />
                  </div>
                  <h3 className="dashboard-empty-title">No workspaces yet</h3>
                  <p className="dashboard-empty-text">
                    Create your first workspace to start collaborating with your team
                  </p>
                  <button
                    onClick={handleCreateWorkspace}
                    className="dashboard-empty-button"
                  >
                    <Plus size={20} />
                    Create Workspace
                  </button>
                </div>
              ) : (
                <div className="dashboard-workspaces-grid">
                  {workspaces.map((workspace) => (
                    <WorkspaceCard
                      key={workspace.id}
                      workspace={workspace}
                      onClick={() => handleWorkspaceClick(workspace)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Recent Activity Section */}
            <div className="dashboard-sidebar-container">
              <div className="dashboard-activity-section">
                <div className="dashboard-section-header">
                  <h3 className="dashboard-section-title">Recent Activity</h3>
                  <Clock size={18} />
                </div>

                <div className="dashboard-activity-list">
                  {stats.recentActivity.map((activity) => (
                    <div key={activity.id} className="dashboard-activity-item">
                      <div className="dashboard-activity-dot"></div>
                      <div className="dashboard-activity-content">
                        <p className="dashboard-activity-action">
                          {activity.action}
                        </p>
                        <p className="dashboard-activity-workspace">
                          {activity.workspace}
                        </p>
                        <span className="dashboard-activity-time">
                          {activity.time}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <button className="dashboard-activity-view-all">
                  View all activity
                </button>
              </div>

              {/* Quick Stats */}
              <div className="dashboard-quick-stats">
                <h3 className="dashboard-section-title">Quick Stats</h3>
                
                <div className="dashboard-stat-item">
                  <div className="dashboard-stat-label">
                    <TrendingUp size={16} />
                    <span>Productivity</span>
                  </div>
                  <div className="dashboard-progress-bar">
                    <div
                      className="dashboard-progress-fill dashboard-progress-green"
                      style={{ width: '75%' }}
                    ></div>
                  </div>
                  <span className="dashboard-stat-value">75%</span>
                </div>

                <div className="dashboard-stat-item">
                  <div className="dashboard-stat-label">
                    <CheckSquare size={16} />
                    <span>Tasks Done</span>
                  </div>
                  <div className="dashboard-progress-bar">
                    <div
                      className="dashboard-progress-fill dashboard-progress-blue"
                      style={{ width: '60%' }}
                    ></div>
                  </div>
                  <span className="dashboard-stat-value">60%</span>
                </div>

                <div className="dashboard-stat-item">
                  <div className="dashboard-stat-label">
                    <Users size={16} />
                    <span>Collaboration</span>
                  </div>
                  <div className="dashboard-progress-bar">
                    <div
                      className="dashboard-progress-fill dashboard-progress-purple"
                      style={{ width: '85%' }}
                    ></div>
                  </div>
                  <span className="dashboard-stat-value">85%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Create Workspace Modal */}
      {showCreateModal && (
        <CreateWorkspaceModal onClose={() => setShowCreateModal(false)} />
      )}
    </div>
  );
}

export default Dashboard;