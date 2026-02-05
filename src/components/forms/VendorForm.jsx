import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Icon from '../AppIcon';
import { vendors as vendorsApi } from '../../lib/database';

const VendorForm = ({ isOpen, onClose, vendor, onSuccess }) => {
  const isEditing = !!vendor?.id;

  const [formData, setFormData] = useState({
    name: '',
    tier: 'tier_2',
    contact_person: '',
    contact_email: '',
    contact_phone: '',
    address: '',
    is_active: true
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (vendor) {
      setFormData({
        name: vendor?.name || '',
        tier: vendor?.tier || 'tier_2',
        contact_person: vendor?.contact_person || '',
        contact_email: vendor?.contact_email || '',
        contact_phone: vendor?.contact_phone || '',
        address: vendor?.address || '',
        is_active: vendor?.is_active ?? true
      });
    } else {
      resetForm();
    }
  }, [vendor, isOpen]);

  const resetForm = () => {
    setFormData({
      name: '',
      tier: 'tier_2',
      contact_person: '',
      contact_email: '',
      contact_phone: '',
      address: '',
      is_active: true
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

    if (!formData?.name?.trim()) newErrors.name = 'Vendor name is required';
    if (!formData?.tier) newErrors.tier = 'Tier is required';
    if (formData?.contact_email && !/\S+@\S+\.\S+/?.test(formData?.contact_email)) {
      newErrors.contact_email = 'Invalid email format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors)?.length === 0;
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);

    const payload = {
      name: formData?.name?.trim(),
      tier: formData?.tier,
      contact_person: formData?.contact_person?.trim() || null,
      contact_email: formData?.contact_email?.trim()?.toLowerCase() || null,
      contact_phone: formData?.contact_phone?.trim() || null,
      address: formData?.address?.trim() || null,
      is_active: formData?.is_active
    };

    try {
      let result;
      if (isEditing) {
        result = await vendorsApi.update(vendor?.id, payload);
      } else {
        result = await vendorsApi.create(payload);
      }

      if (result?.error) {
        setErrors({ general: result?.error?.message || 'Failed to save vendor' });
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
        {isEditing ? 'Update Vendor' : 'Add Vendor'}
      </Button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Vendor' : 'Add New Vendor'}
      description={isEditing ? 'Update vendor information' : 'Add a new vendor or client to the system'}
      size="md"
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

        {/* Company Information */}
        <div>
          <h3 className="text-sm font-medium text-foreground mb-4 flex items-center gap-2">
            <Icon name="Building" size={16} />
            Company Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Vendor Name"
              name="name"
              value={formData?.name}
              onChange={handleInputChange}
              error={errors?.name}
              required
              placeholder="Company Name"
              disabled={isLoading}
            />
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Tier *</label>
              <Select
                name="tier"
                value={formData?.tier}
                onChange={handleInputChange}
                disabled={isLoading}
              >
                <option value="tier_1">Tier 1 (Prime)</option>
                <option value="tier_2">Tier 2</option>
                <option value="tier_3">Tier 3</option>
                <option value="direct_client">Direct Client</option>
              </Select>
            </div>
            <div className="md:col-span-2">
              <Input
                label="Address"
                name="address"
                value={formData?.address}
                onChange={handleInputChange}
                placeholder="Full address"
                disabled={isLoading}
              />
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div>
          <h3 className="text-sm font-medium text-foreground mb-4 flex items-center gap-2">
            <Icon name="User" size={16} />
            Contact Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Contact Person"
              name="contact_person"
              value={formData?.contact_person}
              onChange={handleInputChange}
              placeholder="Primary contact name"
              disabled={isLoading}
            />
            <Input
              label="Contact Email"
              type="email"
              name="contact_email"
              value={formData?.contact_email}
              onChange={handleInputChange}
              error={errors?.contact_email}
              placeholder="email@company.com"
              disabled={isLoading}
            />
            <Input
              label="Contact Phone"
              name="contact_phone"
              value={formData?.contact_phone}
              onChange={handleInputChange}
              placeholder="+1-555-0100"
              disabled={isLoading}
            />
            <div className="flex items-center space-x-3 pt-6">
              <input
                type="checkbox"
                name="is_active"
                id="is_active"
                checked={formData?.is_active}
                onChange={handleInputChange}
                className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                disabled={isLoading}
              />
              <label htmlFor="is_active" className="text-sm text-foreground">
                Active Vendor
              </label>
            </div>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default VendorForm;
