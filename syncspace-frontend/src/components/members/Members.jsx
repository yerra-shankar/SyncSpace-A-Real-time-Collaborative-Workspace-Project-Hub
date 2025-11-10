
// Members.jsx

import React, { useState, useEffect } from 'react';
import MemberCard from './MemberCard';
import InviteMemberModal from '../../components/modals/InviteMemberModal';
import { UserPlus, Search, Filter, Users } from 'lucide-react';
import api from '../../services/api';
import { toast } from 'react-toastify';
import { useApp } from '../../context/AppContext';
import '../../styles/App.css';

function Members({ workspaceId }) {
  const { user } = useApp();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('all');

  useEffect(() => {
    loadMembers();
  }, [workspaceId]);

  const loadMembers = async () => {
    setLoading(true);
    try {
      // ✅ Fetch data properly
      const response = await api.members.getByWorkspace(workspaceId);
      if (response && response.members) {
        // ✅ Map to frontend-friendly structure
        const formatted = response.members.map(m => ({
          id: m.userId._id,
          name: m.userId.name,
          email: m.userId.email,
          avatar: m.userId.avatar,
          role: m.role,
          status: m.userId.isActive ? 'online' : 'offline'
        }));
        setMembers(formatted);
      } else {
        setMembers([]);
      }
    } catch (error) {
      console.error('Error loading members:', error);
      toast.error('Failed to load members');
    } finally {
      setLoading(false);
    }
  };

  const handleInviteMember = () => setShowInviteModal(true);
  const handleMemberInvited = () => {
    loadMembers();
    setShowInviteModal(false);
  };

  const handleRemoveMember = async (memberId) => {
    if (!window.confirm('Are you sure you want to remove this member?')) return;

    try {
      await api.members.remove(workspaceId, memberId);
      toast.success('Member removed successfully');
      setMembers(members.filter(m => m.id !== memberId));
    } catch (error) {
      console.error('Error removing member:', error);
      toast.error('Failed to remove member');
    }
  };

  const handleUpdateRole = async (memberId, newRole) => {
    try {
      await api.members.updateRole(workspaceId, memberId, newRole);
      toast.success('Role updated successfully');
      setMembers(members.map(m =>
        m.id === memberId ? { ...m, role: newRole } : m
      ));
    } catch (error) {
      console.error('Error updating role:', error);
      toast.error('Failed to update role');
    }
  };

  const filteredMembers = members.filter(member => {
    const matchesSearch =
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter =
      filterRole === 'all' || member.role.toLowerCase() === filterRole.toLowerCase();
    return matchesSearch && matchesFilter;
  });

  const onlineCount = members.filter(m => m.status === 'online').length;
  const isAdmin = user?.role === 'Admin' || user?.role === 'admin';

  if (loading) {
    return (
      <div className="members-loading-wrapper">
        <div className="members-spinner"></div>
        <p>Loading members...</p>
      </div>
    );
  }

  return (
    <div className="members-wrapper">
      <div className="container-fluid">
        {/* Header */}
        <div className="row mb-4">
          <div className="col-12">
            <div className="members-header-section">
              <div className="row align-items-center g-3">
                <div className="col-12 col-md-6">
                  <h2 className="members-title">Team Members</h2>
                  <div className="members-stats-row">
                    <div className="members-stat-item">
                      <Users size={16} />
                      <span>{members.length} members</span>
                    </div>
                    <div className="members-stat-divider">•</div>
                    <div className="members-stat-item">
                      <span className="members-online-dot"></span>
                      <span>{onlineCount} online</span>
                    </div>
                  </div>
                </div>

                {isAdmin && (
                  <div className="col-12 col-md-6">
                    <div className="members-actions-row">
                      <button
                        onClick={handleInviteMember}
                        className="members-invite-btn"
                      >
                        <UserPlus size={20} />
                        <span className="d-none d-sm-inline">Invite Member</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="row mb-4">
          <div className="col-12">
            <div className="members-toolbar">
              <div className="row g-3">
                <div className="col-12 col-md-6 col-lg-8">
                  <div className="members-search-wrapper">
                    <Search size={18} className="members-search-icon" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search members..."
                      className="members-search-input"
                    />
                  </div>
                </div>

                <div className="col-12 col-md-6 col-lg-4">
                  <div className="members-filter-wrapper">
                    <Filter size={18} />
                    <select
                      value={filterRole}
                      onChange={(e) => setFilterRole(e.target.value)}
                      className="members-filter-select"
                    >
                      <option value="all">All Roles</option>
                      <option value="admin">Admin</option>
                      <option value="member">Member</option>
                      <option value="viewer">Viewer</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Members List */}
        <div className="row">
          <div className="col-12">
            {filteredMembers.length === 0 ? (
              <div className="members-empty-state">
                <Users size={48} />
                <h3>No members found</h3>
                <p>
                  {searchQuery || filterRole !== 'all'
                    ? 'Try adjusting your search or filters'
                    : 'Invite members to get started'}
                </p>
                {isAdmin && (
                  <button
                    onClick={handleInviteMember}
                    className="members-invite-btn"
                  >
                    <UserPlus size={20} />
                    Invite Member
                  </button>
                )}
              </div>
            ) : (
              <div className="members-list-container">
                {filteredMembers.map((member) => (
                  <MemberCard
                    key={member.id}
                    member={member}
                    isAdmin={isAdmin}
                    currentUserId={user?._id}
                    onRemove={() => handleRemoveMember(member.id)}
                    onUpdateRole={(role) => handleUpdateRole(member.id, role)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <InviteMemberModal
          workspaceId={workspaceId}
          onClose={() => setShowInviteModal(false)}
          onInvite={handleMemberInvited}
        />
      )}
    </div>
  );
}

export default Members;
