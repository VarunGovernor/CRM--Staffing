import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Icon from '../AppIcon';
import Button from './Button';
import { useAuth } from '../../contexts/AuthContext';
import { getNavigationForRole, canEdit } from '../../lib/permissions';

const Sidebar = ({ isOpen = false, onClose }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { userProfile } = useAuth();

  // Get navigation items based on user role
  const userRole = userProfile?.role || 'employee';
  const navigationItems = getNavigationForRole(userRole);

  const handleNavigation = (path) => {
    navigate(path);
    if (onClose) {
      onClose();
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full w-64 bg-background border-r border-border z-50 lg:z-30
          transform transition-transform duration-300 ease-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border">
            <div className="flex items-center space-x-3">
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

            {/* Close button for mobile */}
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="lg:hidden"
              aria-label="Close navigation menu"
            >
              <Icon name="X" size={20} />
            </Button>
          </div>

          {/* User Role Badge */}
          <div className="px-6 py-3 border-b border-border">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                <Icon name="User" size={16} className="text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {userProfile?.full_name || 'User'}
                </p>
                <p className="text-xs text-muted-foreground capitalize">
                  {userRole}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-4">
            <div className="px-3 space-y-1">
              {navigationItems?.map((item) => {
                const isActive = location?.pathname === item?.path;
                const isReadOnly = item?.readOnly;

                return (
                  <button
                    key={item?.path}
                    onClick={() => handleNavigation(item?.path)}
                    className={`
                      w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-lg
                      transition-smooth group
                      ${isActive
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                      }
                    `}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon
                        name={item?.icon}
                        size={18}
                        className={`
                          ${isActive ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-foreground'}
                        `}
                      />
                      <span>{item?.label}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {isReadOnly && !isActive && (
                        <span className="px-1.5 py-0.5 text-[10px] font-medium bg-muted text-muted-foreground rounded">
                          View
                        </span>
                      )}
                      {item?.badge && (
                        <span
                          className={`
                            px-2 py-0.5 text-xs font-medium rounded-full
                            ${isActive
                              ? 'bg-primary-foreground/20 text-primary-foreground'
                              : 'bg-accent text-accent-foreground'
                            }
                          `}
                        >
                          {item?.badge}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-border">
            <div className="text-xs text-muted-foreground text-center">
              © 2025 CRMPro. All rights reserved.
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
