/**
 * Role-Based Access Control (RBAC) Configuration
 *
 * Roles: admin, sales, recruiter, hr, finance, employee
 *
 * Permission Levels:
 * - full: Can view, create, edit, delete
 * - edit: Can view, create, edit (no delete)
 * - view: Read-only access
 * - none: No access
 * - own: Can only access own records (for employee role)
 * - limited: Limited access to specific sections
 */

export const ROLES = {
  ADMIN: 'admin',
  SALES: 'sales',
  RECRUITER: 'recruiter',
  HR: 'hr',
  FINANCE: 'finance',
  EMPLOYEE: 'employee'
};

export const PERMISSION_LEVELS = {
  FULL: 'full',
  EDIT: 'edit',
  VIEW: 'view',
  NONE: 'none',
  OWN: 'own',
  LIMITED: 'limited'
};

/**
 * Permission Matrix
 * Defines access levels for each role per module
 */
export const PERMISSION_MATRIX = {
  dashboard: {
    [ROLES.ADMIN]: PERMISSION_LEVELS.FULL,
    [ROLES.SALES]: PERMISSION_LEVELS.VIEW,
    [ROLES.RECRUITER]: PERMISSION_LEVELS.VIEW,
    [ROLES.HR]: PERMISSION_LEVELS.VIEW,
    [ROLES.FINANCE]: PERMISSION_LEVELS.VIEW,
    [ROLES.EMPLOYEE]: PERMISSION_LEVELS.VIEW
  },
  pipeline: {
    [ROLES.ADMIN]: PERMISSION_LEVELS.FULL,
    [ROLES.SALES]: PERMISSION_LEVELS.FULL,
    [ROLES.RECRUITER]: PERMISSION_LEVELS.VIEW,
    [ROLES.HR]: PERMISSION_LEVELS.NONE,
    [ROLES.FINANCE]: PERMISSION_LEVELS.NONE,
    [ROLES.EMPLOYEE]: PERMISSION_LEVELS.NONE
  },
  candidates: {
    [ROLES.ADMIN]: PERMISSION_LEVELS.FULL,
    [ROLES.SALES]: PERMISSION_LEVELS.VIEW,
    [ROLES.RECRUITER]: PERMISSION_LEVELS.FULL,
    [ROLES.HR]: PERMISSION_LEVELS.VIEW,
    [ROLES.FINANCE]: PERMISSION_LEVELS.VIEW, // Masked data
    [ROLES.EMPLOYEE]: PERMISSION_LEVELS.NONE
  },
  submissions: {
    [ROLES.ADMIN]: PERMISSION_LEVELS.FULL,
    [ROLES.SALES]: PERMISSION_LEVELS.FULL,
    [ROLES.RECRUITER]: PERMISSION_LEVELS.EDIT,
    [ROLES.HR]: PERMISSION_LEVELS.NONE,
    [ROLES.FINANCE]: PERMISSION_LEVELS.NONE,
    [ROLES.EMPLOYEE]: PERMISSION_LEVELS.NONE
  },
  interviews: {
    [ROLES.ADMIN]: PERMISSION_LEVELS.FULL,
    [ROLES.SALES]: PERMISSION_LEVELS.FULL,
    [ROLES.RECRUITER]: PERMISSION_LEVELS.VIEW,
    [ROLES.HR]: PERMISSION_LEVELS.VIEW,
    [ROLES.FINANCE]: PERMISSION_LEVELS.NONE,
    [ROLES.EMPLOYEE]: PERMISSION_LEVELS.NONE
  },
  placements: {
    [ROLES.ADMIN]: PERMISSION_LEVELS.FULL,
    [ROLES.SALES]: PERMISSION_LEVELS.FULL,
    [ROLES.RECRUITER]: PERMISSION_LEVELS.VIEW,
    [ROLES.HR]: PERMISSION_LEVELS.VIEW,
    [ROLES.FINANCE]: PERMISSION_LEVELS.VIEW,
    [ROLES.EMPLOYEE]: PERMISSION_LEVELS.NONE
  },
  'hr-onboarding': {
    [ROLES.ADMIN]: PERMISSION_LEVELS.FULL,
    [ROLES.SALES]: PERMISSION_LEVELS.NONE,
    [ROLES.RECRUITER]: PERMISSION_LEVELS.NONE,
    [ROLES.HR]: PERMISSION_LEVELS.FULL,
    [ROLES.FINANCE]: PERMISSION_LEVELS.NONE,
    [ROLES.EMPLOYEE]: PERMISSION_LEVELS.OWN
  },
  payroll: {
    [ROLES.ADMIN]: PERMISSION_LEVELS.FULL,
    [ROLES.SALES]: PERMISSION_LEVELS.NONE,
    [ROLES.RECRUITER]: PERMISSION_LEVELS.NONE,
    [ROLES.HR]: PERMISSION_LEVELS.VIEW,
    [ROLES.FINANCE]: PERMISSION_LEVELS.FULL,
    [ROLES.EMPLOYEE]: PERMISSION_LEVELS.OWN
  },
  invoices: {
    [ROLES.ADMIN]: PERMISSION_LEVELS.FULL,
    [ROLES.SALES]: PERMISSION_LEVELS.NONE,
    [ROLES.RECRUITER]: PERMISSION_LEVELS.NONE,
    [ROLES.HR]: PERMISSION_LEVELS.NONE,
    [ROLES.FINANCE]: PERMISSION_LEVELS.FULL,
    [ROLES.EMPLOYEE]: PERMISSION_LEVELS.NONE
  },
  compliance: {
    [ROLES.ADMIN]: PERMISSION_LEVELS.FULL,
    [ROLES.SALES]: PERMISSION_LEVELS.NONE,
    [ROLES.RECRUITER]: PERMISSION_LEVELS.NONE,
    [ROLES.HR]: PERMISSION_LEVELS.FULL,
    [ROLES.FINANCE]: PERMISSION_LEVELS.NONE,
    [ROLES.EMPLOYEE]: PERMISSION_LEVELS.OWN
  },
  analytics: {
    [ROLES.ADMIN]: PERMISSION_LEVELS.FULL,
    [ROLES.SALES]: PERMISSION_LEVELS.VIEW,
    [ROLES.RECRUITER]: PERMISSION_LEVELS.VIEW,
    [ROLES.HR]: PERMISSION_LEVELS.VIEW,
    [ROLES.FINANCE]: PERMISSION_LEVELS.VIEW,
    [ROLES.EMPLOYEE]: PERMISSION_LEVELS.NONE
  },
  settings: {
    [ROLES.ADMIN]: PERMISSION_LEVELS.FULL,
    [ROLES.SALES]: PERMISSION_LEVELS.NONE,
    [ROLES.RECRUITER]: PERMISSION_LEVELS.NONE,
    [ROLES.HR]: PERMISSION_LEVELS.NONE,
    [ROLES.FINANCE]: PERMISSION_LEVELS.NONE,
    [ROLES.EMPLOYEE]: PERMISSION_LEVELS.NONE
  },
  // User menu modules
  profile: {
    [ROLES.ADMIN]: PERMISSION_LEVELS.FULL,
    [ROLES.SALES]: PERMISSION_LEVELS.FULL,
    [ROLES.RECRUITER]: PERMISSION_LEVELS.FULL,
    [ROLES.HR]: PERMISSION_LEVELS.FULL,
    [ROLES.FINANCE]: PERMISSION_LEVELS.FULL,
    [ROLES.EMPLOYEE]: PERMISSION_LEVELS.FULL
  },
  'account-settings': {
    [ROLES.ADMIN]: PERMISSION_LEVELS.FULL,
    [ROLES.SALES]: PERMISSION_LEVELS.NONE,
    [ROLES.RECRUITER]: PERMISSION_LEVELS.NONE,
    [ROLES.HR]: PERMISSION_LEVELS.LIMITED, // HR-related configurations only
    [ROLES.FINANCE]: PERMISSION_LEVELS.LIMITED, // Finance-related configurations only
    [ROLES.EMPLOYEE]: PERMISSION_LEVELS.NONE
  },
  billing: {
    [ROLES.ADMIN]: PERMISSION_LEVELS.FULL,
    [ROLES.SALES]: PERMISSION_LEVELS.NONE,
    [ROLES.RECRUITER]: PERMISSION_LEVELS.NONE,
    [ROLES.HR]: PERMISSION_LEVELS.NONE,
    [ROLES.FINANCE]: PERMISSION_LEVELS.FULL,
    [ROLES.EMPLOYEE]: PERMISSION_LEVELS.NONE
  },
  'admin-activity': {
    [ROLES.ADMIN]: PERMISSION_LEVELS.FULL,
    [ROLES.SALES]: PERMISSION_LEVELS.NONE,
    [ROLES.RECRUITER]: PERMISSION_LEVELS.NONE,
    [ROLES.HR]: PERMISSION_LEVELS.NONE,
    [ROLES.FINANCE]: PERMISSION_LEVELS.NONE,
    [ROLES.EMPLOYEE]: PERMISSION_LEVELS.NONE
  }
};

