import { supabase } from './supabase';

/**
 * Create an in-app notification for a user
 */
export const createInAppNotification = async (userId, type, title, message, data = {}) => {
  const { data: notification, error } = await supabase
    .from('notifications')
    .insert({
      user_id: userId,
      type,
      title,
      message,
      data
    })
    .select()
    .single();

  return { data: notification, error };
};

/**
 * Create notifications for all admin users
 */
export const notifyAdmins = async (type, title, message, data = {}) => {
  const { data: admins, error: fetchError } = await supabase
    .from('user_profiles')
    .select('id')
    .eq('role', 'admin')
    .eq('is_active', true);

  if (fetchError || !admins?.length) return { error: fetchError };

  const notifications = admins.map(admin => ({
    user_id: admin.id,
    type,
    title,
    message,
    data
  }));

  const { error } = await supabase
    .from('notifications')
    .insert(notifications);

  return { error };
};

/**
 * Get notifications for a user
 */
export const getNotifications = async (userId, { unreadOnly = false, limit = 20 } = {}) => {
  let query = supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (unreadOnly) query = query.eq('is_read', false);

  const { data, error } = await query;
  return { data, error };
};

/**
 * Get unread notification count for a user
 */
export const getUnreadCount = async (userId) => {
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_read', false);

  return { count: count || 0, error };
};

/**
 * Mark a single notification as read
 */
export const markNotificationRead = async (notificationId) => {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId);

  return { error };
};

/**
 * Mark all notifications as read for a user
 */
export const markAllRead = async (userId) => {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('is_read', false);

  return { error };
};

/**
 * Send a WhatsApp notification via Supabase Edge Function
 */
export const sendWhatsAppNotification = async (toPhone, message) => {
  try {
    const { data, error } = await supabase.functions.invoke('send-whatsapp', {
      body: { to: toPhone, message }
    });

    if (error) {
      console.error('WhatsApp notification failed:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (err) {
    console.error('WhatsApp notification error:', err);
    return { success: false, error: err };
  }
};

/**
 * Notify manager when employee clocks out via WhatsApp + in-app
 */
export const notifyManagerOnClockOut = async (employee, managerId, clockData) => {
  // Get manager details
  const { data: manager, error: managerError } = await supabase
    .from('user_profiles')
    .select('id, full_name, phone')
    .eq('id', managerId)
    .single();

  if (managerError || !manager) {
    console.error('Could not find manager:', managerError);
    return { error: managerError || new Error('Manager not found') };
  }

  const duration = clockData.duration_minutes;
  const hours = Math.floor(duration / 60);
  const mins = duration % 60;
  const durationStr = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;

  const message = `${employee.full_name} has clocked out. Session duration: ${durationStr}.`;

  // Send in-app notification to manager
  await createInAppNotification(
    managerId,
    'clock_out',
    'Employee Clocked Out',
    message,
    {
      employeeId: employee.id,
      employeeName: employee.full_name,
      clockIn: clockData.clock_in,
      clockOut: clockData.clock_out,
      durationMinutes: duration
    }
  );

  // Send WhatsApp notification if manager has a phone number
  if (manager.phone) {
    await sendWhatsAppNotification(manager.phone, message);
  }

  return { success: true };
};

/**
 * Get user's manager info
 */
export const getManagerInfo = async (userId) => {
  const { data: user, error } = await supabase
    .from('user_profiles')
    .select('reports_to')
    .eq('id', userId)
    .single();

  if (error || !user?.reports_to) return { manager: null, error };

  const { data: manager, error: managerError } = await supabase
    .from('user_profiles')
    .select('id, full_name, email, phone, role')
    .eq('id', user.reports_to)
    .single();

  return { manager, error: managerError };
};
