import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from '../../../components/AppIcon';

const DEAL_TYPE_LABELS = {
  full_time: 'Full-time',
  w2: 'W2',
  c2c: 'Corp-to-Corp (C2C)'
};

const NCA_STATUS_LABELS = {
  not_started: 'Not Started',
  downloaded: 'Downloaded',
  uploaded: 'Uploaded',
  verified: 'Verified'
};

const CandidateDrawer = ({ candidate, isOpen, onClose, onEdit }) => {
  if (!candidate) return null;

  const candidateName = candidate?.full_name
    || `${candidate?.first_name || ''} ${candidate?.last_name || ''}`.trim();

  const getStatusColor = (status) => {
    const colors = {
      'in_market': 'bg-blue-100 text-blue-700',
      'active': 'bg-green-100 text-green-700',
      'placed': 'bg-purple-100 text-purple-700',
      'on_hold': 'bg-yellow-100 text-yellow-700',
      'inactive': 'bg-gray-100 text-gray-700'
    };
    return colors?.[status] || 'bg-gray-100 text-gray-700';
  };

  const getVisaColor = (visa) => {
    const colors = {
      'us_citizen': 'bg-blue-100 text-blue-700',
      'green_card': 'bg-emerald-100 text-emerald-700',
      'h1b': 'bg-indigo-100 text-indigo-700',
      'h4_ead': 'bg-teal-100 text-teal-700',
      'l1': 'bg-violet-100 text-violet-700',
      'opt': 'bg-orange-100 text-orange-700',
      'cpt': 'bg-pink-100 text-pink-700',
      'tn_visa': 'bg-sky-100 text-sky-700',
      'e3': 'bg-lime-100 text-lime-700',
      'ead': 'bg-cyan-100 text-cyan-700',
      'gc_ead': 'bg-green-100 text-green-700',
      'no_work_auth': 'bg-red-100 text-red-700',
      'citizen': 'bg-blue-100 text-blue-700',
    };
    return colors?.[visa] || 'bg-gray-100 text-gray-700';
  };

  const getVisaLabel = (visa) => {
    const labels = {
      'us_citizen': 'US Citizen', 'green_card': 'Green Card', 'h1b': 'H1B',
      'h4_ead': 'H4 EAD', 'l1': 'L1', 'opt': 'OPT', 'cpt': 'CPT',
      'tn_visa': 'TN Visa', 'e3': 'E3', 'ead': 'EAD', 'gc_ead': 'GC EAD',
      'no_work_auth': 'No Work Auth', 'citizen': 'US Citizen',
    };
    return labels?.[visa] || visa?.replace(/_/g, ' ')?.toUpperCase();
  };

  const getNcaColor = (status) => {
    const colors = {
      'not_started': 'bg-gray-100 text-gray-700',
      'downloaded': 'bg-yellow-100 text-yellow-700',
      'uploaded': 'bg-blue-100 text-blue-700',
      'verified': 'bg-green-100 text-green-700'
    };
    return colors?.[status] || 'bg-gray-100 text-gray-700';
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-40"
          />

          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full md:w-2/3 lg:w-1/2 bg-card shadow-2xl z-50 overflow-y-auto"
          >
            {/* Header */}
            <div className="sticky top-0 bg-card border-b border-border p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                  <Icon name="User" size={32} className="text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-foreground">{candidateName}</h2>
                  <p className="text-muted-foreground">{candidate?.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {onEdit && (
                  <button
                    onClick={() => onEdit(candidate)}
                    className="p-2 hover:bg-muted rounded-lg transition-colors flex items-center gap-2 text-primary"
                  >
                    <Icon name="Edit" size={20} />
                    <span className="text-sm font-medium">Edit</span>
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-muted rounded-lg transition-colors"
                >
                  <Icon name="X" size={24} className="text-muted-foreground" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Status, Visa & Deal Type */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Status</p>
                  <span className={`px-4 py-2 rounded-full text-sm font-medium inline-block ${getStatusColor(candidate?.status)}`}>
                    {candidate?.status?.replace('_', ' ')?.toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Visa Status</p>
                  <span className={`px-4 py-2 rounded-full text-sm font-medium inline-block ${getVisaColor(candidate?.visa_status)}`}>
                    {getVisaLabel(candidate?.visa_status)}
                  </span>
                </div>
                {candidate?.deal_type && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Deal Type</p>
                    <span className="px-4 py-2 rounded-full text-sm font-medium inline-block bg-primary/10 text-primary">
                      {DEAL_TYPE_LABELS[candidate.deal_type] || candidate.deal_type}
                    </span>
                  </div>
                )}
              </div>

              {/* NCA Compliance Status */}
              <div className="bg-muted/30 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Icon name="Shield" size={20} className="text-primary" />
                  NCA Compliance
                </h3>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1.5 rounded-full text-xs font-medium ${getNcaColor(candidate?.nca_status)}`}>
                    {NCA_STATUS_LABELS[candidate?.nca_status] || 'Not Started'}
                  </span>
                  {candidate?.nca_status !== 'uploaded' && candidate?.nca_status !== 'verified' && (
                    <span className="text-xs text-warning font-medium flex items-center gap-1">
                      <Icon name="AlertTriangle" size={14} />
                      NCA required before marketing
                    </span>
                  )}
                  {(candidate?.nca_status === 'uploaded' || candidate?.nca_status === 'verified') && (
                    <span className="text-xs text-success font-medium flex items-center gap-1">
                      <Icon name="CheckCircle" size={14} />
                      Cleared for marketing
                    </span>
                  )}
                </div>
              </div>

              {/* Contact Information */}
              <div className="bg-muted/30 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Icon name="Phone" size={20} className="text-primary" />
                  Contact Information
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Icon name="Mail" size={18} className="text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Email</p>
                      <p className="text-sm text-foreground font-medium">{candidate?.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Icon name="Phone" size={18} className="text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Phone</p>
                      <p className="text-sm text-foreground font-medium">{candidate?.phone}</p>
                    </div>
                  </div>
                  {candidate?.linkedin_url && (
                    <div className="flex items-center gap-3">
                      <Icon name="Linkedin" size={18} className="text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">LinkedIn</p>
                        <a href={candidate?.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">
                          View Profile
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Professional Details */}
              <div className="bg-muted/30 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Icon name="Briefcase" size={20} className="text-primary" />
                  Professional Details
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Experience</p>
                    <p className="text-sm text-foreground font-medium">
                      {candidate?.experience_years != null ? `${candidate.experience_years} years` : 'Not specified'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Days in Market</p>
                    <p className="text-sm text-foreground font-medium">{candidate?.days_in_market} days</p>
                  </div>
                </div>
              </div>

              {/* Payment Terms */}
              {candidate?.payment_terms && (
                <div className="bg-muted/30 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Icon name="DollarSign" size={20} className="text-primary" />
                    Payment Terms
                  </h3>
                  <p className="text-sm text-foreground whitespace-pre-wrap">{candidate.payment_terms}</p>
                </div>
              )}

              {/* Skills */}
              <div className="bg-muted/30 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Icon name="Code" size={20} className="text-primary" />
                  Skills
                </h3>
                <div className="flex flex-wrap gap-2">
                  {candidate?.skills?.length > 0 ? (
                    candidate?.skills?.map((skill, idx) => (
                      <span key={idx} className="px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-sm font-medium">
                        {skill}
                      </span>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No skills listed</p>
                  )}
                </div>
              </div>

              {/* Education */}
              {candidate?.education && (
                <div className="bg-muted/30 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Icon name="GraduationCap" size={20} className="text-primary" />
                    Education
                  </h3>
                  <p className="text-sm text-foreground">{candidate?.education}</p>
                </div>
              )}

              {/* Location */}
              <div className="bg-muted/30 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Icon name="MapPin" size={20} className="text-primary" />
                  Location
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Current Location</p>
                    <p className="text-sm text-foreground font-medium">{candidate?.current_location || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Willing to Relocate</p>
                    <div className="flex items-center gap-2">
                      {candidate?.willing_to_relocate ? (
                        <>
                          <Icon name="Check" size={16} className="text-green-600" />
                          <span className="text-sm text-green-600 font-medium">Yes</span>
                        </>
                      ) : (
                        <>
                          <Icon name="X" size={16} className="text-red-600" />
                          <span className="text-sm text-red-600 font-medium">No</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Recruiter */}
              {candidate?.recruiter && (
                <div className="bg-muted/30 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Icon name="UserCheck" size={20} className="text-primary" />
                    Assigned Recruiter
                  </h3>
                  <p className="text-sm text-foreground font-medium">{candidate?.recruiter?.full_name}</p>
                </div>
              )}

              {/* Resume */}
              {candidate?.resume_url && (
                <div className="bg-muted/30 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Icon name="FileText" size={20} className="text-primary" />
                    Resume
                  </h3>
                  <a
                    href={candidate?.resume_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    <Icon name="Download" size={18} />
                    Download Resume
                  </a>
                </div>
              )}

              {/* Notes */}
              {candidate?.notes && (
                <div className="bg-muted/30 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Icon name="FileText" size={20} className="text-primary" />
                    Notes
                  </h3>
                  <p className="text-sm text-foreground whitespace-pre-wrap">{candidate?.notes}</p>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CandidateDrawer;
