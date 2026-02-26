import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Header from '../../components/ui/Header';
import Sidebar from '../../components/ui/Sidebar';
import Icon from '../../components/AppIcon';
import Select from '../../components/ui/Select';
import { supabase } from '../../lib/supabase';
import { getTodayClockStats, getAllClockEntries } from '../../lib/clockTracker';
import { useAuth } from '../../contexts/AuthContext';

const AdminActivity = () => {
  const { userProfile } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('today');
  const [stats, setStats] = useState({
    totalClockIns: 0,
    currentlyClockedIn: 0,
    totalHours: 0,
    totalLogins: 0
  });
  const [activityLog, setActivityLog] = useState([]);
  const [clockEntries, setClockEntries] = useState([]);

  useEffect(() => {
    fetchData();
  }, [filter]);

  const getDateRange = () => {
    const now = new Date();
    const start = new Date();

    switch (filter) {
      case 'today':
        start.setHours(0, 0, 0, 0);
        break;
      case 'week':
        start.setDate(now.getDate() - 7);
        start.setHours(0, 0, 0, 0);
        break;
      case 'month':
        start.setDate(now.getDate() - 30);
        start.setHours(0, 0, 0, 0);
        break;
      default:
        start.setHours(0, 0, 0, 0);
    }

    return { startDate: start.toISOString(), endDate: now.toISOString() };
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const { startDate, endDate } = getDateRange();

      // Fetch clock entries
      const { data: clockData } = await getAllClockEntries({
        startDate,
        endDate,
        limit: 100
      });

      // Fetch audit log entries (logins/logouts)
      const { data: auditData } = await supabase
        .from('audit_logs')
        .select('*')
        .in('action', ['auth.login', 'auth.logout'])
        .gte('timestamp', startDate)
        .lte('timestamp', endDate)
        .order('timestamp', { ascending: false })
        .limit(100);

      // Calculate stats
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayClock = clockData?.filter(e =>
        new Date(e.clock_in) >= todayStart
      ) || [];

      const currentlyClockedIn = todayClock.filter(e => !e.clock_out).length;
      const totalMinutes = clockData?.reduce((sum, e) => sum + (e.duration_minutes || 0), 0) || 0;
      const loginCount = auditData?.filter(a => a.action === 'auth.login').length || 0;

      setStats({
        totalClockIns: clockData?.length || 0,
        currentlyClockedIn,
        totalHours: Math.round((totalMinutes / 60) * 10) / 10,
        totalLogins: loginCount
      });

      setClockEntries(clockData || []);

      // Combine and sort activity log
      const combined = [
        ...(clockData || []).map(entry => ({
          id: entry.id,
          userName: entry.user?.full_name || 'Unknown',
          userEmail: entry.user?.email || '',
          userRole: entry.user?.role || '',
          action: entry.clock_out ? 'Clock Out' : 'Clock In',
          actionType: entry.clock_out ? 'clock_out' : 'clock_in',
          timestamp: entry.clock_out || entry.clock_in,
          duration: entry.duration_minutes
            ? `${Math.floor(entry.duration_minutes / 60)}h ${entry.duration_minutes % 60}m`
            : entry.clock_out ? '0m' : 'Active'
        })),
        ...(auditData || []).map(entry => ({
          id: entry.id,
          userName: entry.details?.full_name || entry.user_email?.split('@')[0] || 'Unknown',
          userEmail: entry.user_email || '',
          userRole: entry.user_role || '',
          action: entry.action === 'auth.login' ? 'Login' : 'Logout',
          actionType: entry.action === 'auth.login' ? 'login' : 'logout',
          timestamp: entry.timestamp,
          duration: '-'
        }))
      ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      setActivityLog(combined);
    } catch (error) {
      console.error('Error fetching activity data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTimestamp = (ts) => {
    if (!ts) return '-';
    const date = new Date(ts);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const kpiCards = [
    {
      label: 'Total Clock-Ins',
      value: stats.totalClockIns,
      icon: 'Timer',
      color: 'text-primary',
      bgColor: 'bg-primary/10'
    },
    {
      label: 'Currently Clocked In',
      value: stats.currentlyClockedIn,
      icon: 'UserCheck',
      color: 'text-success',
      bgColor: 'bg-success/10'
    },
    {
      label: 'Total Hours',
      value: stats.totalHours,
      icon: 'Clock',
      color: 'text-accent',
      bgColor: 'bg-accent/10'
    },
    {
      label: 'Total Logins',
      value: stats.totalLogins,
      icon: 'LogIn',
      color: 'text-warning',
      bgColor: 'bg-warning/10'
    }
  ];

  const getActionBadge = (type) => {
    switch (type) {
      case 'clock_in':
        return 'bg-success/10 text-success border-success/30';
      case 'clock_out':
        return 'bg-error/10 text-error border-error/30';
      case 'login':
        return 'bg-primary/10 text-primary border-primary/30';
      case 'logout':
        return 'bg-muted text-muted-foreground border-border';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  if (userProfile && userProfile.role !== 'admin') {
    return (
      <div className="min-h-screen bg-background">
        <Header onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)} isSidebarOpen={isSidebarOpen} />
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        <main className="lg:ml-64 pt-16">
          <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center">
              <Icon name="ShieldOff" size={28} className="text-red-500" />
            </div>
            <h2 className="text-xl font-semibold text-foreground">Admin Access Only</h2>
            <p className="text-muted-foreground text-sm">You don't have permission to view the Activity Log.</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)} isSidebarOpen={isSidebarOpen} />
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <main className="lg:ml-64 pt-16">
        <motion.div
          initial={false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="p-4 lg:p-6"
        >
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
            <div className="flex items-center space-x-4 mb-4 sm:mb-0">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <Icon name="Activity" size={24} className="text-primary" />
              </div>
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Activity Log</h1>
                <p className="text-muted-foreground">Monitor user logins, logouts, and clock activity</p>
              </div>
            </div>
            <div className="w-40">
              <Select
                options={[
                  { value: 'today', label: 'Today' },
                  { value: 'week', label: 'Last 7 Days' },
                  { value: 'month', label: 'Last 30 Days' }
                ]}
                value={filter}
                onChange={(e) => setFilter(e?.target?.value)}
              />
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
            {kpiCards.map((card, index) => (
              <motion.div
                key={card.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="bg-card border border-border rounded-xl p-5"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-muted-foreground">{card.label}</span>
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${card.bgColor}`}>
                    <Icon name={card.icon} size={18} className={card.color} />
                  </div>
                </div>
                <div className="text-2xl font-bold text-foreground">
                  {loading ? '...' : card.value}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Currently Clocked In */}
          {stats.currentlyClockedIn > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.4 }}
              className="bg-card border border-border rounded-xl p-6 mb-6"
            >
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-2.5 h-2.5 bg-success rounded-full animate-pulse" />
                <h2 className="text-lg font-semibold text-foreground">Currently Clocked In</h2>
              </div>
              <div className="flex flex-wrap gap-3">
                {clockEntries
                  .filter(e => !e.clock_out)
                  .map(entry => {
                    const start = new Date(entry.clock_in);
                    const diffMs = Date.now() - start.getTime();
                    const hours = Math.floor(diffMs / 3600000);
                    const mins = Math.floor((diffMs % 3600000) / 60000);
                    const elapsed = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
                    return (
                      <div key={entry.id} className="flex items-center space-x-3 bg-success/5 border border-success/20 rounded-lg px-4 py-2">
                        <div className="w-8 h-8 bg-success/10 rounded-full flex items-center justify-center">
                          <span className="text-xs font-semibold text-success">
                            {entry.user?.full_name?.split(' ')?.map(n => n?.[0])?.join('')?.toUpperCase() || '?'}
                          </span>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-foreground">{entry.user?.full_name || 'Unknown'}</span>
                          <span className="text-xs text-muted-foreground ml-2">{elapsed}</span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </motion.div>
          )}

          {/* Activity Log Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.5 }}
            className="bg-card border border-border rounded-xl overflow-hidden"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="text-lg font-semibold text-foreground">Activity Log</h2>
              <span className="text-sm text-muted-foreground">{activityLog.length} entries</span>
            </div>

            {loading ? (
              <div className="p-12 text-center text-muted-foreground">
                <Icon name="Loader2" size={24} className="mx-auto mb-2 animate-spin" />
                Loading activity data...
              </div>
            ) : activityLog.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground">
                <Icon name="Activity" size={32} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">No activity found for the selected period</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">User</th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Action</th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Time</th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Duration</th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Role</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {activityLog.map((entry) => (
                      <tr key={`${entry.actionType}-${entry.id}`} className="hover:bg-muted/20 transition-smooth">
                        <td className="px-6 py-3">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                              <span className="text-xs font-semibold text-primary">
                                {entry.userName?.split(' ')?.map(n => n?.[0])?.join('')?.toUpperCase() || '?'}
                              </span>
                            </div>
                            <div>
                              <div className="text-sm font-medium text-foreground">{entry.userName}</div>
                              <div className="text-xs text-muted-foreground">{entry.userEmail}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-3">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getActionBadge(entry.actionType)}`}>
                            {entry.action}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-sm text-foreground">
                          {formatTimestamp(entry.timestamp)}
                        </td>
                        <td className="px-6 py-3 text-sm text-foreground">
                          {entry.duration}
                        </td>
                        <td className="px-6 py-3">
                          <span className="text-xs text-muted-foreground capitalize">
                            {entry.userRole?.replace('_', ' ') || '-'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
};

export default AdminActivity;
