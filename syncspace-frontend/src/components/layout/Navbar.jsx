import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@context/AppContext';
import {
  Search,
  Bell,
  LogOut,
  Settings,
  User,
  Moon,
  Sun,
  Menu,
  X
} from 'lucide-react';
import '../../styles/App.css';

function Navbar({ onMenuToggle, isSidebarOpen }) {
  const navigate = useNavigate();
  const { user, logout, notifications, markNotificationAsRead, markAllNotificationsAsRead, theme, toggleTheme } = useApp();
  
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const notificationRef = useRef(null);
  const userMenuRef = useRef(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      markNotificationAsRead(notification.id);
    }
    setShowNotifications(false);
    // Navigate to relevant page based on notification type
    if (notification.link) {
      navigate(notification.link);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Implement search functionality
      console.log('Searching for:', searchQuery);
    }
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <nav className="navbar-container">
      <div className="navbar-content">
        {/* Left Section - Logo & Menu Toggle */}
        <div className="navbar-left-section">
          {onMenuToggle && (
            <button
              onClick={onMenuToggle}
              className="navbar-menu-toggle"
              aria-label="Toggle menu"
            >
              {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          )}
          
          <div className="navbar-brand-section">
            <h1 className="navbar-brand-logo">SyncSpace</h1>
          </div>
        </div>

        {/* Center Section - Search */}
        <div className="navbar-center-section">
          <form onSubmit={handleSearch} className="navbar-search-form">
            <Search size={18} className="navbar-search-icon" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search workspaces, projects, tasks..."
              className="navbar-search-input"
            />
          </form>
        </div>

        {/* Right Section - Actions */}
        <div className="navbar-right-section">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="navbar-icon-button"
            aria-label="Toggle theme"
          >
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>

          {/* Notifications */}
          <div className="navbar-dropdown-wrapper" ref={notificationRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="navbar-icon-button navbar-notification-button"
              aria-label="Notifications"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="navbar-notification-badge">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="navbar-dropdown-menu navbar-notifications-dropdown">
                <div className="navbar-dropdown-header">
                  <h3 className="navbar-dropdown-title">Notifications</h3>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllNotificationsAsRead}
                      className="navbar-link-small"
                    >
                      Mark all as read
                    </button>
                  )}
                </div>

                <div className="navbar-dropdown-content">
                  {notifications.length === 0 ? (
                    <div className="navbar-empty-state">
                      <Bell size={32} />
                      <p>No notifications</p>
                    </div>
                  ) : (
                    notifications.map((notification) => (
                      <div
                        key={notification.id}
                        onClick={() => handleNotificationClick(notification)}
                        className={`navbar-notification-item ${!notification.read ? 'navbar-notification-unread' : ''}`}
                      >
                        <div className="navbar-notification-icon">
                          <Bell size={16} />
                        </div>
                        <div className="navbar-notification-content">
                          <p className="navbar-notification-message">
                            {notification.message}
                          </p>
                          <span className="navbar-notification-time">
                            {notification.time}
                          </span>
                        </div>
                        {!notification.read && (
                          <div className="navbar-notification-dot"></div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Menu */}
          <div className="navbar-dropdown-wrapper" ref={userMenuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="navbar-user-button"
            >
              <div className="navbar-user-avatar">
                {getInitials(user?.name)}
              </div>
              <span className="navbar-user-name">{user?.name}</span>
            </button>

            {showUserMenu && (
              <div className="navbar-dropdown-menu navbar-user-dropdown">
                <div className="navbar-user-info-section">
                  <div className="navbar-user-avatar-large">
                    {getInitials(user?.name)}
                  </div>
                  <div className="navbar-user-details">
                    <p className="navbar-user-detail-name">{user?.name}</p>
                    <p className="navbar-user-detail-email">{user?.email}</p>
                    <span className="navbar-user-role-badge">{user?.role}</span>
                  </div>
                </div>

                <div className="navbar-dropdown-divider"></div>

                <div className="navbar-dropdown-content">
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      navigate('/profile');
                    }}
                    className="navbar-dropdown-item"
                  >
                    <User size={18} />
                    <span>My Profile</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      navigate('/settings');
                    }}
                    className="navbar-dropdown-item"
                  >
                    <Settings size={18} />
                    <span>Settings</span>
                  </button>

                  <div className="navbar-dropdown-divider"></div>

                  <button
                    onClick={handleLogout}
                    className="navbar-dropdown-item navbar-dropdown-item-danger"
                  >
                    <LogOut size={18} />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;