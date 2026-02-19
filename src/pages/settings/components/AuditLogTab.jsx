import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const ACTION_LABELS = {
  'auth.login': 'Login',
  'auth.logout': 'Logout',
  'auth.login_failed': 'Login Failed',
};

const ACTION_COLORS = {
  'auth.login': 'bg-green-100 text-green-700',
  'auth.logout': 'bg-gray-100 text-gray-600',
  'auth.login_failed': 'bg-red-100 text-red-700',
};

const getDeviceSummary = (details) => {
  try {
    const parsed = typeof details === 'string' ? JSON.parse(details) : details;
    const ua = parsed?.userAgent || '';
    if (!ua) return 'Unknown';
    if (/iPhone|iPad|iPod/.test(ua)) return 'iOS';
    if (/Android/.test(ua)) return 'Android';
    if (/Chrome/.test(ua)) return 'Chrome';
    if (/Firefox/.test(ua)) return 'Firefox';
    if (/Safari/.test(ua)) return 'Safari';
    if (/Edge/.test(ua)) return 'Edge';
    return 'Browser';
  } catch {
    return 'Unknown';
  }
};

const formatDateTime = (ts) => {
  if (!ts) return '—';
  const d = new Date(ts);
  return d.toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: true
  });
};

// Pair login + logout rows to compute session durations
const computeSessions = (rows) => {
  // Group events by user_id, sorted by time ascending
  const byUser = {};
  rows.forEach(r => {
    if (!byUser[r.user_id]) byUser[r.user_id] = [];
    byUser[r.user_id].push(r);
  });

  const sessions = [];
  Object.values(byUser).forEach(events => {
    const sorted = [...events].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    let pendingLogin = null;
    sorted.forEach(ev => {
      if (ev.action === 'auth.login') {
        pendingLogin = ev;
        sessions.push({ ...ev, logout_at: null, duration_mins: null });
      } else if (ev.action === 'auth.logout' && pendingLogin) {
        const loginTime = new Date(pendingLogin.timestamp);
        const logoutTime = new Date(ev.timestamp);
        const mins = Math.round((logoutTime - loginTime) / 60000);
        // Update the matching login session entry
        const idx = sessions.findIndex(s => s.id === pendingLogin.id);
        if (idx !== -1) {
          sessions[idx] = { ...sessions[idx], logout_at: ev.timestamp, duration_mins: mins };
        }
        pendingLogin = null;
      } else if (ev.action === 'auth.login_failed') {
        sessions.push({ ...ev, logout_at: null, duration_mins: null });
      }
    });
  });

  // Re-sort by timestamp descending
  return sessions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
};

