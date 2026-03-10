import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Header from '../../components/ui/Header';
import Sidebar from '../../components/ui/Sidebar';
import Icon from '../../components/AppIcon';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { notifyOnNcaSigned, notifyOnBgcCompleted } from '../../lib/notifications';

// ─── Constants ───────────────────────────────────────────────────────────────

const DOC_TYPES = [
  { key: 'i9',           label: 'I-9 Form',           icon: 'FileText',    description: 'Employment Eligibility Verification' },
  { key: 'everify',      label: 'E-Verify',            icon: 'ShieldCheck', description: 'Electronic employment authorization' },
  { key: 'nca',          label: 'NCA / Non-Compete',   icon: 'FileSignature', description: 'Non-Compete Agreement' },
  { key: 'bgc',          label: 'Background Check',    icon: 'Search',      description: 'Criminal & employment background check' },
  { key: 'offer_letter', label: 'Offer Letter',        icon: 'Mail',        description: 'Signed offer letter from client' },
];

const STATUS_CONFIG = {
  pending:  { label: 'Pending',  color: 'bg-gray-100 text-gray-600',   dot: 'bg-gray-400' },
  uploaded: { label: 'Uploaded', color: 'bg-blue-100 text-blue-700',   dot: 'bg-blue-500' },
  verified: { label: 'Verified', color: 'bg-green-100 text-green-700', dot: 'bg-green-500' },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-700',     dot: 'bg-red-500' },
};

const getOverallStatus = (docs) => {
  if (!docs || docs.length === 0) return { label: 'Not Started', color: 'bg-gray-100 text-gray-600' };
  const all = DOC_TYPES.map(dt => docs.find(d => d.doc_type === dt.key));
  const verified = all.filter(d => d?.status === 'verified').length;
  const total = DOC_TYPES.length;
  if (verified === total) return { label: 'Complete', color: 'bg-green-100 text-green-700' };
  if (verified > 0) return { label: `${verified}/${total} Verified`, color: 'bg-blue-100 text-blue-700' };
  const uploaded = all.filter(d => d?.status === 'uploaded').length;
  if (uploaded > 0) return { label: 'In Progress', color: 'bg-yellow-100 text-yellow-700' };
  return { label: 'Not Started', color: 'bg-gray-100 text-gray-600' };
};

// ─── Doc Row ─────────────────────────────────────────────────────────────────