/**
 * User menu configuration
 */
export const USER_MENU_CONFIG = [
  {
    label: 'Profile Settings',
    path: '/profile',
    icon: 'User',
    module: 'profile',
    description: 'Manage your personal information'
  },
  {
    label: 'Account Settings',
    path: '/settings/account',
    icon: 'Settings',
    module: 'account-settings',
    description: 'Configure account preferences'
  },
  {
    label: 'Billing & Plans',
    path: '/settings/billing',
    icon: 'CreditCard',
    module: 'billing',
    description: 'Manage subscription and payments'
  }
];

/**
 * Get user menu items based on role
 * @param {string} role - User role
 * @returns {Array} - Filtered menu items
 */
export const getUserMenuForRole = (role) => {
  if (!role) return [];

  return USER_MENU_CONFIG.filter(item => hasAccess(role, item.module));
};

/**
 * Sidebar navigation configuration with module mappings
 */
export const NAVIGATION_CONFIG = [
  {
    label: 'Dashboard',
    path: '/dashboard',
    icon: 'LayoutDashboard',
    module: 'dashboard'
  },
  {
    label: 'Pipeline',
    path: '/candidate-pipeline',
    icon: 'Kanban',
    module: 'pipeline'
  },
  {
    label: 'Candidates',
    path: '/candidates',
    icon: 'Users',
    module: 'candidates'
  },
  {
    label: 'Submissions',
    path: '/submissions',
    icon: 'Send',
    module: 'submissions'
  },
  {
    label: 'Interviews',
    path: '/interviews',
    icon: 'Calendar',
    module: 'interviews'
  },
  {
    label: 'Placements',
    path: '/placements',
    icon: 'Briefcase',
    module: 'placements'
  },
  {
    label: 'HR & Onboarding',
    path: '/hr-onboarding',
    icon: 'UserCheck',
    module: 'hr-onboarding'
  },
  {
    label: 'Payroll',
    path: '/payroll',
    icon: 'DollarSign',
    module: 'payroll'
  },
  {
    label: 'Invoices',
    path: '/invoices',
    icon: 'FileText',
    module: 'invoices'
  },
  {
    label: 'Compliance',
    path: '/compliance',
    icon: 'Shield',
    module: 'compliance'
  },
  {
    label: 'Analytics',
    path: '/analytics',
    icon: 'BarChart3',
    module: 'analytics'
  },
  {
    label: 'Activity Log',
    path: '/admin/activity',
    icon: 'Activity',
    module: 'admin-activity'
  },
  {
    label: 'Settings',
    path: '/settings',
    icon: 'Settings',
    module: 'settings'
  }
];

