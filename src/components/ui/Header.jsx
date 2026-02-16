import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Icon from '../AppIcon';
import Button from './Button';
import { useAuth } from '../../contexts/AuthContext';
import { getUserMenuForRole } from '../../lib/permissions';
import { logAuthEvent, AUDIT_ACTIONS } from '../../lib/auditLog';
import { clockIn, clockOut, getActiveClockEntry } from '../../lib/clockTracker';
import {
  getNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllRead,
  notifyManagerOnClockOut,
  notifyAdmins,
  getManagerInfo
} from '../../lib/notifications';

const Header = ({ onMenuToggle, isSidebarOpen = false }) => {
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isHelpDropdownOpen, setIsHelpDropdownOpen] = useState(false);
  const [isNotifDropdownOpen, setIsNotifDropdownOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, userProfile, signOut } = useAuth();
  const userDropdownRef = useRef(null);
  const helpDropdownRef = useRef(null);

  // Clock state
  const [activeClockEntry, setActiveClockEntry] = useState(null);
  const [isClocking, setIsClocking] = useState(false);
  const [clockElapsed, setClockElapsed] = useState('');

  // Notification state
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const userRole = userProfile?.role || 'employee';
  const menuItems = getUserMenuForRole(userRole);

  // Load active clock entry on mount
  useEffect(() => {
    if (user?.id) {
      getActiveClockEntry(user.id).then(({ data }) => {
        if (data) setActiveClockEntry(data);
      });
    }
  }, [user?.id]);

  // Update elapsed time display every minute when clocked in
  useEffect(() => {
    if (!activeClockEntry) {
      setClockElapsed('');
      return;
    }

    const updateElapsed = () => {
      const start = new Date(activeClockEntry.clock_in);
      const now = new Date();
      const diffMs = now - start;
      const hours = Math.floor(diffMs / 3600000);
      const mins = Math.floor((diffMs % 3600000) / 60000);
      setClockElapsed(hours > 0 ? `${hours}h ${mins}m` : `${mins}m`);
    };

    updateElapsed();
    const interval = setInterval(updateElapsed, 60000);
    return () => clearInterval(interval);
  }, [activeClockEntry]);

  // Load notifications
  const loadNotifications = useCallback(async () => {
    if (!user?.id) return;
    const [notifResult, countResult] = await Promise.all([
      getNotifications(user.id, { limit: 10 }),
      getUnreadCount(user.id)
    ]);
    if (notifResult.data) setNotifications(notifResult.data);
    if (typeof countResult.count === 'number') setUnreadCount(countResult.count);
  }, [user?.id]);

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, [loadNotifications]);

  const handleUserDropdownToggle = () => {
    setIsUserDropdownOpen(!isUserDropdownOpen);
    setIsHelpDropdownOpen(false);
    setIsNotifDropdownOpen(false);
  };

  const handleHelpDropdownToggle = () => {
    setIsHelpDropdownOpen(!isHelpDropdownOpen);
    setIsUserDropdownOpen(false);
    setIsNotifDropdownOpen(false);
  };

  const handleNotifDropdownToggle = () => {
    setIsNotifDropdownOpen(!isNotifDropdownOpen);
    setIsUserDropdownOpen(false);
    setIsHelpDropdownOpen(false);
  };

  const handleDropdownClose = () => {
    setIsUserDropdownOpen(false);
    setIsHelpDropdownOpen(false);
    setIsNotifDropdownOpen(false);
  };

  // Close dropdowns on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') handleDropdownClose();
    };
    if (isUserDropdownOpen || isHelpDropdownOpen || isNotifDropdownOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isUserDropdownOpen, isHelpDropdownOpen, isNotifDropdownOpen]);

  const handleMenuItemClick = (path) => {
    navigate(path);
    handleDropdownClose();
  };

  const handleLogout = async () => {
    handleDropdownClose();
    await logAuthEvent(AUDIT_ACTIONS.LOGOUT, {
      id: user?.id,
      email: user?.email,
      role: userRole
    }, true, { logoutMethod: 'user_menu' });

    // Notify admins about logout
    await notifyAdmins(
      'logout',
      'User Logged Out',
      `${userProfile?.full_name || user?.email} has logged out.`,
      { userId: user?.id, userEmail: user?.email, role: userRole }
    );

    await signOut();
    navigate('/login', { replace: true });
  };

  // Clock In/Out handler
  const handleClockToggle = async () => {
    if (isClocking) return;
    setIsClocking(true);

    try {
      if (activeClockEntry) {
        // Clock Out
        const { data: updatedEntry, error } = await clockOut(activeClockEntry.id);
        if (error) {
          console.error('Clock out failed:', error);
          return;
        }

        // Notify manager via WhatsApp + in-app
        const { manager } = await getManagerInfo(user.id);
        if (manager) {
          await notifyManagerOnClockOut(
            { id: user.id, full_name: userProfile?.full_name },
            manager.id,
            updatedEntry
          );
        }

        // Notify admins
        const duration = updatedEntry.duration_minutes;
        const hours = Math.floor(duration / 60);
        const mins = duration % 60;
        const durationStr = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
        await notifyAdmins(
          'clock_out',
          'Employee Clocked Out',
          `${userProfile?.full_name} clocked out. Duration: ${durationStr}.`,
          { userId: user.id, clockEntryId: updatedEntry.id, durationMinutes: duration }
        );

        setActiveClockEntry(null);
      } else {
        // Clock In
        const { data: newEntry, error } = await clockIn(user.id);
        if (error) {
          console.error('Clock in failed:', error);
          return;
        }

        // Notify admins
        await notifyAdmins(
          'clock_in',
          'Employee Clocked In',
          `${userProfile?.full_name} has clocked in.`,
          { userId: user.id, clockEntryId: newEntry.id }
        );

        setActiveClockEntry(newEntry);
      }
    } finally {
      setIsClocking(false);
    }
  };

  const handleMarkNotifRead = async (notifId) => {
    await markNotificationRead(notifId);
    setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, is_read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const handleMarkAllRead = async () => {
    await markAllRead(user.id);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);
  };

  const getNotifIcon = (type) => {
    switch (type) {
      case 'clock_in': return 'LogIn';
      case 'clock_out': return 'LogOut';
      case 'login': return 'LogIn';
      case 'logout': return 'LogOut';
      default: return 'Bell';
    }
  };

  const formatTimeAgo = (timestamp) => {
    const diff = Date.now() - new Date(timestamp).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 h-16 bg-background border-b border-border z-40">
        <div className="flex items-center justify-between h-full px-4 lg:px-6">
          {/* Left Section - Mobile Menu & Logo */}
          <div className="flex items-center space-x-4">
            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={onMenuToggle}
              className="lg:hidden"
              aria-label="Toggle navigation menu"
            >
              <Icon name={isSidebarOpen ? "X" : "Menu"} size={20} />
            </Button>

            {/* Desktop Logo */}
            <div className="hidden lg:flex items-center space-x-3 ml-64">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Icon name="Zap" size={20} color="white" />
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-lg font-semibold text-foreground">San Synapse-CRM</span>
                <span className="px-2 py-0.5 text-xs font-medium bg-accent text-accent-foreground rounded-full">
                  v2.2
                </span>
              </div>
            </div>

            {/* Mobile Logo */}
            <div className="flex items-center space-x-3 lg:hidden">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Icon name="Zap" size={20} color="white" />
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-lg font-semibold text-foreground">San Synapse-CRM</span>
                <span className="px-2 py-0.5 text-xs font-medium bg-accent text-accent-foreground rounded-full">
                  v2.2
                </span>
              </div>
            </div>
          </div>

          {/* Right Section - Actions & User */}
          <div className="flex items-center space-x-2">
            {/* Clock In/Out Button */}
            <button
              onClick={handleClockToggle}
              disabled={isClocking}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-smooth ${
                activeClockEntry
                  ? 'bg-error/10 text-error hover:bg-error/20 border border-error/30'
                  : 'bg-success/10 text-success hover:bg-success/20 border border-success/30'
              } ${isClocking ? 'opacity-50 cursor-not-allowed' : ''}`}
              aria-label={activeClockEntry ? 'Clock Out' : 'Clock In'}
            >
              <Icon name={activeClockEntry ? 'TimerOff' : 'Timer'} size={16} />
              <span className="hidden sm:inline">
                {isClocking
                  ? 'Processing...'
                  : activeClockEntry
                    ? `Clock Out${clockElapsed ? ` (${clockElapsed})` : ''}`
                    : 'Clock In'}
              </span>
            </button>

            {/* Help Dropdown */}
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleHelpDropdownToggle}
                className="relative"
                aria-label="Help and support"
              >
                <Icon name="HelpCircle" size={20} />
              </Button>

              {isHelpDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-50"
                    onClick={handleDropdownClose}
                  />
                  <div className="absolute right-0 mt-2 w-56 bg-popover border border-border rounded-lg shadow-elevation-2 z-60">
                    <div className="py-1">
                      <button
                        onClick={() => console.log('Documentation clicked')}
                        className="flex items-center w-full px-4 py-2 text-sm text-popover-foreground hover:bg-muted transition-smooth"
                      >
                        <Icon name="Book" size={16} className="mr-3" />
                        Documentation
                      </button>
                      <button
                        onClick={() => console.log('Keyboard shortcuts clicked')}
                        className="flex items-center w-full px-4 py-2 text-sm text-popover-foreground hover:bg-muted transition-smooth"
                      >
                        <Icon name="Keyboard" size={16} className="mr-3" />
                        Keyboard Shortcuts
                      </button>
                      <button
                        onClick={() => console.log('Contact support clicked')}
                        className="flex items-center w-full px-4 py-2 text-sm text-popover-foreground hover:bg-muted transition-smooth"
                      >
                        <Icon name="MessageCircle" size={16} className="mr-3" />
                        Contact Support
                      </button>
                      <div className="border-t border-border my-1" />
                      <button
                        onClick={() => console.log('What\'s new clicked')}
                        className="flex items-center w-full px-4 py-2 text-sm text-popover-foreground hover:bg-muted transition-smooth"
                      >
                        <Icon name="Sparkles" size={16} className="mr-3" />
                        What's New
                        <span className="ml-auto w-2 h-2 bg-accent rounded-full" />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Notifications Dropdown */}
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                className="relative"
                aria-label="Notifications"
                onClick={handleNotifDropdownToggle}
              >
                <Icon name="Bell" size={20} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-error rounded-full flex items-center justify-center px-1">
                    <span className="text-[10px] font-bold text-white">{unreadCount > 9 ? '9+' : unreadCount}</span>
                  </span>
                )}
              </Button>

              {isNotifDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-50"
                    onClick={handleDropdownClose}
                  />
                  <div className="absolute right-0 mt-2 w-80 bg-popover border border-border rounded-lg shadow-elevation-2 z-60 max-h-[400px] flex flex-col">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                      <h3 className="font-semibold text-sm text-popover-foreground">Notifications</h3>
                      {unreadCount > 0 && (
                        <button
                          onClick={handleMarkAllRead}
                          className="text-xs text-primary hover:underline"
                        >
                          Mark all read
                        </button>
                      )}
                    </div>
                    <div className="overflow-y-auto flex-1">
                      {notifications.length === 0 ? (
                        <div className="py-8 text-center text-sm text-muted-foreground">
                          <Icon name="BellOff" size={24} className="mx-auto mb-2 opacity-40" />
                          No notifications yet
                        </div>
                      ) : (
                        notifications.map((notif) => (
                          <button
                            key={notif.id}
                            onClick={() => handleMarkNotifRead(notif.id)}
                            className={`flex items-start w-full px-4 py-3 text-left transition-smooth hover:bg-muted ${
                              !notif.is_read ? 'bg-primary/5' : ''
                            }`}
                          >
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 mt-0.5 shrink-0 ${
                              notif.type === 'clock_out' ? 'bg-error/10 text-error'
                                : notif.type === 'clock_in' ? 'bg-success/10 text-success'
                                : notif.type === 'login' ? 'bg-primary/10 text-primary'
                                : 'bg-muted text-muted-foreground'
                            }`}>
                              <Icon name={getNotifIcon(notif.type)} size={14} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-popover-foreground truncate">{notif.title}</span>
                                {!notif.is_read && (
                                  <span className="w-2 h-2 bg-primary rounded-full ml-2 shrink-0" />
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{notif.message}</p>
                              <p className="text-xs text-muted-foreground/60 mt-1">{formatTimeAgo(notif.created_at)}</p>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* User Dropdown */}
            <div className="relative">
              <button
                onClick={handleUserDropdownToggle}
                className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted transition-smooth"
                aria-label="User account menu"
              >
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-primary-foreground">
                    {userProfile?.full_name?.split(' ')?.map(n => n?.[0])?.join('')?.toUpperCase() || 'U'}
                  </span>
                </div>
                <div className="hidden sm:block text-left">
                  <div className="text-sm font-medium text-foreground">{userProfile?.full_name || user?.email}</div>
                  <div className="text-xs text-muted-foreground">{userProfile?.role?.replace('_', ' ')?.toUpperCase() || 'User'}</div>
                </div>
                <Icon
                  name="ChevronDown"
                  size={16}
                  className={`transition-transform ${isUserDropdownOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {isUserDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-50"
                    onClick={handleDropdownClose}
                  />
                  <div className="absolute right-0 mt-2 w-64 bg-popover border border-border rounded-lg shadow-elevation-2 z-60">
                    <div className="p-4 border-b border-border">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-primary-foreground">
                            {userProfile?.full_name?.split(' ')?.map(n => n?.[0])?.join('')?.toUpperCase() || 'U'}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium text-popover-foreground">{userProfile?.full_name || 'User'}</div>
                          <div className="text-sm text-muted-foreground">{user?.email}</div>
                          <div className="text-xs text-muted-foreground">{userProfile?.role?.replace('_', ' ')?.toUpperCase() || 'User'}</div>
                        </div>
                      </div>
                    </div>
                    <div className="py-1">
                      {menuItems.map((item) => (
                        <button
                          key={item.path}
                          onClick={() => handleMenuItemClick(item.path)}
                          className={`flex items-center w-full px-4 py-2 text-sm transition-smooth ${
                            location.pathname === item.path
                              ? 'bg-muted text-foreground font-medium'
                              : 'text-popover-foreground hover:bg-muted'
                          }`}
                        >
                          <Icon name={item.icon} size={16} className="mr-3" />
                          <div className="text-left">
                            <div>{item.label}</div>
                            {item.description && (
                              <div className="text-xs text-muted-foreground mt-0.5">{item.description}</div>
                            )}
                          </div>
                        </button>
                      ))}
                      <div className="border-t border-border my-1" />
                      <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-2 text-sm text-error hover:bg-error/10 transition-smooth"
                      >
                        <Icon name="LogOut" size={16} className="mr-3" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Backdrop for mobile dropdowns */}
      {(isUserDropdownOpen || isHelpDropdownOpen || isNotifDropdownOpen) && (
        <div
          className="fixed inset-0 bg-black/20 z-40 lg:hidden"
          onClick={handleDropdownClose}
        />
      )}
    </>
  );
};

export default Header;
