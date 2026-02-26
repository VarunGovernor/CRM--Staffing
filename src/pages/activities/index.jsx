import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Header from '../../components/ui/Header';
import Sidebar from '../../components/ui/Sidebar';
import Button from '../../components/ui/Button';
import { Checkbox } from '../../components/ui/Checkbox';
import Icon from '../../components/AppIcon';
import ActivityTimeline from './components/ActivityTimeline';
import ActivityFilters from './components/ActivityFilters';
import QuickAddActivity from './components/QuickAddActivity';
import BulkActions from './components/BulkActions';
import ActivityStats from './components/ActivityStats';
import { supabase } from '../../lib/supabase';

// ────────────────────────────────────────────────────────────────
// Edit / Reschedule modal
// ────────────────────────────────────────────────────────────────
const EditActivityModal = ({ activity, onClose, onSave }) => {
  const [form, setForm] = useState({
    type: activity?.type || 'task',
    title: activity?.title || '',
    description: activity?.description || '',
    due_date: activity?.dueDate ? new Date(activity.dueDate).toISOString().split('T')[0] : '',
    due_time: activity?.dueDate ? new Date(activity.dueDate).toTimeString().slice(0, 5) : '',
    priority: activity?.priority || 'medium',
    owner: activity?.owner || '',
    contact: activity?.contact || '',
    account: activity?.account || '',
    notes: activity?.notes || '',
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
      due_date,
      priority: form.priority,
      owner: form.owner || null,
      contact: form.contact || null,
      account: form.account || null,
      notes: form.notes || null,
    };
    try {
      const { error: err } = await supabase.from('crm_activities').update(payload).eq('id', activity.id);
      if (err) throw err;
      onSave({ ...activity, ...payload, dueDate: due_date });
      onClose();
    } catch (e) {
      setError(e.message || 'Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  const typeOptions = ['task', 'call', 'meeting', 'email', 'note'];
  const priorityOptions = ['low', 'medium', 'high'];

  return (
    <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <motion.div className="relative bg-card border border-border rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto" initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} transition={{ duration: 0.2 }}>
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-lg font-semibold text-card-foreground">Edit Activity</h2>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg transition-colors">
            <Icon name="X" size={18} className="text-muted-foreground" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          {error && <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm"><Icon name="AlertCircle" size={15} />{error}</div>}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Type</label>
              <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))} className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20">
                {typeOptions.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Priority</label>
              <select value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))} className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20">
                {priorityOptions.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Title *</label>
            <input type="text" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Description</label>
            <textarea rows={2} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Due Date</label>
              <input type="date" value={form.due_date} onChange={e => setForm(p => ({ ...p, due_date: e.target.value }))} className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Due Time</label>
              <input type="time" value={form.due_time} onChange={e => setForm(p => ({ ...p, due_time: e.target.value }))} className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Assigned To</label>
              <input type="text" value={form.owner} onChange={e => setForm(p => ({ ...p, owner: e.target.value }))} placeholder="Name" className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Contact</label>
              <input type="text" value={form.contact} onChange={e => setForm(p => ({ ...p, contact: e.target.value }))} placeholder="Contact name" className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Account</label>
            <input type="text" value={form.account} onChange={e => setForm(p => ({ ...p, account: e.target.value }))} placeholder="Account name" className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Notes</label>
            <textarea rows={2} value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none" />
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 p-6 border-t border-border">
          <button onClick={onClose} className="px-4 py-2 border border-border rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-60">
            {saving ? <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" /> : <Icon name="Save" size={15} />}
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ────────────────────────────────────────────────────────────────
// Main Activities page
// ────────────────────────────────────────────────────────────────
const Activities = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [selectedActivities, setSelectedActivities] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingActivity, setEditingActivity] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const [filters, setFilters] = useState({
    search: '',
    type: 'all',
    status: 'all',
    owner: 'all',
    priority: 'all',
    dateFrom: '',
    dateTo: ''
  });

  // ── DB helpers ──────────────────────────────────────────────
  const dbToActivity = (row) => ({
    id: row.id,
    type: row.type,
    title: row.title,
    description: row.description || '',
    dueDate: row.due_date ? new Date(row.due_date) : new Date(),
    priority: row.priority || 'medium',
    owner: row.owner || '',
    contact: row.contact || null,
    account: row.account || null,
    completed: row.completed || false,
    notes: row.notes || '',
  });

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('crm_activities')
        .select('*')
        .order('due_date', { ascending: true });
      if (error) throw error;
      setActivities((data || []).map(dbToActivity));
    } catch (err) {
      console.error('Activities fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchActivities(); }, []);

  // ── Filters ──────────────────────────────────────────────────
  const filteredActivities = useMemo(() => {
    return activities.filter(activity => {
      if (filters.search) {
        const term = filters.search.toLowerCase();
        const matches =
          activity.title?.toLowerCase().includes(term) ||
          activity.description?.toLowerCase().includes(term) ||
          (activity.contact && activity.contact.toLowerCase().includes(term)) ||
          (activity.account && activity.account.toLowerCase().includes(term));
        if (!matches) return false;
      }
      if (filters.type !== 'all' && activity.type !== filters.type) return false;
      if (filters.status !== 'all') {
        const now = new Date();
        const isOverdue = !activity.completed && new Date(activity.dueDate) < now;
        if (filters.status === 'completed' && !activity.completed) return false;
        if (filters.status === 'pending' && (activity.completed || isOverdue)) return false;
        if (filters.status === 'overdue' && !isOverdue) return false;
      }
      if (filters.owner !== 'all') {
        const ownerMap = {
          'john-doe': 'John Doe',
          'sarah-wilson': 'Sarah Wilson',
          'mike-johnson': 'Mike Johnson',
          'emily-davis': 'Emily Davis',
          'alex-brown': 'Alex Brown'
        };
        if (activity.owner !== ownerMap[filters.owner]) return false;
      }
      if (filters.priority !== 'all' && activity.priority !== filters.priority) return false;
      if (filters.dateFrom) {
        if (new Date(activity.dueDate) < new Date(filters.dateFrom)) return false;
      }
      if (filters.dateTo) {
        const toDate = new Date(filters.dateTo);
        toDate.setHours(23, 59, 59, 999);
        if (new Date(activity.dueDate) > toDate) return false;
      }
      return true;
    }).sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
  }, [activities, filters]);

  // ── CRUD ─────────────────────────────────────────────────────
  const handleAddActivity = async (newActivity) => {
    // QuickAddActivity calls onAdd with a local object; we persist it to DB
    const due_date = newActivity.dueDate ? new Date(newActivity.dueDate).toISOString() : null;
    const payload = {
      type: newActivity.type,
      title: newActivity.title,
      description: newActivity.description || null,
      due_date,
      priority: newActivity.priority,
      owner: newActivity.owner || null,
      contact: newActivity.contact || null,
      account: newActivity.account || null,
      notes: newActivity.notes || null,
      completed: false,
    };
    try {
      const { data, error } = await supabase.from('crm_activities').insert([payload]).select().single();
      if (error) throw error;
      setActivities(prev => [dbToActivity(data), ...prev]);
    } catch (err) {
      console.error('Failed to add activity:', err);
      // Fallback: show locally
      setActivities(prev => [newActivity, ...prev]);
    }
  };

  const handleEditActivity = (activity) => {
    setEditingActivity(activity);
  };

  const handleEditSave = (updated) => {
    setActivities(prev => prev.map(a => a.id === updated.id ? { ...a, ...updated } : a));
    setEditingActivity(null);
  };

  const handleCompleteActivity = async (activityId) => {
    try {
      const { error } = await supabase.from('crm_activities').update({ completed: true }).eq('id', activityId);
      if (error) throw error;
      setActivities(prev => prev.map(a => a.id === activityId ? { ...a, completed: true } : a));
    } catch (err) {
      console.error('Failed to complete activity:', err);
    }
  };

  const handleRescheduleActivity = (activity) => {
    // Open edit modal — user can change the due date there
    setEditingActivity(activity);
  };

  const handleDeleteActivity = async (activityId) => {
    try {
      const { error } = await supabase.from('crm_activities').delete().eq('id', activityId);
      if (error) throw error;
      setActivities(prev => prev.filter(a => a.id !== activityId));
      setSelectedActivities(prev => prev.filter(id => id !== activityId));
    } catch (err) {
      console.error('Failed to delete activity:', err);
    } finally {
      setDeletingId(null);
    }
  };

  // ── Selection ────────────────────────────────────────────────
  const handleSelectActivity = (activityId, checked) => {
    setSelectedActivities(prev => checked ? [...prev, activityId] : prev.filter(id => id !== activityId));
  };

  const handleSelectAll = (checked) => {
    setSelectedActivities(checked ? filteredActivities.map(a => a.id) : []);
  };

  // ── Bulk actions ──────────────────────────────────────────────
  const handleBulkComplete = async () => {
    try {
      await supabase.from('crm_activities').update({ completed: true }).in('id', selectedActivities);
      setActivities(prev => prev.map(a => selectedActivities.includes(a.id) ? { ...a, completed: true } : a));
      setSelectedActivities([]);
    } catch (err) {
      console.error('Bulk complete failed:', err);
    }
  };

  const handleBulkReassign = async (newOwner) => {
    try {
      await supabase.from('crm_activities').update({ owner: newOwner }).in('id', selectedActivities);
      setActivities(prev => prev.map(a => selectedActivities.includes(a.id) ? { ...a, owner: newOwner } : a));
      setSelectedActivities([]);
    } catch (err) {
      console.error('Bulk reassign failed:', err);
    }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Delete ${selectedActivities.length} activities?`)) return;
    try {
      await supabase.from('crm_activities').delete().in('id', selectedActivities);
      setActivities(prev => prev.filter(a => !selectedActivities.includes(a.id)));
      setSelectedActivities([]);
    } catch (err) {
      console.error('Bulk delete failed:', err);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)} isSidebarOpen={isSidebarOpen} />
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <main className="lg:ml-64 pt-16">
        <div className="p-6">
          {/* Page Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">Activities</h1>
              <p className="text-muted-foreground">Track and manage your sales activities, tasks, and follow-ups</p>
            </div>
            <Button variant="default" onClick={() => setIsQuickAddOpen(true)} iconName="Plus" iconPosition="left">
              Quick Add Activity
            </Button>
          </div>

          <ActivityStats activities={activities} />

          <ActivityFilters
            filters={filters}
            onFilterChange={(field, value) => setFilters(prev => ({ ...prev, [field]: value }))}
            onClearFilters={() => setFilters({ search: '', type: 'all', status: 'all', owner: 'all', priority: 'all', dateFrom: '', dateTo: '' })}
            totalCount={activities.length}
            filteredCount={filteredActivities.length}
          />

          <BulkActions
            selectedCount={selectedActivities.length}
            onMarkComplete={handleBulkComplete}
            onReassign={handleBulkReassign}
            onDelete={handleBulkDelete}
            onClearSelection={() => setSelectedActivities([])}
          />

          {/* Activities List */}
          <div className="bg-card border border-border rounded-lg">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center space-x-4">
                <Checkbox
                  checked={selectedActivities.length === filteredActivities.length && filteredActivities.length > 0}
                  onChange={(e) => handleSelectAll(e?.target?.checked)}
                  className="mr-2"
                />
                <h3 className="text-lg font-semibold text-foreground">
                  Activity Timeline ({filteredActivities.length})
                </h3>
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" iconName="RefreshCw" onClick={fetchActivities}>
                  Refresh
                </Button>
              </div>
            </div>

            <div className="p-6">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : filteredActivities.length === 0 ? (
                <div className="text-center py-12">
                  <Icon name="Calendar" size={48} className="text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No activities found</h3>
                  <p className="text-muted-foreground mb-4">
                    {activities.length === 0 ? 'Get started by creating your first activity' : 'Try adjusting your filters'}
                  </p>
                  <Button variant="outline" onClick={() => setIsQuickAddOpen(true)} iconName="Plus" iconPosition="left">
                    Add Activity
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredActivities.map((activity) => (
                    <div key={activity.id} className="flex items-start space-x-4">
                      <Checkbox
                        checked={selectedActivities.includes(activity.id)}
                        onChange={(e) => handleSelectActivity(activity.id, e?.target?.checked)}
                        className="mt-6"
                      />
                      <div className="flex-1">
                        <ActivityTimeline
                          activities={[activity]}
                          onEdit={handleEditActivity}
                          onComplete={handleCompleteActivity}
                          onReschedule={handleRescheduleActivity}
                        />
                      </div>
                      {/* Delete button per row */}
                      <div className="mt-4 flex-shrink-0">
                        {deletingId === activity.id ? (
                          <div className="flex items-center gap-1">
                            <button onClick={() => handleDeleteActivity(activity.id)} className="px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700">Yes</button>
                            <button onClick={() => setDeletingId(null)} className="px-2 py-1 bg-muted text-foreground rounded text-xs">No</button>
                          </div>
                        ) : (
                          <button onClick={() => setDeletingId(activity.id)} className="p-1.5 rounded hover:bg-red-50 transition-colors text-muted-foreground hover:text-red-600" title="Delete">
                            <Icon name="Trash2" size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <QuickAddActivity
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        onAdd={handleAddActivity}
      />

      <AnimatePresence>
        {editingActivity && (
          <EditActivityModal
            activity={editingActivity}
            onClose={() => setEditingActivity(null)}
            onSave={handleEditSave}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Activities;
