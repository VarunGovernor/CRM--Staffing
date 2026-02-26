import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Header from '../../components/ui/Header';
import Sidebar from '../../components/ui/Sidebar';
import Icon from '../../components/AppIcon';
import { supabase } from '../../lib/supabase';

const STATUSES = ['draft', 'pending', 'paid', 'overdue', 'cancelled'];

const getStatusColor = (status) => {
  const colors = {
    draft: 'bg-gray-100 text-gray-700',
    pending: 'bg-yellow-100 text-yellow-700',
    paid: 'bg-green-100 text-green-700',
    overdue: 'bg-red-100 text-red-700',
    cancelled: 'bg-red-100 text-red-700',
  };
  return colors[status] || 'bg-gray-100 text-gray-700';
};

const emptyForm = {
  invoice_number: '',
  candidate_id: '',
  placement_id: '',
  period_start: '',
  period_end: '',
  hours_worked: '',
  gross_earnings: '',
  deductions: '',
  net_pay: '',
  status: 'draft',
  invoice_date: new Date().toISOString().split('T')[0],
};

const Invoices = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  // Dropdown options
  const [candidates, setCandidates] = useState([]);
  const [placements, setPlacements] = useState([]);

  // Inline status editing
  const [editingStatusId, setEditingStatusId] = useState(null);

  // Delete confirmation
  const [deletingId, setDeletingId] = useState(null);

  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      const candidateName = `${inv?.candidate?.first_name || ''} ${inv?.candidate?.last_name || ''}`;
      const matchesSearch = searchTerm === '' ||
        candidateName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (inv?.invoice_number || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (inv?.placement?.job_title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (inv?.placement?.client_name || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === '' || inv?.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [invoices, searchTerm, statusFilter]);

  useEffect(() => {
    fetchInvoices();
    fetchCandidates();
    fetchPlacements();
  }, []);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('invoices').select(`
        *,
        candidate:candidates(first_name, last_name),
        placement:placements(job_title, client_name),
        created_by_user:user_profiles!created_by(full_name)
      `).order('invoice_date', { ascending: false });
      if (error) throw error;
      setInvoices(data || []);
    } catch (err) {
      console.error('Error fetching invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCandidates = async () => {
    const { data } = await supabase.from('candidates').select('id, first_name, last_name').order('first_name');
    setCandidates(data || []);
  };

  const fetchPlacements = async () => {
    const { data } = await supabase.from('placements').select('id, job_title, client_name').order('job_title');
    setPlacements(data || []);
  };

  const openAddModal = () => {
    setEditingInvoice(null);
    setForm(emptyForm);
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (invoice) => {
    setEditingInvoice(invoice);
    setForm({
      invoice_number: invoice.invoice_number || '',
      candidate_id: invoice.candidate_id || '',
      placement_id: invoice.placement_id || '',
      period_start: invoice.period_start || '',
      period_end: invoice.period_end || '',
      hours_worked: invoice.hours_worked || '',
      gross_earnings: invoice.gross_earnings || '',
      deductions: invoice.deductions || '',
      net_pay: invoice.net_pay || '',
      status: invoice.status || 'draft',
      invoice_date: invoice.invoice_date || new Date().toISOString().split('T')[0],
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleFormChange = (field, value) => {
    setForm(prev => {
      const updated = { ...prev, [field]: value };
      // Auto-calculate net pay
      if (field === 'gross_earnings' || field === 'deductions') {
        const gross = parseFloat(field === 'gross_earnings' ? value : updated.gross_earnings) || 0;
        const ded = parseFloat(field === 'deductions' ? value : updated.deductions) || 0;
        updated.net_pay = (gross - ded).toFixed(2);
      }
      return updated;
    });
  };

  const handleSave = async () => {
    if (!form.invoice_number.trim()) { setFormError('Invoice number is required.'); return; }
    if (!form.candidate_id) { setFormError('Please select a candidate.'); return; }
    if (!form.invoice_date) { setFormError('Invoice date is required.'); return; }

    setSaving(true);
    setFormError('');

    const payload = {
      invoice_number: form.invoice_number.trim(),
      candidate_id: form.candidate_id || null,
      placement_id: form.placement_id || null,
      period_start: form.period_start || null,
      period_end: form.period_end || null,
      hours_worked: parseFloat(form.hours_worked) || null,
      gross_earnings: parseFloat(form.gross_earnings) || null,
      deductions: parseFloat(form.deductions) || null,
      net_pay: parseFloat(form.net_pay) || null,
      status: form.status,
      invoice_date: form.invoice_date,
    };

    try {
      if (editingInvoice) {
        const { error } = await supabase.from('invoices').update(payload).eq('id', editingInvoice.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('invoices').insert([payload]);
        if (error) throw error;
      }
      setIsModalOpen(false);
      await fetchInvoices();
    } catch (err) {
      setFormError(err.message || 'Failed to save invoice.');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (invoiceId, newStatus) => {
    try {
      const { error } = await supabase.from('invoices').update({ status: newStatus }).eq('id', invoiceId);
      if (error) throw error;
      setInvoices(prev => prev.map(inv => inv.id === invoiceId ? { ...inv, status: newStatus } : inv));
    } catch (err) {
      console.error('Failed to update status:', err);
    } finally {
      setEditingStatusId(null);
    }
  };

  const handleDelete = async (invoiceId) => {
    try {
      const { error } = await supabase.from('invoices').delete().eq('id', invoiceId);
      if (error) throw error;
      setInvoices(prev => prev.filter(inv => inv.id !== invoiceId));
    } catch (err) {
      console.error('Failed to delete invoice:', err);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)} isSidebarOpen={isSidebarOpen} />
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <main className="lg:ml-64 pt-16">
        <div className="p-4 lg:p-6">
          <motion.div initial={false} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>

            {/* Page header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">Invoicing & Timesheets</h1>
                <p className="text-muted-foreground">Manage payroll, invoices, and timesheets</p>
              </div>
              <button
                onClick={openAddModal}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                <Icon name="Plus" size={16} />
                New Invoice
              </button>
            </div>

            {/* Filters */}
            <div className="bg-card rounded-xl border border-border p-4 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <Icon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search invoice #, candidate, job title..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                  <option value="">All Statuses</option>
                  {STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                </select>
              </div>
              {(searchTerm || statusFilter) && (
                <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Showing {filteredInvoices.length} of {invoices.length} invoices</span>
                  <button onClick={() => { setSearchTerm(''); setStatusFilter(''); }} className="text-primary hover:underline ml-2">Clear filters</button>
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
              {[
                { label: 'Total', value: invoices.length, color: 'text-foreground' },
                { label: 'Paid', value: invoices.filter(i => i.status === 'paid').length, color: 'text-green-600' },
                { label: 'Pending', value: invoices.filter(i => i.status === 'pending').length, color: 'text-yellow-600' },
                { label: 'Overdue', value: invoices.filter(i => i.status === 'overdue').length, color: 'text-red-600' },
                { label: 'Total Amount', value: `$${invoices.reduce((s, i) => s + (i.net_pay || 0), 0).toLocaleString()}`, color: 'text-primary' },
              ].map(stat => (
                <div key={stat.label} className="bg-card p-5 rounded-xl border border-border">
                  <p className="text-xs text-muted-foreground mb-1">{stat.label}</p>
                  <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                </div>
              ))}
            </div>

            {/* Table */}
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              {loading ? (
                <div className="p-12 text-center">
                  <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-muted-foreground">Loading invoices...</p>
                </div>
              ) : filteredInvoices.length === 0 ? (
                <div className="p-12 text-center">
                  <Icon name="FileText" size={40} className="mx-auto mb-3 text-muted-foreground opacity-40" />
                  <p className="text-muted-foreground mb-4">No invoices found</p>
                  <button onClick={openAddModal} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
                    Create First Invoice
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/50 border-b border-border">
                      <tr>
                        {['Invoice #', 'Candidate', 'Job Title', 'Period', 'Hours', 'Gross', 'Deductions', 'Net Pay', 'Status', 'Date', 'Actions'].map(h => (
                          <th key={h} className="px-6 py-3 text-left text-sm font-medium text-muted-foreground whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filteredInvoices.map(invoice => (
                        <tr key={invoice.id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-6 py-4 font-medium text-foreground whitespace-nowrap">{invoice.invoice_number}</td>
                          <td className="px-6 py-4 font-medium text-foreground whitespace-nowrap">
                            {invoice.candidate?.first_name} {invoice.candidate?.last_name}
                          </td>
                          <td className="px-6 py-4 text-sm text-foreground">{invoice.placement?.job_title || '—'}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <p className="text-sm text-foreground">{invoice.period_start ? new Date(invoice.period_start).toLocaleDateString() : '—'}</p>
                            <p className="text-xs text-muted-foreground">to {invoice.period_end ? new Date(invoice.period_end).toLocaleDateString() : '—'}</p>
                          </td>
                          <td className="px-6 py-4 text-sm text-foreground">{invoice.hours_worked ?? '—'} hrs</td>
                          <td className="px-6 py-4 text-sm font-medium text-foreground">${(invoice.gross_earnings || 0).toLocaleString()}</td>
                          <td className="px-6 py-4 text-sm text-red-600">-${(invoice.deductions || 0).toLocaleString()}</td>
                          <td className="px-6 py-4 text-sm font-bold text-green-600">${(invoice.net_pay || 0).toLocaleString()}</td>
                          <td className="px-6 py-4">
                            {editingStatusId === invoice.id ? (
                              <select
                                autoFocus
                                defaultValue={invoice.status}
                                onChange={(e) => handleStatusChange(invoice.id, e.target.value)}
                                onBlur={() => setEditingStatusId(null)}
                                className="px-2 py-1 border border-border rounded text-xs bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                              >
                                {STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                              </select>
                            ) : (
                              <button
                                onClick={() => setEditingStatusId(invoice.id)}
                                title="Click to change status"
                                className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(invoice.status)} hover:ring-2 hover:ring-primary/30 transition-all`}
                              >
                                {(invoice.status || 'draft').toUpperCase()}
                              </button>
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm text-muted-foreground whitespace-nowrap">
                            {invoice.invoice_date ? new Date(invoice.invoice_date).toLocaleDateString() : '—'}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => openEditModal(invoice)}
                                className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                                title="Edit"
                              >
                                <Icon name="Pencil" size={14} />
                              </button>
                              {deletingId === invoice.id ? (
                                <div className="flex items-center gap-1">
                                  <button onClick={() => handleDelete(invoice.id)} className="px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700">Yes</button>
                                  <button onClick={() => setDeletingId(null)} className="px-2 py-1 bg-muted text-foreground rounded text-xs hover:bg-muted/80">No</button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setDeletingId(invoice.id)}
                                  className="p-1.5 rounded hover:bg-red-50 transition-colors text-muted-foreground hover:text-red-600"
                                  title="Delete"
                                >
                                  <Icon name="Trash2" size={14} />
                                </button>
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

      {/* Add / Edit Invoice Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-black/50" onClick={() => setIsModalOpen(false)} />
            <motion.div
              className="relative bg-card border border-border rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center justify-between p-6 border-b border-border">
                <h2 className="text-xl font-semibold text-card-foreground">
                  {editingInvoice ? 'Edit Invoice' : 'New Invoice'}
                </h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-muted rounded-lg transition-colors">
                  <Icon name="X" size={20} className="text-muted-foreground" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                {formError && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    <Icon name="AlertCircle" size={16} />
                    {formError}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Invoice Number *</label>
                    <input
                      type="text"
                      value={form.invoice_number}
                      onChange={(e) => handleFormChange('invoice_number', e.target.value)}
                      placeholder="INV-001"
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Invoice Date *</label>
                    <input
                      type="date"
                      value={form.invoice_date}
                      onChange={(e) => handleFormChange('invoice_date', e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Candidate *</label>
                    <select
                      value={form.candidate_id}
                      onChange={(e) => handleFormChange('candidate_id', e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    >
                      <option value="">Select candidate...</option>
                      {candidates.map(c => (
                        <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Placement</label>
                    <select
                      value={form.placement_id}
                      onChange={(e) => handleFormChange('placement_id', e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    >
                      <option value="">Select placement...</option>
                      {placements.map(p => (
                        <option key={p.id} value={p.id}>{p.job_title} — {p.client_name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Period Start</label>
                    <input
                      type="date"
                      value={form.period_start}
                      onChange={(e) => handleFormChange('period_start', e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Period End</label>
                    <input
                      type="date"
                      value={form.period_end}
                      onChange={(e) => handleFormChange('period_end', e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Hours Worked</label>
                    <input
                      type="number"
                      value={form.hours_worked}
                      onChange={(e) => handleFormChange('hours_worked', e.target.value)}
                      placeholder="0"
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Status</label>
                    <select
                      value={form.status}
                      onChange={(e) => handleFormChange('status', e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    >
                      {STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Gross Earnings ($)</label>
                    <input
                      type="number"
                      value={form.gross_earnings}
                      onChange={(e) => handleFormChange('gross_earnings', e.target.value)}
                      placeholder="0.00"
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Deductions ($)</label>
                    <input
                      type="number"
                      value={form.deductions}
                      onChange={(e) => handleFormChange('deductions', e.target.value)}
                      placeholder="0.00"
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-foreground mb-1">Net Pay ($) <span className="text-muted-foreground font-normal">(auto-calculated)</span></label>
                    <input
                      type="number"
                      value={form.net_pay}
                      onChange={(e) => handleFormChange('net_pay', e.target.value)}
                      placeholder="0.00"
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 p-6 border-t border-border">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-border rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-60"
                >
                  {saving ? <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" /> : <Icon name="Save" size={15} />}
                  {saving ? 'Saving...' : (editingInvoice ? 'Save Changes' : 'Create Invoice')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Invoices;
