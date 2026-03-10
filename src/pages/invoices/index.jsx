import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Header from '../../components/ui/Header';
import Sidebar from '../../components/ui/Sidebar';
import Icon from '../../components/AppIcon';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { notifyOnInvoiceGenerated } from '../../lib/notifications';

// ─── QuickBooks OAuth helper ──────────────────────────────────────────────────
const QB_AUTH_URL   = 'https://appcenter.intuit.com/connect/oauth2';
const QB_SCOPES     = 'com.intuit.quickbooks.accounting';

function buildQBAuthUrl() {
  const clientId = import.meta.env.VITE_QB_CLIENT_ID;
  if (!clientId) return null;
  const params = new URLSearchParams({
    client_id:     clientId,
    response_type: 'code',
    scope:         QB_SCOPES,
    redirect_uri:  `${window.location.origin}/auth/quickbooks/callback`,
    state:         'qb_connect',
  });
  return `${QB_AUTH_URL}?${params}`;
}

const STATUSES = ['draft', 'pending', 'paid', 'overdue', 'cancelled'];

const getStatusColor = (status) => ({
  draft:     'bg-gray-100 text-gray-700',
  pending:   'bg-yellow-100 text-yellow-700',
  paid:      'bg-green-100 text-green-700',
  overdue:   'bg-red-100 text-red-700',
  cancelled: 'bg-red-100 text-red-700',
}[status] || 'bg-gray-100 text-gray-700');

const getApprovalColor = (s) => ({
  pending:  'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
}[s] || 'bg-gray-100 text-gray-700');

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
  status: 'pending',
  invoice_date: new Date().toISOString().split('T')[0],
};

