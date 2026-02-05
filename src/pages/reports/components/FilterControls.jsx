import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

import Select from '../../../components/ui/Select';

const FilterControls = ({ onFiltersChange, isLoading }) => {
  const [dateRange, setDateRange] = useState('last-30-days');
  const [selectedOwner, setSelectedOwner] = useState('all');
  const [selectedStage, setSelectedStage] = useState('all');

  const dateRangeOptions = [
    { value: 'last-7-days', label: 'Last 7 days' },
    { value: 'last-30-days', label: 'Last 30 days' },
    { value: 'last-90-days', label: 'Last 90 days' },
    { value: 'last-6-months', label: 'Last 6 months' },
    { value: 'last-year', label: 'Last year' },
    { value: 'custom', label: 'Custom range' }
  ];

  const ownerOptions = [
    { value: 'all', label: 'All owners' },
    { value: 'john-doe', label: 'John Doe' },
    { value: 'sarah-wilson', label: 'Sarah Wilson' },
    { value: 'mike-johnson', label: 'Mike Johnson' },
    { value: 'emily-davis', label: 'Emily Davis' },
    { value: 'alex-chen', label: 'Alex Chen' }
  ];

  const stageOptions = [
    { value: 'all', label: 'All stages' },
    { value: 'new', label: 'New' },
    { value: 'qualified', label: 'Qualified' },
    { value: 'proposal', label: 'Proposal' },
    { value: 'negotiation', label: 'Negotiation' },
    { value: 'won', label: 'Won' },
    { value: 'lost', label: 'Lost' }
  ];

  const handleFilterChange = (type, value) => {
    const newFilters = { dateRange, selectedOwner, selectedStage };
    newFilters[type] = value;
    
    if (type === 'dateRange') setDateRange(value);
    if (type === 'selectedOwner') setSelectedOwner(value);
    if (type === 'selectedStage') setSelectedStage(value);
    
    onFiltersChange(newFilters);
  };

  const handleRefresh = () => {
    onFiltersChange({ dateRange, selectedOwner, selectedStage, refresh: true });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-card border border-border rounded-xl p-6 mb-6"
    >
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
        <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
          <Select
            label="Date Range"
            options={dateRangeOptions}
            value={dateRange}
            onChange={(value) => handleFilterChange('dateRange', value)}
            className="w-full sm:w-48"
          />
          
          <Select
            label="Owner"
            options={ownerOptions}
            value={selectedOwner}
            onChange={(value) => handleFilterChange('selectedOwner', value)}
            className="w-full sm:w-48"
          />
          
          <Select
            label="Pipeline Stage"
            options={stageOptions}
            value={selectedStage}
            onChange={(value) => handleFilterChange('selectedStage', value)}
            className="w-full sm:w-48"
          />
        </div>
        
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            onClick={handleRefresh}
            loading={isLoading}
            iconName="RefreshCw"
            iconPosition="left"
            className="flex-shrink-0"
          >
            Refresh Data
          </Button>
          
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Icon name="Clock" size={16} />
            <span>Last updated: {new Date()?.toLocaleTimeString()}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default FilterControls;