import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';

const ContactFilters = ({ 
  searchTerm, 
  onSearchChange, 
  filters, 
  onFilterChange, 
  activeFiltersCount,
  onClearFilters 
}) => {
  const companyOptions = [
    { value: '', label: 'All Companies' },
    { value: 'TechCorp Solutions', label: 'TechCorp Solutions' },
    { value: 'Global Industries', label: 'Global Industries' },
    { value: 'Innovation Labs', label: 'Innovation Labs' },
    { value: 'Digital Dynamics', label: 'Digital Dynamics' },
    { value: 'Future Systems', label: 'Future Systems' },
    { value: 'Smart Solutions', label: 'Smart Solutions' },
    { value: 'NextGen Tech', label: 'NextGen Tech' },
    { value: 'Alpha Enterprises', label: 'Alpha Enterprises' }
  ];

  const roleOptions = [
    { value: '', label: 'All Roles' },
    { value: 'CEO', label: 'CEO' },
    { value: 'CTO', label: 'CTO' },
    { value: 'VP Sales', label: 'VP Sales' },
    { value: 'Marketing Director', label: 'Marketing Director' },
    { value: 'Sales Manager', label: 'Sales Manager' },
    { value: 'Product Manager', label: 'Product Manager' },
    { value: 'Operations Manager', label: 'Operations Manager' },
    { value: 'Business Analyst', label: 'Business Analyst' }
  ];

  const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'Active', label: 'Active' },
    { value: 'Inactive', label: 'Inactive' },
    { value: 'Prospect', label: 'Prospect' },
    { value: 'Customer', label: 'Customer' }
  ];

  return (
    <div className="bg-card rounded-xl border border-border p-6 mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4">
        {/* Search */}
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Icon 
              name="Search" 
              size={20} 
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" 
            />
            <Input
              type="search"
              placeholder="Search contacts by name, email, or company..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e?.target?.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
          <Select
            placeholder="Company"
            options={companyOptions}
            value={filters?.company}
            onChange={(value) => onFilterChange('company', value)}
            className="w-full sm:w-48"
          />
          
          <Select
            placeholder="Role"
            options={roleOptions}
            value={filters?.role}
            onChange={(value) => onFilterChange('role', value)}
            className="w-full sm:w-40"
          />
          
          <Select
            placeholder="Status"
            options={statusOptions}
            value={filters?.status}
            onChange={(value) => onFilterChange('status', value)}
            className="w-full sm:w-36"
          />

          {/* Clear Filters */}
          {activeFiltersCount > 0 && (
            <Button
              variant="outline"
              onClick={onClearFilters}
              className="whitespace-nowrap"
            >
              <Icon name="X" size={16} className="mr-2" />
              Clear ({activeFiltersCount})
            </Button>
          )}
        </div>
      </div>
      {/* Active Filters Display */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-border">
          <span className="text-sm text-muted-foreground">Active filters:</span>
          {filters?.company && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
              Company: {filters?.company}
              <button
                onClick={() => onFilterChange('company', '')}
                className="ml-1.5 hover:text-primary/80"
              >
                <Icon name="X" size={12} />
              </button>
            </span>
          )}
          {filters?.role && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary/10 text-secondary border border-secondary/20">
              Role: {filters?.role}
              <button
                onClick={() => onFilterChange('role', '')}
                className="ml-1.5 hover:text-secondary/80"
              >
                <Icon name="X" size={12} />
              </button>
            </span>
          )}
          {filters?.status && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-accent/10 text-accent-foreground border border-accent/20">
              Status: {filters?.status}
              <button
                onClick={() => onFilterChange('status', '')}
                className="ml-1.5 hover:opacity-80"
              >
                <Icon name="X" size={12} />
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default ContactFilters;