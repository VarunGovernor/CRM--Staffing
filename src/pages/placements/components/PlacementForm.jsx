import React, { useState, useEffect } from 'react';
import Modal from '../../../components/ui/Modal';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Icon from '../../../components/AppIcon';
import { placements as placementsApi } from '../../../lib/database';
import { supabase } from '../../../lib/supabase';

const PlacementForm = ({ isOpen, onClose, placement, onSuccess }) => {
  const isEditing = !!placement?.id;

  const [formData, setFormData] = useState({
    candidate_id: '',
    vendor_id: '',
    submission_id: '',
    client_name: '',
    job_title: '',
    start_date: '',
    end_date: '',
    duration_months: '',
    bill_rate: '',
    pay_rate: '',
    status: 'active',
    location: '',
    notes: ''
  });

  const [candidates, setCandidates] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchDropdownData();
  }, []);

  useEffect(() => {
    if (placement) {
      setFormData({
        candidate_id: placement?.candidate_id || '',
        vendor_id: placement?.vendor_id || '',
        submission_id: placement?.submission_id || '',
        client_name: placement?.client_name || '',
        job_title: placement?.job_title || '',
        start_date: placement?.start_date || '',
        end_date: placement?.end_date || '',
        duration_months: placement?.duration_months?.toString() || '',
        bill_rate: placement?.bill_rate?.toString() || '',
        pay_rate: placement?.pay_rate?.toString() || '',
        status: placement?.status || 'active',
        location: placement?.location || '',
        notes: placement?.notes || ''
      });
    } else {
      resetForm();
    }
  }, [placement, isOpen]);

  const fetchDropdownData = async () => {
    const [candidatesRes, vendorsRes, submissionsRes] = await Promise.all([
      supabase?.from('candidates')?.select('id, first_name, last_name')?.order('first_name'),
      supabase?.from('vendors')?.select('id, name')?.eq('is_active', true)?.order('name'),
      supabase?.from('submissions')?.select('id, job_title, candidate:candidates(first_name, last_name)')?.eq('status', 'selected')?.order('submission_date', { ascending: false })
    ]);

    setCandidates(candidatesRes?.data || []);
    setVendors(vendorsRes?.data || []);
    setSubmissions(submissionsRes?.data || []);
  };

  const resetForm = () => {
    setFormData({
      candidate_id: '',
      vendor_id: '',
      submission_id: '',
      client_name: '',
      job_title: '',
      start_date: '',
      end_date: '',
      duration_months: '',
      bill_rate: '',
      pay_rate: '',
      status: 'active',
      location: '',
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

    // Auto-fill from submission if selected
    if (name === 'submission_id' && value) {
      const selectedSubmission = submissions?.find(s => s?.id === value);
      if (selectedSubmission) {
        setFormData(prev => ({
          ...prev,
          submission_id: value,
          job_title: selectedSubmission?.job_title || prev?.job_title
        }));
      }
    }

    if (errors?.[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData?.candidate_id) newErrors.candidate_id = 'Candidate is required';
    if (!formData?.vendor_id) newErrors.vendor_id = 'Vendor is required';
    if (!formData?.client_name?.trim()) newErrors.client_name = 'Client name is required';
    if (!formData?.job_title?.trim()) newErrors.job_title = 'Job title is required';
    if (!formData?.start_date) newErrors.start_date = 'Start date is required';
    if (!formData?.bill_rate) newErrors.bill_rate = 'Bill rate is required';
    if (!formData?.pay_rate) newErrors.pay_rate = 'Pay rate is required';

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
      submission_id: formData?.submission_id || null,
      client_name: formData?.client_name?.trim(),
      job_title: formData?.job_title?.trim(),
      start_date: formData?.start_date,
      end_date: formData?.end_date || null,
      duration_months: formData?.duration_months ? parseInt(formData?.duration_months) : null,
      bill_rate: parseFloat(formData?.bill_rate),
      pay_rate: parseFloat(formData?.pay_rate),
      status: formData?.status,
      location: formData?.location?.trim() || null,
      notes: formData?.notes?.trim() || null
    };

    try {
      let result;
      if (isEditing) {
        result = await placementsApi.update(placement?.id, payload);
      } else {
        result = await placementsApi.create(payload);
      }

      if (result?.error) {
        setErrors({ general: result?.error?.message || 'Failed to save placement' });
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
        {isEditing ? 'Update Placement' : 'Create Placement'}
      </Button>
    </>
  );

  // Calculate margin if both rates are provided
  const margin = formData?.bill_rate && formData?.pay_rate
    ? ((parseFloat(formData?.bill_rate) - parseFloat(formData?.pay_rate)) / parseFloat(formData?.bill_rate) * 100).toFixed(1)
    : null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Placement' : 'New Placement'}
      description={isEditing ? 'Update placement details' : 'Create a new placement record'}
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
                    {c?.first_name} {c?.last_name}
                  </option>
                ))}
              </Select>
              {errors?.candidate_id && (
                <p className="text-xs text-red-500">{errors?.candidate_id}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Vendor *</label>
              <Select
                name="vendor_id"
                value={formData?.vendor_id}
                onChange={handleInputChange}
                disabled={isLoading}
              >
                <option value="">Select Vendor</option>
                {vendors?.map(v => (
                  <option key={v?.id} value={v?.id}>{v?.name}</option>
                ))}
              </Select>
              {errors?.vendor_id && (
                <p className="text-xs text-red-500">{errors?.vendor_id}</p>
              )}
            </div>
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-sm font-medium text-foreground">Link to Submission (optional)</label>
              <Select
                name="submission_id"
                value={formData?.submission_id}
                onChange={handleInputChange}
                disabled={isLoading}
              >
                <option value="">Select Submission</option>
                {submissions?.map(s => (
                  <option key={s?.id} value={s?.id}>
                    {s?.candidate?.first_name} {s?.candidate?.last_name} - {s?.job_title}
                  </option>
                ))}
              </Select>
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
              label="Client Name"
              name="client_name"
              value={formData?.client_name}
              onChange={handleInputChange}
              error={errors?.client_name}
              required
              placeholder="End client company"
              disabled={isLoading}
            />
            <Input
              label="Job Title"
              name="job_title"
              value={formData?.job_title}
              onChange={handleInputChange}
              error={errors?.job_title}
              required
              placeholder="Senior Developer"
              disabled={isLoading}
            />
            <Input
              label="Location"
              name="location"
              value={formData?.location}
              onChange={handleInputChange}
              placeholder="City, State"
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
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="terminated">Terminated</option>
                <option value="extended">Extended</option>
              </Select>
            </div>
          </div>
        </div>

        {/* Duration & Rates */}
        <div>
          <h3 className="text-sm font-medium text-foreground mb-4 flex items-center gap-2">
            <Icon name="DollarSign" size={16} />
            Duration & Rates
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Start Date"
              type="date"
              name="start_date"
              value={formData?.start_date}
              onChange={handleInputChange}
              error={errors?.start_date}
              required
              disabled={isLoading}
            />
            <Input
              label="End Date"
              type="date"
              name="end_date"
              value={formData?.end_date}
              onChange={handleInputChange}
              disabled={isLoading}
            />
            <Input
              label="Duration (Months)"
              type="number"
              name="duration_months"
              value={formData?.duration_months}
              onChange={handleInputChange}
              min="1"
              disabled={isLoading}
            />
            <Input
              label="Bill Rate ($/hr)"
              type="number"
              name="bill_rate"
              value={formData?.bill_rate}
              onChange={handleInputChange}
              error={errors?.bill_rate}
              required
              min="0"
              step="0.01"
              disabled={isLoading}
            />
            <Input
              label="Pay Rate ($/hr)"
              type="number"
              name="pay_rate"
              value={formData?.pay_rate}
              onChange={handleInputChange}
              error={errors?.pay_rate}
              required
              min="0"
              step="0.01"
              disabled={isLoading}
            />
            <div className="flex flex-col justify-end">
              {margin && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-xs text-green-600">Margin</p>
                  <p className="text-lg font-semibold text-green-700">{margin}%</p>
                </div>
              )}
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

export default PlacementForm;
