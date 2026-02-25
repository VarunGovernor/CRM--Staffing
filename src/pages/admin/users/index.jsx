import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Header from '../../../components/ui/Header';
import Sidebar from '../../../components/ui/Sidebar';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Select from '../../../components/ui/Select';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/AuthContext';

const ROLES = ['recruiter', 'sales', 'hr', 'finance', 'employee', 'admin'];
const ROLE_LABELS = {
  recruiter: 'Recruiter',
  sales: 'Sales',
  hr: 'HR',
  finance: 'Finance / Payroll',
  employee: 'Employee',
  admin: 'Admin',
};
const ROLE_COLORS = {
  recruiter: 'bg-blue-100 text-blue-700',
  sales: 'bg-green-100 text-green-700',
  hr: 'bg-purple-100 text-purple-700',
  finance: 'bg-orange-100 text-orange-700',
  employee: 'bg-gray-100 text-gray-700',
  admin: 'bg-red-100 text-red-700',
};

const AdminUsers = () => {
  const { user, userProfile } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending'); // 'all' | 'pending' | 'approved'
  const [approveModal, setApproveModal] = useState(null); // { user } | null
  const [selectedRole, setSelectedRole] = useState('recruiter');
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*, approver:approved_by(full_name)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = users.filter(u => {
    if (filter === 'pending') return !u.is_approved;
    if (filter === 'approved') return u.is_approved;
    return true;
  });

  const pendingCount = users.filter(u => !u.is_approved).length;

  const handleOpenApprove = (u) => {
    setSelectedRole(u.requested_role || u.role || 'recruiter');
    setApproveModal(u);
  };

  const handleApprove = async () => {
    if (!approveModal) return;
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          is_approved: true,
          role: selectedRole,
          approved_by: userProfile?.id,
          approved_at: new Date().toISOString(),
        })
        .eq('id', approveModal.id);
      if (error) throw error;
      setApproveModal(null);
      showToast(`${approveModal.full_name} approved as ${ROLE_LABELS[selectedRole]}`);
      fetchUsers();
    } catch (error) {
      showToast('Failed to approve user. Please try again.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleChangeRole = async (userId, newRole) => {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ role: newRole })
        .eq('id', userId);
      if (error) throw error;
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
      showToast('Role updated successfully');
    } catch (error) {
      showToast('Failed to update role.', 'error');
    }
  };

  const handleToggleActive = async (u) => {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ is_active: !u.is_active })
        .eq('id', u.id);
      if (error) throw error;
      setUsers(prev => prev.map(p => p.id === u.id ? { ...p, is_active: !p.is_active } : p));
      showToast(`${u.full_name} ${u.is_active ? 'deactivated' : 'reactivated'}`);
    } catch (error) {
      showToast('Failed to update status.', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)} isSidebarOpen={isSidebarOpen} />
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <main className="lg:ml-64 pt-16">
        <div className="p-4 lg:p-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-1">User Management</h1>
                <p className="text-muted-foreground">Approve new users and manage roles</p>
              </div>
              {pendingCount > 0 && (
                <div className="flex items-center gap-2 px-4 py-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <Icon name="Clock" size={16} className="text-yellow-600" />
                  <span className="text-sm font-medium text-yellow-700">{pendingCount} pending approval{pendingCount > 1 ? 's' : ''}</span>
                </div>
              )}
            </div>

            {/* Filter tabs */}
            <div className="flex gap-2 mb-6">
              {[
                { key: 'pending', label: 'Pending', count: users.filter(u => !u.is_approved).length },
                { key: 'approved', label: 'Approved', count: users.filter(u => u.is_approved).length },
                { key: 'all', label: 'All Users', count: users.length },
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                    filter === tab.key
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {tab.label}
                  <span className={`px-1.5 py-0.5 rounded-full text-xs ${
                    filter === tab.key ? 'bg-white/20' : 'bg-background'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Table */}
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                  <Icon name="Users" size={40} className="mb-3 opacity-30" />
                  <p className="font-medium">No {filter === 'all' ? '' : filter} users</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b border-border bg-muted/40">
                      <tr>
                        {['User', 'Email', 'Requested Role', 'Assigned Role', 'Status', 'Registered', 'Actions'].map(h => (
                          <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filteredUsers.map(u => (
                        <tr key={u.id} className="hover:bg-muted/20 transition-colors">
                          {/* Name */}
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                                {u.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                              </div>
                              <span className="font-medium text-foreground whitespace-nowrap">{u.full_name}</span>
                            </div>
                          </td>

                          {/* Email */}
                          <td className="px-4 py-3 text-muted-foreground">{u.email}</td>

                          {/* Requested role */}
                          <td className="px-4 py-3">
                            {u.requested_role ? (
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_COLORS[u.requested_role] || 'bg-gray-100 text-gray-700'}`}>
                                {ROLE_LABELS[u.requested_role] || u.requested_role}
                              </span>
                            ) : <span className="text-muted-foreground text-xs">—</span>}
                          </td>

                          {/* Assigned role (editable) */}
                          <td className="px-4 py-3">
                            {u.is_approved ? (
                              <Select
                                value={u.role}
                                onChange={(e) => handleChangeRole(u.id, e.target.value)}
                                className="text-xs py-1 h-8 min-w-[130px]"
                                disabled={u.id === userProfile?.id} // can't change own role
                              >
                                {ROLES.map(r => (
                                  <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                                ))}
                              </Select>
                            ) : (
                              <span className="text-muted-foreground text-xs italic">Pending</span>
                            )}
                          </td>

                          {/* Status */}
                          <td className="px-4 py-3">
                            {!u.is_approved ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                                <Icon name="Clock" size={10} /> Pending
                              </span>
                            ) : u.is_active ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                <Icon name="CheckCircle" size={10} /> Active
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                                <Icon name="XCircle" size={10} /> Inactive
                              </span>
                            )}
                          </td>

                          {/* Registered */}
                          <td className="px-4 py-3 text-muted-foreground whitespace-nowrap text-xs">
                            {new Date(u.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </td>

                          {/* Actions */}
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              {!u.is_approved ? (
                                <Button size="sm" variant="default" onClick={() => handleOpenApprove(u)}
                                  className="text-xs h-7 px-3">
                                  Approve
                                </Button>
                              ) : (
                                u.id !== userProfile?.id && (
                                  <button onClick={() => handleToggleActive(u)}
                                    className={`text-xs px-3 h-7 rounded-md border transition-colors ${
                                      u.is_active
                                        ? 'border-red-200 text-red-600 hover:bg-red-50'
                                        : 'border-green-200 text-green-600 hover:bg-green-50'
                                    }`}>
                                    {u.is_active ? 'Deactivate' : 'Reactivate'}
                                  </button>
                                )
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </motion.div>
        </div>
      </main>

      {/* Approve Modal */}
      {approveModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="bg-card border border-border rounded-xl shadow-xl w-full max-w-md p-6 space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Approve User</h2>
                <p className="text-sm text-muted-foreground mt-0.5">Assign a role and grant access</p>
              </div>
              <button onClick={() => setApproveModal(null)} className="text-muted-foreground hover:text-foreground">
                <Icon name="X" size={20} />
              </button>
            </div>

            {/* User summary */}
            <div className="bg-muted rounded-lg p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Name</span>
                <span className="font-medium">{approveModal.full_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Email</span>
                <span className="font-medium">{approveModal.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Requested role</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_COLORS[approveModal.requested_role] || 'bg-gray-100 text-gray-700'}`}>
                  {ROLE_LABELS[approveModal.requested_role] || approveModal.requested_role || '—'}
                </span>
              </div>
            </div>

            {/* Role selector */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Assign Role</label>
              <Select value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)}>
                {ROLES.map(r => (
                  <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                ))}
              </Select>
              <p className="text-xs text-muted-foreground">This determines what the user can see and do in the CRM.</p>
            </div>

            <div className="flex gap-3 pt-1">
              <Button variant="outline" size="md" fullWidth onClick={() => setApproveModal(null)} disabled={actionLoading}>
                Cancel
              </Button>
              <Button variant="default" size="md" fullWidth onClick={handleApprove} loading={actionLoading} disabled={actionLoading}
                className="bg-gradient-to-r from-primary to-secondary">
                {actionLoading ? 'Approving...' : 'Approve & Grant Access'}
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg text-sm font-medium ${
          toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-green-600 text-white'
        }`}>
          <Icon name={toast.type === 'error' ? 'AlertCircle' : 'CheckCircle'} size={16} />
          {toast.message}
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
