import React, { useState, useMemo } from 'react';
import Header from '../../components/ui/Header';
import Sidebar from '../../components/ui/Sidebar';
import Button from '../../components/ui/Button';
import { Checkbox } from '../../components/ui/Checkbox';
import Icon from '../../components/AppIcon';
import ActivityTimeline from './components/ActivityTimeline';
import ActivityFilters from './components/ActivityFilters';
import QuickAddActivity from './components/QuickAddActivity';
import BulkActions from './components/BulkActions';
import ActivityStats from './components/ActivityStats';

const Activities = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [selectedActivities, setSelectedActivities] = useState([]);
  const [activities, setActivities] = useState([
    {
      id: 1,
      type: 'task',
      title: 'Follow up on TechCorp proposal',
      description: 'Review the technical requirements and prepare counter-proposal for the enterprise solution.',
      dueDate: new Date('2025-11-03T14:00:00'),
      priority: 'high',
      owner: 'John Doe',
      contact: 'Robert Chen',
      account: 'TechCorp Solutions',
      completed: false,
      notes: 'Client mentioned budget constraints during last call. Focus on ROI benefits.'
    },
    {
      id: 2,
      type: 'call',
      title: 'Discovery call with InnovateLab',
      description: 'Initial discovery call to understand their current pain points and requirements.',
      dueDate: new Date('2025-11-03T10:30:00'),
      priority: 'medium',
      owner: 'Sarah Wilson',
      contact: 'Lisa Martinez',
      account: 'InnovateLab Inc.',
      completed: true,
      notes: 'Great call! They are very interested in our automation features. Sending proposal by Friday.'
    },
    {
      id: 3,
      type: 'meeting',
      title: 'Product demo for GlobalTech',
      description: 'Comprehensive product demonstration focusing on integration capabilities.',
      dueDate: new Date('2025-11-04T15:00:00'),
      priority: 'high',
      owner: 'Mike Johnson',
      contact: 'David Kim',
      account: 'GlobalTech Industries',
      completed: false,
      notes: 'Prepare demo environment with their sample data. Focus on API integrations.'
    },
    {
      id: 4,
      type: 'email',
      title: 'Send contract to DataFlow Systems',
      description: 'Finalize and send the service agreement for review and signature.',
      dueDate: new Date('2025-11-02T16:00:00'),
      priority: 'high',
      owner: 'Emily Davis',
      contact: 'Jennifer White',
      account: 'DataFlow Systems',
      completed: false,
      notes: 'Legal team has approved the contract. Ready to send for client review.'
    },
    {
      id: 5,
      type: 'task',
      title: 'Prepare quarterly business review',
      description: 'Compile performance metrics and prepare presentation for CloudSys QBR.',
      dueDate: new Date('2025-11-05T09:00:00'),
      priority: 'medium',
      owner: 'Alex Brown',
      contact: 'Michael Brown',
      account: 'CloudSys Technologies',
      completed: false,
      notes: 'Include usage statistics, ROI analysis, and expansion opportunities.'
    },
    {
      id: 6,
      type: 'note',
      title: 'Competitor analysis update',
      description: 'Research latest competitor features and pricing updates for Q4 strategy.',
      dueDate: new Date('2025-11-01T12:00:00'),
      priority: 'low',
      owner: 'John Doe',
      contact: null,
      account: null,
      completed: true,
      notes: 'Completed analysis shows we maintain competitive advantage in automation and pricing.'
    },
    {
      id: 7,
      type: 'call',
      title: 'Check-in call with existing client',
      description: 'Monthly check-in to ensure satisfaction and identify expansion opportunities.',
      dueDate: new Date('2025-11-06T11:00:00'),
      priority: 'medium',
      owner: 'Sarah Wilson',
      contact: 'Robert Chen',
      account: 'TechCorp Solutions',
      completed: false,
      notes: 'Last month they mentioned interest in additional modules. Prepare expansion proposal.'
    },
    {
      id: 8,
      type: 'meeting',
      title: 'Internal strategy session',
      description: 'Team meeting to discuss Q4 sales strategy and territory planning.',
      dueDate: new Date('2025-11-07T14:30:00'),
      priority: 'medium',
      owner: 'Mike Johnson',
      contact: null,
      account: null,
      completed: false,
      notes: 'Prepare territory analysis and pipeline review for the team discussion.'
    }
  ]);

  const [filters, setFilters] = useState({
    search: '',
    type: 'all',
    status: 'all',
    owner: 'all',
    priority: 'all',
    dateFrom: '',
    dateTo: ''
  });

  const filteredActivities = useMemo(() => {
    return activities?.filter(activity => {
      // Search filter
      if (filters?.search) {
        const searchTerm = filters?.search?.toLowerCase();
        const matchesSearch = 
          activity?.title?.toLowerCase()?.includes(searchTerm) ||
          activity?.description?.toLowerCase()?.includes(searchTerm) ||
          (activity?.contact && activity?.contact?.toLowerCase()?.includes(searchTerm)) ||
          (activity?.account && activity?.account?.toLowerCase()?.includes(searchTerm));
        
        if (!matchesSearch) return false;
      }

      // Type filter
      if (filters?.type !== 'all' && activity?.type !== filters?.type) {
        return false;
      }

      // Status filter
      if (filters?.status !== 'all') {
        const now = new Date();
        const isOverdue = !activity?.completed && new Date(activity.dueDate) < now;
        
        if (filters?.status === 'completed' && !activity?.completed) return false;
        if (filters?.status === 'pending' && (activity?.completed || isOverdue)) return false;
        if (filters?.status === 'overdue' && !isOverdue) return false;
      }

      // Owner filter
      if (filters?.owner !== 'all') {
        const ownerMap = {
          'john-doe': 'John Doe',
          'sarah-wilson': 'Sarah Wilson',
          'mike-johnson': 'Mike Johnson',
          'emily-davis': 'Emily Davis',
          'alex-brown': 'Alex Brown'
        };
        
        if (activity?.owner !== ownerMap?.[filters?.owner]) return false;
      }

      // Priority filter
      if (filters?.priority !== 'all' && activity?.priority !== filters?.priority) {
        return false;
      }

      // Date range filter
      if (filters?.dateFrom) {
        const activityDate = new Date(activity.dueDate);
        const fromDate = new Date(filters.dateFrom);
        if (activityDate < fromDate) return false;
      }

      if (filters?.dateTo) {
        const activityDate = new Date(activity.dueDate);
        const toDate = new Date(filters.dateTo);
        toDate?.setHours(23, 59, 59, 999); // End of day
        if (activityDate > toDate) return false;
      }

      return true;
    })?.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
  }, [activities, filters]);

  const handleMenuToggle = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleSidebarClose = () => {
    setIsSidebarOpen(false);
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleClearFilters = () => {
    setFilters({
      search: '',
      type: 'all',
      status: 'all',
      owner: 'all',
      priority: 'all',
      dateFrom: '',
      dateTo: ''
    });
  };

  const handleAddActivity = (newActivity) => {
    setActivities(prev => [newActivity, ...prev]);
  };

  const handleEditActivity = (activity) => {
    // In a real app, this would open an edit modal
    console.log('Edit activity:', activity);
  };

  const handleCompleteActivity = (activityId) => {
    setActivities(prev => 
      prev?.map(activity => 
        activity?.id === activityId 
          ? { ...activity, completed: true }
          : activity
      )
    );
  };

  const handleRescheduleActivity = (activity) => {
    // In a real app, this would open a reschedule modal
    console.log('Reschedule activity:', activity);
  };

  const handleSelectActivity = (activityId, checked) => {
    if (checked) {
      setSelectedActivities(prev => [...prev, activityId]);
    } else {
      setSelectedActivities(prev => prev?.filter(id => id !== activityId));
    }
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedActivities(filteredActivities?.map(a => a?.id));
    } else {
      setSelectedActivities([]);
    }
  };

  const handleBulkComplete = () => {
    setActivities(prev => 
      prev?.map(activity => 
        selectedActivities?.includes(activity?.id)
          ? { ...activity, completed: true }
          : activity
      )
    );
    setSelectedActivities([]);
  };

  const handleBulkReassign = (newOwner) => {
    setActivities(prev => 
      prev?.map(activity => 
        selectedActivities?.includes(activity?.id)
          ? { ...activity, owner: newOwner }
          : activity
      )
    );
    setSelectedActivities([]);
  };

  const handleBulkDelete = () => {
    if (window.confirm(`Are you sure you want to delete ${selectedActivities?.length} activities?`)) {
      setActivities(prev => 
        prev?.filter(activity => !selectedActivities?.includes(activity?.id))
      );
      setSelectedActivities([]);
    }
  };

  const handleClearSelection = () => {
    setSelectedActivities([]);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header onMenuToggle={handleMenuToggle} isSidebarOpen={isSidebarOpen} />
      <Sidebar isOpen={isSidebarOpen} onClose={handleSidebarClose} />
      <main className="lg:ml-64 pt-16">
        <div className="p-6">
          {/* Page Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-foreground mb-2">Activities</h1>
              <p className="text-muted-foreground">
                Track and manage your sales activities, tasks, and follow-ups
              </p>
            </div>
            
            <Button
              variant="default"
              onClick={() => setIsQuickAddOpen(true)}
              iconName="Plus"
              iconPosition="left"
            >
              Quick Add Activity
            </Button>
          </div>

          {/* Activity Stats */}
          <ActivityStats activities={activities} />

          {/* Activity Filters */}
          <ActivityFilters
            filters={filters}
            onFilterChange={handleFilterChange}
            onClearFilters={handleClearFilters}
            totalCount={activities?.length}
            filteredCount={filteredActivities?.length}
          />

          {/* Bulk Actions */}
          <BulkActions
            selectedCount={selectedActivities?.length}
            onMarkComplete={handleBulkComplete}
            onReassign={handleBulkReassign}
            onDelete={handleBulkDelete}
            onClearSelection={handleClearSelection}
          />

          {/* Activities List */}
          <div className="bg-card border border-border rounded-lg">
            {/* List Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center space-x-4">
                <Checkbox
                  checked={selectedActivities?.length === filteredActivities?.length && filteredActivities?.length > 0}
                  onChange={(e) => handleSelectAll(e?.target?.checked)}
                  className="mr-2"
                />
                <h3 className="text-lg font-semibold text-foreground">
                  Activity Timeline ({filteredActivities?.length})
                </h3>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" iconName="Download">
                  Export
                </Button>
                <Button variant="outline" size="sm" iconName="RefreshCw">
                  Refresh
                </Button>
              </div>
            </div>

            {/* Activities Timeline */}
            <div className="p-6">
              {filteredActivities?.length === 0 ? (
                <div className="text-center py-12">
                  <Icon name="Calendar" size={48} className="text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No activities found</h3>
                  <p className="text-muted-foreground mb-4">
                    {activities?.length === 0 
                      ? "Get started by creating your first activity" :"Try adjusting your filters to see more activities"
                    }
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => setIsQuickAddOpen(true)}
                    iconName="Plus"
                    iconPosition="left"
                  >
                    Add Activity
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Selection checkboxes for timeline items */}
                  {filteredActivities?.map((activity) => (
                    <div key={activity?.id} className="flex items-start space-x-4">
                      <Checkbox
                        checked={selectedActivities?.includes(activity?.id)}
                        onChange={(e) => handleSelectActivity(activity?.id, e?.target?.checked)}
                        className="mt-6"
                      />
                      <div className="flex-1">
                        <ActivityTimeline
                          activities={[activity]}
                          onEdit={handleEditActivity}
                          onComplete={handleCompleteActivity}
                          onReschedule={handleRescheduleActivity}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      {/* Quick Add Activity Modal */}
      <QuickAddActivity
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        onAdd={handleAddActivity}
      />
    </div>
  );
};

export default Activities;