import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Select from '../../../components/ui/Select';

const AccountsFilters = ({ onFiltersChange, activeFilters, resultCount }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const industryOptions = [
    { value: '', label: 'All Industries' },
    { value: 'technology', label: 'Technology' },
    { value: 'healthcare', label: 'Healthcare' },
    { value: 'finance', label: 'Finance' },
    { value: 'manufacturing', label: 'Manufacturing' },
    { value: 'retail', label: 'Retail' },
    { value: 'education', label: 'Education' },
    { value: 'real-estate', label: 'Real Estate' },
    { value: 'consulting', label: 'Consulting' },
    { value: 'media', label: 'Media & Entertainment' },
    { value: 'automotive', label: 'Automotive' }
  ];

  const revenueOptions = [
    { value: '', label: 'All Revenue Ranges' },
    { value: '0-1M', label: 'Under $1M' },
    { value: '1M-10M', label: '$1M - $10M' },
    { value: '10M-50M', label: '$10M - $50M' },
    { value: '50M-100M', label: '$50M - $100M' },
    { value: '100M+', label: '$100M+' }
  ];

  const regionOptions = [
    { value: '', label: 'All Regions' },
    { value: 'north-america', label: 'North America' },
    { value: 'europe', label: 'Europe' },
    { value: 'asia-pacific', label: 'Asia Pacific' },
    { value: 'latin-america', label: 'Latin America' },
    { value: 'middle-east-africa', label: 'Middle East & Africa' }
  ];

  const handleFilterChange = (filterType, value) => {
    onFiltersChange({
      ...activeFilters,
      [filterType]: value
    });
  };

  const clearAllFilters = () => {
    onFiltersChange({
      industry: '',
      revenue: '',
      region: ''
    });
  };

  const hasActiveFilters = Object.values(activeFilters)?.some(value => value !== '');
  const activeFilterCount = Object.values(activeFilters)?.filter(value => value !== '')?.length;

  return (
    <div className="bg-card border border-border rounded-lg p-4 mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1">
            <Select
              options={industryOptions}
              value={activeFilters?.industry || ''}
              onChange={(value) => handleFilterChange('industry', value)}
              placeholder="Filter by industry"
              className="min-w-0"
            />
            
            <Select
              options={revenueOptions}
              value={activeFilters?.revenue || ''}
              onChange={(value) => handleFilterChange('revenue', value)}
              placeholder="Filter by revenue"
              className="min-w-0"
            />
            
            <Select
              options={regionOptions}
              value={activeFilters?.region || ''}
              onChange={(value) => handleFilterChange('region', value)}
              placeholder="Filter by region"
              className="min-w-0"
            />
          </div>

          {/* Mobile Filter Toggle */}
          <Button
            variant="outline"
            onClick={() => setIsExpanded(!isExpanded)}
            className="sm:hidden"
          >
            <Icon name="Filter" size={16} className="mr-2" />
            Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
            <Icon 
              name={isExpanded ? "ChevronUp" : "ChevronDown"} 
              size={16} 
              className="ml-2" 
            />
          </Button>
        </div>

        {/* Results and Actions */}
        <div className="flex items-center justify-between sm:justify-end gap-4">
          <div className="text-sm text-muted-foreground">
            {resultCount} {resultCount === 1 ? 'account' : 'accounts'} found
          </div>
          
          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="text-muted-foreground hover:text-foreground"
              >
                <Icon name="X" size={16} className="mr-2" />
                Clear filters
              </Button>
            )}
            
            <Button variant="outline" size="sm">
              <Icon name="Download" size={16} className="mr-2" />
              Export
            </Button>
          </div>
        </div>
      </div>
      {/* Active Filter Chips */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-border">
          {activeFilters?.industry && (
            <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
              <span>Industry: {industryOptions?.find(opt => opt?.value === activeFilters?.industry)?.label}</span>
              <button
                onClick={() => handleFilterChange('industry', '')}
                className="hover:bg-primary/20 rounded-full p-0.5 transition-colors"
              >
                <Icon name="X" size={14} />
              </button>
            </div>
          )}
          
          {activeFilters?.revenue && (
            <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
              <span>Revenue: {revenueOptions?.find(opt => opt?.value === activeFilters?.revenue)?.label}</span>
              <button
                onClick={() => handleFilterChange('revenue', '')}
                className="hover:bg-primary/20 rounded-full p-0.5 transition-colors"
              >
                <Icon name="X" size={14} />
              </button>
            </div>
          )}
          
          {activeFilters?.region && (
            <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
              <span>Region: {regionOptions?.find(opt => opt?.value === activeFilters?.region)?.label}</span>
              <button
                onClick={() => handleFilterChange('region', '')}
                className="hover:bg-primary/20 rounded-full p-0.5 transition-colors"
              >
                <Icon name="X" size={14} />
              </button>
            </div>
          )}
        </div>
      )}
      {/* Mobile Expanded Filters */}
      {isExpanded && (
        <div className="sm:hidden mt-4 pt-4 border-t border-border">
          <div className="space-y-3">
            <Select
              options={industryOptions}
              value={activeFilters?.industry || ''}
              onChange={(value) => handleFilterChange('industry', value)}
              placeholder="Filter by industry"
            />
            
            <Select
              options={revenueOptions}
              value={activeFilters?.revenue || ''}
              onChange={(value) => handleFilterChange('revenue', value)}
              placeholder="Filter by revenue"
            />
            
            <Select
              options={regionOptions}
              value={activeFilters?.region || ''}
              onChange={(value) => handleFilterChange('region', value)}
              placeholder="Filter by region"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountsFilters;