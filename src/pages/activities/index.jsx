import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Header from '../../components/ui/Header';
import Sidebar from '../../components/ui/Sidebar';
import Icon from '../../components/AppIcon';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

// ─── Constants ───────────────────────────────────────────────────────────────

const ACTIVITY_TYPES = [
  { value: 'call',      label: 'Call',         icon: 'Phone',        color: 'bg-blue-100 text-blue-700' },
  { value: 'email',     label: 'Email',        icon: 'Mail',         color: 'bg-purple-100 text-purple-700' },
  { value: 'meeting',   label: 'Meeting',      icon: 'Users',        color: 'bg-green-100 text-green-700' },
  { value: 'follow_up', label: 'Follow-up',    icon: 'ArrowRightCircle', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'task',      label: 'Task',         icon: 'CheckSquare',  color: 'bg-gray-100 text-gray-700' },
  { value: 'note',      label: 'Note',         icon: 'FileText',     color: 'bg-orange-100 text-orange-700' },
];

const PRIORITIES = [
  { value: 'low',    label: 'Low',    color: 'text-gray-500' },
  { value: 'medium', label: 'Medium', color: 'text-yellow-600' },
  { value: 'high',   label: 'High',   color: 'text-red-600' },
];

const getTypeConfig = (type) => ACTIVITY_TYPES.find(t => t.value === type) || ACTIVITY_TYPES[4];

const getPriorityColor = (priority) => ({
  low:    'bg-gray-100 text-gray-600',
  medium: 'bg-yellow-100 text-yellow-700',
  high:   'bg-red-100 text-red-700',
}[priority] || 'bg-gray-100 text-gray-600');

const emptyForm = {
  type: 'call',
  title: '',
  description: '',
  activity_date: new Date().toISOString().split('T')[0],
  due_date: '',
  due_time: '',
  hours_logged: '',
  priority: 'medium',
  assigned_to: '',
  reminder_at: '',
  notes: '',
};

// ─── Activity Form Modal ─────────────────────────────────────────────────────

