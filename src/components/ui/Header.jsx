import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import Icon from '../AppIcon';
import Button from './Button';
import { useAuth } from '../../contexts/AuthContext';

const Header = ({ onMenuToggle, isSidebarOpen = false }) => {
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isHelpDropdownOpen, setIsHelpDropdownOpen] = useState(false);
  const location = useLocation();
  const { user, userProfile, signOut } = useAuth();

  const handleUserDropdownToggle = () => {
    setIsUserDropdownOpen(!isUserDropdownOpen);
    setIsHelpDropdownOpen(false);
  };

  const handleHelpDropdownToggle = () => {
    setIsHelpDropdownOpen(!isHelpDropdownOpen);
    setIsUserDropdownOpen(false);
  };

  const handleDropdownClose = () => {
    setIsUserDropdownOpen(false);
    setIsHelpDropdownOpen(false);
  };

  const handleLogout = async () => {
    await signOut();
    handleDropdownClose();
  };

  const handleProfileClick = () => {
    // Navigate to profile
    console.log('Profile clicked');
    handleDropdownClose();
  };

  const handleSettingsClick = () => {
    // Navigate to settings
    console.log('Settings clicked');
    handleDropdownClose();
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

            {/* Desktop Logo - Always visible on desktop */}
            <div className="hidden lg:flex items-center space-x-3 ml-64">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Icon name="Zap" size={20} color="white" />
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-lg font-semibold text-foreground">CRMPro</span>
                <span className="px-2 py-0.5 text-xs font-medium bg-accent text-accent-foreground rounded-full">
                  v2.1
                </span>
              </div>
            </div>

            {/* Mobile Logo - Only visible on mobile */}
            <div className="flex items-center space-x-3 lg:hidden">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Icon name="Zap" size={20} color="white" />
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-lg font-semibold text-foreground">CRMPro</span>
                <span className="px-2 py-0.5 text-xs font-medium bg-accent text-accent-foreground rounded-full">
                  v2.1
                </span>
              </div>
            </div>
          </div>

          {/* Right Section - Actions & User */}
          <div className="flex items-center space-x-2">
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

            {/* Notifications */}
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              aria-label="Notifications"
            >
              <Icon name="Bell" size={20} />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-error rounded-full flex items-center justify-center">
                <span className="w-1.5 h-1.5 bg-white rounded-full" />
              </span>
            </Button>

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
                      <button
                        onClick={handleProfileClick}
                        className="flex items-center w-full px-4 py-2 text-sm text-popover-foreground hover:bg-muted transition-smooth"
                      >
                        <Icon name="User" size={16} className="mr-3" />
                        Profile Settings
                      </button>
                      <button
                        onClick={handleSettingsClick}
                        className="flex items-center w-full px-4 py-2 text-sm text-popover-foreground hover:bg-muted transition-smooth"
                      >
                        <Icon name="Settings" size={16} className="mr-3" />
                        Account Settings
                      </button>
                      <button
                        onClick={() => console.log('Billing clicked')}
                        className="flex items-center w-full px-4 py-2 text-sm text-popover-foreground hover:bg-muted transition-smooth"
                      >
                        <Icon name="CreditCard" size={16} className="mr-3" />
                        Billing & Plans
                      </button>
                      <div className="border-t border-border my-1" />
                      <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-2 text-sm text-popover-foreground hover:bg-muted transition-smooth"
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
      {(isUserDropdownOpen || isHelpDropdownOpen) && (
        <div
          className="fixed inset-0 bg-black/20 z-40 lg:hidden"
          onClick={handleDropdownClose}
        />
      )}
    </>
  );
};

export default Header;