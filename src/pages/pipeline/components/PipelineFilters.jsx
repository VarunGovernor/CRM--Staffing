import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';

const PipelineFilters = ({ filters, onFiltersChange, onResetFilters }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const ownerOptions = [
    { value: 'all', label: 'All Owners' },
    { value: 'john-doe', label: 'John Doe' },
    { value: 'sarah-wilson', label: 'Sarah Wilson' },
    { value: 'mike-johnson', label: 'Mike Johnson' },
    { value: 'emily-davis', label: 'Emily Davis' },
    { value: 'alex-chen', label: 'Alex Chen' }
  ];

  const priorityOptions = [
    { value: 'all', label: 'All Priorities' },
    { value: 'High', label: 'High Priority' },
    { value: 'Medium', label: 'Medium Priority' },
    { value: 'Low', label: 'Low Priority' }
  ];

  const dateRangeOptions = [
    { value: 'all', label: 'All Time' },
    { value: 'this-week', label: 'This Week' },
    { value: 'this-month', label: 'This Month' },
    { value: 'this-quarter', label: 'This Quarter' },
    { value: 'custom', label: 'Custom Range' }
  ];

  const handleFilterChange = (key, value) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters?.owner && filters?.owner !== 'all') count++;
    if (filters?.priority && filters?.priority !== 'all') count++;
    if (filters?.dateRange && filters?.dateRange !== 'all') count++;
    if (filters?.search && filters?.search?.trim()) count++;
    if (filters?.minValue && filters?.minValue > 0) count++;
    if (filters?.maxValue && filters?.maxValue > 0) count++;
    return count;
  };

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <div className="bg-card border border-border rounded-lg p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Icon name="Filter" size={20} className="text-muted-foreground" />
          <h3 className="font-medium text-card-foreground">Pipeline Filters</h3>
          {activeFiltersCount > 0 && (
            <span className="px-2 py-1 text-xs font-medium bg-primary text-primary-foreground rounded-full">
              {activeFiltersCount}
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {activeFiltersCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onResetFilters}
              iconName="X"
              iconPosition="left"
              iconSize={14}
            >
              Clear All
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsExpanded(!isExpanded)}
            className="lg:hidden"
            aria-label={isExpanded ? 'Collapse filters' : 'Expand filters'}
          >
            <Icon name={isExpanded ? "ChevronUp" : "ChevronDown"} size={16} />
          </Button>
        </div>
      </div>
      {/* Filters Content */}
      <div className={`space-y-4 ${isExpanded ? 'block' : 'hidden lg:block'}`}>
        {/* Search and Quick Filters Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Input
            type="search"
            placeholder="Search deals..."
            value={filters?.search || ''}
            onChange={(e) => handleFilterChange('search', e?.target?.value)}
            className="w-full"
          />
          
          <Select
            placeholder="Select owner"
            options={ownerOptions}
            value={filters?.owner || 'all'}
            onChange={(value) => handleFilterChange('owner', value)}
          />
          
          <Select
            placeholder="Select priority"
            options={priorityOptions}
            value={filters?.priority || 'all'}
            onChange={(value) => handleFilterChange('priority', value)}
          />
          
          <Select
            placeholder="Select date range"
            options={dateRangeOptions}
            value={filters?.dateRange || 'all'}
            onChange={(value) => handleFilterChange('dateRange', value)}
          />
        </div>

        {/* Value Range Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            type="number"
            label="Minimum Deal Value"
            placeholder="$0"
            value={filters?.minValue || ''}
            onChange={(e) => handleFilterChange('minValue', parseFloat(e?.target?.value) || 0)}
            min="0"
            step="1000"
          />
          
          <Input
            type="number"
            label="Maximum Deal Value"
            placeholder="No limit"
            value={filters?.maxValue || ''}
            onChange={(e) => handleFilterChange('maxValue', parseFloat(e?.target?.value) || 0)}
            min="0"
            step="1000"
          />
        </div>

        {/* Custom Date Range */}
        {filters?.dateRange === 'custom' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
            <Input
              type="date"
              label="Start Date"
              value={filters?.startDate || ''}
              onChange={(e) => handleFilterChange('startDate', e?.target?.value)}
            />
            
            <Input
              type="date"
              label="End Date"
              value={filters?.endDate || ''}
              onChange={(e) => handleFilterChange('endDate', e?.target?.value)}
            />
          </div>
        )}

        {/* Filter Summary */}
        {activeFiltersCount > 0 && (
          <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
            {filters?.search && (
              <span className="inline-flex items-center px-3 py-1 text-sm bg-accent text-accent-foreground rounded-full">
                Search: "{filters?.search}"
                <button
                  onClick={() => handleFilterChange('search', '')}
                  className="ml-2 hover:text-accent-foreground/80"
                  aria-label="Remove search filter"
                >
                  <Icon name="X" size={12} />
                </button>
              </span>
            )}
            
            {filters?.owner && filters?.owner !== 'all' && (
              <span className="inline-flex items-center px-3 py-1 text-sm bg-accent text-accent-foreground rounded-full">
                Owner: {ownerOptions?.find(o => o?.value === filters?.owner)?.label}
                <button
                  onClick={() => handleFilterChange('owner', 'all')}
                  className="ml-2 hover:text-accent-foreground/80"
                  aria-label="Remove owner filter"
                >
                  <Icon name="X" size={12} />
                </button>
              </span>
            )}
            
            {filters?.priority && filters?.priority !== 'all' && (
              <span className="inline-flex items-center px-3 py-1 text-sm bg-accent text-accent-foreground rounded-full">
                Priority: {filters?.priority}
                <button
                  onClick={() => handleFilterChange('priority', 'all')}
                  className="ml-2 hover:text-accent-foreground/80"
                  aria-label="Remove priority filter"
                >
                  <Icon name="X" size={12} />
                </button>
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PipelineFilters;