const ActivityFormModal = ({ activity, users, currentUserId, isAdmin, onClose, onSave }) => {
  const [form, setForm] = useState(() => {
    if (activity) {
      return {
        type: activity.type || 'call',
        title: activity.title || '',
        description: activity.description || '',
        activity_date: activity.activity_date || new Date().toISOString().split('T')[0],
        due_date: activity.due_date ? activity.due_date.split('T')[0] : '',
        due_time: activity.due_date ? activity.due_date.slice(11, 16) : '',
        hours_logged: activity.hours_logged || '',
        priority: activity.priority || 'medium',
        assigned_to: activity.assigned_to || '',
        reminder_at: activity.reminder_at ? activity.reminder_at.slice(0, 16) : '',
        notes: activity.notes || '',
      };
    }
    return { ...emptyForm, assigned_to: currentUserId || '' };
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!form.title.trim()) { setError('Title is required.'); return; }
    setSaving(true);
    setError('');

    const due_date = form.due_date
      ? new Date(`${form.due_date}T${form.due_time || '00:00'}`).toISOString()
      : null;

    const payload = {
      type: form.type,
      title: form.title.trim(),
      description: form.description || null,
      activity_date: form.activity_date || null,
      due_date,
      hours_logged: form.hours_logged !== '' ? parseFloat(form.hours_logged) : null,
      priority: form.priority,
      assigned_to: form.assigned_to || null,
      reminder_at: form.reminder_at ? new Date(form.reminder_at).toISOString() : null,
      notes: form.notes || null,
    };

    try {
      if (activity) {
        const { error: err } = await supabase.from('crm_activities').update(payload).eq('id', activity.id);
        if (err) throw err;
        onSave({ ...activity, ...payload, due_date });
      } else {
        const { data, error: err } = await supabase.from('crm_activities').insert([{ ...payload, completed: false }]).select().single();
        if (err) throw err;
        onSave(data);
      }
      onClose();
    } catch (e) {
      setError(e.message || 'Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  const F = ({ label, children }) => (
    <div>
      <label className="block text-sm font-medium text-foreground mb-1">{label}</label>
      {children}
    </div>
  );

  const inputCls = "w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary";

  return (
    <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <motion.div className="relative bg-card border border-border rounded-2xl shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto" initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} transition={{ duration: 0.2 }}>
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-lg font-semibold text-card-foreground">{activity ? 'Edit Activity' : 'Add Activity'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg transition-colors"><Icon name="X" size={18} className="text-muted-foreground" /></button>
        </div>
        <div className="p-6 space-y-4">
          {error && <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm"><Icon name="AlertCircle" size={15} />{error}</div>}

          <div className="grid grid-cols-2 gap-4">
            <F label="Type">
              <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))} className={inputCls}>
                {ACTIVITY_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </F>
            <F label="Priority">
              <select value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))} className={inputCls}>
                {PRIORITIES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </F>
          </div>

          <F label="Title *">
            <input type="text" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} className={inputCls} placeholder="Activity title..." />
          </F>

          <F label="Description">
            <textarea rows={2} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} className={`${inputCls} resize-none`} placeholder="Optional details..." />
          </F>

          <div className="grid grid-cols-2 gap-4">
            <F label="Activity Date">
              <input type="date" value={form.activity_date} onChange={e => setForm(p => ({ ...p, activity_date: e.target.value }))} className={inputCls} />
            </F>
            <F label="Hours Logged">
              <input type="number" step="0.25" min="0" value={form.hours_logged} onChange={e => setForm(p => ({ ...p, hours_logged: e.target.value }))} className={inputCls} placeholder="0.0" />
            </F>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <F label="Due Date">
              <input type="date" value={form.due_date} onChange={e => setForm(p => ({ ...p, due_date: e.target.value }))} className={inputCls} />
            </F>
            <F label="Due Time">
              <input type="time" value={form.due_time} onChange={e => setForm(p => ({ ...p, due_time: e.target.value }))} className={inputCls} />
            </F>
          </div>

          <F label="Assign To">
            <select value={form.assigned_to} onChange={e => setForm(p => ({ ...p, assigned_to: e.target.value }))} className={inputCls}>
              <option value="">Unassigned</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.full_name} ({u.role})</option>)}
            </select>
          </F>

          <F label="Reminder">
            <input type="datetime-local" value={form.reminder_at} onChange={e => setForm(p => ({ ...p, reminder_at: e.target.value }))} className={inputCls} />
          </F>

          <F label="Notes">
            <textarea rows={2} value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} className={`${inputCls} resize-none`} placeholder="Internal notes..." />
          </F>
        </div>
        <div className="flex items-center justify-end gap-3 p-6 border-t border-border">
          <button onClick={onClose} className="px-4 py-2 border border-border rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-60">
            {saving ? <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" /> : <Icon name="Save" size={15} />}
            {saving ? 'Saving...' : (activity ? 'Save Changes' : 'Add Activity')}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ─── Activity Card ────────────────────────────────────────────────────────────

const ActivityCard = ({ activity, users, onEdit, onComplete, onDelete, isDeleting, onConfirmDelete, onCancelDelete }) => {
  const typeConfig = getTypeConfig(activity.type);
  const assignedUser = users.find(u => u.id === activity.assigned_to);
  const isOverdue = activity.due_date && !activity.completed && new Date(activity.due_date) < new Date();
  const hasReminder = activity.reminder_at && new Date(activity.reminder_at) > new Date(Date.now() - 3600000);

  return (
    <div className={`bg-card border rounded-xl p-4 transition-all ${activity.completed ? 'opacity-60 border-border' : isOverdue ? 'border-red-300 bg-red-50/30' : 'border-border hover:border-primary/30'}`}>
      <div className="flex items-start gap-3">
        {/* Type icon */}
        <div className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center ${typeConfig.color}`}>
          <Icon name={typeConfig.icon} size={16} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className={`font-medium text-sm ${activity.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                  {activity.title}
                </p>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(activity.priority)}`}>
                  {activity.priority}
                </span>
                {activity.completed && (
                  <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">Done</span>
                )}
                {isOverdue && !activity.completed && (
                  <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-medium">Overdue</span>
                )}
              </div>

              {activity.description && (
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{activity.description}</p>
              )}

              <div className="flex items-center gap-4 mt-2 flex-wrap">
                {activity.activity_date && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Icon name="Calendar" size={11} />
                    {new Date(activity.activity_date).toLocaleDateString()}
                  </span>
                )}
                {activity.due_date && (
                  <span className={`text-xs flex items-center gap-1 ${isOverdue ? 'text-red-600 font-medium' : 'text-muted-foreground'}`}>
                    <Icon name="Clock" size={11} />
                    Due: {new Date(activity.due_date).toLocaleDateString()}
                  </span>
                )}
                {activity.hours_logged != null && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Icon name="Timer" size={11} />
                    {activity.hours_logged}h logged
                  </span>
                )}
                {assignedUser && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Icon name="User" size={11} />
                    {assignedUser.full_name}
                  </span>
                )}
                {activity.reminder_at && (
                  <span className="text-xs text-blue-600 flex items-center gap-1">
                    <Icon name="Bell" size={11} />
                    Reminder: {new Date(activity.reminder_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </div>

              {activity.notes && (
                <p className="text-xs text-muted-foreground italic mt-1 border-l-2 border-muted pl-2">{activity.notes}</p>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 flex-shrink-0">
              {!activity.completed && (
                <button onClick={() => onComplete(activity.id)} className="p-1.5 rounded-lg hover:bg-green-50 text-muted-foreground hover:text-green-600 transition-colors" title="Mark complete">
                  <Icon name="CheckCircle" size={15} />
                </button>
              )}
              <button onClick={() => onEdit(activity)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" title="Edit">
                <Icon name="Pencil" size={14} />
              </button>
              {isDeleting ? (
                <div className="flex items-center gap-1">
                  <button onClick={() => onConfirmDelete(activity.id)} className="px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700">Yes</button>
                  <button onClick={onCancelDelete} className="px-2 py-1 bg-muted text-foreground rounded text-xs">No</button>
                </div>
              ) : (
                <button onClick={() => onDelete(activity.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-600 transition-colors" title="Delete">
                  <Icon name="Trash2" size={14} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Main Activities Page ─────────────────────────────────────────────────────

const Activities = () => {
  const { user, userProfile } = useAuth();
  const isAdmin = userProfile?.role === 'admin' || userProfile?.role === 'manager';
  const isRecruiter = userProfile?.role === 'recruiter';

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activities, setActivities] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [modalActivity, setModalActivity] = useState(undefined); // undefined=closed, null=new, obj=edit
  const [deletingId, setDeletingId] = useState(null);

  // Filters
  const [filters, setFilters] = useState({
    search: '',
    type: '',
    status: '',
    assignedTo: '',
    priority: '',
    dateFrom: '',
    dateTo: '',
  });

  useEffect(() => {
    fetchUsers();
    fetchActivities();
  }, [user, userProfile]);

  const fetchUsers = async () => {
    const { data } = await supabase
      .from('user_profiles')
      .select('id, full_name, role')
      .in('role', ['admin', 'recruiter', 'manager', 'hr', 'accounts'])
      .eq('is_active', true)
      .order('full_name');
    setUsers(data || []);
  };

  const fetchActivities = async () => {
    if (!user) return;
    try {
      setLoading(true);
      let query = supabase.from('crm_activities').select('*').order('activity_date', { ascending: false });

      // Recruiters only see their own activities
      if (isRecruiter && user?.id) {
        query = query.eq('assigned_to', user.id);
      }

      const { data, error } = await query;
      if (error) throw error;
      setActivities(data || []);
    } catch (err) {
      console.error('Activities fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = (savedActivity) => {
    if (modalActivity === null) {
      // New activity
      setActivities(prev => [savedActivity, ...prev]);
    } else {
      // Update
      setActivities(prev => prev.map(a => a.id === savedActivity.id ? { ...a, ...savedActivity } : a));
    }
  };

  const handleComplete = async (id) => {
    try {
      const { error } = await supabase.from('crm_activities').update({ completed: true }).eq('id', id);
      if (error) throw error;
      setActivities(prev => prev.map(a => a.id === id ? { ...a, completed: true } : a));
    } catch (err) {
      console.error('Complete error:', err);
    }
  };

  const handleDelete = async (id) => {
    try {
      const { error } = await supabase.from('crm_activities').delete().eq('id', id);
      if (error) throw error;
      setActivities(prev => prev.filter(a => a.id !== id));
    } catch (err) {
      console.error('Delete error:', err);
    } finally {
      setDeletingId(null);
    }
  };

  // Reminders due today/overdue
  const dueReminders = useMemo(() => {
    const now = new Date();
    const todayEnd = new Date(now); todayEnd.setHours(23, 59, 59);
    return activities.filter(a =>
      a.reminder_at &&
      !a.completed &&
      new Date(a.reminder_at) <= todayEnd
    );
  }, [activities]);

  const filteredActivities = useMemo(() => {
    return activities.filter(a => {
      if (filters.search) {
        const t = filters.search.toLowerCase();
        if (!(a.title?.toLowerCase().includes(t) || a.description?.toLowerCase().includes(t) || a.notes?.toLowerCase().includes(t))) return false;
      }
      if (filters.type && a.type !== filters.type) return false;
      if (filters.priority && a.priority !== filters.priority) return false;
      if (filters.assignedTo && a.assigned_to !== filters.assignedTo) return false;
      if (filters.status === 'completed' && !a.completed) return false;
      if (filters.status === 'pending' && (a.completed || (a.due_date && new Date(a.due_date) < new Date()))) return false;
      if (filters.status === 'overdue' && (!a.due_date || a.completed || new Date(a.due_date) >= new Date())) return false;
      if (filters.dateFrom && a.activity_date && a.activity_date < filters.dateFrom) return false;
      if (filters.dateTo && a.activity_date && a.activity_date > filters.dateTo) return false;
      return true;
    });
  }, [activities, filters]);

  // Stats
  const stats = useMemo(() => ({
    total: activities.length,
    completed: activities.filter(a => a.completed).length,
    overdue: activities.filter(a => a.due_date && !a.completed && new Date(a.due_date) < new Date()).length,
    hoursLogged: activities.reduce((sum, a) => sum + (parseFloat(a.hours_logged) || 0), 0).toFixed(1),
  }), [activities]);

  const clearFilters = () => setFilters({ search: '', type: '', status: '', assignedTo: '', priority: '', dateFrom: '', dateTo: '' });
  const hasFilters = Object.values(filters).some(v => v !== '');

  const inputCls = "px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary";

  return (
    <div className="min-h-screen bg-background">
      <Header onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)} isSidebarOpen={isSidebarOpen} />
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <main className="lg:ml-64 pt-16">
        <div className="p-4 lg:p-6">
          <motion.div initial={false} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-1">Activities</h1>
                <p className="text-muted-foreground">Daily log — calls, emails, meetings, follow-ups &amp; tasks</p>
              </div>
              <button
                onClick={() => setModalActivity(null)}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                <Icon name="Plus" size={16} />
                Add Activity
              </button>
            </div>

            {/* Reminder banner */}
            {dueReminders.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-5 flex items-start gap-3">
                <Icon name="Bell" size={18} className="text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-blue-800 mb-1">
                    {dueReminders.length} reminder{dueReminders.length > 1 ? 's' : ''} due today
                  </p>
                  {dueReminders.slice(0, 3).map(a => (
                    <p key={a.id} className="text-xs text-blue-700">• {a.title}</p>
                  ))}
                  {dueReminders.length > 3 && <p className="text-xs text-blue-600 mt-0.5">+{dueReminders.length - 3} more</p>}
                </div>
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {[
                { label: 'Total Activities', value: stats.total, icon: 'Activity', color: 'text-foreground' },
                { label: 'Completed', value: stats.completed, icon: 'CheckCircle', color: 'text-green-600' },
                { label: 'Overdue', value: stats.overdue, icon: 'AlertCircle', color: 'text-red-600' },
                { label: 'Hours Logged', value: `${stats.hoursLogged}h`, icon: 'Timer', color: 'text-primary' },
              ].map(stat => (
                <div key={stat.label} className="bg-card p-5 rounded-xl border border-border flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                    <Icon name={stat.icon} size={18} className={stat.color} />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                    <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Filters */}
            <div className="bg-card rounded-xl border border-border p-4 mb-5">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="relative md:col-span-2">
                  <Icon name="Search" size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search activities..."
                    value={filters.search}
                    onChange={(e) => setFilters(p => ({ ...p, search: e.target.value }))}
                    className={`${inputCls} w-full pl-9`}
                  />
                </div>
                <select value={filters.type} onChange={e => setFilters(p => ({ ...p, type: e.target.value }))} className={`${inputCls} w-full`}>
                  <option value="">All Types</option>
                  {ACTIVITY_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
                <select value={filters.status} onChange={e => setFilters(p => ({ ...p, status: e.target.value }))} className={`${inputCls} w-full`}>
                  <option value="">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                  <option value="overdue">Overdue</option>
                </select>
                <select value={filters.priority} onChange={e => setFilters(p => ({ ...p, priority: e.target.value }))} className={`${inputCls} w-full`}>
                  <option value="">All Priorities</option>
                  {PRIORITIES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
                {isAdmin && (
                  <select value={filters.assignedTo} onChange={e => setFilters(p => ({ ...p, assignedTo: e.target.value }))} className={`${inputCls} w-full`}>
                    <option value="">All Assignees</option>
                    {users.map(u => <option key={u.id} value={u.id}>{u.full_name}</option>)}
                  </select>
                )}
                <input type="date" value={filters.dateFrom} onChange={e => setFilters(p => ({ ...p, dateFrom: e.target.value }))} className={`${inputCls} w-full`} placeholder="From" />
                <input type="date" value={filters.dateTo} onChange={e => setFilters(p => ({ ...p, dateTo: e.target.value }))} className={`${inputCls} w-full`} placeholder="To" />
              </div>
              {hasFilters && (
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Showing {filteredActivities.length} of {activities.length}</span>
                  <button onClick={clearFilters} className="text-sm text-primary hover:underline">Clear filters</button>
                </div>
              )}
            </div>

            {/* Activity list */}
            <div className="space-y-3">
              {loading ? (
                <div className="bg-card rounded-xl border border-border p-12 text-center">
                  <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-muted-foreground">Loading activities...</p>
                </div>
              ) : filteredActivities.length === 0 ? (
                <div className="bg-card rounded-xl border border-border p-12 text-center">
                  <Icon name="Calendar" size={40} className="mx-auto mb-3 text-muted-foreground opacity-40" />
                  <p className="text-muted-foreground mb-4">
                    {activities.length === 0 ? 'No activities yet. Log your first activity!' : 'No activities match your filters.'}
                  </p>
                  <button onClick={() => setModalActivity(null)} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 mx-auto transition-colors">
                    <Icon name="Plus" size={15} />
                    Add Activity
                  </button>
                </div>
              ) : (
                filteredActivities.map(activity => (
                  <ActivityCard
                    key={activity.id}
                    activity={activity}
                    users={users}
                    onEdit={(a) => setModalActivity(a)}
                    onComplete={handleComplete}
                    onDelete={(id) => setDeletingId(id)}
                    isDeleting={deletingId === activity.id}
                    onConfirmDelete={handleDelete}
                    onCancelDelete={() => setDeletingId(null)}
                  />
                ))
              )}
            </div>

          </motion.div>
        </div>
      </main>

      {/* Add / Edit Modal */}
      <AnimatePresence>
        {modalActivity !== undefined && (
          <ActivityFormModal
            activity={modalActivity}
            users={users}
            currentUserId={user?.id}
            isAdmin={isAdmin}
            onClose={() => setModalActivity(undefined)}
            onSave={handleSave}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Activities;
