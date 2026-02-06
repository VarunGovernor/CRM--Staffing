import React, { createContext, useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  hasAccess,
  canEdit,
  canDelete,
  isOwnOnly,
  getModuleFromPath,
  getPermissionLevel,
  PERMISSION_LEVELS
} from '../lib/permissions';
import { logUnauthorizedAccess } from '../lib/auditLog';

// Create a context to share permission info with child components
const PermissionContext = createContext({
  canEdit: false,
  canDelete: false,
  isOwnOnly: false,
  permissionLevel: PERMISSION_LEVELS.NONE,
  userRole: null
});

// Hook to access permission context
export const usePermissions = () => useContext(PermissionContext);

const ProtectedRoute = ({ children, allowedRoles = [], module: explicitModule }) => {
  const { user, loading, userProfile, profileLoading } = useAuth();
  const location = useLocation();

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if no user
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Show loading while profile is being fetched (role check depends on it)
  if (profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  const userRole = userProfile?.role || 'employee';

  // Determine the module from the route path or explicit prop
  const currentModule = explicitModule || getModuleFromPath(location.pathname);

  // Check access using the permissions system
  if (currentModule) {
    const hasModuleAccess = hasAccess(userRole, currentModule);

    if (!hasModuleAccess) {
      // Log unauthorized access attempt
      logUnauthorizedAccess(
        { id: user?.id, email: user?.email, role: userRole },
        currentModule,
        'route_access'
      );
      // Redirect to unauthorized page, or login if not authenticated
      if (hasAccess(userRole, 'dashboard')) {
        return <Navigate to="/unauthorized" replace />;
      }
      return <Navigate to="/login" replace />;
    }

    // Create permission context value
    const permissionValue = {
      canEdit: canEdit(userRole, currentModule),
      canDelete: canDelete(userRole, currentModule),
      isOwnOnly: isOwnOnly(userRole, currentModule),
      permissionLevel: getPermissionLevel(userRole, currentModule),
      userRole,
      module: currentModule
    };

    // Wrap children with permission context
    return (
      <PermissionContext.Provider value={permissionValue}>
        {children}
      </PermissionContext.Provider>
    );
  }

  // Legacy support: If no module but allowedRoles is provided
  if (allowedRoles?.length > 0 && userProfile?.role && !allowedRoles?.includes(userProfile?.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  // Default permission context for routes without module
  const defaultPermissionValue = {
    canEdit: userRole === 'admin',
    canDelete: userRole === 'admin',
    isOwnOnly: false,
    permissionLevel: userRole === 'admin' ? PERMISSION_LEVELS.FULL : PERMISSION_LEVELS.VIEW,
    userRole,
    module: null
  };

  return (
    <PermissionContext.Provider value={defaultPermissionValue}>
      {children}
    </PermissionContext.Provider>
  );
};

export default ProtectedRoute;