const DocRow = ({ docType, doc, isAdmin, onUpload, onVerify, onReject, onViewFile }) => {
  const cfg = STATUS_CONFIG[doc?.status || 'pending'];
  const hasFile = !!doc?.file_url;

  return (
    <div className="flex items-center gap-4 p-4 rounded-xl border border-border hover:bg-muted/30 transition-colors">
      <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
        <Icon name={docType.icon} size={18} className="text-primary" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-medium text-foreground text-sm">{docType.label}</p>
        <p className="text-xs text-muted-foreground">{docType.description}</p>
        {doc?.file_name && (
          <p className="text-xs text-primary mt-0.5 truncate">{doc.file_name}</p>
        )}
        {doc?.notes && (
          <p className="text-xs text-muted-foreground italic mt-0.5">{doc.notes}</p>
        )}
      </div>

      {/* Status badge */}
      <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.color} flex-shrink-0`}>
        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
        {cfg.label}
      </span>

      {/* Actions */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {hasFile && (
          <button
            onClick={() => onViewFile(doc)}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            title="View file"
          >
            <Icon name="ExternalLink" size={14} />
          </button>
        )}

        {/* Candidate or admin can upload */}
        {(doc?.status === 'pending' || doc?.status === 'rejected') && (
          <button
            onClick={() => onUpload(docType)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:bg-primary/90 transition-colors"
          >
            <Icon name="Upload" size={12} />
            Upload
          </button>
        )}

        {/* Admin can verify or reject uploaded docs */}
        {isAdmin && doc?.status === 'uploaded' && (
          <>
            <button
              onClick={() => onVerify(doc, docType)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 transition-colors"
            >
              <Icon name="Check" size={12} />
              Verify
            </button>
            <button
              onClick={() => onReject(doc)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-red-600 text-white rounded-lg text-xs font-medium hover:bg-red-700 transition-colors"
            >
              <Icon name="X" size={12} />
              Reject
            </button>
          </>
        )}

        {/* Admin can re-upload verified docs */}
        {isAdmin && doc?.status === 'verified' && (
          <button
            onClick={() => onUpload(docType)}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            title="Replace file"
          >
            <Icon name="RefreshCw" size={13} />
          </button>
        )}
      </div>
    </div>
  );
};

// ─── Upload Modal ────────────────────────────────────────────────────────────

const UploadModal = ({ docType, candidateId, onClose, onSuccess }) => {
  const [file, setFile] = useState(null);
  const [notes, setNotes] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!file) { setError('Please select a file.'); return; }
    setUploading(true);
    setError('');

    try {
      let fileUrl = null;
      let fileName = file.name;

      // Try Supabase Storage upload
      const filePath = `hr-docs/${candidateId}/${docType.key}/${Date.now()}_${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('hr-docs')
        .upload(filePath, file, { upsert: true });

      if (!uploadError) {
        const { data: { publicUrl } } = supabase.storage.from('hr-docs').getPublicUrl(filePath);
        fileUrl = publicUrl;
      } else {
        // Storage bucket might not exist — store file name only
        console.warn('Storage upload failed (bucket may not exist):', uploadError.message);
        fileUrl = null;
      }

      // Upsert the doc record
      const { error: dbError } = await supabase
        .from('hr_onboarding_docs')
        .upsert({
          candidate_id: candidateId,
          doc_type: docType.key,
          status: 'uploaded',
          file_url: fileUrl,
          file_name: fileName,
          notes: notes.trim() || null,
        }, { onConflict: 'candidate_id,doc_type' });

      if (dbError) throw dbError;
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <motion.div className="relative bg-card border border-border rounded-2xl shadow-xl w-full max-w-md" initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} transition={{ duration: 0.2 }}>
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Upload {docType.label}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{docType.description}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg"><Icon name="X" size={18} className="text-muted-foreground" /></button>
        </div>
        <div className="p-6 space-y-4">
          {error && <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm"><Icon name="AlertCircle" size={15} />{error}</div>}

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">File *</label>
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-xl cursor-pointer hover:bg-muted/30 transition-colors">
              {file ? (
                <div className="text-center px-4">
                  <Icon name="FileCheck" size={24} className="mx-auto mb-1 text-green-600" />
                  <p className="text-sm font-medium text-foreground truncate max-w-xs">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
              ) : (
                <div className="text-center">
                  <Icon name="Upload" size={24} className="mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Click to select file</p>
                  <p className="text-xs text-muted-foreground">PDF, JPG, PNG, DOCX</p>
                </div>
              )}
              <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png,.docx,.doc" onChange={(e) => setFile(e.target.files[0])} />
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Any notes about this document..."
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
            />
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 p-6 border-t border-border">
          <button onClick={onClose} className="px-4 py-2 border border-border rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors">Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={uploading}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-60"
          >
            {uploading ? <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" /> : <Icon name="Upload" size={15} />}
            {uploading ? 'Uploading...' : 'Upload Document'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ─── Main Page ───────────────────────────────────────────────────────────────

const HROnboarding = () => {
  const { user, userProfile } = useAuth();
  const isAdmin = userProfile?.role === 'admin' || userProfile?.role === 'hr';
  const isCandidate = userProfile?.role === 'candidate';

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [candidates, setCandidates] = useState([]);
  const [docsByCandidateId, setDocsByCandidateId] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [uploadModal, setUploadModal] = useState(null); // { docType, candidateId }

  useEffect(() => {
    fetchData();
  }, [user, userProfile]);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      let candidateQuery = supabase.from('candidates').select('id, first_name, last_name, email, technology').order('first_name');
      if (isCandidate) {
        // Candidates see only themselves
        candidateQuery = candidateQuery.eq('email', user.email);
      }
      const { data: candidateData, error: candErr } = await candidateQuery;
      if (candErr) throw candErr;

      setCandidates(candidateData || []);

      if (candidateData?.length > 0) {
        const ids = candidateData.map(c => c.id);
        const { data: docsData } = await supabase
          .from('hr_onboarding_docs')
          .select('*')
          .in('candidate_id', ids);

        // Group by candidate_id
        const grouped = {};
        (docsData || []).forEach(doc => {
          if (!grouped[doc.candidate_id]) grouped[doc.candidate_id] = [];
          grouped[doc.candidate_id].push(doc);
        });
        setDocsByCandidateId(grouped);

        // Auto-select first candidate if candidate role
        if (isCandidate && candidateData.length > 0) {
          setSelectedCandidate(candidateData[0]);
        }
      }
    } catch (err) {
      console.error('HR Onboarding fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (doc, docType) => {
    try {
      const { error } = await supabase
        .from('hr_onboarding_docs')
        .update({ status: 'verified', verified_by: user.id, verified_at: new Date().toISOString() })
        .eq('id', doc.id);
      if (error) throw error;

      // Fire notifications
      if (docType.key === 'nca' && selectedCandidate) {
        const name = `${selectedCandidate.first_name} ${selectedCandidate.last_name}`;
        notifyOnNcaSigned(name, selectedCandidate.id);
      }
      if (docType.key === 'bgc' && selectedCandidate) {
        const name = `${selectedCandidate.first_name} ${selectedCandidate.last_name}`;
        notifyOnBgcCompleted(name, selectedCandidate.id);
      }

      await fetchData();
    } catch (err) {
      console.error('Verify error:', err);
    }
  };

  const handleReject = async (doc) => {
    try {
      const { error } = await supabase
        .from('hr_onboarding_docs')
        .update({ status: 'rejected' })
        .eq('id', doc.id);
      if (error) throw error;
      await fetchData();
    } catch (err) {
      console.error('Reject error:', err);
    }
  };

  const handleViewFile = (doc) => {
    if (doc.file_url) {
      window.open(doc.file_url, '_blank');
    } else {
      alert('No file URL available.');
    }
  };

  const filteredCandidates = useMemo(() => {
    if (!searchTerm) return candidates;
    const term = searchTerm.toLowerCase();
    return candidates.filter(c =>
      `${c.first_name} ${c.last_name}`.toLowerCase().includes(term) ||
      (c.email || '').toLowerCase().includes(term) ||
      (c.technology || '').toLowerCase().includes(term)
    );
  }, [candidates, searchTerm]);

  const selectedDocs = selectedCandidate ? (docsByCandidateId[selectedCandidate.id] || []) : [];

  // Stats
  const totalCandidates = candidates.length;
  const complete = candidates.filter(c => {
    const docs = docsByCandidateId[c.id] || [];
    return DOC_TYPES.every(dt => docs.find(d => d.doc_type === dt.key)?.status === 'verified');
  }).length;
  const inProgress = candidates.filter(c => {
    const docs = docsByCandidateId[c.id] || [];
    return docs.some(d => d.status === 'uploaded');
  }).length;

  return (
    <div className="min-h-screen bg-background">
      <Header onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)} isSidebarOpen={isSidebarOpen} />
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <main className="lg:ml-64 pt-16">
        <div className="p-4 lg:p-6">
          <motion.div initial={false} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>

            {/* Page Header */}
            <div className="mb-6">
              <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-1">HR Onboarding</h1>
              <p className="text-muted-foreground">Manage onboarding documents — I-9, E-Verify, NCA, BGC, Offer Letter</p>
            </div>

            {/* Stats (admin only) */}
            {isAdmin && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {[
                  { label: 'Total Candidates', value: totalCandidates, icon: 'Users', color: 'text-foreground' },
                  { label: 'Fully Complete', value: complete, icon: 'CheckCircle', color: 'text-green-600' },
                  { label: 'In Progress', value: inProgress, icon: 'Clock', color: 'text-blue-600' },
                  { label: 'Not Started', value: totalCandidates - complete - inProgress, icon: 'AlertCircle', color: 'text-yellow-600' },
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
            )}

            {/* Two-panel layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* Left: Candidate list (hidden for candidates — they auto-see their own) */}
              {!isCandidate && (
                <div className="lg:col-span-1">
                  <div className="bg-card rounded-xl border border-border overflow-hidden sticky top-24">
                    <div className="p-4 border-b border-border">
                      <p className="text-sm font-semibold text-foreground mb-3">Candidates ({filteredCandidates.length})</p>
                      <div className="relative">
                        <Icon name="Search" size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <input
                          type="text"
                          placeholder="Search candidates..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                      </div>
                    </div>
                    <div className="divide-y divide-border max-h-[60vh] overflow-y-auto">
                      {loading ? (
                        <div className="p-6 text-center">
                          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                        </div>
                      ) : filteredCandidates.length === 0 ? (
                        <div className="p-6 text-center text-muted-foreground text-sm">No candidates found</div>
                      ) : filteredCandidates.map(candidate => {
                        const docs = docsByCandidateId[candidate.id] || [];
                        const overall = getOverallStatus(docs);
                        const isSelected = selectedCandidate?.id === candidate.id;
                        return (
                          <button
                            key={candidate.id}
                            onClick={() => setSelectedCandidate(candidate)}
                            className={`w-full text-left p-4 hover:bg-muted/50 transition-colors ${isSelected ? 'bg-primary/5 border-l-2 border-primary' : ''}`}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm flex-shrink-0">
                                {candidate.first_name?.[0]}{candidate.last_name?.[0]}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-foreground truncate">{candidate.first_name} {candidate.last_name}</p>
                                <p className="text-xs text-muted-foreground truncate">{candidate.technology || candidate.email}</p>
                              </div>
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${overall.color}`}>
                                {overall.label}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Right: Document checklist */}
              <div className={isCandidate ? 'lg:col-span-3' : 'lg:col-span-2'}>
                {!selectedCandidate ? (
                  <div className="bg-card rounded-xl border border-border p-12 text-center">
                    <Icon name="Users" size={40} className="mx-auto mb-3 text-muted-foreground opacity-40" />
                    <p className="text-muted-foreground">Select a candidate to view their onboarding documents</p>
                  </div>
                ) : (
                  <div className="bg-card rounded-xl border border-border overflow-hidden">
                    {/* Candidate header */}
                    <div className="p-5 border-b border-border flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                          {selectedCandidate.first_name?.[0]}{selectedCandidate.last_name?.[0]}
                        </div>
                        <div>
                          <h2 className="text-lg font-semibold text-foreground">{selectedCandidate.first_name} {selectedCandidate.last_name}</h2>
                          <p className="text-sm text-muted-foreground">{selectedCandidate.technology || selectedCandidate.email}</p>
                        </div>
                      </div>
                      <div>
                        {(() => {
                          const overall = getOverallStatus(selectedDocs);
                          return <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${overall.color}`}>{overall.label}</span>;
                        })()}
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="px-5 py-3 bg-muted/30 border-b border-border">
                      {(() => {
                        const verified = selectedDocs.filter(d => d.status === 'verified').length;
                        const pct = Math.round((verified / DOC_TYPES.length) * 100);
                        return (
                          <div className="flex items-center gap-3">
                            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                              <div className="h-full bg-green-500 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="text-sm font-medium text-foreground whitespace-nowrap">{verified}/{DOC_TYPES.length} verified</span>
                          </div>
                        );
                      })()}
                    </div>

                    {/* Document rows */}
                    <div className="p-5 space-y-3">
                      {DOC_TYPES.map(docType => {
                        const doc = selectedDocs.find(d => d.doc_type === docType.key);
                        return (
                          <DocRow
                            key={docType.key}
                            docType={docType}
                            doc={doc}
                            isAdmin={isAdmin}
                            onUpload={(dt) => setUploadModal({ docType: dt, candidateId: selectedCandidate.id })}
                            onVerify={handleVerify}
                            onReject={handleReject}
                            onViewFile={handleViewFile}
                          />
                        );
                      })}
                    </div>

                    {/* Verification history */}
                    {selectedDocs.some(d => d.verified_at) && (
                      <div className="px-5 pb-5">
                        <div className="p-4 bg-muted/30 rounded-xl">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Verification Log</p>
                          {selectedDocs
                            .filter(d => d.verified_at)
                            .map(d => {
                              const dt = DOC_TYPES.find(x => x.key === d.doc_type);
                              return (
                                <p key={d.id} className="text-xs text-muted-foreground">
                                  <span className="text-green-600 font-medium">{dt?.label}</span> verified on{' '}
                                  {new Date(d.verified_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                </p>
                              );
                            })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

          </motion.div>
        </div>
      </main>

      {/* Upload Modal */}
      <AnimatePresence>
        {uploadModal && (
          <UploadModal
            docType={uploadModal.docType}
            candidateId={uploadModal.candidateId}
            onClose={() => setUploadModal(null)}
            onSuccess={() => { setUploadModal(null); fetchData(); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default HROnboarding;
