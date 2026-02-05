import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Header from '../../components/ui/Header';
import Sidebar from '../../components/ui/Sidebar';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import PipelineColumn from './components/PipelineColumn';
import PipelineFilters from './components/PipelineFilters';
import AddDealModal from './components/AddDealModal';
import PipelineStats from './components/PipelineStats';

const Pipeline = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAddDealModalOpen, setIsAddDealModalOpen] = useState(false);
  const [selectedStage, setSelectedStage] = useState(null);
  const [deals, setDeals] = useState([]);
  const [filters, setFilters] = useState({
    search: '',
    owner: 'all',
    priority: 'all',
    dateRange: 'all',
    minValue: 0,
    maxValue: 0,
    startDate: '',
    endDate: ''
  });

  // Mock data for pipeline stages
  const pipelineStages = [
  { id: 'new', name: 'New', color: 'blue' },
  { id: 'qualified', name: 'Qualified', color: 'yellow' },
  { id: 'proposal', name: 'Proposal', color: 'purple' },
  { id: 'won', name: 'Won', color: 'green' },
  { id: 'lost', name: 'Lost', color: 'red' }];


  // Mock deals data
  const mockDeals = [
  {
    id: 'deal-1',
    title: 'Enterprise Software License',
    accountName: 'TechCorp Solutions',
    value: 125000,
    owner: {
      id: 'john-doe',
      name: 'John Doe',
      avatar: "https://images.unsplash.com/photo-1588178457501-31b7688a41a0",
      avatarAlt: 'Professional headshot of John Doe in navy suit with short brown hair'
    },
    closeDate: '2025-01-15',
    priority: 'High',
    probability: 85,
    stage: 'proposal',
    tags: ['Enterprise', 'Software', 'Renewal'],
    createdAt: '2024-12-01T10:00:00Z',
    updatedAt: '2025-01-02T14:30:00Z'
  },
  {
    id: 'deal-2',
    title: 'Cloud Migration Project',
    accountName: 'Global Manufacturing Inc',
    value: 75000,
    owner: {
      id: 'sarah-wilson',
      name: 'Sarah Wilson',
      avatar: "https://images.unsplash.com/photo-1647326164285-b882810647cb",
      avatarAlt: 'Professional headshot of Sarah Wilson with blonde hair in business attire'
    },
    closeDate: '2025-02-28',
    priority: 'Medium',
    probability: 60,
    stage: 'qualified',
    tags: ['Cloud', 'Migration'],
    createdAt: '2024-12-15T09:15:00Z',
    updatedAt: '2025-01-01T11:20:00Z'
  },
  {
    id: 'deal-3',
    title: 'Security Audit Services',
    accountName: 'Financial Services Ltd',
    value: 45000,
    owner: {
      id: 'mike-johnson',
      name: 'Mike Johnson',
      avatar: "https://images.unsplash.com/photo-1722368378695-8a56b520fcf0",
      avatarAlt: 'Professional headshot of Mike Johnson with dark hair and glasses'
    },
    closeDate: '2025-01-30',
    priority: 'High',
    probability: 90,
    stage: 'proposal',
    tags: ['Security', 'Audit', 'Compliance'],
    createdAt: '2024-11-20T16:45:00Z',
    updatedAt: '2025-01-02T09:10:00Z'
  },
  {
    id: 'deal-4',
    title: 'Marketing Automation Platform',
    accountName: 'Retail Chain Corp',
    value: 35000,
    owner: {
      id: 'emily-davis',
      name: 'Emily Davis',
      avatar: "https://images.unsplash.com/photo-1700561791890-a15d45b9c79d",
      avatarAlt: 'Professional headshot of Emily Davis with curly brown hair in blue blazer'
    },
    closeDate: '2025-03-15',
    priority: 'Medium',
    probability: 40,
    stage: 'new',
    tags: ['Marketing', 'Automation'],
    createdAt: '2025-01-01T08:30:00Z',
    updatedAt: '2025-01-02T15:45:00Z'
  },
  {
    id: 'deal-5',
    title: 'Data Analytics Solution',
    accountName: 'Healthcare Systems',
    value: 95000,
    owner: {
      id: 'alex-chen',
      name: 'Alex Chen',
      avatar: "https://images.unsplash.com/photo-1537107041341-713aaa2a234c",
      avatarAlt: 'Professional headshot of Alex Chen with black hair in charcoal suit'
    },
    closeDate: '2025-02-10',
    priority: 'High',
    probability: 75,
    stage: 'qualified',
    tags: ['Analytics', 'Healthcare', 'Data'],
    createdAt: '2024-12-10T13:20:00Z',
    updatedAt: '2025-01-02T10:15:00Z'
  },
  {
    id: 'deal-6',
    title: 'Mobile App Development',
    accountName: 'Startup Innovations',
    value: 28000,
    owner: {
      id: 'john-doe',
      name: 'John Doe',
      avatar: "https://images.unsplash.com/photo-1588178457501-31b7688a41a0",
      avatarAlt: 'Professional headshot of John Doe in navy suit with short brown hair'
    },
    closeDate: '2025-04-01',
    priority: 'Low',
    probability: 30,
    stage: 'new',
    tags: ['Mobile', 'Development'],
    createdAt: '2025-01-02T12:00:00Z',
    updatedAt: '2025-01-02T12:00:00Z'
  },
  {
    id: 'deal-7',
    title: 'ERP Implementation',
    accountName: 'Manufacturing Plus',
    value: 180000,
    owner: {
      id: 'sarah-wilson',
      name: 'Sarah Wilson',
      avatar: "https://images.unsplash.com/photo-1648466982925-65dac4ed0814",
      avatarAlt: 'Professional headshot of Sarah Wilson with blonde hair in business attire'
    },
    closeDate: '2024-12-20',
    priority: 'High',
    probability: 100,
    stage: 'won',
    tags: ['ERP', 'Implementation', 'Enterprise'],
    createdAt: '2024-10-15T14:30:00Z',
    updatedAt: '2024-12-20T16:45:00Z'
  },
  {
    id: 'deal-8',
    title: 'Website Redesign',
    accountName: 'Local Business Co',
    value: 15000,
    owner: {
      id: 'mike-johnson',
      name: 'Mike Johnson',
      avatar: "https://images.unsplash.com/photo-1722368378695-8a56b520fcf0",
      avatarAlt: 'Professional headshot of Mike Johnson with dark hair and glasses'
    },
    closeDate: '2024-11-30',
    priority: 'Low',
    probability: 0,
    stage: 'lost',
    tags: ['Website', 'Design'],
    createdAt: '2024-10-01T09:00:00Z',
    updatedAt: '2024-11-30T17:00:00Z'
  }];


  useEffect(() => {
    setDeals(mockDeals);
  }, []);

  const handleSidebarToggle = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleSidebarClose = () => {
    setIsSidebarOpen(false);
  };

  const handleAddDeal = (stageId = null) => {
    setSelectedStage(stageId);
    setIsAddDealModalOpen(true);
  };

  const handleSaveDeal = (newDeal) => {
    setDeals((prevDeals) => [...prevDeals, newDeal]);
  };

  const handleDealMove = (dealId, newStageId) => {
    setDeals((prevDeals) =>
    prevDeals?.map((deal) =>
    deal?.id === dealId ?
    { ...deal, stage: newStageId, updatedAt: new Date()?.toISOString() } :
    deal
    )
    );
  };

  const handleEditDeal = (deal) => {
    console.log('Edit deal:', deal);
    // Implement edit functionality
  };

  const handleDeleteDeal = (dealId) => {
    if (window.confirm('Are you sure you want to delete this deal?')) {
      setDeals((prevDeals) => prevDeals?.filter((deal) => deal?.id !== dealId));
    }
  };

  const handleCloneDeal = (deal) => {
    const clonedDeal = {
      ...deal,
      id: `deal-${Date.now()}`,
      title: `${deal?.title} (Copy)`,
      createdAt: new Date()?.toISOString(),
      updatedAt: new Date()?.toISOString()
    };
    setDeals((prevDeals) => [...prevDeals, clonedDeal]);
  };

  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
  };

  const handleResetFilters = () => {
    setFilters({
      search: '',
      owner: 'all',
      priority: 'all',
      dateRange: 'all',
      minValue: 0,
      maxValue: 0,
      startDate: '',
      endDate: ''
    });
  };

  const getFilteredDeals = () => {
    return deals?.filter((deal) => {
      // Search filter
      if (filters?.search && !deal?.title?.toLowerCase()?.includes(filters?.search?.toLowerCase()) &&
      !deal?.accountName?.toLowerCase()?.includes(filters?.search?.toLowerCase())) {
        return false;
      }

      // Owner filter
      if (filters?.owner && filters?.owner !== 'all' && deal?.owner?.id !== filters?.owner) {
        return false;
      }

      // Priority filter
      if (filters?.priority && filters?.priority !== 'all' && deal?.priority !== filters?.priority) {
        return false;
      }

      // Value range filters
      if (filters?.minValue && deal?.value < filters?.minValue) {
        return false;
      }
      if (filters?.maxValue && deal?.value > filters?.maxValue) {
        return false;
      }

      // Date range filter
      if (filters?.dateRange && filters?.dateRange !== 'all') {
        const closeDate = new Date(deal.closeDate);
        const today = new Date();

        switch (filters?.dateRange) {
          case 'this-week':
            const weekStart = new Date(today);
            weekStart?.setDate(today?.getDate() - today?.getDay());
            const weekEnd = new Date(weekStart);
            weekEnd?.setDate(weekStart?.getDate() + 6);
            if (closeDate < weekStart || closeDate > weekEnd) return false;
            break;
          case 'this-month':
            if (closeDate?.getMonth() !== today?.getMonth() || closeDate?.getFullYear() !== today?.getFullYear()) {
              return false;
            }
            break;
          case 'this-quarter':
            const quarter = Math.floor(today?.getMonth() / 3);
            const dealQuarter = Math.floor(closeDate?.getMonth() / 3);
            if (dealQuarter !== quarter || closeDate?.getFullYear() !== today?.getFullYear()) {
              return false;
            }
            break;
          case 'custom':
            if (filters?.startDate && closeDate < new Date(filters.startDate)) return false;
            if (filters?.endDate && closeDate > new Date(filters.endDate)) return false;
            break;
        }
      }

      return true;
    });
  };

  const filteredDeals = getFilteredDeals();

  const getDealsByStage = (stageId) => {
    return filteredDeals?.filter((deal) => deal?.stage === stageId);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header onMenuToggle={handleSidebarToggle} isSidebarOpen={isSidebarOpen} />
      <Sidebar isOpen={isSidebarOpen} onClose={handleSidebarClose} />
      <main className="lg:ml-64 pt-16">
        <div className="p-6 space-y-6">
          {/* Page Header */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Sales Pipeline</h1>
              <p className="text-muted-foreground">
                Manage your deals through the sales process with drag-and-drop functionality
              </p>
            </div>
            
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                iconName="Download"
                iconPosition="left"
                iconSize={16}>

                Export Pipeline
              </Button>
              <Button
                variant="default"
                onClick={() => handleAddDeal()}
                iconName="Plus"
                iconPosition="left"
                iconSize={16}>

                Add Deal
              </Button>
            </div>
          </div>

          {/* Pipeline Stats */}
          <PipelineStats deals={filteredDeals} />

          {/* Filters */}
          <PipelineFilters
            filters={filters}
            onFiltersChange={handleFiltersChange}
            onResetFilters={handleResetFilters} />


          {/* Pipeline Board */}
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <Icon name="Kanban" size={24} className="text-primary" />
                <div>
                  <h2 className="text-xl font-bold text-card-foreground">Pipeline Board</h2>
                  <p className="text-base font-medium text-foreground">
                    {filteredDeals?.length} deal{filteredDeals?.length !== 1 ? 's' : ''} • 
                    <span className="text-primary font-semibold ml-1">
                      {new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: 'USD',
                        minimumFractionDigits: 0
                      })?.format(filteredDeals?.reduce((sum, deal) => sum + deal?.value, 0))}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* Kanban Board with Horizontal Scroll */}
            <div className="overflow-x-auto">
              <div className="flex gap-6 min-h-[600px] w-max min-w-full">
                {pipelineStages?.map((stage) =>
                <motion.div
                  key={stage?.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: pipelineStages?.indexOf(stage) * 0.1 }}
                  className="flex-shrink-0 w-80 h-full">

                    <PipelineColumn
                    stage={stage}
                    deals={getDealsByStage(stage?.id)}
                    onDealMove={handleDealMove}
                    onAddDeal={handleAddDeal}
                    onEditDeal={handleEditDeal}
                    onDeleteDeal={handleDeleteDeal}
                    onCloneDeal={handleCloneDeal} />

                  </motion.div>
                )}
              </div>
            </div>
          </div>

          {/* Mobile Pipeline View */}
          <div className="lg:hidden">
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center space-x-3 mb-6">
                <Icon name="Smartphone" size={24} className="text-primary" />
                <div>
                  <h3 className="text-lg font-bold text-card-foreground">Mobile Pipeline View</h3>
                  <p className="text-sm text-muted-foreground">
                    Switch to landscape mode or use a larger screen for the full Kanban board experience.
                  </p>
                </div>
              </div>
              
              {/* Stage Tabs for Mobile */}
              <div className="space-y-4">
                {pipelineStages?.map((stage) => {
                  const stageDeals = getDealsByStage(stage?.id);
                  return (
                    <div key={stage?.id} className="border border-border rounded-lg p-4 bg-muted/20">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-card-foreground text-base">{stage?.name}</h4>
                        <span className="text-sm font-medium text-foreground bg-background px-2 py-1 rounded-full">
                          {stageDeals?.length} deal{stageDeals?.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <div className="text-base font-semibold text-primary">
                        {new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: 'USD',
                          minimumFractionDigits: 0
                        })?.format(stageDeals?.reduce((sum, deal) => sum + deal?.value, 0))}
                      </div>
                    </div>);

                })}
              </div>
            </div>
          </div>
        </div>
      </main>
      {/* Add Deal Modal */}
      <AddDealModal
        isOpen={isAddDealModalOpen}
        onClose={() => setIsAddDealModalOpen(false)}
        onSave={handleSaveDeal}
        initialStage={selectedStage} />
    </div>
  );

};

export default Pipeline;