const AuditLogTab = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [userFilter, setUserFilter] = useState('');
  const [users, setUsers] = useState([]);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      let query = supabase
        .from('audit_logs')
        .select('*, user:user_profiles!user_id(full_name)')
        .in('action', ['auth.login', 'auth.logout', 'auth.login_failed'])
        .order('timestamp', { ascending: false })
        .limit(1000);

      if (dateFrom) query = query.gte('timestamp', dateFrom);
      if (dateTo) {
        const endOfDay = new Date(dateTo);
        endOfDay.setHours(23, 59, 59, 999);
        query = query.lte('timestamp', endOfDay.toISOString());
      }
      if (userFilter) query = query.eq('user_id', userFilter);

      const { data, error: fetchErr } = await query;
      if (fetchErr) throw fetchErr;
      setLogs(data || []);
    } catch (err) {
      setError('Failed to load audit logs. Make sure the audit_logs table migration has been applied.');
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo, userFilter]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  useEffect(() => {
    supabase
      .from('user_profiles')
      .select('id, full_name, email')
      .order('full_name')
      .then(({ data }) => setUsers(data || []));
  }, []);

  const sessions = computeSessions(logs);

  const exportCSV = () => {
    const headers = ['Name', 'Email', 'Role', 'Action', 'Login Time', 'Logout Time', 'Session Duration', 'IP Address', 'Device'];
    const rows = sessions.map(s => [
      `"${s.user?.full_name || 'N/A'}"`,
      `"${s.user_email || ''}"`,
      `"${s.user_role || ''}"`,
      `"${ACTION_LABELS[s.action] || s.action}"`,
      `"${formatDateTime(s.timestamp)}"`,
      `"${s.logout_at ? formatDateTime(s.logout_at) : '—'}"`,
      `"${s.duration_mins != null ? `${s.duration_mins} min` : '—'}"`,
      `"${s.ip_address || '—'}"`,
      `"${getDeviceSummary(s.details)}"`,
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const today = new Date().toISOString().split('T')[0];
    a.download = `login-activity-${today}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatDuration = (mins) => {
    if (mins == null) return <span className="text-muted-foreground text-xs">Active / Unknown</span>;
    if (mins < 60) return `${mins}m`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  };

  return (
    <div className="space-y-6">
      {/* Header row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-foreground">Login Activity</h3>
          <p className="text-sm text-muted-foreground mt-0.5">
            Full history of who logged in, when, and for how long.
          </p>
        </div>
        <Button
          onClick={exportCSV}
          disabled={loading || sessions.length === 0}
          className="flex items-center gap-2 shrink-0"
          variant="outline"
        >
          <Icon name="Download" size={16} />
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <label className="text-xs text-muted-foreground whitespace-nowrap">From</label>
          <input
            type="date"
            value={dateFrom}
            onChange={e => setDateFrom(e.target.value)}
            max={dateTo || new Date().toISOString().split('T')[0]}
            className="h-9 px-3 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-muted-foreground whitespace-nowrap">To</label>
          <input
            type="date"
            value={dateTo}
            onChange={e => setDateTo(e.target.value)}
            min={dateFrom}
            max={new Date().toISOString().split('T')[0]}
            className="h-9 px-3 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>
        <select
          value={userFilter}
          onChange={e => setUserFilter(e.target.value)}
          className="h-9 px-3 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
        >
          <option value="">All Users</option>
          {users.map(u => (
            <option key={u.id} value={u.id}>{u.full_name} ({u.email})</option>
          ))}
        </select>
        {(dateFrom || dateTo || userFilter) && (
          <button
            onClick={() => { setDateFrom(''); setDateTo(''); setUserFilter(''); }}
            className="h-9 px-3 text-sm text-muted-foreground hover:text-foreground border border-border rounded-lg hover:bg-muted transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center gap-2">
          <Icon name="AlertCircle" size={16} className="text-red-500 shrink-0" />
          {error}
        </div>
      )}

      {/* Table */}
      <div className="border border-border rounded-xl overflow-hidden">
        {loading ? (
          <div className="py-16 text-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Loading login activity…</p>
          </div>
        ) : sessions.length === 0 ? (
          <div className="py-16 text-center">
            <Icon name="ShieldCheck" size={40} className="text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No login records found for the selected filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">User</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Action</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Login Time</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Logout Time</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Duration</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">IP Address</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Device</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sessions.map((session) => (
                  <tr key={session.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">{session.user?.full_name || 'Unknown'}</p>
                      <p className="text-xs text-muted-foreground">{session.user_email}</p>
                      {session.user_role && (
                        <p className="text-xs text-muted-foreground capitalize">{session.user_role}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ACTION_COLORS[session.action] || 'bg-gray-100 text-gray-600'}`}>
                        {ACTION_LABELS[session.action] || session.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-foreground whitespace-nowrap">{formatDateTime(session.timestamp)}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {session.logout_at
                        ? <span className="text-foreground">{formatDateTime(session.logout_at)}</span>
                        : <span className="text-muted-foreground text-xs">—</span>
                      }
                    </td>
                    <td className="px-4 py-3 font-medium text-foreground">{formatDuration(session.duration_mins)}</td>
                    <td className="px-4 py-3 text-foreground font-mono text-xs">{session.ip_address || '—'}</td>
                    <td className="px-4 py-3 text-foreground">{getDeviceSummary(session.details)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {!loading && sessions.length > 0 && (
        <p className="text-xs text-muted-foreground">
          Showing {sessions.length} record{sessions.length !== 1 ? 's' : ''}.
          {' '}Session duration is only available for logins recorded after logout tracking was enabled.
        </p>
      )}
    </div>
  );
};

export default AuditLogTab;
