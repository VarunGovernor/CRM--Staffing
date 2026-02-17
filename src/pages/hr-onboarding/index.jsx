import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Header from '../../components/ui/Header';
import Sidebar from '../../components/ui/Sidebar';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { supabase } from '../../lib/supabase';

const HROnboarding = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [onboardings, setOnboardings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

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
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6 border-b border-border">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 -mb-px ${
                  activeTab === 'overview'
                    ? 'text-primary border-primary'
                    : 'text-muted-foreground border-transparent hover:text-foreground'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('onboarding')}
                className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 -mb-px ${
                  activeTab === 'onboarding'
                    ? 'text-primary border-primary'
                    : 'text-muted-foreground border-transparent hover:text-foreground'
                }`}
              >
                Onboarding Records
              </button>
            </div>

            {activeTab === 'overview' ? (
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
            ) : (
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
            )}
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
