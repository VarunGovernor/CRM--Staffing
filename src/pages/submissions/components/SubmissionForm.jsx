import React, { useState, useEffect } from 'react';
import Modal from '../../../components/ui/Modal';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Icon from '../../../components/AppIcon';
import { submissions as submissionsApi } from '../../../lib/database';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/AuthContext';

const SubmissionForm = ({ isOpen, onClose, submission, onSuccess }) => {
  const { user } = useAuth();
  const isEditing = !!submission?.id;

  const [formData, setFormData] = useState({
    candidate_id: '',
    vendor_id: '',
    sales_person_id: '',
    job_title: '',
    job_description: '',
    submission_date: new Date().toISOString().split('T')[0],
    status: 'submitted',
    rate: '',
    notes: ''
  });

  const [candidates, setCandidates] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [salespeople, setSalespeople] = useState([]);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchDropdownData();
  }, []);

  useEffect(() => {
    if (submission) {
      setFormData({
        candidate_id: submission?.candidate_id || '',
        vendor_id: submission?.vendor_id || '',
        sales_person_id: submission?.sales_person_id || '',
        job_title: submission?.job_title || '',
        job_description: submission?.job_description || '',
        submission_date: submission?.submission_date || new Date().toISOString().split('T')[0],
        status: submission?.status || 'submitted',
        rate: submission?.rate?.toString() || '',
        notes: submission?.notes || ''
      });
    } else {
      resetForm();
    }
  }, [submission, isOpen]);

  const fetchDropdownData = async () => {
    const [candidatesRes, vendorsRes, salespeopleRes] = await Promise.all([
      supabase?.from('candidates')?.select('id, first_name, last_name, email')?.in('status', ['in_market', 'active'])?.order('first_name'),
      supabase?.from('vendors')?.select('id, name, tier')?.eq('is_active', true)?.order('name'),
      supabase?.from('user_profiles')?.select('id, full_name')?.in('role', ['sales', 'admin'])?.order('full_name')
    ]);

    setCandidates(candidatesRes?.data || []);
    setVendors(vendorsRes?.data || []);
    setSalespeople(salespeopleRes?.data || []);
  };

  const resetForm = () => {
    setFormData({
      candidate_id: '',
      vendor_id: '',
      sales_person_id: user?.id || '',
      job_title: '',
      job_description: '',
      submission_date: new Date().toISOString().split('T')[0],
      status: 'submitted',
      rate: '',
      notes: ''
    });
    setErrors({});
  };

  const handleInputChange = (e) => {
    const { name, value } = e?.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (errors?.[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData?.candidate_id) newErrors.candidate_id = 'Candidate is required';
    if (!formData?.vendor_id) newErrors.vendor_id = 'Vendor is required';
    if (!formData?.job_title?.trim()) newErrors.job_title = 'Job title is required';
    if (!formData?.submission_date) newErrors.submission_date = 'Submission date is required';

    setErrors(newErrors);
    return Object.keys(newErrors)?.length === 0;
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);

    const payload = {
      candidate_id: formData?.candidate_id,
      vendor_id: formData?.vendor_id,
      sales_person_id: formData?.sales_person_id || null,
      job_title: formData?.job_title?.trim(),
      job_description: formData?.job_description?.trim() || null,
      submission_date: formData?.submission_date,
      status: formData?.status,
      rate: formData?.rate ? parseFloat(formData?.rate) : null,
      notes: formData?.notes?.trim() || null
    };

    try {
      let result;
      if (isEditing) {
        result = await submissionsApi.update(submission?.id, payload);
      } else {
        result = await submissionsApi.create(payload);
      }

      if (result?.error) {
        setErrors({ general: result?.error?.message || 'Failed to save submission' });
      } else {
        onSuccess?.(result?.data);
        onClose();
        resetForm();
      }
    } catch (error) {
      setErrors({ general: 'Network error. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const footer = (
    <>
      <Button variant="outline" onClick={onClose} disabled={isLoading}>
        Cancel
      </Button>
      <Button onClick={handleSubmit} loading={isLoading} disabled={isLoading}>
        {isEditing ? 'Update Submission' : 'Create Submission'}
      </Button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Submission' : 'New Submission'}
      description={isEditing ? 'Update submission details' : 'Submit a candidate to a vendor for a job opening'}
      size="lg"
      footer={footer}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {errors?.general && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <Icon name="AlertCircle" size={16} className="text-red-500" />
              <p className="text-sm text-red-700">{errors?.general}</p>
            </div>
          </div>
        )}

        {/* Candidate & Vendor */}
        <div>
          <h3 className="text-sm font-medium text-foreground mb-4 flex items-center gap-2">
            <Icon name="Users" size={16} />
            Candidate & Vendor
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Candidate *</label>
              <Select
                name="candidate_id"
                value={formData?.candidate_id}
                onChange={handleInputChange}
                disabled={isLoading}
              >
                <option value="">Select Candidate</option>
                {candidates?.map(c => (
                  <option key={c?.id} value={c?.id}>
                    {c?.first_name} {c?.last_name} ({c?.email})
                  </option>
                ))}
              </Select>
              {errors?.candidate_id && (
                <p className="text-xs text-red-500">{errors?.candidate_id}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Vendor/Client *</label>
              <Select
                name="vendor_id"
                value={formData?.vendor_id}
                onChange={handleInputChange}
                disabled={isLoading}
              >
                <option value="">Select Vendor</option>
                {vendors?.map(v => (
                  <option key={v?.id} value={v?.id}>
                    {v?.name} ({v?.tier?.replace('_', ' ')})
                  </option>
                ))}
              </Select>
              {errors?.vendor_id && (
                <p className="text-xs text-red-500">{errors?.vendor_id}</p>
              )}
            </div>
          </div>
        </div>

        {/* Job Details */}
        <div>
          <h3 className="text-sm font-medium text-foreground mb-4 flex items-center gap-2">
            <Icon name="Briefcase" size={16} />
            Job Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Job Title"
              name="job_title"
              value={formData?.job_title}
              onChange={handleInputChange}
              error={errors?.job_title}
              required
              placeholder="Senior Java Developer"
              disabled={isLoading}
            />
            <Input
              label="Bill Rate ($/hr)"
              type="number"
              name="rate"
              value={formData?.rate}
              onChange={handleInputChange}
              min="0"
              step="0.01"
              placeholder="95.00"
              disabled={isLoading}
            />
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-foreground mb-1.5 block">Job Description</label>
              <textarea
                name="job_description"
                value={formData?.job_description}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                placeholder="Job requirements and responsibilities..."
                disabled={isLoading}
              />
            </div>
          </div>
        </div>

        {/* Submission Details */}
        <div>
          <h3 className="text-sm font-medium text-foreground mb-4 flex items-center gap-2">
            <Icon name="Send" size={16} />
            Submission Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Submission Date"
              type="date"
              name="submission_date"
              value={formData?.submission_date}
              onChange={handleInputChange}
              error={errors?.submission_date}
              required
              disabled={isLoading}
            />
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Status</label>
              <Select
                name="status"
                value={formData?.status}
                onChange={handleInputChange}
                disabled={isLoading}
              >
                <option value="submitted">Submitted</option>
                <option value="shortlisted">Shortlisted</option>
                <option value="rejected">Rejected</option>
                <option value="interview_scheduled">Interview Scheduled</option>
                <option value="selected">Selected</option>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Sales Person</label>
              <Select
                name="sales_person_id"
                value={formData?.sales_person_id}
                onChange={handleInputChange}
                disabled={isLoading}
              >
                <option value="">Select Sales Person</option>
                {salespeople?.map(s => (
                  <option key={s?.id} value={s?.id}>{s?.full_name}</option>
                ))}
              </Select>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">Notes</label>
          <textarea
            name="notes"
            value={formData?.notes}
            onChange={handleInputChange}
            rows={2}
            className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
            placeholder="Additional notes..."
            disabled={isLoading}
          />
        </div>
      </form>
    </Modal>
  );
};

export default SubmissionForm;
