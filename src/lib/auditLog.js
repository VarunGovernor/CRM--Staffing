/**
 * Audit Logging Utility
 *
 * Logs sensitive actions for compliance and security purposes.
 * In production, these logs should be sent to a secure logging service
 * or stored in a dedicated audit_logs table in the database.
 */

import { supabase } from './supabase';

// Sensitive actions that should be logged
export const AUDIT_ACTIONS = {
  // Authentication
  LOGIN: 'auth.login',
  LOGOUT: 'auth.logout',
  LOGIN_FAILED: 'auth.login_failed',
  PASSWORD_CHANGE: 'auth.password_change',
  PASSWORD_RESET: 'auth.password_reset',

  // User Management
  USER_CREATE: 'user.create',
  USER_UPDATE: 'user.update',
  USER_DELETE: 'user.delete',
  USER_ROLE_CHANGE: 'user.role_change',

  // Candidate Actions
  CANDIDATE_CREATE: 'candidate.create',
  CANDIDATE_UPDATE: 'candidate.update',
  CANDIDATE_DELETE: 'candidate.delete',
  CANDIDATE_VIEW_SENSITIVE: 'candidate.view_sensitive',

  // Payroll Actions
  PAYROLL_VIEW: 'payroll.view',
  PAYROLL_PROCESS: 'payroll.process',
  PAYROLL_APPROVE: 'payroll.approve',
  PAYROLL_EXPORT: 'payroll.export',

  // Invoice Actions
  INVOICE_CREATE: 'invoice.create',
  INVOICE_UPDATE: 'invoice.update',
  INVOICE_DELETE: 'invoice.delete',
  INVOICE_SEND: 'invoice.send',

  // Compliance Actions
  COMPLIANCE_VIEW: 'compliance.view',
  COMPLIANCE_UPDATE: 'compliance.update',
  DOCUMENT_UPLOAD: 'compliance.document_upload',
  DOCUMENT_DELETE: 'compliance.document_delete',

  // Data Export
  DATA_EXPORT: 'data.export',
  REPORT_GENERATE: 'report.generate',

  // Settings
  SETTINGS_CHANGE: 'settings.change',
  INTEGRATION_UPDATE: 'settings.integration_update',

  // Access Control
  ACCESS_DENIED: 'access.denied',
  UNAUTHORIZED_ATTEMPT: 'access.unauthorized_attempt'
};

// Severity levels for audit events
export const SEVERITY = {
  INFO: 'info',
  WARNING: 'warning',
  CRITICAL: 'critical'
};

// Action severity mapping
const ACTION_SEVERITY = {
  [AUDIT_ACTIONS.LOGIN]: SEVERITY.INFO,
  [AUDIT_ACTIONS.LOGOUT]: SEVERITY.INFO,
  [AUDIT_ACTIONS.LOGIN_FAILED]: SEVERITY.WARNING,
  [AUDIT_ACTIONS.PASSWORD_CHANGE]: SEVERITY.CRITICAL,
  [AUDIT_ACTIONS.PASSWORD_RESET]: SEVERITY.CRITICAL,
  [AUDIT_ACTIONS.USER_CREATE]: SEVERITY.CRITICAL,
  [AUDIT_ACTIONS.USER_DELETE]: SEVERITY.CRITICAL,
  [AUDIT_ACTIONS.USER_ROLE_CHANGE]: SEVERITY.CRITICAL,
  [AUDIT_ACTIONS.PAYROLL_PROCESS]: SEVERITY.CRITICAL,
  [AUDIT_ACTIONS.PAYROLL_APPROVE]: SEVERITY.CRITICAL,
  [AUDIT_ACTIONS.INVOICE_DELETE]: SEVERITY.WARNING,
  [AUDIT_ACTIONS.DATA_EXPORT]: SEVERITY.WARNING,
  [AUDIT_ACTIONS.ACCESS_DENIED]: SEVERITY.WARNING,
  [AUDIT_ACTIONS.UNAUTHORIZED_ATTEMPT]: SEVERITY.CRITICAL
};

/**
 * Create an audit log entry
 * @param {Object} params - Audit log parameters
 * @param {string} params.action - The action being logged (use AUDIT_ACTIONS constants)
 * @param {string} params.userId - ID of the user performing the action
 * @param {string} params.userEmail - Email of the user performing the action
 * @param {string} params.userRole - Role of the user performing the action
 * @param {string} params.module - Module where the action occurred
 * @param {string} params.resourceType - Type of resource affected (e.g., 'candidate', 'invoice')
 * @param {string} params.resourceId - ID of the affected resource
 * @param {Object} params.details - Additional details about the action
 * @param {string} params.ipAddress - IP address of the user (if available)
 * @returns {Promise<Object>} - The created audit log entry
 */
