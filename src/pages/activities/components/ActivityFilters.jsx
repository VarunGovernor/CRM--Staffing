import React from 'react';
import Select from '../../../components/ui/Select';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import Icon from '../../../components/AppIcon';

const ActivityFilters = ({ 
  filters, 
  onFilterChange, 
  onClearFilters,
  totalCount,
  filteredCount 
}) => {
  const activityTypeOptions = [
    { value: 'all', label: 'All Types' },
    { value: 'task', label: 'Tasks' },
    { value: 'call', label: 'Calls' },
    { value: 'meeting', label: 'Meetings' },
    { value: 'email', label: 'Emails' },
    { value: 'note', label: 'Notes' }
  ];

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'pending', label: 'Pending' },
    { value: 'completed', label: 'Completed' },
    { value: 'overdue', label: 'Overdue' }
  ];

  const ownerOptions = [
    { value: 'all', label: 'All Owners' },
    { value: 'john-doe', label: 'John Doe' },
    { value: 'sarah-wilson', label: 'Sarah Wilson' },
    { value: 'mike-johnson', label: 'Mike Johnson' },
    { value: 'emily-davis', label: 'Emily Davis' },
    { value: 'alex-brown', label: 'Alex Brown' }
  ];

  const priorityOptions = [
    { value: 'all', label: 'All Priorities' },
    { value: 'high', label: 'High Priority' },
    { value: 'medium', label: 'Medium Priority' },
    { value: 'low', label: 'Low Priority' }
  ];

  const hasActiveFilters = () => {
    return filters?.type !== 'all' || 
           filters?.status !== 'all' || 
           filters?.owner !== 'all' || 
           filters?.priority !== 'all' ||
           filters?.dateFrom || 
           filters?.dateTo ||
           filters?.search;
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Icon name="Filter" size={20} className="text-muted-foreground" />
          <h3 className="text-lg font-semibold text-foreground">Filter Activities</h3>
        </div>
        
        <div className="flex items-center space-x-4">
          <span className="text-sm text-muted-foreground">
            Showing {filteredCount} of {totalCount} activities
          </span>
          
          {hasActiveFilters() && (
            <Button
              variant="outline"
              size="sm"
              onClick={onClearFilters}
              iconName="X"
              iconPosition="left"
            >
              Clear Filters
            </Button>
          )}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {/* Search */}
        <div className="lg:col-span-2">
          <Input
            type="search"
            placeholder="Search activities..."
            value={filters?.search}
            onChange={(e) => onFilterChange('search', e?.target?.value)}
            className="w-full"
          />
        </div>

        {/* Activity Type */}
        <Select
          options={activityTypeOptions}
          value={filters?.type}
          onChange={(value) => onFilterChange('type', value)}
          placeholder="Activity Type"
        />

        {/* Status */}
        <Select
          options={statusOptions}
          value={filters?.status}
          onChange={(value) => onFilterChange('status', value)}
          placeholder="Status"
        />

        {/* Owner */}
        <Select
          options={ownerOptions}
          value={filters?.owner}
          onChange={(value) => onFilterChange('owner', value)}
          placeholder="Owner"
        />

        {/* Priority */}
        <Select
          options={priorityOptions}
          value={filters?.priority}
          onChange={(value) => onFilterChange('priority', value)}
          placeholder="Priority"
        />
      </div>
      {/* Date Range Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <Input
          type="date"
          label="From Date"
          value={filters?.dateFrom}
          onChange={(e) => onFilterChange('dateFrom', e?.target?.value)}
        />
        
        <Input
          type="date"
          label="To Date"
          value={filters?.dateTo}
          onChange={(e) => onFilterChange('dateTo', e?.target?.value)}
        />
      </div>
    </div>
  );
};

export default ActivityFilters;