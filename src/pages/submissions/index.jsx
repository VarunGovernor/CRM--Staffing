import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import Header from '../../components/ui/Header';
import Sidebar from '../../components/ui/Sidebar';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import { supabase } from '../../lib/supabase';
import SubmissionForm from './components/SubmissionForm';

const Submissions = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSubmission, setEditingSubmission] = useState(null);

  const filteredSubmissions = useMemo(() => {
    return submissions?.filter(s => {
      const candidateName = s?.candidate?.full_name || `${s?.candidate?.first_name || ''} ${s?.candidate?.last_name || ''}`;
      const techStr = Array.isArray(s?.technology) ? s.technology.join(' ') : (s?.technology || '');
      const matchesSearch = searchTerm === '' ||
        candidateName?.toLowerCase()?.includes(searchTerm?.toLowerCase()) ||
        s?.candidate?.email?.toLowerCase()?.includes(searchTerm?.toLowerCase()) ||
        s?.job_title?.toLowerCase()?.includes(searchTerm?.toLowerCase()) ||
        techStr?.toLowerCase()?.includes(searchTerm?.toLowerCase()) ||
        s?.client_name?.toLowerCase()?.includes(searchTerm?.toLowerCase()) ||
        s?.vendor?.name?.toLowerCase()?.includes(searchTerm?.toLowerCase());
      const matchesStatus = statusFilter === '' || s?.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [submissions, searchTerm, statusFilter]);

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const handleEdit = (submission) => {
    setEditingSubmission(submission);
    setIsFormOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this submission?')) return;
    const { error } = await supabase.from('submissions').delete().eq('id', id);
    if (!error) setSubmissions(prev => prev.filter(s => s.id !== id));
  };

  const handleStatusChange = async (submissionId, newStatus) => {
    setSubmissions(prev =>
      prev.map(s => s.id === submissionId ? { ...s, status: newStatus } : s)
    );
    try {
      const { error } = await supabase
        .from('submissions')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', submissionId);
      if (error) throw error;
    } catch (error) {
      console.error('Error updating submission status:', error);
      fetchSubmissions();
    }
  };

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase?.from('submissions')?.select(`
          *,
          candidate:candidates(first_name, last_name, full_name, email),
          vendor:vendors(name, tier),
          sales_person:user_profiles!sales_person_id(full_name),
          owner:user_profiles!submission_owner(full_name)
        `)?.order('submission_date', { ascending: false });

      if (error) throw error;
      setSubmissions(data || []);
    } catch (error) {
      console.error('Error fetching submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'submitted': 'bg-blue-100 text-blue-700',
      'shortlisted': 'bg-yellow-100 text-yellow-700',
      'rejected': 'bg-red-100 text-red-700',
      'interview_scheduled': 'bg-purple-100 text-purple-700',
      'selected': 'bg-green-100 text-green-700'
    };
    return colors?.[status] || 'bg-gray-100 text-gray-700';
  };

  const getTierColor = (tier) => {
    const colors = {
      'tier_1': 'bg-emerald-100 text-emerald-700',
      'tier_2': 'bg-blue-100 text-blue-700',
      'tier_3': 'bg-orange-100 text-orange-700',
      'direct_client': 'bg-purple-100 text-purple-700'
    };
    return colors?.[tier] || 'bg-gray-100 text-gray-700';
  };

  const renderTech = (technology) => {
    const tech = Array.isArray(technology) ? technology : (technology ? [technology] : []);
    if (tech.length === 0) return <span className="text-muted-foreground">—</span>;
    return (
      <div className="flex flex-wrap gap-1 max-w-[200px]">
        {tech.slice(0, 3).map(t => (
          <span key={t} className="px-1.5 py-0.5 bg-primary/10 text-primary text-xs rounded">{t}</span>
        ))}
        {tech.length > 3 && <span className="text-xs text-muted-foreground">+{tech.length - 3}</span>}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Header onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)} isSidebarOpen={isSidebarOpen} />
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <main className="lg:ml-64 pt-16">
        <div className="p-4 lg:p-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">Submission Management</h1>
                <p className="text-muted-foreground">Track candidate submissions to vendors and clients</p>
              </div>
              <Button onClick={() => { setEditingSubmission(null); setIsFormOpen(true); }} className="flex items-center gap-2">
                <Icon name="Plus" size={18} />
                New Submission
              </Button>
            </div>

            {/* Filters */}
            <div className="bg-card rounded-xl border border-border p-4 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <Icon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search candidate, job, vendor, tech, client..."
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
                  <option value="submitted">Submitted</option>
                  <option value="shortlisted">Shortlisted</option>
                  <option value="rejected">Rejected</option>
                  <option value="interview_scheduled">Interview Scheduled</option>
                  <option value="selected">Selected</option>
                </select>
              </div>
              {(searchTerm || statusFilter) && (
                <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Showing {filteredSubmissions?.length} of {submissions?.length} submissions</span>
                  <button onClick={() => { setSearchTerm(''); setStatusFilter(''); }} className="text-primary hover:underline ml-2">Clear filters</button>
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
              <div className="bg-card p-4 rounded-xl border border-border">
                <p className="text-sm text-muted-foreground mb-1">Total</p>
                <p className="text-2xl font-bold text-foreground">{submissions?.length}</p>
              </div>
              <div className="bg-card p-4 rounded-xl border border-border">
                <p className="text-sm text-muted-foreground mb-1">Submitted</p>
                <p className="text-2xl font-bold text-blue-600">
                  {submissions?.filter(s => s?.status === 'submitted')?.length}
                </p>
              </div>
              <div className="bg-card p-4 rounded-xl border border-border">
                <p className="text-sm text-muted-foreground mb-1">Shortlisted</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {submissions?.filter(s => s?.status === 'shortlisted')?.length}
                </p>
              </div>
              <div className="bg-card p-4 rounded-xl border border-border">
                <p className="text-sm text-muted-foreground mb-1">Interview</p>
                <p className="text-2xl font-bold text-purple-600">
                  {submissions?.filter(s => s?.status === 'interview_scheduled')?.length}
                </p>
              </div>
              <div className="bg-card p-4 rounded-xl border border-border">
                <p className="text-sm text-muted-foreground mb-1">Selected</p>
                <p className="text-2xl font-bold text-green-600">
                  {submissions?.filter(s => s?.status === 'selected')?.length}
                </p>
              </div>
            </div>

            {/* Submissions Table */}
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              {loading ? (
                <div className="p-12 text-center">
                  <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading submissions...</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/50 border-b border-border">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Candidate</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Job / Client</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Technology</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Vendor</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Rate</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Status</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Date</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filteredSubmissions?.map((submission) => (
                        <tr key={submission?.id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-4">
                            <div>
                              <p className="font-medium text-foreground">
                                {submission?.candidate?.full_name || `${submission?.candidate?.first_name} ${submission?.candidate?.last_name}`}
                              </p>
                              <p className="text-xs text-muted-foreground">{submission?.candidate?.email}</p>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <p className="text-sm text-foreground">{submission?.job_title}</p>
                            {submission?.client_name && (
                              <p className="text-xs text-muted-foreground">{submission.client_name}</p>
                            )}
                          </td>
                          <td className="px-4 py-4">
                            {renderTech(submission?.technology)}
                          </td>
                          <td className="px-4 py-4">
                            <div>
                              <p className="text-sm text-foreground">{submission?.vendor?.name}</p>
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getTierColor(submission?.vendor?.tier)}`}>
                                {submission?.vendor?.tier?.replace(/_/g, ' ')?.toUpperCase()}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-sm font-medium text-foreground">
                            {submission?.rate ? `$${submission?.rate}/hr` : '—'}
                          </td>
                          <td className="px-4 py-4" onClick={e => e.stopPropagation()}>
                            <select
                              value={submission?.status}
                              onChange={e => handleStatusChange(submission?.id, e.target.value)}
                              className={`px-3 py-1 rounded-full text-xs font-medium border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30 ${getStatusColor(submission?.status)}`}
                            >
                              <option value="submitted">SUBMITTED</option>
                              <option value="shortlisted">SHORTLISTED</option>
                              <option value="interview_scheduled">INTERVIEW SCHEDULED</option>
                              <option value="selected">SELECTED</option>
                              <option value="rejected">REJECTED</option>
                            </select>
                          </td>
                          <td className="px-4 py-4 text-sm text-muted-foreground whitespace-nowrap">
                            {new Date(submission?.submission_date)?.toLocaleDateString()}
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2">
                              <button onClick={() => handleEdit(submission)} className="p-1.5 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-colors" title="Edit">
                                <Icon name="Pencil" size={14} />
                              </button>
                              <button onClick={() => handleDelete(submission?.id)} className="p-1.5 hover:bg-red-50 rounded text-muted-foreground hover:text-red-600 transition-colors" title="Delete">
                                <Icon name="Trash2" size={14} />
                              </button>
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

      <SubmissionForm
        isOpen={isFormOpen}
        onClose={() => { setIsFormOpen(false); setEditingSubmission(null); }}
        submission={editingSubmission}
        onSuccess={() => { setIsFormOpen(false); setEditingSubmission(null); fetchSubmissions(); }}
      />
    </div>
  );
};

export default Submissions;
