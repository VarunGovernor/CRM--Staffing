import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import { Checkbox } from '../../../components/ui/Checkbox';

const CustomFieldsTab = () => {
  const [customFields, setCustomFields] = useState([
    {
      id: 1,
      name: "Lead Source",
      type: "select",
      entity: "contacts",
      required: true,
      options: ["Website", "Referral", "Cold Call", "Social Media"],
      order: 1,
      active: true
    },
    {
      id: 2,
      name: "Deal Priority",
      type: "select",
      entity: "deals",
      required: false,
      options: ["Low", "Medium", "High", "Critical"],
      order: 2,
      active: true
    },
    {
      id: 3,
      name: "Annual Revenue",
      type: "number",
      entity: "accounts",
      required: false,
      options: [],
      order: 3,
      active: true
    },
    {
      id: 4,
      name: "Contract End Date",
      type: "date",
      entity: "accounts",
      required: true,
      options: [],
      order: 4,
      active: true
    },
    {
      id: 5,
      name: "Special Notes",
      type: "textarea",
      entity: "deals",
      required: false,
      options: [],
      order: 5,
      active: false
    }
  ]);

  const [newField, setNewField] = useState({
    name: "",
    type: "text",
    entity: "contacts",
    required: false,
    options: [],
    optionInput: ""
  });

  const [isAddFieldModalOpen, setIsAddFieldModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const fieldTypes = [
    { value: "text", label: "Text", description: "Single line text input" },
    { value: "textarea", label: "Textarea", description: "Multi-line text input" },
    { value: "number", label: "Number", description: "Numeric input with validation" },
    { value: "email", label: "Email", description: "Email address with validation" },
    { value: "phone", label: "Phone", description: "Phone number input" },
    { value: "url", label: "URL", description: "Website URL input" },
    { value: "date", label: "Date", description: "Date picker input" },
    { value: "select", label: "Dropdown", description: "Single selection dropdown" },
    { value: "multiselect", label: "Multi-select", description: "Multiple selection dropdown" },
    { value: "checkbox", label: "Checkbox", description: "True/false checkbox" },
    { value: "radio", label: "Radio", description: "Single choice from options" }
  ];

  const entityTypes = [
    { value: "contacts", label: "Contacts", description: "Add field to contact records" },
    { value: "accounts", label: "Accounts", description: "Add field to account records" },
    { value: "deals", label: "Deals", description: "Add field to deal records" },
    { value: "activities", label: "Activities", description: "Add field to activity records" }
  ];

  const handleNewFieldChange = (field, value) => {
    setNewField(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddOption = () => {
    if (newField?.optionInput?.trim()) {
      setNewField(prev => ({
        ...prev,
        options: [...prev?.options, prev?.optionInput?.trim()],
        optionInput: ""
      }));
    }
  };

  const handleRemoveOption = (index) => {
    setNewField(prev => ({
      ...prev,
      options: prev?.options?.filter((_, i) => i !== index)
    }));
  };

  const handleCreateField = async () => {
    setIsLoading(true);
    // Mock field creation
    setTimeout(() => {
      const field = {
        id: customFields?.length + 1,
        name: newField?.name,
        type: newField?.type,
        entity: newField?.entity,
        required: newField?.required,
        options: newField?.options,
        order: customFields?.length + 1,
        active: true
      };
      
      setCustomFields(prev => [...prev, field]);
      setNewField({
        name: "",
        type: "text",
        entity: "contacts",
        required: false,
        options: [],
        optionInput: ""
      });
      setIsAddFieldModalOpen(false);
      setIsLoading(false);
      console.log('Custom field created successfully');
    }, 1000);
  };

  const handleToggleField = (fieldId) => {
    setCustomFields(prev => prev?.map(field => 
      field?.id === fieldId ? { ...field, active: !field?.active } : field
    ));
  };

  const handleDeleteField = (fieldId) => {
    setCustomFields(prev => prev?.filter(field => field?.id !== fieldId));
  };

  const moveField = (fieldId, direction) => {
    const fieldIndex = customFields?.findIndex(f => f?.id === fieldId);
    if (
      (direction === 'up' && fieldIndex === 0) ||
      (direction === 'down' && fieldIndex === customFields?.length - 1)
    ) {
      return;
    }

    const newFields = [...customFields];
    const targetIndex = direction === 'up' ? fieldIndex - 1 : fieldIndex + 1;
    
    [newFields[fieldIndex], newFields[targetIndex]] = [newFields?.[targetIndex], newFields?.[fieldIndex]];
    
    setCustomFields(newFields);
  };

  const getEntityBadge = (entity) => {
    const entityConfig = {
      contacts: { bg: 'bg-primary/10', text: 'text-primary', icon: 'Users' },
      accounts: { bg: 'bg-secondary/10', text: 'text-secondary', icon: 'Building2' },
      deals: { bg: 'bg-success/10', text: 'text-success', icon: 'Target' },
      activities: { bg: 'bg-warning/10', text: 'text-warning', icon: 'Calendar' }
    };

    const config = entityConfig?.[entity] || entityConfig?.contacts;

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config?.bg} ${config?.text}`}>
        <Icon name={config?.icon} size={12} className="mr-1" />
        {entity?.charAt(0)?.toUpperCase() + entity?.slice(1)}
      </span>
    );
  };

  const getTypeBadge = (type) => {
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground">
        {type}
      </span>
    );
  };

  const needsOptions = ['select', 'multiselect', 'radio']?.includes(newField?.type);

  return (
    <div className="space-y-8">
      {/* Custom Fields Overview */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Icon name="Settings" size={24} className="text-primary" />
            <div>
              <h3 className="text-lg font-semibold text-card-foreground">Custom Fields</h3>
              <p className="text-sm text-muted-foreground">Create and manage custom fields for your CRM records</p>
            </div>
          </div>
          <Button
            variant="default"
            onClick={() => setIsAddFieldModalOpen(true)}
            iconName="Plus"
            iconPosition="left"
          >
            Add Custom Field
          </Button>
        </div>

        {/* Fields by Entity */}
        <div className="space-y-6">
          {['contacts', 'accounts', 'deals', 'activities']?.map(entity => {
            const entityFields = customFields?.filter(field => field?.entity === entity);
            
            return (
              <div key={entity} className="border border-border rounded-lg p-4">
                <div className="flex items-center space-x-3 mb-4">
                  {getEntityBadge(entity)}
                  <span className="text-sm text-muted-foreground">
                    {entityFields?.length} custom field{entityFields?.length !== 1 ? 's' : ''}
                  </span>
                </div>
                {entityFields?.length > 0 ? (
                  <div className="space-y-3">
                    {entityFields?.map((field) => (
                      <div key={field?.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className="flex flex-col space-y-1">
                            <button
                              onClick={() => moveField(field?.id, 'up')}
                              className="p-1 hover:bg-background rounded transition-smooth"
                              disabled={customFields?.findIndex(f => f?.id === field?.id) === 0}
                              aria-label="Move field up"
                            >
                              <Icon name="ChevronUp" size={14} />
                            </button>
                            <button
                              onClick={() => moveField(field?.id, 'down')}
                              className="p-1 hover:bg-background rounded transition-smooth"
                              disabled={customFields?.findIndex(f => f?.id === field?.id) === customFields?.length - 1}
                              aria-label="Move field down"
                            >
                              <Icon name="ChevronDown" size={14} />
                            </button>
                          </div>
                          
                          <div className="flex items-center space-x-3">
                            <div>
                              <div className="flex items-center space-x-2">
                                <span className="font-medium text-card-foreground">{field?.name}</span>
                                {field?.required && (
                                  <span className="text-xs text-error">Required</span>
                                )}
                              </div>
                              <div className="flex items-center space-x-2 mt-1">
                                {getTypeBadge(field?.type)}
                                {field?.options?.length > 0 && (
                                  <span className="text-xs text-muted-foreground">
                                    {field?.options?.length} option{field?.options?.length !== 1 ? 's' : ''}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleField(field?.id)}
                            className={field?.active ? 'text-success' : 'text-muted-foreground'}
                          >
                            <Icon name={field?.active ? "Eye" : "EyeOff"} size={16} className="mr-2" />
                            {field?.active ? 'Active' : 'Inactive'}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => console.log('Edit field', field?.id)}
                            aria-label="Edit field"
                          >
                            <Icon name="Edit" size={16} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteField(field?.id)}
                            aria-label="Delete field"
                          >
                            <Icon name="Trash2" size={16} />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">No custom fields created yet</p>
                )}
              </div>
            );
          })}
        </div>
      </div>
      {/* Add Field Modal */}
      {isAddFieldModalOpen && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setIsAddFieldModalOpen(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-card border border-border rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-card-foreground">Add Custom Field</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsAddFieldModalOpen(false)}
                  aria-label="Close modal"
                >
                  <Icon name="X" size={20} />
                </Button>
              </div>

              <div className="space-y-4">
                <Input
                  label="Field Name"
                  type="text"
                  value={newField?.name}
                  onChange={(e) => handleNewFieldChange('name', e?.target?.value)}
                  placeholder="e.g., Lead Source, Priority Level"
                  required
                />

                <Select
                  label="Field Type"
                  options={fieldTypes}
                  value={newField?.type}
                  onChange={(value) => handleNewFieldChange('type', value)}
                />

                <Select
                  label="Apply to Entity"
                  options={entityTypes}
                  value={newField?.entity}
                  onChange={(value) => handleNewFieldChange('entity', value)}
                />

                <Checkbox
                  label="Required Field"
                  description="Users must fill this field when creating or editing records"
                  checked={newField?.required}
                  onChange={(e) => handleNewFieldChange('required', e?.target?.checked)}
                />

                {needsOptions && (
                  <div>
                    <label className="block text-sm font-medium text-card-foreground mb-2">
                      Options
                    </label>
                    <div className="space-y-2">
                      <div className="flex space-x-2">
                        <Input
                          type="text"
                          value={newField?.optionInput}
                          onChange={(e) => handleNewFieldChange('optionInput', e?.target?.value)}
                          placeholder="Enter option"
                          onKeyPress={(e) => e?.key === 'Enter' && handleAddOption()}
                        />
                        <Button
                          variant="outline"
                          onClick={handleAddOption}
                          iconName="Plus"
                        >
                          Add
                        </Button>
                      </div>
                      
                      {newField?.options?.length > 0 && (
                        <div className="space-y-1">
                          {newField?.options?.map((option, index) => (
                            <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                              <span className="text-sm">{option}</span>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveOption(index)}
                                aria-label="Remove option"
                              >
                                <Icon name="X" size={14} />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex space-x-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setIsAddFieldModalOpen(false)}
                    fullWidth
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="default"
                    onClick={handleCreateField}
                    loading={isLoading}
                    iconName="Save"
                    iconPosition="left"
                    fullWidth
                    disabled={!newField?.name?.trim() || (needsOptions && newField?.options?.length === 0)}
                  >
                    Create Field
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CustomFieldsTab;