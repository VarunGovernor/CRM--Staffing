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
    full_name: '',
    email: '',
    phone: '',
    alternate_phone: '',
    emergency_contact: '',
    date_of_birth: '',
    full_address: '',
    visa_status: 'h1b',
    visa_copy_url: '',
    status: 'in_market',
    deal_type: '',
    payment_terms: '',
    skills: '',
    education: '',
    experience_years: '',
    current_location: '',
    willing_to_relocate: false,
    relocation_places: '',
    recruiter_id: '',
    linkedin_url: '',
    nca_document_url: '',
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
      // Support both legacy (first_name + last_name) and new (full_name)
      const name = candidate?.full_name
        || `${candidate?.first_name || ''} ${candidate?.last_name || ''}`.trim();
      setFormData({
        full_name: name,
        email: candidate?.email || '',
        phone: candidate?.phone || '',
        alternate_phone: candidate?.alternate_phone || '',
        emergency_contact: candidate?.emergency_contact || '',
        date_of_birth: candidate?.date_of_birth || '',
        full_address: candidate?.full_address || '',
        visa_status: candidate?.visa_status || 'h1b',
        visa_copy_url: candidate?.visa_copy_url || '',
        status: candidate?.status || 'in_market',
        deal_type: candidate?.deal_type || '',
        payment_terms: candidate?.payment_terms || '',
        skills: candidate?.skills?.join(', ') || '',
        education: candidate?.education || '',
        experience_years: candidate?.experience_years?.toString() || '',
        current_location: candidate?.current_location || '',
        willing_to_relocate: candidate?.willing_to_relocate || false,
        relocation_places: candidate?.relocation_places || '',
        recruiter_id: candidate?.recruiter_id || '',
        linkedin_url: candidate?.linkedin_url || '',
        nca_document_url: candidate?.nca_document_url || '',
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
      full_name: '',
      email: '',
      phone: '',
      alternate_phone: '',
      emergency_contact: '',
      date_of_birth: '',
      full_address: '',
      visa_status: 'h1b',
      visa_copy_url: '',
      status: 'in_market',
      deal_type: '',
      payment_terms: '',
      skills: '',
      education: '',
      experience_years: '',
      current_location: '',
      willing_to_relocate: false,
      relocation_places: '',
      recruiter_id: user?.id || '',
      linkedin_url: '',
      nca_document_url: '',
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

    if (!formData?.full_name?.trim()) newErrors.full_name = 'Candidate name is required';
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

    // Split full_name back to first_name + last_name for DB compatibility
    const nameParts = formData?.full_name?.trim()?.split(/\s+/) || [];
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    const payload = {
      full_name: formData?.full_name?.trim(),
      first_name: firstName,
      last_name: lastName,
      email: formData?.email?.trim()?.toLowerCase(),
      phone: formData?.phone?.trim(),
      alternate_phone: formData?.alternate_phone?.trim() || null,
      emergency_contact: formData?.emergency_contact?.trim() || null,
      date_of_birth: formData?.date_of_birth || null,
      full_address: formData?.full_address?.trim() || null,
      visa_status: formData?.visa_status,
      visa_copy_url: formData?.visa_copy_url?.trim() || null,
      status: formData?.status,
      deal_type: formData?.deal_type || null,
      payment_terms: formData?.payment_terms?.trim() || null,
      skills: formData?.skills?.split(',')?.map(s => s?.trim())?.filter(Boolean) || [],
      education: formData?.education?.trim() || null,
      experience_years: formData?.experience_years ? parseInt(formData?.experience_years) : null,
      current_location: formData?.current_location?.trim() || null,
      willing_to_relocate: formData?.willing_to_relocate,
      relocation_places: formData?.relocation_places?.trim() || null,
      recruiter_id: formData?.recruiter_id || null,
      linkedin_url: formData?.linkedin_url?.trim() || null,
      nca_document_url: formData?.nca_document_url?.trim() || null,
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
            <div className="md:col-span-2">
              <Input
                label="Candidate Name"
                name="full_name"
                value={formData?.full_name}
                onChange={handleInputChange}
                error={errors?.full_name}
                placeholder="Full name"
                required
                disabled={isLoading}
              />
            </div>
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
            <Input
              label="Alternate Contact No"
              name="alternate_phone"
              value={formData?.alternate_phone}
              onChange={handleInputChange}
              placeholder="Alternate phone number"
              disabled={isLoading}
            />
            <Input
              label="Emergency Contact No"
              name="emergency_contact"
              value={formData?.emergency_contact}
              onChange={handleInputChange}
              placeholder="Emergency contact number"
              disabled={isLoading}
            />
            <Input
              label="Date of Birth"
              type="date"
              name="date_of_birth"
              value={formData?.date_of_birth}
              onChange={handleInputChange}
              disabled={isLoading}
            />
            <div className="md:col-span-2">
              <Input
                label="Full Address"
                name="full_address"
                value={formData?.full_address}
                onChange={handleInputChange}
                placeholder="Street, City, State, ZIP"
                disabled={isLoading}
              />
            </div>
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
            <Input
              label="VISA Copy URL"
              name="visa_copy_url"
              value={formData?.visa_copy_url}
              onChange={handleInputChange}
              placeholder="Paste link to VISA document"
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

        {/* Deal & Compensation */}
        <div>
          <h3 className="text-sm font-medium text-foreground mb-4 flex items-center gap-2">
            <Icon name="DollarSign" size={16} />
            Deal & Compensation
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Deal Type</label>
              <Select
                name="deal_type"
                value={formData?.deal_type}
                onChange={handleInputChange}
                disabled={isLoading}
              >
                <option value="">Select Deal Type</option>
                <option value="full_time">Full-time</option>
                <option value="w2">W2</option>
                <option value="c2c">Corp-to-Corp (C2C)</option>
              </Select>
            </div>
            <Input
              label="Current Location"
              name="current_location"
              value={formData?.current_location}
              onChange={handleInputChange}
              placeholder="City, State"
              disabled={isLoading}
            />
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-foreground mb-1.5 block">Payment Terms</label>
              <textarea
                name="payment_terms"
                value={formData?.payment_terms}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                placeholder="Describe agreed payment installments and time periods..."
                disabled={isLoading}
              />
            </div>
            <Input
              label="NCA Signed Document URL"
              name="nca_document_url"
              value={formData?.nca_document_url}
              onChange={handleInputChange}
              placeholder="Paste link to signed NCA document"
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
            {formData?.willing_to_relocate && (
              <div className="md:col-span-2">
                <Input
                  label="Places Willing to Relocate"
                  name="relocation_places"
                  value={formData?.relocation_places}
                  onChange={handleInputChange}
                  placeholder="e.g. Dallas TX, Chicago IL, New York NY"
                  disabled={isLoading}
                />
              </div>
            )}
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