/**
 * Check if a role has access to a module
 * @param {string} role - User role
 * @param {string} module - Module name
 * @returns {boolean} - Whether the role can access the module
 */
export const hasAccess = (role, module) => {
  if (!role || !module) return false;
  const permission = PERMISSION_MATRIX[module]?.[role];
  return permission && permission !== PERMISSION_LEVELS.NONE;
};

/**
 * Check if a role can edit a module
 * @param {string} role - User role
 * @param {string} module - Module name
 * @returns {boolean} - Whether the role can edit the module
 */
export const canEdit = (role, module) => {
  if (!role || !module) return false;
  const permission = PERMISSION_MATRIX[module]?.[role];
  return permission === PERMISSION_LEVELS.FULL || permission === PERMISSION_LEVELS.EDIT;
};

/**
 * Check if a role can delete in a module
 * @param {string} role - User role
 * @param {string} module - Module name
 * @returns {boolean} - Whether the role can delete in the module
 */
export const canDelete = (role, module) => {
  if (!role || !module) return false;
  const permission = PERMISSION_MATRIX[module]?.[role];
  return permission === PERMISSION_LEVELS.FULL;
};

/**
 * Check if access is limited to own records only
 * @param {string} role - User role
 * @param {string} module - Module name
 * @returns {boolean} - Whether access is limited to own records
 */
