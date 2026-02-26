import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Header from '../../components/ui/Header';
import Sidebar from '../../components/ui/Sidebar';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

const NCA_STATUS_LABELS = {
  not_started: 'Not Started',
  downloaded: 'Downloaded',
  uploaded: 'Uploaded',
  verified: 'Verified'
};

const NCA_STATUS_COLORS = {
  not_started: 'bg-gray-100 text-gray-700',
  downloaded: 'bg-yellow-100 text-yellow-700',
  uploaded: 'bg-blue-100 text-blue-700',
  verified: 'bg-green-100 text-green-700'
};

const HROnboarding = () => {
  const { user } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [onboardings, setOnboardings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Compliance state
  const [complianceForms, setComplianceForms] = useState([]);
  const [complianceCandidates, setComplianceCandidates] = useState([]);
  const [complianceLoading, setComplianceLoading] = useState(false);
  const [ncaLoading, setNcaLoading] = useState(false);
  const [complianceActiveTab, setComplianceActiveTab] = useState('overview');

  // Modal states
  const [uploadModal, setUploadModal] = useState({ isOpen: false });
  const [uploadForm, setUploadForm] = useState({ documentType: '', documentName: '', file: null });

  // Mock data for demonstration
  const [onboardingTasks, setOnboardingTasks] = useState([
    { id: 1, task: 'Complete I-9 Form', candidate: 'Sarah Johnson', dueDate: '2025-02-10', completedDate: '2025-02-08', status: 'completed' },
    { id: 2, task: 'Background Check', candidate: 'Michael Chen', dueDate: '2025-02-12', completedDate: '2025-02-11', status: 'completed' },
    { id: 3, task: 'Submit Tax Documents', candidate: 'Emily Davis', dueDate: '2025-02-15', completedDate: null, status: 'pending' },
    { id: 4, task: 'Sign NDA Agreement', candidate: 'James Wilson', dueDate: '2025-02-14', completedDate: null, status: 'pending' },
    { id: 5, task: 'E-Verify Submission', candidate: 'Sarah Johnson', dueDate: '2025-02-09', completedDate: '2025-02-09', status: 'completed' },
  ]);

  const [visaAlerts, setVisaAlerts] = useState([
    { id: 1, candidate: 'Raj Patel', visaType: 'H1B', expirationDate: '2025-03-15', daysUntilExpiry: 38, status: 'warning' },
    { id: 2, candidate: 'Wei Zhang', visaType: 'OPT', expirationDate: '2025-02-28', daysUntilExpiry: 23, status: 'critical' },
    { id: 3, candidate: 'Maria Garcia', visaType: 'L1', expirationDate: '2025-06-20', daysUntilExpiry: 135, status: 'ok' },
  ]);

  const [documents, setDocuments] = useState([
    { id: 1, name: 'Company Handbook 2025', type: 'Policy', uploadDate: '2025-01-15', size: '2.4 MB', url: null },
    { id: 2, name: 'I-9 Form Template (USCIS)', type: 'Form', uploadDate: '2025-01-10', size: '156 KB', url: 'https://www.uscis.gov/sites/default/files/document/forms/i-9.pdf' },
    { id: 3, name: 'NDA Agreement', type: 'Legal', uploadDate: '2025-01-05', size: '89 KB', url: null },
  ]);

  useEffect(() => {
    fetchOnboardings();
  }, []);

  useEffect(() => {
    if (activeTab === 'compliance') {
      fetchComplianceForms();
      fetchComplianceCandidates();
    }
  }, [activeTab]);

  const fetchOnboardings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase?.from('hr_onboarding')?.select(`
          *,
          candidate:candidates(first_name, last_name, email, visa_status, visa_expiry_date),
          placement:placements(job_title, client_name),
          hr_manager:user_profiles!hr_manager_id(full_name)
        `)?.order('onboarding_date', { ascending: false });

      if (error) throw error;
      setOnboardings(data || []);
    } catch (error) {
      console.error('Error fetching onboardings:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchComplianceForms = async () => {
    try {
      setComplianceLoading(true);
      const { data, error } = await supabase?.from('compliance_forms')?.select(`
          *,
          candidate:candidates(first_name, last_name, full_name, email),
          verified_by_user:user_profiles!verified_by(full_name)
        `)?.order('generated_date', { ascending: false });
      if (error) throw error;
      setComplianceForms(data || []);
    } catch (err) {
      console.error('Error fetching compliance forms:', err);
    } finally {
      setComplianceLoading(false);
    }
  };

  const fetchComplianceCandidates = async () => {
    try {
      setNcaLoading(true);
      const { data, error } = await supabase
        ?.from('candidates')
        ?.select('id, first_name, last_name, full_name, email, nca_status, nca_document_url, nca_uploaded_at, nca_verified_by, status, deal_type')
        ?.order('created_at', { ascending: false });
      if (error) throw error;
      setComplianceCandidates(data || []);
    } catch (err) {
      console.error('Error fetching NCA data:', err);
    } finally {
      setNcaLoading(false);
    }
  };

  const handleNcaStatusUpdate = async (candidateId, newStatus) => {
    const updates = { nca_status: newStatus };
    if (newStatus === 'verified') updates.nca_verified_by = user?.id;
    if (newStatus === 'uploaded') updates.nca_uploaded_at = new Date().toISOString();
    const { error } = await supabase.from('candidates').update(updates).eq('id', candidateId);
    if (!error) fetchComplianceCandidates();
  };

  const completedTasks = onboardingTasks.filter(t => t.status === 'completed').length;
  const totalTasks = onboardingTasks.length;
  const criticalVisaAlerts = visaAlerts.filter(v => v.daysUntilExpiry <= 30).length;
  const eVerifyCompleted = onboardingTasks.filter(t => t.task.includes('E-Verify') && t.status === 'completed').length;
  const eVerifyTotal = onboardingTasks.filter(t => t.task.includes('E-Verify')).length;
  const eVerifyPercentage = eVerifyTotal > 0 ? Math.round((eVerifyCompleted / eVerifyTotal) * 100) : 100;

  const handleTaskToggle = (taskId) => {
    setOnboardingTasks(prev => prev.map(task => {
      if (task.id === taskId) {
        const newStatus = task.status === 'completed' ? 'pending' : 'completed';
        return {
          ...task,
          status: newStatus,
          completedDate: newStatus === 'completed' ? new Date().toISOString().split('T')[0] : null
        };
      }
      return task;
    }));
  };

  const handleUploadDocument = () => {
    if (!uploadForm.documentName || !uploadForm.documentType) return;

    const newDoc = {
      id: documents.length + 1,
      name: uploadForm.documentName,
      type: uploadForm.documentType,
      uploadDate: new Date().toISOString().split('T')[0],
      size: '-- KB'
    };

    setDocuments(prev => [newDoc, ...prev]);
    setUploadModal({ isOpen: false });
    setUploadForm({ documentType: '', documentName: '', file: null });
  };

  const handleGenerateReport = () => {
    alert('Report generation initiated. The report will be downloaded shortly.');
  };

  // Compliance helpers
  const filteredForms = (type) => type ? complianceForms.filter(f => f.form_type === type) : complianceForms;
  const getFormTypeColor = (type) => {
    const colors = { i9: 'bg-blue-100 text-blue-700', w2: 'bg-green-100 text-green-700', everify: 'bg-purple-100 text-purple-700', onboarding: 'bg-orange-100 text-orange-700', nca: 'bg-indigo-100 text-indigo-700' };
    return colors?.[type] || 'bg-gray-100 text-gray-700';
  };
  const ncaStats = {
    total: complianceCandidates.length,
    notStarted: complianceCandidates.filter(c => !c.nca_status || c.nca_status === 'not_started').length,
    downloaded: complianceCandidates.filter(c => c.nca_status === 'downloaded').length,
    uploaded: complianceCandidates.filter(c => c.nca_status === 'uploaded').length,
    verified: complianceCandidates.filter(c => c.nca_status === 'verified').length,
  };

  const renderComplianceOverview = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {[
          { label: 'Total Forms', value: complianceForms.length, color: 'text-foreground' },
          { label: 'I-9 Forms', value: filteredForms('i9').length, color: 'text-blue-600' },
          { label: 'E-Verify', value: filteredForms('everify').length, color: 'text-purple-600' },
          { label: 'NCA Verified', value: ncaStats.verified, color: 'text-green-600' },
          { label: 'NCA Pending', value: ncaStats.notStarted + ncaStats.downloaded, color: 'text-amber-600' },
          { label: 'Verified Forms', value: complianceForms.filter(f => f.is_verified).length, color: 'text-green-600' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-card p-5 rounded-xl border border-border">
            <p className="text-xs text-muted-foreground mb-1">{label}</p>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>
      <div className="bg-card rounded-xl border border-border p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Icon name="Shield" size={20} className="text-primary" />
          NCA Compliance Summary
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Not Started', value: ncaStats.notStarted, bg: 'bg-gray-50', color: 'text-gray-600' },
            { label: 'Downloaded', value: ncaStats.downloaded, bg: 'bg-yellow-50', color: 'text-yellow-600' },
            { label: 'Uploaded', value: ncaStats.uploaded, bg: 'bg-blue-50', color: 'text-blue-600' },
            { label: 'Verified', value: ncaStats.verified, bg: 'bg-green-50', color: 'text-green-600' },
          ].map(({ label, value, bg, color }) => (
            <div key={label} className={`text-center p-4 ${bg} rounded-lg`}>
              <p className={`text-3xl font-bold ${color}`}>{value}</p>
              <p className="text-sm text-muted-foreground mt-1">{label}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-card rounded-xl border border-border p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Icon name="Clock" size={20} className="text-primary" />
          Recent Compliance Activity
        </h3>
        <div className="space-y-3">
          {complianceForms.slice(0, 5).map(form => (
            <div key={form.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-3">
                <span className={`px-2 py-1 rounded text-xs font-medium ${getFormTypeColor(form.form_type)}`}>
                  {form.form_type?.toUpperCase()}
                </span>
                <div>
                  <p className="text-sm font-medium text-foreground">{form.candidate?.full_name || `${form.candidate?.first_name} ${form.candidate?.last_name}`}</p>
                  <p className="text-xs text-muted-foreground">{form.candidate?.email}</p>
                </div>
              </div>
              <div className="text-right">
                {form.is_verified ? (
                  <span className="text-xs text-green-600 font-medium flex items-center gap-1"><Icon name="CheckCircle" size={14} /> Verified</span>
                ) : (
                  <span className="text-xs text-amber-600 font-medium flex items-center gap-1"><Icon name="Clock" size={14} /> Pending</span>
                )}
                <p className="text-xs text-muted-foreground mt-1">{form.generated_date ? new Date(form.generated_date).toLocaleDateString() : ''}</p>
              </div>
            </div>
          ))}
          {complianceForms.length === 0 && !complianceLoading && (
            <p className="text-sm text-muted-foreground text-center py-4">No compliance forms yet</p>
          )}
        </div>
      </div>
    </div>
  );

  const renderComplianceFormsTable = (formType) => {
    const data = formType ? filteredForms(formType) : complianceForms;
    return (
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        {complianceLoading ? (
          <div className="p-12 text-center"><div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" /><p className="text-muted-foreground">Loading forms...</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Candidate</th>
                  {!formType && <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Form Type</th>}
                  <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Generated Date</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Verified By</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Document</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.map(form => (
                  <tr key={form.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-medium text-foreground">{form.candidate?.full_name || `${form.candidate?.first_name} ${form.candidate?.last_name}`}</p>
                      <p className="text-sm text-muted-foreground">{form.candidate?.email}</p>
                    </td>
                    {!formType && (
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getFormTypeColor(form.form_type)}`}>{form.form_type?.toUpperCase()}</span>
                      </td>
                    )}
                    <td className="px-6 py-4 text-sm text-foreground">{form.generated_date ? new Date(form.generated_date).toLocaleDateString() : 'N/A'}</td>
                    <td className="px-6 py-4 text-sm text-foreground">{form.verified_by_user?.full_name || 'N/A'}</td>
                    <td className="px-6 py-4">
                      {form.is_verified ? (
                        <span className="flex items-center text-green-600 text-sm"><Icon name="CheckCircle" size={16} className="mr-1" />Verified</span>
                      ) : (
                        <span className="flex items-center text-amber-600 text-sm"><Icon name="Clock" size={16} className="mr-1" />Pending</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {form.document_url ? (
                        <a href={form.document_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80 flex items-center text-sm"><Icon name="Download" size={16} className="mr-1" />Download</a>
                      ) : (
                        <span className="text-muted-foreground text-sm">N/A</span>
                      )}
                    </td>
                  </tr>
                ))}
                {data.length === 0 && (
                  <tr><td colSpan={formType ? 5 : 6} className="px-6 py-12 text-center text-muted-foreground">No forms found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  const renderNcaTab = () => (
    <div className="space-y-6">
      <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-5">
        <div className="flex items-start gap-3">
          <Icon name="Info" size={20} className="text-indigo-600 mt-0.5 shrink-0" />
          <div>
            <h4 className="text-sm font-semibold text-indigo-800">NCA Compliance Workflow</h4>
            <p className="text-sm text-indigo-700 mt-1">Every candidate must complete a Non-Compete Agreement before being marketed to vendors. Workflow: <strong>Download Template</strong> → <strong>Candidate Signs & Uploads</strong> → <strong>Admin Verifies</strong> → <strong>Cleared for Marketing</strong>.</p>
          </div>
        </div>
      </div>
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        {ncaLoading ? (
          <div className="p-12 text-center"><div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" /><p className="text-muted-foreground">Loading NCA data...</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  {['Candidate', 'Deal Type', 'Status', 'NCA Status', 'Uploaded', 'Marketing', 'Actions'].map(h => (
                    <th key={h} className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {complianceCandidates.map(candidate => {
                  const ncaStatus = candidate.nca_status || 'not_started';
                  const isCleared = ncaStatus === 'uploaded' || ncaStatus === 'verified';
                  return (
                    <tr key={candidate.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-medium text-foreground">{candidate.full_name || `${candidate.first_name} ${candidate.last_name}`}</p>
                        <p className="text-sm text-muted-foreground">{candidate.email}</p>
                      </td>
                      <td className="px-6 py-4 text-sm text-foreground capitalize">{candidate.deal_type?.replace('_', ' ') || '-'}</td>
                      <td className="px-6 py-4 text-sm text-foreground capitalize">{candidate.status?.replace('_', ' ') || '-'}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${NCA_STATUS_COLORS[ncaStatus]}`}>{NCA_STATUS_LABELS[ncaStatus]}</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">{candidate.nca_uploaded_at ? new Date(candidate.nca_uploaded_at).toLocaleDateString() : '-'}</td>
                      <td className="px-6 py-4">
                        {isCleared ? (
                          <span className="text-xs text-green-600 font-medium flex items-center gap-1"><Icon name="CheckCircle" size={14} />Cleared</span>
                        ) : (
                          <span className="text-xs text-red-500 font-medium flex items-center gap-1"><Icon name="XCircle" size={14} />Blocked</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {ncaStatus === 'not_started' && (
                            <button onClick={() => handleNcaStatusUpdate(candidate.id, 'downloaded')} className="px-3 py-1.5 text-xs font-medium bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors flex items-center gap-1"><Icon name="Download" size={14} />Mark Downloaded</button>
                          )}
                          {ncaStatus === 'downloaded' && (
                            <button onClick={() => handleNcaStatusUpdate(candidate.id, 'uploaded')} className="px-3 py-1.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors flex items-center gap-1"><Icon name="Upload" size={14} />Mark Uploaded</button>
                          )}
                          {ncaStatus === 'uploaded' && (
                            <button onClick={() => handleNcaStatusUpdate(candidate.id, 'verified')} className="px-3 py-1.5 text-xs font-medium bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors flex items-center gap-1"><Icon name="CheckCircle" size={14} />Verify</button>
                          )}
                          {ncaStatus === 'verified' && (
                            <span className="text-xs text-green-600 font-medium flex items-center gap-1"><Icon name="ShieldCheck" size={14} />Verified</span>
                          )}
                          {candidate.nca_document_url && (
                            <a href={candidate.nca_document_url} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 text-xs font-medium bg-muted text-foreground rounded-lg hover:bg-muted/70 transition-colors flex items-center gap-1"><Icon name="ExternalLink" size={14} />View</a>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {complianceCandidates.length === 0 && (
                  <tr><td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">No candidates found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );

  const getAlertColor = (status) => {
    switch (status) {
      case 'critical': return 'bg-red-100 text-red-700 border-red-200';
      case 'warning': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      default: return 'bg-green-100 text-green-700 border-green-200';
    }
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
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-foreground">HR & Compliance</h1>
                <p className="text-muted-foreground">Manage onboarding, visa tracking, and compliance documents</p>
              </div>
              <Button onClick={handleGenerateReport} className="flex items-center gap-2">
                <Icon name="FileText" size={18} />
                Generate Report
              </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="bg-card p-6 rounded-xl border border-border">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-muted-foreground">Onboarding Tasks</p>
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <Icon name="ClipboardCheck" size={20} className="text-blue-600" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-foreground">{completedTasks}/{totalTasks}</p>
                <div className="mt-2 w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all"
                    style={{ width: `${(completedTasks / totalTasks) * 100}%` }}
                  />
                </div>
              </div>

              <div className="bg-card p-6 rounded-xl border border-border">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-muted-foreground">Visa Alerts</p>
                  <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                    <Icon name="AlertTriangle" size={20} className="text-orange-600" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-foreground">{criticalVisaAlerts}</p>
                <p className="text-xs text-muted-foreground mt-1">Expiring within 30 days</p>
              </div>

              <div className="bg-card p-6 rounded-xl border border-border">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-muted-foreground">Compliance Documents</p>
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                    <Icon name="FolderOpen" size={20} className="text-green-600" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-foreground">{documents.length}</p>
                <p className="text-xs text-muted-foreground mt-1">Total documents uploaded</p>
              </div>

              <div className="bg-card p-6 rounded-xl border border-border">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-muted-foreground">E-Verify Status</p>
                  <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                    <Icon name="ShieldCheck" size={20} className="text-purple-600" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-foreground">{eVerifyPercentage}%</p>
                <div className="mt-2 w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-purple-500 h-2 rounded-full transition-all"
                    style={{ width: `${eVerifyPercentage}%` }}
                  />
                </div>
              </div>

              {/* Compliance shortcut card */}
              <button
                onClick={() => setActiveTab('compliance')}
                className="bg-card p-6 rounded-xl border border-border hover:border-primary hover:shadow-md transition-all text-left group"
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-muted-foreground">Compliance & Docs</p>
                  <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                    <Icon name="Shield" size={20} className="text-indigo-600" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-foreground">NCA</p>
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1 group-hover:text-primary transition-colors">
                  View compliance dashboard <Icon name="ArrowRight" size={12} />
                </p>
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6 border-b border-border">
              {[
                { id: 'overview', label: 'Overview', icon: 'LayoutDashboard' },
                { id: 'onboarding', label: 'Onboarding Records', icon: 'ClipboardList' },
                { id: 'compliance', label: 'Compliance', icon: 'Shield' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 font-medium text-sm transition-colors border-b-2 -mb-px ${
                    activeTab === tab.id
                      ? 'text-primary border-primary'
                      : 'text-muted-foreground border-transparent hover:text-foreground'
                  }`}
                >
                  <Icon name={tab.icon} size={15} />
                  {tab.label}
                </button>
              ))}
            </div>

            {activeTab === 'compliance' && (
              <div className="space-y-6">
                {/* Compliance sub-tabs */}
                <div className="flex flex-wrap gap-2 border-b border-border pb-4">
                  {[
                    { id: 'overview', label: 'Overview', icon: 'LayoutDashboard' },
                    { id: 'nca', label: 'NCA Compliance', icon: 'Shield' },
                    { id: 'i9', label: 'I-9 Forms', icon: 'FileCheck' },
                    { id: 'everify', label: 'E-Verify', icon: 'CheckSquare' },
                    { id: 'all', label: 'All Forms', icon: 'Files' },
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setComplianceActiveTab(tab.id)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        complianceActiveTab === tab.id
                          ? 'bg-primary text-white'
                          : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                      }`}
                    >
                      <Icon name={tab.icon} size={15} />
                      {tab.label}
                    </button>
                  ))}
                </div>

                {complianceActiveTab === 'overview' && renderComplianceOverview()}
                {complianceActiveTab === 'nca' && renderNcaTab()}
                {complianceActiveTab === 'i9' && (
                  <div className="space-y-6">
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
                      <div className="flex items-start gap-3">
                        <Icon name="FileCheck" size={20} className="text-blue-600 mt-0.5 shrink-0" />
                        <div>
                          <h4 className="text-sm font-semibold text-blue-800">I-9 Employment Eligibility Verification</h4>
                          <p className="text-sm text-blue-700 mt-1">Form I-9 verifies identity and employment authorization. Employees complete Section 1 by day 1; employers complete Section 2 within 3 business days.</p>
                          <a href="https://www.uscis.gov/sites/default/files/document/forms/i-9.pdf" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 mt-3 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
                            <Icon name="Download" size={16} />
                            Download Official I-9 Form (USCIS)
                          </a>
                        </div>
                      </div>
                    </div>
                    {renderComplianceFormsTable('i9')}
                  </div>
                )}
                {complianceActiveTab === 'everify' && (
                  <div className="space-y-6">
                    <div className="bg-purple-50 border border-purple-200 rounded-xl p-5">
                      <div className="flex items-start gap-3">
                        <Icon name="CheckSquare" size={20} className="text-purple-600 mt-0.5 shrink-0" />
                        <div>
                          <h4 className="text-sm font-semibold text-purple-800">E-Verify Electronic Verification</h4>
                          <p className="text-sm text-purple-700 mt-1">E-Verify compares I-9 information with DHS and SSA records. Cases must be created within 3 business days of hire.</p>
                        </div>
                      </div>
                    </div>
                    {renderComplianceFormsTable('everify')}
                  </div>
                )}
                {complianceActiveTab === 'all' && renderComplianceFormsTable(null)}
              </div>
            )}

            {activeTab !== 'compliance' && activeTab === 'overview' ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Onboarding Checklist */}
                <div className="bg-card rounded-xl border border-border">
                  <div className="p-4 border-b border-border">
                    <h2 className="text-lg font-semibold text-foreground">Onboarding Checklist</h2>
                  </div>
                  <div className="divide-y divide-border max-h-96 overflow-y-auto">
                    {onboardingTasks.map((task) => (
                      <div key={task.id} className="p-4 hover:bg-muted/30 transition-colors">
                        <div className="flex items-start gap-3">
                          <button
                            onClick={() => handleTaskToggle(task.id)}
                            className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                              task.status === 'completed'
                                ? 'bg-green-500 border-green-500 text-white'
                                : 'border-muted-foreground hover:border-primary'
                            }`}
                          >
                            {task.status === 'completed' && <Icon name="Check" size={12} />}
                          </button>
                          <div className="flex-1">
                            <p className={`font-medium ${task.status === 'completed' ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                              {task.task}
                            </p>
                            <p className="text-sm text-muted-foreground">{task.candidate}</p>
                            <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Icon name="Calendar" size={12} />
                                Due: {new Date(task.dueDate).toLocaleDateString()}
                              </span>
                              {task.completedDate && (
                                <span className="flex items-center gap-1 text-green-600">
                                  <Icon name="CheckCircle" size={12} />
                                  Completed: {new Date(task.completedDate).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Visa Expiration Alerts */}
                <div className="bg-card rounded-xl border border-border">
                  <div className="p-4 border-b border-border">
                    <h2 className="text-lg font-semibold text-foreground">Visa Expiration Alerts</h2>
                  </div>
                  <div className="divide-y divide-border max-h-96 overflow-y-auto">
                    {visaAlerts.map((alert) => (
                      <div key={alert.id} className="p-4 hover:bg-muted/30 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              alert.status === 'critical' ? 'bg-red-100' :
                              alert.status === 'warning' ? 'bg-yellow-100' : 'bg-green-100'
                            }`}>
                              <Icon
                                name="User"
                                size={20}
                                className={
                                  alert.status === 'critical' ? 'text-red-600' :
                                  alert.status === 'warning' ? 'text-yellow-600' : 'text-green-600'
                                }
                              />
                            </div>
                            <div>
                              <p className="font-medium text-foreground">{alert.candidate}</p>
                              <p className="text-sm text-muted-foreground">{alert.visaType} Visa</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`text-sm font-medium px-2 py-1 rounded ${getAlertColor(alert.status)}`}>
                              {alert.daysUntilExpiry} days
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Expires: {new Date(alert.expirationDate).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Compliance Document Repository */}
                <div className="bg-card rounded-xl border border-border lg:col-span-2">
                  <div className="p-4 border-b border-border flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-foreground">Compliance Document Repository</h2>
                    <Button
                      size="sm"
                      onClick={() => setUploadModal({ isOpen: true })}
                      className="flex items-center gap-2"
                    >
                      <Icon name="Upload" size={16} />
                      Upload Document
                    </Button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Document Name</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Type</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Upload Date</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Size</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {documents.map((doc) => (
                          <tr key={doc.id} className="hover:bg-muted/30 transition-colors">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <Icon name="FileText" size={18} className="text-muted-foreground" />
                                <span className="font-medium text-foreground">{doc.name}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <span className="px-2 py-1 bg-muted rounded text-xs font-medium text-muted-foreground">
                                {doc.type}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-muted-foreground">
                              {new Date(doc.uploadDate).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-3 text-sm text-muted-foreground">{doc.size}</td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <button
                                  className="p-1.5 hover:bg-muted rounded transition-colors"
                                  title="Download"
                                  onClick={() => doc.url && window.open(doc.url, '_blank', 'noopener,noreferrer')}
                                  disabled={!doc.url}
                                >
                                  <Icon name="Download" size={16} className={doc.url ? "text-blue-600" : "text-muted-foreground"} />
                                </button>
                                <button
                                  className="p-1.5 hover:bg-muted rounded transition-colors"
                                  title="View"
                                  onClick={() => doc.url && window.open(doc.url, '_blank', 'noopener,noreferrer')}
                                  disabled={!doc.url}
                                >
                                  <Icon name="Eye" size={16} className={doc.url ? "text-blue-600" : "text-muted-foreground"} />
                                </button>
                                <button className="p-1.5 hover:bg-red-100 rounded transition-colors" title="Delete">
                                  <Icon name="Trash2" size={16} className="text-red-500" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : activeTab === 'onboarding' ? (
              /* Onboarding Records Table */
              <div className="bg-card rounded-xl border border-border overflow-hidden">
                {loading ? (
                  <div className="p-12 text-center">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading onboarding records...</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-muted/50 border-b border-border">
                        <tr>
                          <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Candidate</th>
                          <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Job Title</th>
                          <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Client</th>
                          <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Visa Status</th>
                          <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Onboarding Date</th>
                          <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Documents</th>
                          <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Background Check</th>
                          <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">HR Manager</th>
                          <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {onboardings?.length > 0 ? onboardings?.map((onboarding) => (
                          <tr key={onboarding?.id} className="hover:bg-muted/30 transition-colors">
                            <td className="px-6 py-4">
                              <div>
                                <p className="font-medium text-foreground">
                                  {onboarding?.candidate?.first_name} {onboarding?.candidate?.last_name}
                                </p>
                                <p className="text-sm text-muted-foreground">{onboarding?.candidate?.email}</p>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-foreground">
                              {onboarding?.placement?.job_title || 'N/A'}
                            </td>
                            <td className="px-6 py-4 text-sm text-foreground">
                              {onboarding?.placement?.client_name || 'N/A'}
                            </td>
                            <td className="px-6 py-4">
                              <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                                {onboarding?.candidate?.visa_status?.toUpperCase() || 'N/A'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-foreground">
                              {onboarding?.onboarding_date ? new Date(onboarding?.onboarding_date)?.toLocaleDateString() : 'N/A'}
                            </td>
                            <td className="px-6 py-4">
                              {onboarding?.documents_verified ? (
                                <span className="flex items-center text-green-600">
                                  <Icon name="CheckCircle" size={16} className="mr-1" />
                                  Verified
                                </span>
                              ) : (
                                <span className="flex items-center text-yellow-600">
                                  <Icon name="Clock" size={16} className="mr-1" />
                                  Pending
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              {onboarding?.background_check_completed ? (
                                <span className="flex items-center text-green-600">
                                  <Icon name="CheckCircle" size={16} className="mr-1" />
                                  Completed
                                </span>
                              ) : (
                                <span className="flex items-center text-yellow-600">
                                  <Icon name="Clock" size={16} className="mr-1" />
                                  Pending
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-sm text-foreground">
                              {onboarding?.hr_manager?.full_name || 'N/A'}
                            </td>
                            <td className="px-6 py-4">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                onboarding?.allocation_status === 'Completed'
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-yellow-100 text-yellow-700'
                              }`}>
                                {onboarding?.allocation_status || 'In Progress'}
                              </span>
                            </td>
                          </tr>
                        )) : (
                          <tr>
                            <td colSpan="9" className="px-6 py-12 text-center text-muted-foreground">
                              <Icon name="Users" size={48} className="mx-auto mb-4 opacity-20" />
                              <p>No onboarding records found</p>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ) : null}
          </motion.div>
        </div>
      </main>

      {/* Upload Document Modal */}
      <Modal
        isOpen={uploadModal.isOpen}
        onClose={() => setUploadModal({ isOpen: false })}
        title="Upload Document"
        size="md"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setUploadModal({ isOpen: false })}>
              Cancel
            </Button>
            <Button onClick={handleUploadDocument}>
              Upload
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Document Name</label>
            <input
              type="text"
              value={uploadForm.documentName}
              onChange={(e) => setUploadForm(prev => ({ ...prev, documentName: e.target.value }))}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Enter document name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Document Type</label>
            <select
              value={uploadForm.documentType}
              onChange={(e) => setUploadForm(prev => ({ ...prev, documentType: e.target.value }))}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Select type</option>
              <option value="Policy">Policy</option>
              <option value="Form">Form</option>
              <option value="Legal">Legal</option>
              <option value="Training">Training</option>
              <option value="Compliance">Compliance</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">File</label>
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer">
              <Icon name="Upload" size={32} className="mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Click to upload or drag and drop</p>
              <p className="text-xs text-muted-foreground mt-1">PDF, DOC, DOCX, XLS, XLSX up to 10MB</p>
              <input type="file" className="hidden" />
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default HROnboarding;