// ─── Print Invoice Modal ─────────────────────────────────────────────────────
const PrintInvoiceModal = ({ invoice, onClose }) => {
  const candidateName = `${invoice?.candidate?.first_name || ''} ${invoice?.candidate?.last_name || ''}`.trim();

  const handlePrint = () => window.print();

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/50 print:hidden" onClick={onClose} />
      <motion.div
        className="relative bg-white border border-gray-200 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} transition={{ duration: 0.2 }}
      >
        {/* Header bar — hidden on print */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 print:hidden">
          <h2 className="text-lg font-semibold text-gray-900">Invoice Preview</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              <Icon name="Printer" size={15} />
              Print / Save PDF
            </button>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <Icon name="X" size={18} className="text-gray-500" />
            </button>
          </div>
        </div>

        {/* Invoice body */}
        <div className="p-8 text-gray-900" id="invoice-print-area">
          {/* Company header */}
          <div className="flex items-start justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-blue-700">ByteForce IT</h1>
              <p className="text-sm text-gray-500 mt-1">IT Staffing &amp; Consulting</p>
              <p className="text-sm text-gray-500">admin@byteforceit.com</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-gray-800">INVOICE</p>
              <p className="text-sm font-medium text-gray-600 mt-1"># {invoice.invoice_number}</p>
              <p className="text-sm text-gray-500 mt-1">
                Date: {invoice.invoice_date ? new Date(invoice.invoice_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}
              </p>
            </div>
          </div>

          {/* Bill To */}
          <div className="mb-8 p-4 bg-gray-50 rounded-xl">
            <p className="text-xs uppercase tracking-widest text-gray-400 mb-2">Bill To / Consultant</p>
            <p className="font-semibold text-gray-800">{candidateName || '—'}</p>
            {invoice.placement?.client_name && (
              <p className="text-sm text-gray-600">Client: {invoice.placement.client_name}</p>
            )}
            {invoice.placement?.job_title && (
              <p className="text-sm text-gray-500">Position: {invoice.placement.job_title}</p>
            )}
          </div>

          {/* Period */}
          {(invoice.period_start || invoice.period_end) && (
            <div className="mb-6 flex gap-8">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Period Start</p>
                <p className="font-medium">{invoice.period_start ? new Date(invoice.period_start).toLocaleDateString() : '—'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Period End</p>
                <p className="font-medium">{invoice.period_end ? new Date(invoice.period_end).toLocaleDateString() : '—'}</p>
              </div>
            </div>
          )}

          {/* Earnings table */}
          <table className="w-full mb-6 text-sm">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left py-2 text-gray-500 font-medium">Description</th>
                <th className="text-right py-2 text-gray-500 font-medium">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <tr>
                <td className="py-3">
                  Hours Worked: <span className="font-medium">{invoice.hours_worked ?? '—'} hrs</span>
                </td>
                <td className="py-3 text-right font-medium">${(invoice.gross_earnings || 0).toLocaleString()}</td>
              </tr>
              {(invoice.deductions > 0) && (
                <tr>
                  <td className="py-3 text-gray-500">Deductions</td>
                  <td className="py-3 text-right text-red-600">-${(invoice.deductions || 0).toLocaleString()}</td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gray-300">
                <td className="py-3 font-bold text-gray-800">Net Pay</td>
                <td className="py-3 text-right font-bold text-green-700 text-lg">${(invoice.net_pay || 0).toLocaleString()}</td>
              </tr>
            </tfoot>
          </table>

          {/* Status */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 uppercase tracking-widest">Status:</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                {(invoice.status || 'pending').toUpperCase()}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 uppercase tracking-widest">Approval:</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getApprovalColor(invoice.approval_status)}`}>
                {(invoice.approval_status || 'pending').toUpperCase()}
              </span>
            </div>
          </div>

          {/* Footer */}
          <p className="text-center text-xs text-gray-400 mt-8">Thank you for your service — ByteForce IT</p>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ─── Main Invoices Page ──────────────────────────────────────────────────────
const Invoices = () => {
  const { userProfile } = useAuth();
  const isAdmin = userProfile?.role === 'admin';

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [approvalFilter, setApprovalFilter] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const [candidates, setCandidates] = useState([]);
  const [placements, setPlacements] = useState([]);

  const [editingStatusId, setEditingStatusId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [printingInvoice, setPrintingInvoice] = useState(null);

  // Rejection reason modal
  const [rejectingInvoice, setRejectingInvoice] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // QuickBooks state
  const [qbConnected, setQbConnected] = useState(false);
  const [syncingId, setSyncingId] = useState(null);

  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      const candidateName = `${inv?.candidate?.first_name || ''} ${inv?.candidate?.last_name || ''}`;
      const matchesSearch = !searchTerm ||
        candidateName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (inv?.invoice_number || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (inv?.placement?.job_title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (inv?.placement?.client_name || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = !statusFilter || inv?.status === statusFilter;
      const matchesApproval = !approvalFilter || inv?.approval_status === approvalFilter;
      return matchesSearch && matchesStatus && matchesApproval;
    });
  }, [invoices, searchTerm, statusFilter, approvalFilter]);

  useEffect(() => {
    fetchInvoices();
    fetchCandidates();
    fetchPlacements();
    checkQBConnection();
  }, []);

  // Listen for QuickBooks OAuth popup
  useEffect(() => {
    const handler = (event) => {
      if (event.data?.type === 'QUICKBOOKS_OAUTH_SUCCESS') {
        setQbConnected(true);
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  const checkQBConnection = async () => {
    if (!userProfile?.id) return;
    const { data } = await supabase.from('quickbooks_tokens').select('user_id').eq('user_id', userProfile.id).maybeSingle();
    setQbConnected(!!data);
  };

  const connectQuickBooks = () => {
    const url = buildQBAuthUrl();
    if (!url) { alert('Add VITE_QB_CLIENT_ID to your .env file.'); return; }
    const popup = window.open(url, 'qb-oauth', 'width=600,height=700,scrollbars=yes');
    if (!popup) window.location.href = url;
  };

  const syncToQuickBooks = async (invoice) => {
    if (invoice.qb_synced_at) {
      alert(`Already synced to QuickBooks on ${new Date(invoice.qb_synced_at).toLocaleDateString()}.`);
      return;
    }
    setSyncingId(invoice.id);
    try {
      const { data, error } = await supabase.functions.invoke('sync-quickbooks-timesheet', {
        body: { user_id: userProfile.id, invoice_id: invoice.id },
      });
      if (error || data?.error) throw new Error(data?.error || error?.message || 'Sync failed');
      await fetchInvoices();
      alert('Invoice synced to QuickBooks successfully!');
    } catch (err) {
      alert(`QuickBooks sync failed: ${err.message}`);
    } finally {
      setSyncingId(null);
    }
  };

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('invoices').select(`
        *,
        candidate:candidates(first_name, last_name),
        placement:placements(job_title, client_name)
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
    const { data } = await supabase.from('placements').select('id, job_title, client_name, candidate_name').order('created_at', { ascending: false });
    setPlacements(data || []);
  };

  const openAddModal = () => {
    setEditingInvoice(null);
    // Auto-generate invoice number
    const nextNum = String(invoices.length + 1).padStart(3, '0');
    setForm({ ...emptyForm, invoice_number: `INV-${nextNum}` });
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
      status: invoice.status || 'pending',
      invoice_date: invoice.invoice_date || new Date().toISOString().split('T')[0],
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleFormChange = (field, value) => {
    setForm(prev => {
      const updated = { ...prev, [field]: value };
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
        const { data: newInv, error } = await supabase.from('invoices').insert([payload]).select().single();
        if (error) throw error;
        // Notify admins
        const placement = placements.find(p => p.id === form.placement_id);
        const candidate = candidates.find(c => c.id === form.candidate_id);
        const candidateName = candidate ? `${candidate.first_name} ${candidate.last_name}` : 'Candidate';
        notifyOnInvoiceGenerated(
          form.invoice_number,
          parseFloat(form.net_pay) || 0,
          placement?.job_title ? `${candidateName} — ${placement.job_title}` : candidateName
        );
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

  const handleApprove = async (invoice) => {
    try {
      const { error } = await supabase.from('invoices').update({
        approval_status: 'approved',
        approved_by: userProfile?.id,
        approved_at: new Date().toISOString(),
        status: 'paid',
      }).eq('id', invoice.id);
      if (error) throw error;
      await fetchInvoices();
    } catch (err) {
      console.error('Failed to approve invoice:', err);
    }
  };

  const handleReject = async () => {
    if (!rejectingInvoice) return;
    try {
      const { error } = await supabase.from('invoices').update({
        approval_status: 'rejected',
        rejection_reason: rejectionReason.trim() || null,
        status: 'cancelled',
      }).eq('id', rejectingInvoice.id);
      if (error) throw error;
      setRejectingInvoice(null);
      setRejectionReason('');
      await fetchInvoices();
    } catch (err) {
      console.error('Failed to reject invoice:', err);
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

  const totalNetPay = invoices.reduce((s, i) => s + (i.net_pay || 0), 0);
  const pendingApproval = invoices.filter(i => i.approval_status === 'pending' || !i.approval_status).length;

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
                <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">Invoices</h1>
                <p className="text-muted-foreground">Manage invoices and approve consultant payments</p>
              </div>
              <div className="flex items-center gap-2">
                {isAdmin && !qbConnected && (
                  <button
                    onClick={connectQuickBooks}
                    className="flex items-center gap-2 px-3 py-2 border border-green-300 text-green-700 bg-green-50 rounded-lg text-sm font-medium hover:bg-green-100 transition-colors"
                    title="Connect QuickBooks to sync invoices"
                  >
                    <Icon name="Link" size={14} />
                    Connect QuickBooks
                  </button>
                )}
                {isAdmin && qbConnected && (
                  <span className="flex items-center gap-1.5 px-3 py-2 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
                    <Icon name="CheckCircle" size={13} /> QuickBooks Connected
                  </span>
                )}
                {isAdmin && (
                  <button
                    onClick={openAddModal}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
                  >
                    <Icon name="Plus" size={16} />
                    New Invoice
                  </button>
                )}
              </div>
            </div>

            {/* Pending approval banner */}
            {isAdmin && pendingApproval > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6 flex items-center gap-3">
                <Icon name="AlertCircle" size={18} className="text-yellow-600 flex-shrink-0" />
                <p className="text-sm text-yellow-800 font-medium">
                  {pendingApproval} invoice{pendingApproval > 1 ? 's' : ''} pending your approval
                </p>
                <button onClick={() => setApprovalFilter('pending')} className="ml-auto text-xs text-yellow-700 underline hover:text-yellow-900">
                  View pending
                </button>
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
              {[
                { label: 'Total', value: invoices.length, color: 'text-foreground' },
                { label: 'Paid', value: invoices.filter(i => i.status === 'paid').length, color: 'text-green-600' },
                { label: 'Pending', value: invoices.filter(i => i.status === 'pending').length, color: 'text-yellow-600' },
                { label: 'Pending Approval', value: pendingApproval, color: 'text-orange-600' },
                { label: 'Total Amount', value: `$${totalNetPay.toLocaleString()}`, color: 'text-primary' },
              ].map(stat => (
                <div key={stat.label} className="bg-card p-5 rounded-xl border border-border">
                  <p className="text-xs text-muted-foreground mb-1">{stat.label}</p>
                  <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                </div>
              ))}
            </div>

            {/* Filters */}
            <div className="bg-card rounded-xl border border-border p-4 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                <select
                  value={approvalFilter}
                  onChange={(e) => setApprovalFilter(e.target.value)}
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                  <option value="">All Approvals</option>
                  <option value="pending">Pending Approval</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
              {(searchTerm || statusFilter || approvalFilter) && (
                <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Showing {filteredInvoices.length} of {invoices.length} invoices</span>
                  <button onClick={() => { setSearchTerm(''); setStatusFilter(''); setApprovalFilter(''); }} className="text-primary hover:underline ml-2">
                    Clear filters
                  </button>
                </div>
              )}
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
                  {isAdmin && (
                    <button onClick={openAddModal} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
                      Create First Invoice
                    </button>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/50 border-b border-border">
                      <tr>
                        {['Invoice #', 'Candidate', 'Job / Client', 'Period', 'Hours', 'Gross', 'Net Pay', 'Status', 'Approval', 'Date', 'Actions'].map(h => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground whitespace-nowrap uppercase tracking-wider">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filteredInvoices.map(invoice => (
                        <tr key={invoice.id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-4 font-medium text-foreground whitespace-nowrap text-sm">{invoice.invoice_number}</td>
                          <td className="px-4 py-4 text-sm text-foreground whitespace-nowrap">
                            {invoice.candidate?.first_name} {invoice.candidate?.last_name}
                          </td>
                          <td className="px-4 py-4 text-sm">
                            <p className="text-foreground">{invoice.placement?.job_title || '—'}</p>
                            {invoice.placement?.client_name && <p className="text-xs text-muted-foreground">{invoice.placement.client_name}</p>}
                          </td>
                          <td className="px-4 py-4 text-xs text-muted-foreground whitespace-nowrap">
                            <p>{invoice.period_start ? new Date(invoice.period_start).toLocaleDateString() : '—'}</p>
                            <p>to {invoice.period_end ? new Date(invoice.period_end).toLocaleDateString() : '—'}</p>
                          </td>
                          <td className="px-4 py-4 text-sm text-foreground">{invoice.hours_worked ?? '—'}</td>
                          <td className="px-4 py-4 text-sm text-foreground">${(invoice.gross_earnings || 0).toLocaleString()}</td>
                          <td className="px-4 py-4 text-sm font-bold text-green-600">${(invoice.net_pay || 0).toLocaleString()}</td>

                          {/* Status */}
                          <td className="px-4 py-4">
                            {editingStatusId === invoice.id ? (
                              <select
                                autoFocus
                                defaultValue={invoice.status}
                                onChange={(e) => handleStatusChange(invoice.id, e.target.value)}
                                onBlur={() => setEditingStatusId(null)}
                                className="px-2 py-1 border border-border rounded text-xs bg-background focus:outline-none"
                              >
                                {STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                              </select>
                            ) : (
                              <button
                                onClick={() => isAdmin && setEditingStatusId(invoice.id)}
                                title={isAdmin ? 'Click to change status' : ''}
                                className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(invoice.status)} ${isAdmin ? 'hover:ring-2 hover:ring-primary/30 cursor-pointer' : 'cursor-default'}`}
                              >
                                {(invoice.status || 'draft').toUpperCase()}
                              </button>
                            )}
                          </td>

                          {/* Approval */}
                          <td className="px-4 py-4">
                            {isAdmin && (invoice.approval_status === 'pending' || !invoice.approval_status) ? (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleApprove(invoice)}
                                  className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 font-medium transition-colors"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => { setRejectingInvoice(invoice); setRejectionReason(''); }}
                                  className="px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700 font-medium transition-colors"
                                >
                                  Reject
                                </button>
                              </div>
                            ) : (
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getApprovalColor(invoice.approval_status)}`}>
                                {(invoice.approval_status || 'pending').toUpperCase()}
                              </span>
                            )}
                          </td>

                          <td className="px-4 py-4 text-xs text-muted-foreground whitespace-nowrap">
                            {invoice.invoice_date ? new Date(invoice.invoice_date).toLocaleDateString() : '—'}
                          </td>

                          <td className="px-4 py-4">
                            <div className="flex items-center gap-1">
                              {/* QuickBooks sync */}
                              {isAdmin && qbConnected && (
                                invoice.qb_synced_at ? (
                                  <span className="p-1.5 text-green-600" title={`Synced ${new Date(invoice.qb_synced_at).toLocaleDateString()}`}>
                                    <Icon name="CheckCircle" size={14} />
                                  </span>
                                ) : (
                                  <button
                                    onClick={() => syncToQuickBooks(invoice)}
                                    disabled={syncingId === invoice.id}
                                    className="p-1.5 rounded hover:bg-green-50 transition-colors text-muted-foreground hover:text-green-700 disabled:opacity-50"
                                    title="Sync to QuickBooks"
                                  >
                                    {syncingId === invoice.id
                                      ? <div className="w-3.5 h-3.5 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
                                      : <Icon name="RefreshCw" size={14} />
                                    }
                                  </button>
                                )
                              )}
                              <button
                                onClick={() => setPrintingInvoice(invoice)}
                                className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                                title="Print / PDF"
                              >
                                <Icon name="Printer" size={14} />
                              </button>
                              {isAdmin && (
                                <>
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
                                      <button onClick={() => setDeletingId(null)} className="px-2 py-1 bg-muted text-foreground rounded text-xs">No</button>
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
                                </>
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
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/50" onClick={() => setIsModalOpen(false)} />
            <motion.div
              className="relative bg-card border border-border rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} transition={{ duration: 0.2 }}
            >
              <div className="flex items-center justify-between p-6 border-b border-border">
                <h2 className="text-xl font-semibold text-card-foreground">{editingInvoice ? 'Edit Invoice' : 'New Invoice'}</h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-muted rounded-lg transition-colors">
                  <Icon name="X" size={20} className="text-muted-foreground" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                {formError && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    <Icon name="AlertCircle" size={16} />{formError}
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { label: 'Invoice Number *', field: 'invoice_number', type: 'text', placeholder: 'INV-001' },
                    { label: 'Invoice Date *', field: 'invoice_date', type: 'date' },
                  ].map(({ label, field, type, placeholder }) => (
                    <div key={field}>
                      <label className="block text-sm font-medium text-foreground mb-1">{label}</label>
                      <input
                        type={type}
                        value={form[field]}
                        onChange={(e) => handleFormChange(field, e.target.value)}
                        placeholder={placeholder}
                        className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      />
                    </div>
                  ))}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Candidate *</label>
                    <select value={form.candidate_id} onChange={(e) => handleFormChange('candidate_id', e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
                      <option value="">Select candidate...</option>
                      {candidates.map(c => <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Placement</label>
                    <select value={form.placement_id} onChange={(e) => handleFormChange('placement_id', e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
                      <option value="">Select placement...</option>
                      {placements.map(p => <option key={p.id} value={p.id}>{p.candidate_name || p.job_title} — {p.client_name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Period Start</label>
                    <input type="date" value={form.period_start} onChange={(e) => handleFormChange('period_start', e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Period End</label>
                    <input type="date" value={form.period_end} onChange={(e) => handleFormChange('period_end', e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Hours Worked</label>
                    <input type="number" value={form.hours_worked} onChange={(e) => handleFormChange('hours_worked', e.target.value)} placeholder="0" className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Status</label>
                    <select value={form.status} onChange={(e) => handleFormChange('status', e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
                      {STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Gross Earnings ($)</label>
                    <input type="number" value={form.gross_earnings} onChange={(e) => handleFormChange('gross_earnings', e.target.value)} placeholder="0.00" className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Deductions ($)</label>
                    <input type="number" value={form.deductions} onChange={(e) => handleFormChange('deductions', e.target.value)} placeholder="0.00" className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-foreground mb-1">Net Pay ($) <span className="text-muted-foreground font-normal">(auto-calculated)</span></label>
                    <input type="number" value={form.net_pay} readOnly className="w-full px-3 py-2 border border-border rounded-lg bg-muted text-foreground text-sm" />
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 p-6 border-t border-border">
                <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 border border-border rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors">Cancel</button>
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

      {/* Reject Invoice Modal */}
      <AnimatePresence>
        {rejectingInvoice && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/50" onClick={() => setRejectingInvoice(null)} />
            <motion.div className="relative bg-card border border-border rounded-2xl shadow-xl w-full max-w-md" initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} transition={{ duration: 0.2 }}>
              <div className="flex items-center justify-between p-6 border-b border-border">
                <h2 className="text-lg font-semibold text-foreground">Reject Invoice</h2>
                <button onClick={() => setRejectingInvoice(null)} className="p-2 hover:bg-muted rounded-lg"><Icon name="X" size={18} className="text-muted-foreground" /></button>
              </div>
              <div className="p-6">
                <p className="text-sm text-muted-foreground mb-4">Rejecting <span className="font-medium text-foreground">{rejectingInvoice.invoice_number}</span>. Please provide a reason (optional):</p>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={3}
                  placeholder="Reason for rejection..."
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                />
              </div>
              <div className="flex items-center justify-end gap-3 p-6 border-t border-border">
                <button onClick={() => setRejectingInvoice(null)} className="px-4 py-2 border border-border rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors">Cancel</button>
                <button onClick={handleReject} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors">Confirm Reject</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Print Invoice Modal */}
      <AnimatePresence>
        {printingInvoice && (
          <PrintInvoiceModal invoice={printingInvoice} onClose={() => setPrintingInvoice(null)} />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Invoices;