export const isOwnOnly = (role, module) => {
  if (!role || !module) return false;
  const permission = PERMISSION_MATRIX[module]?.[role];
  return permission === PERMISSION_LEVELS.OWN;
};

/**
 * Check if access is limited (partial access)
 * @param {string} role - User role
 * @param {string} module - Module name
 * @returns {boolean} - Whether access is limited
 */
export const isLimited = (role, module) => {
  if (!role || !module) return false;
  const permission = PERMISSION_MATRIX[module]?.[role];
  return permission === PERMISSION_LEVELS.LIMITED;
};

/**
 * Get permission level for a role and module
 * @param {string} role - User role
 * @param {string} module - Module name
 * @returns {string} - Permission level
 */
export const getPermissionLevel = (role, module) => {
  if (!role || !module) return PERMISSION_LEVELS.NONE;
  return PERMISSION_MATRIX[module]?.[role] || PERMISSION_LEVELS.NONE;
};

/**
 * Get filtered navigation items based on role
 * @param {string} role - User role
 * @returns {Array} - Filtered navigation items
 */
export const getNavigationForRole = (role) => {
  if (!role) return [];

  // Admin gets everything
  if (role === ROLES.ADMIN) {
    return NAVIGATION_CONFIG.map(item => ({ ...item, badge: null }));
  }

  return NAVIGATION_CONFIG
    .filter(item => hasAccess(role, item.module))
    .map(item => ({
      ...item,
      badge: null,
      readOnly: !canEdit(role, item.module)
    }));
};

/**
 * Get all accessible modules for a role
 * @param {string} role - User role
 * @returns {Array} - List of accessible module names
 */
export const getAccessibleModules = (role) => {
  if (!role) return [];

  return Object.keys(PERMISSION_MATRIX).filter(module => hasAccess(role, module));
};

/**
 * Mask sensitive data for finance role viewing candidates
 * @param {Object} data - Data object to mask
 * @param {string} role - User role
 * @param {string} module - Module name
 * @returns {Object} - Masked data object
 */
export const maskSensitiveData = (data, role, module) => {
  if (!data) return data;

  // Finance role viewing candidates - mask personal info
  if (role === ROLES.FINANCE && module === 'candidates') {
    return {
      ...data,
      email: data.email ? '***@***.***' : null,
      phone: data.phone ? '***-***-****' : null,
      ssn: data.ssn ? '***-**-****' : null,
      address: data.address ? '*** Hidden ***' : null
    };
  }

  return data;
};

/**
 * Module to route path mapping for ProtectedRoute
 */
export const MODULE_ROUTE_MAP = {
  '/dashboard': 'dashboard',
  '/candidate-pipeline': 'pipeline',
  '/candidates': 'candidates',
  '/submissions': 'submissions',
  '/interviews': 'interviews',
  '/placements': 'placements',
  '/hr-onboarding': 'hr-onboarding',
  '/payroll': 'payroll',
  '/invoices': 'invoices',
  '/compliance': 'compliance',
  '/analytics': 'analytics',
  '/settings': 'settings',
  '/profile': 'profile',
  '/settings/account': 'account-settings',
  '/settings/billing': 'billing',
  '/admin/activity': 'admin-activity'
};

/**
 * Get module name from route path
 * @param {string} path - Route path
 * @returns {string|null} - Module name or null
 */
export const getModuleFromPath = (path) => {
  return MODULE_ROUTE_MAP[path] || null;
};

/**
 * Get account settings sections based on role
 * @param {string} role - User role
 * @returns {Array} - Available settings sections
 */
export const getAccountSettingsSections = (role) => {
  const sections = {
    general: { label: 'General', roles: [ROLES.ADMIN] },
    security: { label: 'Security', roles: [ROLES.ADMIN] },
    notifications: { label: 'Notifications', roles: [ROLES.ADMIN, ROLES.HR, ROLES.FINANCE] },
    integrations: { label: 'Integrations', roles: [ROLES.ADMIN] },
    hr: { label: 'HR Settings', roles: [ROLES.ADMIN, ROLES.HR] },
    finance: { label: 'Finance Settings', roles: [ROLES.ADMIN, ROLES.FINANCE] },
    api: { label: 'API Access', roles: [ROLES.ADMIN] }
  };

  return Object.entries(sections)
    .filter(([key, value]) => value.roles.includes(role))
    .map(([key, value]) => ({ id: key, ...value }));
};
