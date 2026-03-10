import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';

const VISA_OPTIONS = [
  { value: '', label: 'All VISA Types' },
  { value: 'US Citizen', label: 'US Citizen' },
  { value: 'Green Card', label: 'Green Card' },
  { value: 'H1B', label: 'H1B' },
  { value: 'H4 EAD', label: 'H4 EAD' },
  { value: 'L2 EAD', label: 'L2 EAD' },
  { value: 'OPT', label: 'OPT' },
  { value: 'CPT', label: 'CPT' },
  { value: 'TN', label: 'TN' },
  { value: 'GC EAD', label: 'GC EAD' },
];

const ContactFilters = ({
  searchTerm,
  onSearchChange,
  visaFilter,
  onVisaFilterChange,
  onClearFilters,
}) => {
  const hasFilter = visaFilter !== '';

  return (
    <div className="bg-card rounded-xl border border-border p-4 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        {/* Search */}
        <div className="flex-1 relative">
          <Icon
            name="Search"
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
          />
          <Input
            type="search"
            placeholder="Search by name or title..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e?.target?.value)}
            className="pl-10"
          />
        </div>

        {/* VISA Filter */}
        <Select
          options={VISA_OPTIONS}
          value={visaFilter}
          onChange={onVisaFilterChange}
          className="w-full sm:w-48"
        />

        {/* Clear */}
        {hasFilter && (
          <Button variant="outline" onClick={onClearFilters} className="whitespace-nowrap">
            <Icon name="X" size={16} className="mr-1" />
            Clear
          </Button>
        )}
      </div>
    </div>
  );
};

export default ContactFilters;