export const createAuditLog = async ({
  action,
  userId,
  userEmail,
  userRole,
  module,
  resourceType = null,
  resourceId = null,
  details = {},
  ipAddress = null
}) => {
  const timestamp = new Date().toISOString();
  const severity = ACTION_SEVERITY[action] || SEVERITY.INFO;

  const logEntry = {
    action,
    user_id: userId,
    user_email: userEmail,
    user_role: userRole,
    module,
    resource_type: resourceType,
    resource_id: resourceId,
    details: JSON.stringify(details),
    ip_address: ipAddress,
    severity,
    timestamp,
    created_at: timestamp
  };

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log('[AUDIT LOG]', {
      ...logEntry,
      details // Show parsed details in console
    });
  }

  // Try to save to database if audit_logs table exists
  try {
    const { data, error } = await supabase
      .from('audit_logs')
      .insert([logEntry])
      .select()
      .single();

    if (error) {
      // Table might not exist - log to console only
      console.warn('[AUDIT LOG] Database insert failed:', error.message);
      return logEntry;
    }

    return data;
  } catch (err) {
    // Fallback to console logging
    console.warn('[AUDIT LOG] Failed to save:', err.message);
    return logEntry;
  }
};

/**
 * Log authentication events
 */
export const logAuthEvent = async (action, user, success = true, details = {}) => {
  return createAuditLog({
    action: success ? action : AUDIT_ACTIONS.LOGIN_FAILED,
    userId: user?.id || 'unknown',
    userEmail: user?.email || 'unknown',
    userRole: user?.role || 'unknown',
    module: 'auth',
    details: {
      ...details,
      success,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown'
    }
  });
};

/**
 * Log data access events
 */
export const logDataAccess = async (user, module, resourceType, resourceId, action = 'view') => {
  return createAuditLog({
    action: `${module}.${action}`,
    userId: user?.id,
    userEmail: user?.email,
    userRole: user?.role,
    module,
    resourceType,
    resourceId,
    details: { accessType: action }
  });
};

/**
 * Log unauthorized access attempts
 */
export const logUnauthorizedAccess = async (user, attemptedModule, attemptedAction) => {
  return createAuditLog({
    action: AUDIT_ACTIONS.UNAUTHORIZED_ATTEMPT,
    userId: user?.id || 'unknown',
    userEmail: user?.email || 'unknown',
    userRole: user?.role || 'unknown',
    module: attemptedModule,
    details: {
      attemptedAction,
      blockedAt: new Date().toISOString()
    }
  });
};

/**
 * Log payroll actions (high sensitivity)
 */
export const logPayrollAction = async (user, action, details = {}) => {
  return createAuditLog({
    action,
    userId: user?.id,
    userEmail: user?.email,
    userRole: user?.role,
    module: 'payroll',
    resourceType: 'payroll',
    details: {
      ...details,
      timestamp: new Date().toISOString()
    }
  });
};

/**
 * Log data export events
 */
export const logDataExport = async (user, module, exportType, recordCount) => {
  return createAuditLog({
    action: AUDIT_ACTIONS.DATA_EXPORT,
    userId: user?.id,
    userEmail: user?.email,
    userRole: user?.role,
    module,
    details: {
      exportType,
      recordCount,
      exportedAt: new Date().toISOString()
    }
  });
};

/**
 * Get audit logs with filters (admin only)
 */
export const getAuditLogs = async (filters = {}) => {
  let query = supabase
    .from('audit_logs')
    .select('*')
    .order('created_at', { ascending: false });

  if (filters.userId) {
    query = query.eq('user_id', filters.userId);
  }
  if (filters.action) {
    query = query.eq('action', filters.action);
  }
  if (filters.module) {
    query = query.eq('module', filters.module);
  }
  if (filters.severity) {
    query = query.eq('severity', filters.severity);
  }
  if (filters.startDate) {
    query = query.gte('created_at', filters.startDate);
  }
  if (filters.endDate) {
    query = query.lte('created_at', filters.endDate);
  }
  if (filters.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching audit logs:', error);
    return [];
  }

  return data;
};

export default {
  createAuditLog,
  logAuthEvent,
  logDataAccess,
  logUnauthorizedAccess,
  logPayrollAction,
  logDataExport,
  getAuditLogs,
  AUDIT_ACTIONS,
  SEVERITY
};
