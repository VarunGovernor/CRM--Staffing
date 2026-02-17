import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Header from '../../components/ui/Header';
import Sidebar from '../../components/ui/Sidebar';
import Icon from '../../components/AppIcon';
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

const TABS = [
  { id: 'overview', label: 'Overview', icon: 'LayoutDashboard' },
  { id: 'nca', label: 'NCA Compliance', icon: 'Shield' },
  { id: 'i9', label: 'I-9 Forms', icon: 'FileCheck' },
  { id: 'everify', label: 'E-Verify', icon: 'CheckSquare' },
  { id: 'all', label: 'All Forms', icon: 'Files' }
];

const Compliance = () => {
  const { user } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [forms, setForms] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ncaLoading, setNcaLoading] = useState(true);

  useEffect(() => {
    fetchForms();
    fetchCandidatesNca();
  }, []);

  const fetchForms = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase?.from('compliance_forms')?.select(`
          *,
          candidate:candidates(first_name, last_name, full_name, email),
          verified_by_user:user_profiles!verified_by(full_name)
        `)?.order('generated_date', { ascending: false });

      if (error) throw error;
      setForms(data || []);
    } catch (error) {
      console.error('Error fetching compliance forms:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCandidatesNca = async () => {
    try {
      setNcaLoading(true);
      const { data, error } = await supabase
        ?.from('candidates')
        ?.select('id, first_name, last_name, full_name, email, nca_status, nca_document_url, nca_uploaded_at, nca_verified_by, status, deal_type')
        ?.order('created_at', { ascending: false });

      if (error) throw error;
      setCandidates(data || []);
    } catch (error) {
      console.error('Error fetching candidates NCA data:', error);
    } finally {
      setNcaLoading(false);
    }
  };

  const getCandidateName = (c) => {
    return c?.full_name || `${c?.first_name || ''} ${c?.last_name || ''}`.trim();
  };

  const handleNcaStatusUpdate = async (candidateId, newStatus) => {
    const updates = { nca_status: newStatus };
    if (newStatus === 'verified') {
      updates.nca_verified_by = user?.id;
    }
    if (newStatus === 'uploaded') {
      updates.nca_uploaded_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('candidates')
      .update(updates)
      .eq('id', candidateId);

    if (!error) {
      fetchCandidatesNca();
    }
  };

  const getFormTypeColor = (type) => {
    const colors = {
      'i9': 'bg-blue-100 text-blue-700',
      'w2': 'bg-green-100 text-green-700',
      'everify': 'bg-purple-100 text-purple-700',
      'onboarding': 'bg-orange-100 text-orange-700',
      'nca': 'bg-indigo-100 text-indigo-700'
    };
    return colors?.[type] || 'bg-gray-100 text-gray-700';
  };

  const filteredForms = (type) => {
    if (!type) return forms;
    return forms.filter(f => f.form_type === type);
  };

  // Stats
  const ncaStats = {
    total: candidates.length,
    notStarted: candidates.filter(c => !c.nca_status || c.nca_status === 'not_started').length,
    downloaded: candidates.filter(c => c.nca_status === 'downloaded').length,
    uploaded: candidates.filter(c => c.nca_status === 'uploaded').length,
    verified: candidates.filter(c => c.nca_status === 'verified').length
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <div className="bg-card p-5 rounded-xl border border-border">
          <p className="text-xs text-muted-foreground mb-1">Total Forms</p>
          <p className="text-2xl font-bold text-foreground">{forms.length}</p>
        </div>
        <div className="bg-card p-5 rounded-xl border border-border">
          <p className="text-xs text-muted-foreground mb-1">I-9 Forms</p>
          <p className="text-2xl font-bold text-blue-600">{filteredForms('i9').length}</p>
        </div>
        <div className="bg-card p-5 rounded-xl border border-border">
          <p className="text-xs text-muted-foreground mb-1">E-Verify</p>
          <p className="text-2xl font-bold text-purple-600">{filteredForms('everify').length}</p>
        </div>
        <div className="bg-card p-5 rounded-xl border border-border">
          <p className="text-xs text-muted-foreground mb-1">NCA Verified</p>
          <p className="text-2xl font-bold text-green-600">{ncaStats.verified}</p>
        </div>
        <div className="bg-card p-5 rounded-xl border border-border">
          <p className="text-xs text-muted-foreground mb-1">NCA Pending</p>
          <p className="text-2xl font-bold text-amber-600">{ncaStats.notStarted + ncaStats.downloaded}</p>
        </div>
        <div className="bg-card p-5 rounded-xl border border-border">
          <p className="text-xs text-muted-foreground mb-1">Verified Forms</p>
          <p className="text-2xl font-bold text-success">{forms.filter(f => f.is_verified).length}</p>
        </div>
      </div>

      {/* NCA Compliance Summary */}
      <div className="bg-card rounded-xl border border-border p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Icon name="Shield" size={20} className="text-primary" />
          NCA Compliance Summary
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-3xl font-bold text-gray-600">{ncaStats.notStarted}</p>
            <p className="text-sm text-muted-foreground mt-1">Not Started</p>
          </div>
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <p className="text-3xl font-bold text-yellow-600">{ncaStats.downloaded}</p>
            <p className="text-sm text-muted-foreground mt-1">Downloaded</p>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-3xl font-bold text-blue-600">{ncaStats.uploaded}</p>
            <p className="text-sm text-muted-foreground mt-1">Uploaded</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-3xl font-bold text-green-600">{ncaStats.verified}</p>
            <p className="text-sm text-muted-foreground mt-1">Verified</p>
          </div>
        </div>
        {ncaStats.notStarted > 0 && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2">
            <Icon name="AlertTriangle" size={16} className="text-amber-600" />
            <p className="text-sm text-amber-700">
              <strong>{ncaStats.notStarted}</strong> candidates have not started NCA compliance. They cannot be submitted to vendors until NCA is uploaded and verified.
            </p>
          </div>
        )}
      </div>

      {/* Recent Forms */}
      <div className="bg-card rounded-xl border border-border p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Icon name="Clock" size={20} className="text-primary" />
          Recent Compliance Activity
        </h3>
        <div className="space-y-3">
          {forms.slice(0, 5).map(form => (
            <div key={form.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-3">
                <span className={`px-2 py-1 rounded text-xs font-medium ${getFormTypeColor(form.form_type)}`}>
                  {form.form_type?.toUpperCase()}
                </span>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {form.candidate?.full_name || `${form.candidate?.first_name} ${form.candidate?.last_name}`}
                  </p>
                  <p className="text-xs text-muted-foreground">{form.candidate?.email}</p>
                </div>
              </div>
              <div className="text-right">
                {form.is_verified ? (
                  <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                    <Icon name="CheckCircle" size={14} /> Verified
                  </span>
                ) : (
                  <span className="text-xs text-amber-600 font-medium flex items-center gap-1">
                    <Icon name="Clock" size={14} /> Pending
                  </span>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  {form.generated_date ? new Date(form.generated_date).toLocaleDateString() : ''}
                </p>
              </div>
            </div>
          ))}
          {forms.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">No compliance forms yet</p>
          )}
        </div>
      </div>
    </div>
  );

  const renderNcaTab = () => (
    <div className="space-y-6">
      {/* NCA Info Banner */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-5">
        <div className="flex items-start gap-3">
          <Icon name="Info" size={20} className="text-indigo-600 mt-0.5 shrink-0" />
          <div>
            <h4 className="text-sm font-semibold text-indigo-800">NCA Compliance Workflow</h4>
            <p className="text-sm text-indigo-700 mt-1">
              Every candidate must complete a Non-Compete Agreement before they can be marketed to vendors.
              The workflow is: <strong>Download Template</strong> → <strong>Candidate Signs & Uploads</strong> → <strong>Admin Verifies</strong> → <strong>Cleared for Marketing</strong>.
            </p>
          </div>
        </div>
      </div>

      {/* NCA Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card p-5 rounded-xl border border-border">
          <p className="text-xs text-muted-foreground mb-1">Not Started</p>
          <p className="text-2xl font-bold text-gray-600">{ncaStats.notStarted}</p>
        </div>
        <div className="bg-card p-5 rounded-xl border border-border">
          <p className="text-xs text-muted-foreground mb-1">Downloaded</p>
          <p className="text-2xl font-bold text-yellow-600">{ncaStats.downloaded}</p>
        </div>
        <div className="bg-card p-5 rounded-xl border border-border">
          <p className="text-xs text-muted-foreground mb-1">Uploaded</p>
          <p className="text-2xl font-bold text-blue-600">{ncaStats.uploaded}</p>
        </div>
        <div className="bg-card p-5 rounded-xl border border-border">
          <p className="text-xs text-muted-foreground mb-1">Verified</p>
          <p className="text-2xl font-bold text-green-600">{ncaStats.verified}</p>
        </div>
      </div>

      {/* NCA Candidates Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        {ncaLoading ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading NCA data...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Candidate</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Deal Type</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">NCA Status</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Uploaded</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Marketing</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {candidates.map((candidate) => {
                  const ncaStatus = candidate.nca_status || 'not_started';
                  const isCleared = ncaStatus === 'uploaded' || ncaStatus === 'verified';
                  return (
                    <tr key={candidate.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-foreground">{getCandidateName(candidate)}</p>
                          <p className="text-sm text-muted-foreground">{candidate.email}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-foreground capitalize">
                        {candidate.deal_type?.replace('_', ' ') || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-foreground capitalize">
                        {candidate.status?.replace('_', ' ') || '-'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${NCA_STATUS_COLORS[ncaStatus]}`}>
                          {NCA_STATUS_LABELS[ncaStatus]}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {candidate.nca_uploaded_at
                          ? new Date(candidate.nca_uploaded_at).toLocaleDateString()
                          : '-'
                        }
                      </td>
                      <td className="px-6 py-4">
                        {isCleared ? (
                          <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                            <Icon name="CheckCircle" size={14} />
                            Cleared
                          </span>
                        ) : (
                          <span className="text-xs text-red-500 font-medium flex items-center gap-1">
                            <Icon name="XCircle" size={14} />
                            Blocked
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {ncaStatus === 'not_started' && (
                            <button
                              onClick={() => handleNcaStatusUpdate(candidate.id, 'downloaded')}
                              className="px-3 py-1.5 text-xs font-medium bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors flex items-center gap-1"
                            >
                              <Icon name="Download" size={14} />
                              Mark Downloaded
                            </button>
                          )}
                          {ncaStatus === 'downloaded' && (
                            <button
                              onClick={() => handleNcaStatusUpdate(candidate.id, 'uploaded')}
                              className="px-3 py-1.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors flex items-center gap-1"
                            >
                              <Icon name="Upload" size={14} />
                              Mark Uploaded
                            </button>
                          )}
                          {ncaStatus === 'uploaded' && (
                            <button
                              onClick={() => handleNcaStatusUpdate(candidate.id, 'verified')}
                              className="px-3 py-1.5 text-xs font-medium bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors flex items-center gap-1"
                            >
                              <Icon name="CheckCircle" size={14} />
                              Verify
                            </button>
                          )}
                          {ncaStatus === 'verified' && (
                            <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                              <Icon name="ShieldCheck" size={14} />
                              Verified
                            </span>
                          )}
                          {candidate.nca_document_url && (
                            <a
                              href={candidate.nca_document_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1.5 text-xs font-medium bg-muted text-foreground rounded-lg hover:bg-muted/70 transition-colors flex items-center gap-1"
                            >
                              <Icon name="ExternalLink" size={14} />
                              View
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {candidates.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                      No candidates found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );

  const renderFormsTable = (formType) => {
    const data = formType ? filteredForms(formType) : forms;
    const typeLabel = formType ? formType.toUpperCase() : 'All';

    return (
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading {typeLabel} forms...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Candidate</th>
                  {!formType && (
                    <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Form Type</th>
                  )}
                  <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Generated Date</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Verified By</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Verified Date</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Document</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.map((form) => (
                  <tr key={form.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-foreground">
                          {form.candidate?.full_name || `${form.candidate?.first_name} ${form.candidate?.last_name}`}
                        </p>
                        <p className="text-sm text-muted-foreground">{form.candidate?.email}</p>
                      </div>
                    </td>
                    {!formType && (
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getFormTypeColor(form.form_type)}`}>
                          {form.form_type?.toUpperCase()}
                        </span>
                      </td>
                    )}
                    <td className="px-6 py-4 text-sm text-foreground">
                      {form.generated_date ? new Date(form.generated_date).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-foreground">
                      {form.verified_by_user?.full_name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-foreground">
                      {form.verified_date ? new Date(form.verified_date).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      {form.is_verified ? (
                        <span className="flex items-center text-success text-sm">
                          <Icon name="CheckCircle" size={16} className="mr-1" />
                          Verified
                        </span>
                      ) : (
                        <span className="flex items-center text-warning text-sm">
                          <Icon name="Clock" size={16} className="mr-1" />
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {form.document_url ? (
                        <a
                          href={form.document_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:text-primary/80 flex items-center text-sm"
                        >
                          <Icon name="Download" size={16} className="mr-1" />
                          Download
                        </a>
                      ) : (
                        <span className="text-muted-foreground text-sm">N/A</span>
                      )}
                    </td>
                  </tr>
                ))}
                {data.length === 0 && (
                  <tr>
                    <td colSpan={formType ? 6 : 7} className="px-6 py-12 text-center text-muted-foreground">
                      No {typeLabel} forms found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
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
            <div className="mb-6">
              <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">Compliance & Documents</h1>
              <p className="text-muted-foreground">Manage NCA, I-9, E-Verify, and onboarding compliance documents</p>
            </div>

            {/* Tabs */}
            <div className="flex flex-wrap gap-2 mb-6 border-b border-border pb-4">
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-primary text-white'
                      : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                  }`}
                >
                  <Icon name={tab.icon} size={16} />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            {activeTab === 'overview' && renderOverview()}
            {activeTab === 'nca' && renderNcaTab()}
            {activeTab === 'i9' && (
              <div className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
                  <div className="flex items-start gap-3">
                    <Icon name="FileCheck" size={20} className="text-blue-600 mt-0.5 shrink-0" />
                    <div>
                      <h4 className="text-sm font-semibold text-blue-800">I-9 Employment Eligibility Verification</h4>
                      <p className="text-sm text-blue-700 mt-1">
                        Form I-9 is used to verify the identity and employment authorization of individuals hired for employment in the United States.
                        All employees must complete Section 1 by their first day. Employers must complete Section 2 within 3 business days.
                      </p>
                      <a
                        href="https://www.uscis.gov/sites/default/files/document/forms/i-9.pdf"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 mt-3 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <Icon name="Download" size={16} />
                        Download Official I-9 Form (USCIS)
                      </a>
                    </div>
                  </div>
                </div>
                {renderFormsTable('i9')}
              </div>
            )}
            {activeTab === 'everify' && (
              <div className="space-y-6">
                <div className="bg-purple-50 border border-purple-200 rounded-xl p-5">
                  <div className="flex items-start gap-3">
                    <Icon name="CheckSquare" size={20} className="text-purple-600 mt-0.5 shrink-0" />
                    <div>
                      <h4 className="text-sm font-semibold text-purple-800">E-Verify Electronic Verification</h4>
                      <p className="text-sm text-purple-700 mt-1">
                        E-Verify electronically compares information from Form I-9 with records from the U.S. Department of Homeland Security and the Social Security Administration.
                        Cases must be created within 3 business days of hire.
                      </p>
                    </div>
                  </div>
                </div>
                {renderFormsTable('everify')}
              </div>
            )}
            {activeTab === 'all' && renderFormsTable(null)}
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default Compliance;
