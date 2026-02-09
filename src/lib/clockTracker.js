import { supabase } from './supabase';

/**
 * Clock in — creates a new clock entry with current timestamp
 */
export const clockIn = async (userId) => {
  const { data, error } = await supabase
    .from('clock_entries')
    .insert({
      user_id: userId,
      clock_in: new Date().toISOString()
    })
    .select()
    .single();

  return { data, error };
};

/**
 * Clock out — updates the active clock entry with clock_out time and duration
 */
export const clockOut = async (entryId) => {
  const now = new Date();

  // First get the entry to calculate duration
  const { data: entry, error: fetchError } = await supabase
    .from('clock_entries')
    .select('clock_in')
    .eq('id', entryId)
    .single();

  if (fetchError) return { data: null, error: fetchError };

  const clockInTime = new Date(entry.clock_in);
  const durationMinutes = Math.round((now - clockInTime) / 60000);

  const { data, error } = await supabase
    .from('clock_entries')
    .update({
      clock_out: now.toISOString(),
      duration_minutes: durationMinutes
    })
    .eq('id', entryId)
    .select()
    .single();

  return { data, error };
};

/**
 * Get the active (open) clock entry for a user — where clock_out is null
 */
export const getActiveClockEntry = async (userId) => {
  const { data, error } = await supabase
    .from('clock_entries')
    .select('*')
    .eq('user_id', userId)
    .is('clock_out', null)
    .order('clock_in', { ascending: false })
    .limit(1)
    .maybeSingle();

  return { data, error };
};

/**
 * Get clock history for a user within a date range
 */
export const getClockHistory = async (userId, startDate, endDate) => {
  let query = supabase
    .from('clock_entries')
    .select('*')
    .eq('user_id', userId)
    .order('clock_in', { ascending: false });

  if (startDate) query = query.gte('clock_in', startDate);
  if (endDate) query = query.lte('clock_in', endDate);

  const { data, error } = await query;
  return { data, error };
};

/**
 * Get all clock entries (admin) with user info, optionally filtered
 */
export const getAllClockEntries = async (filters = {}) => {
  let query = supabase
    .from('clock_entries')
    .select(`
      *,
      user:user_profiles!user_id (id, full_name, email, role, avatar_url)
    `)
    .order('clock_in', { ascending: false });

  if (filters.userId) query = query.eq('user_id', filters.userId);
  if (filters.startDate) query = query.gte('clock_in', filters.startDate);
  if (filters.endDate) query = query.lte('clock_in', filters.endDate);
  if (filters.limit) query = query.limit(filters.limit);

  const { data, error } = await query;
  return { data, error };
};

/**
 * Get today's clock stats for admin dashboard
 */
export const getTodayClockStats = async () => {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const { data: todayEntries, error } = await supabase
    .from('clock_entries')
    .select(`
      *,
      user:user_profiles!user_id (id, full_name, email, role)
    `)
    .gte('clock_in', todayStart.toISOString())
    .order('clock_in', { ascending: false });

  if (error) return { stats: null, error };

  const totalClockIns = todayEntries?.length || 0;
  const currentlyClockedIn = todayEntries?.filter(e => !e.clock_out)?.length || 0;
  const totalMinutes = todayEntries?.reduce((sum, e) => sum + (e.duration_minutes || 0), 0) || 0;
  const totalHours = Math.round((totalMinutes / 60) * 10) / 10;

  return {
    stats: {
      totalClockIns,
      currentlyClockedIn,
      totalHours,
      entries: todayEntries
    },
    error: null
  };
};
