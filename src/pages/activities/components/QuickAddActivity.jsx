import React, { useState } from 'react';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import { Checkbox } from '../../../components/ui/Checkbox';
import Icon from '../../../components/AppIcon';

const QuickAddActivity = ({ isOpen, onClose, onAdd }) => {
  const [formData, setFormData] = useState({
    type: 'task',
    title: '',
    description: '',
    dueDate: '',
    dueTime: '',
    priority: 'medium',
    owner: 'john-doe',
    contact: '',
    account: '',
    notes: '',
    reminderEnabled: false,
    reminderTime: '15'
  });

  const [errors, setErrors] = useState({});

  const activityTypeOptions = [
    { value: 'task', label: 'Task' },
    { value: 'call', label: 'Call' },
    { value: 'meeting', label: 'Meeting' },
    { value: 'email', label: 'Email' },
    { value: 'note', label: 'Note' }
  ];

  const priorityOptions = [
    { value: 'low', label: 'Low Priority' },
    { value: 'medium', label: 'Medium Priority' },
    { value: 'high', label: 'High Priority' }
  ];

  const ownerOptions = [
    { value: 'john-doe', label: 'John Doe' },
    { value: 'sarah-wilson', label: 'Sarah Wilson' },
    { value: 'mike-johnson', label: 'Mike Johnson' },
    { value: 'emily-davis', label: 'Emily Davis' },
    { value: 'alex-brown', label: 'Alex Brown' }
  ];

  const contactOptions = [
    { value: '', label: 'Select Contact (Optional)' },
    { value: 'robert-chen', label: 'Robert Chen - TechCorp' },
    { value: 'lisa-martinez', label: 'Lisa Martinez - InnovateLab' },
    { value: 'david-kim', label: 'David Kim - GlobalTech' },
    { value: 'jennifer-white', label: 'Jennifer White - DataFlow' },
    { value: 'michael-brown', label: 'Michael Brown - CloudSys' }
  ];

  const accountOptions = [
    { value: '', label: 'Select Account (Optional)' },
    { value: 'techcorp', label: 'TechCorp Solutions' },
    { value: 'innovatelab', label: 'InnovateLab Inc.' },
    { value: 'globaltech', label: 'GlobalTech Industries' },
    { value: 'dataflow', label: 'DataFlow Systems' },
    { value: 'cloudsys', label: 'CloudSys Technologies' }
  ];

  const reminderOptions = [
    { value: '5', label: '5 minutes before' },
    { value: '15', label: '15 minutes before' },
    { value: '30', label: '30 minutes before' },
    { value: '60', label: '1 hour before' },
    { value: '1440', label: '1 day before' }
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors?.[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData?.title?.trim()) {
      newErrors.title = 'Activity title is required';
    }
    
    if (!formData?.dueDate) {
      newErrors.dueDate = 'Due date is required';
    }
    
    if (!formData?.dueTime) {
      newErrors.dueTime = 'Due time is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors)?.length === 0;
  };

  const handleSubmit = (e) => {
    e?.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const newActivity = {
      id: Date.now(),
      type: formData?.type,
      title: formData?.title,
      description: formData?.description,
      dueDate: new Date(`${formData.dueDate}T${formData.dueTime}`),
      priority: formData?.priority,
      owner: ownerOptions?.find(o => o?.value === formData?.owner)?.label || 'John Doe',
      contact: contactOptions?.find(o => o?.value === formData?.contact)?.label?.split(' - ')?.[0] || null,
      account: accountOptions?.find(o => o?.value === formData?.account)?.label || null,
      notes: formData?.notes,
      completed: false,
      reminderEnabled: formData?.reminderEnabled,
      reminderTime: formData?.reminderTime
    };

    onAdd(newActivity);
    handleReset();
    onClose();
  };

  const handleReset = () => {
    setFormData({
      type: 'task',
      title: '',
      description: '',
      dueDate: '',
      dueTime: '',
      priority: 'medium',
      owner: 'john-doe',
      contact: '',
      account: '',
      notes: '',
      reminderEnabled: false,
      reminderTime: '15'
    });
    setErrors({});
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-background border border-border rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center space-x-2">
            <Icon name="Plus" size={20} className="text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Quick Add Activity</h2>
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <Icon name="X" size={20} />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Activity Type & Priority */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Activity Type"
              options={activityTypeOptions}
              value={formData?.type}
              onChange={(value) => handleInputChange('type', value)}
              required
            />
            
            <Select
              label="Priority"
              options={priorityOptions}
              value={formData?.priority}
              onChange={(value) => handleInputChange('priority', value)}
              required
            />
          </div>

          {/* Title */}
          <Input
            label="Activity Title"
            type="text"
            placeholder="Enter activity title"
            value={formData?.title}
            onChange={(e) => handleInputChange('title', e?.target?.value)}
            error={errors?.title}
            required
          />

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Description
            </label>
            <textarea
              className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
              rows={3}
              placeholder="Enter activity description (optional)"
              value={formData?.description}
              onChange={(e) => handleInputChange('description', e?.target?.value)}
            />
          </div>

          {/* Due Date & Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Due Date"
              type="date"
              value={formData?.dueDate}
              onChange={(e) => handleInputChange('dueDate', e?.target?.value)}
              error={errors?.dueDate}
              required
            />
            
            <Input
              label="Due Time"
              type="time"
              value={formData?.dueTime}
              onChange={(e) => handleInputChange('dueTime', e?.target?.value)}
              error={errors?.dueTime}
              required
            />
          </div>

          {/* Owner */}
          <Select
            label="Assigned To"
            options={ownerOptions}
            value={formData?.owner}
            onChange={(value) => handleInputChange('owner', value)}
            required
          />

          {/* Contact & Account */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Related Contact"
              options={contactOptions}
              value={formData?.contact}
              onChange={(value) => handleInputChange('contact', value)}
              searchable
            />
            
            <Select
              label="Related Account"
              options={accountOptions}
              value={formData?.account}
              onChange={(value) => handleInputChange('account', value)}
              searchable
            />
          </div>

          {/* Reminder Settings */}
          <div className="space-y-4">
            <Checkbox
              label="Set Reminder"
              checked={formData?.reminderEnabled}
              onChange={(e) => handleInputChange('reminderEnabled', e?.target?.checked)}
            />
            
            {formData?.reminderEnabled && (
              <Select
                label="Reminder Time"
                options={reminderOptions}
                value={formData?.reminderTime}
                onChange={(value) => handleInputChange('reminderTime', value)}
              />
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Additional Notes
            </label>
            <textarea
              className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
              rows={3}
              placeholder="Add any additional notes (optional)"
              value={formData?.notes}
              onChange={(e) => handleInputChange('notes', e?.target?.value)}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
            >
              Cancel
            </Button>
            
            <Button
              type="button"
              variant="ghost"
              onClick={handleReset}
            >
              Reset
            </Button>
            
            <Button
              type="submit"
              variant="default"
              iconName="Plus"
              iconPosition="left"
            >
              Add Activity
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default QuickAddActivity;