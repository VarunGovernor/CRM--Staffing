import React, { useState, useEffect } from 'react';
import Modal from '../../../components/ui/Modal';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Icon from '../../../components/AppIcon';
import { candidates as candidatesApi } from '../../../lib/database';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/AuthContext';

const CandidateForm = ({ isOpen, onClose, candidate, onSuccess }) => {
  const { user } = useAuth();
  const isEditing = !!candidate?.id;

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    visa_status: 'h1b',
    status: 'in_market',
    skills: '',
    education: '',
    experience_years: '',
    current_location: '',
    willing_to_relocate: false,
    pay_rate: '',
    pay_percentage: '',
    recruiter_id: '',
    linkedin_url: '',
    notes: ''
  });

  const [recruiters, setRecruiters] = useState([]);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchRecruiters();
  }, []);

  useEffect(() => {
    if (candidate) {
      setFormData({
        first_name: candidate?.first_name || '',
        last_name: candidate?.last_name || '',
        email: candidate?.email || '',
        phone: candidate?.phone || '',
        visa_status: candidate?.visa_status || 'h1b',
        status: candidate?.status || 'in_market',
        skills: candidate?.skills?.join(', ') || '',
        education: candidate?.education || '',
        experience_years: candidate?.experience_years?.toString() || '',
        current_location: candidate?.current_location || '',
        willing_to_relocate: candidate?.willing_to_relocate || false,
        pay_rate: candidate?.pay_rate?.toString() || '',
        pay_percentage: candidate?.pay_percentage?.toString() || '',
        recruiter_id: candidate?.recruiter_id || '',
        linkedin_url: candidate?.linkedin_url || '',
        notes: candidate?.notes || ''
      });
    } else {
      resetForm();
    }
  }, [candidate, isOpen]);

  const fetchRecruiters = async () => {
    const { data } = await supabase
      ?.from('user_profiles')
      ?.select('id, full_name')
      ?.in('role', ['recruiter', 'admin'])
      ?.order('full_name');
    setRecruiters(data || []);
  };

  const resetForm = () => {
    setFormData({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      visa_status: 'h1b',
      status: 'in_market',
      skills: '',
      education: '',
      experience_years: '',
      current_location: '',
      willing_to_relocate: false,
      pay_rate: '',
      pay_percentage: '',
      recruiter_id: user?.id || '',
      linkedin_url: '',
      notes: ''
    });
    setErrors({});
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e?.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    if (errors?.[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData?.first_name?.trim()) newErrors.first_name = 'First name is required';
    if (!formData?.last_name?.trim()) newErrors.last_name = 'Last name is required';
    if (!formData?.email?.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/?.test(formData?.email)) {
      newErrors.email = 'Invalid email format';
    }
    if (!formData?.phone?.trim()) newErrors.phone = 'Phone is required';
    if (!formData?.visa_status) newErrors.visa_status = 'Visa status is required';

    setErrors(newErrors);
    return Object.keys(newErrors)?.length === 0;
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);

    const payload = {
      first_name: formData?.first_name?.trim(),
      last_name: formData?.last_name?.trim(),
      email: formData?.email?.trim()?.toLowerCase(),
      phone: formData?.phone?.trim(),
      visa_status: formData?.visa_status,
      status: formData?.status,
      skills: formData?.skills?.split(',')?.map(s => s?.trim())?.filter(Boolean) || [],
      education: formData?.education?.trim() || null,
      experience_years: formData?.experience_years ? parseInt(formData?.experience_years) : null,
      current_location: formData?.current_location?.trim() || null,
      willing_to_relocate: formData?.willing_to_relocate,
      pay_rate: formData?.pay_rate ? parseFloat(formData?.pay_rate) : null,
      pay_percentage: formData?.pay_percentage ? parseFloat(formData?.pay_percentage) : null,
      recruiter_id: formData?.recruiter_id || null,
      linkedin_url: formData?.linkedin_url?.trim() || null,
      notes: formData?.notes?.trim() || null
    };

    if (!isEditing) {
      payload.created_by = user?.id;
      payload.days_in_market = 0;
    }

    try {
      let result;
      if (isEditing) {
        result = await candidatesApi.update(candidate?.id, payload);
      } else {
        result = await candidatesApi.create(payload);
      }

      if (result?.error) {
        setErrors({ general: result?.error?.message || 'Failed to save candidate' });
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
        {isEditing ? 'Update Candidate' : 'Add Candidate'}
      </Button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Candidate' : 'Add New Candidate'}
      description={isEditing ? 'Update candidate information' : 'Enter candidate details to add to the system'}
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

        {/* Personal Information */}
        <div>
          <h3 className="text-sm font-medium text-foreground mb-4 flex items-center gap-2">
            <Icon name="User" size={16} />
            Personal Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="First Name"
              name="first_name"
              value={formData?.first_name}
              onChange={handleInputChange}
              error={errors?.first_name}
              required
              disabled={isLoading}
            />
            <Input
              label="Last Name"
              name="last_name"
              value={formData?.last_name}
              onChange={handleInputChange}
              error={errors?.last_name}
              required
              disabled={isLoading}
            />
            <Input
              label="Email"
              type="email"
              name="email"
              value={formData?.email}
              onChange={handleInputChange}
              error={errors?.email}
              required
              disabled={isLoading}
            />
            <Input
              label="Phone"
              name="phone"
              value={formData?.phone}
              onChange={handleInputChange}
              error={errors?.phone}
              required
              disabled={isLoading}
            />
          </div>
        </div>

        {/* Professional Information */}
        <div>
          <h3 className="text-sm font-medium text-foreground mb-4 flex items-center gap-2">
            <Icon name="Briefcase" size={16} />
            Professional Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Visa Status *</label>
              <Select
                name="visa_status"
                value={formData?.visa_status}
                onChange={handleInputChange}
                disabled={isLoading}
              >
                <option value="h1b">H1B</option>
                <option value="green_card">Green Card</option>
                <option value="citizen">US Citizen</option>
                <option value="opt">OPT</option>
                <option value="cpt">CPT</option>
                <option value="l1">L1</option>
                <option value="ead">EAD</option>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Status</label>
              <Select
                name="status"
                value={formData?.status}
                onChange={handleInputChange}
                disabled={isLoading}
              >
                <option value="in_market">In Market</option>
                <option value="active">Active</option>
                <option value="placed">Placed</option>
                <option value="on_hold">On Hold</option>
                <option value="inactive">Inactive</option>
              </Select>
            </div>
            <Input
              label="Experience (Years)"
              type="number"
              name="experience_years"
              value={formData?.experience_years}
              onChange={handleInputChange}
              min="0"
              max="50"
              disabled={isLoading}
            />
            <Input
              label="Education"
              name="education"
              value={formData?.education}
              onChange={handleInputChange}
              placeholder="e.g., Masters in Computer Science"
              disabled={isLoading}
            />
            <div className="md:col-span-2">
              <Input
                label="Skills (comma-separated)"
                name="skills"
                value={formData?.skills}
                onChange={handleInputChange}
                placeholder="Java, Spring Boot, AWS, React"
                disabled={isLoading}
              />
            </div>
          </div>
        </div>

        {/* Location & Compensation */}
        <div>
          <h3 className="text-sm font-medium text-foreground mb-4 flex items-center gap-2">
            <Icon name="MapPin" size={16} />
            Location & Compensation
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Current Location"
              name="current_location"
              value={formData?.current_location}
              onChange={handleInputChange}
              placeholder="City, State"
              disabled={isLoading}
            />
            <div className="flex items-center space-x-3 pt-6">
              <input
                type="checkbox"
                name="willing_to_relocate"
                id="willing_to_relocate"
                checked={formData?.willing_to_relocate}
                onChange={handleInputChange}
                className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                disabled={isLoading}
              />
              <label htmlFor="willing_to_relocate" className="text-sm text-foreground">
                Willing to relocate
              </label>
            </div>
            <Input
              label="Pay Rate ($/hr)"
              type="number"
              name="pay_rate"
              value={formData?.pay_rate}
              onChange={handleInputChange}
              min="0"
              step="0.01"
              disabled={isLoading}
            />
            <Input
              label="Pay Percentage (%)"
              type="number"
              name="pay_percentage"
              value={formData?.pay_percentage}
              onChange={handleInputChange}
              min="0"
              max="100"
              step="0.01"
              disabled={isLoading}
            />
          </div>
        </div>

        {/* Assignment & Notes */}
        <div>
          <h3 className="text-sm font-medium text-foreground mb-4 flex items-center gap-2">
            <Icon name="Users" size={16} />
            Assignment & Notes
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Assigned Recruiter</label>
              <Select
                name="recruiter_id"
                value={formData?.recruiter_id}
                onChange={handleInputChange}
                disabled={isLoading}
              >
                <option value="">Select Recruiter</option>
                {recruiters?.map(r => (
                  <option key={r?.id} value={r?.id}>{r?.full_name}</option>
                ))}
              </Select>
            </div>
            <Input
              label="LinkedIn URL"
              name="linkedin_url"
              value={formData?.linkedin_url}
              onChange={handleInputChange}
              placeholder="https://linkedin.com/in/..."
              disabled={isLoading}
            />
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-foreground mb-1.5 block">Notes</label>
              <textarea
                name="notes"
                value={formData?.notes}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                placeholder="Additional notes about the candidate..."
                disabled={isLoading}
              />
            </div>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default CandidateForm;
