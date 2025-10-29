import React, { useState } from 'react';
import {
    MessageSquare,
    MoreVertical,
    Trash2,
    Shield,
    User,
    Eye,
    Mail,
    Phone
} from 'lucide-react';
import '../../styles/App.css';

function MemberCard({ member, isAdmin, currentUserId, onRemove, onUpdateRole }) {
    const [showMenu, setShowMenu] = useState(false);
    const [isChangingRole, setIsChangingRole] = useState(false);

    const isCurrentUser = member.id === currentUserId;

    const handleMenuClick = (e) => {
        e.stopPropagation();
        setShowMenu(!showMenu);
    };

    const handleChangeRole = async (newRole) => {
        setShowMenu(false);
        setIsChangingRole(true);
        await onUpdateRole(newRole);
        setIsChangingRole(false);
    };

    const handleRemove = () => {
        setShowMenu(false);
        onRemove();
    };

    const getRoleIcon = (role) => {
        switch (role.toLowerCase()) {
            case 'admin':
                return <Shield size={14} />;
            case 'member':
                return <User size={14} />;
            case 'viewer':
                return <Eye size={14} />;
            default:
                return <User size={14} />;
        }
    };

    const getRoleBadgeClass = (role) => {
        switch (role.toLowerCase()) {
            case 'admin':
                return 'member-role-badge-admin';
            case 'member':
                return 'member-role-badge-member';
            case 'viewer':
                return 'member-role-badge-viewer';
            default:
                return 'member-role-badge-member';
        }
    };

    return (
        <div className="member-card-wrapper">
            <div className="container-fluid">
                <div className="row align-items-center g-3">
                    {/* Avatar */}
                    <div className="col-auto">
                        <div className="member-card-avatar-container">
                            <div className="member-card-avatar-large">
                                {member.name?.charAt(0).toUpperCase() || 'U'}
                                <span className={`member-status-indicator member-status-${member.status}`}></span>
                            </div>
                        </div>
                    </div>

                    {/* Info */}
                    <div className="col">
                        <div className="member-card-info-section">
                            <div className="member-card-name-row">
                                <h4 className="member-card-name">
                                    {member.name}
                                    {isCurrentUser && (
                                        <span className="member-card-you-badge">You</span>
                                    )}
                                </h4>
                            </div>

                            <div className="member-card-contact-row">
                                <div className="member-card-contact-item">
                                    <Mail size={14} />
                                    <span className="d-none d-sm-inline">{member.email}</span>
                                </div>
                                {member.phone && (
                                    <>
                                        <span className="member-card-contact-divider d-none d-md-inline">•</span>
                                        <div className="member-card-contact-item d-none d-md-flex">
                                            <Phone size={14} />
                                            <span>{member.phone}</span>
                                        </div>
                                    </>
                                )}
                            </div>

                            <div className="member-card-role-row">
                                <span className={`member-role-badge ${getRoleBadgeClass(member.role)}`}>
                                    {getRoleIcon(member.role)}
                                    <span>{member.role}</span>
                                </span>

                                {member.joinedDate && (
                                    <span className="member-joined-text d-none d-lg-inline">
                                        Joined {member.joinedDate}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="col-auto">
                        <div className="member-card-actions-row">
                            <button
                                className="member-card-action-btn d-none d-sm-inline-flex"
                                aria-label="Send message"
                            >
                                <MessageSquare size={18} />
                            </button>

                            {isAdmin && !isCurrentUser && (
                                <div className="member-card-menu-wrapper">
                                    <button
                                        onClick={handleMenuClick}
                                        className="member-card-action-btn"
                                        aria-label="More options"
                                        disabled={isChangingRole}
                                    >
                                        <MoreVertical size={18} />
                                    </button>
                                    {showMenu && (
                                        <div className="member-card-dropdown-menu">
                                            <div className="member-card-dropdown-header">
                                                <span>Change Role</span>
                                            </div>

                                            <button
                                                onClick={() => handleChangeRole('Admin')}
                                                className={`member-card-dropdown-item ${member.role === 'Admin' ? 'member-card-dropdown-item-active' : ''}`}
                                                disabled={member.role === 'Admin'}
                                            >
                                                <Shield size={16} />
                                                <span>Admin</span>
                                            </button>

                                            <button
                                                onClick={() => handleChangeRole('Member')}
                                                className={`member-card-dropdown-item ${member.role === 'Member' ? 'member-card-dropdown-item-active' : ''}`}
                                                disabled={member.role === 'Member'}
                                            >
                                                <User size={16} />
                                                <span>Member</span>
                                            </button>

                                            <button
                                                onClick={() => handleChangeRole('Viewer')}
                                                className={`member-card-dropdown-item ${member.role === 'Viewer' ? 'member-card-dropdown-item-active' : ''}`}
                                                disabled={member.role === 'Viewer'}
                                            >
                                                <Eye size={16} />
                                                <span>Viewer</span>
                                            </button>

                                            <div className="member-card-dropdown-divider"></div>

                                            <button
                                                onClick={handleRemove}
                                                className="member-card-dropdown-item member-card-dropdown-item-danger"
                                            >
                                                <Trash2 size={16} />
                                                <span>Remove Member</span>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
export default MemberCard;