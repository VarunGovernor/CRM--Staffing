import React, { useState, useMemo, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import Header from '../../components/ui/Header';
import Sidebar from '../../components/ui/Sidebar';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import DealsTable from './components/DealsTable';
import DealsFilters from './components/DealsFilters';
import DealDrawer from './components/DealDrawer';
import TablePagination from './components/TablePagination';

const DealsPage = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedDeals, setSelectedDeals] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });
  const [filters, setFilters] = useState({
    search: '',
    stage: '',
    owner: '',
    minValue: '',
    maxValue: '',
    closeDateFrom: '',
    closeDateTo: ''
  });

  // Mock deals data
  const mockDeals = [
    {
      id: 1,
      name: 'Enterprise Software License',
      account: 'TechCorp Solutions',
      value: 125000,
      owner: 'Sarah Johnson',
      stage: 'Proposal',
      closeDate: '2025-12-15',
      probability: 75,
      createdDate: '2025-10-15'
    },
    {
      id: 2,
      name: 'Cloud Migration Project',
      account: 'Global Manufacturing Inc',
      value: 89000,
      owner: 'Michael Chen',
      stage: 'Negotiation',
      closeDate: '2025-11-30',
      probability: 85,
      createdDate: '2025-09-20'
    },
    {
      id: 3,
      name: 'Security Audit & Compliance',
      account: 'Financial Services Ltd',
      value: 45000,
      owner: 'Emily Rodriguez',
      stage: 'Qualified',
      closeDate: '2025-12-31',
      probability: 60,
      createdDate: '2025-10-01'
    },
    {
      id: 4,
      name: 'Digital Transformation Suite',
      account: 'Healthcare Systems Corp',
      value: 200000,
      owner: 'David Kim',
      stage: 'New',
      closeDate: '2026-01-15',
      probability: 40,
      createdDate: '2025-10-28'
    },
    {
      id: 5,
      name: 'Data Analytics Platform',
      account: 'Retail Chain Holdings',
      value: 67000,
      owner: 'Lisa Thompson',
      stage: 'Proposal',
      closeDate: '2025-12-10',
      probability: 70,
      createdDate: '2025-09-15'
    },
    {
      id: 6,
      name: 'Mobile App Development',
      account: 'StartupTech Inc',
      value: 35000,
      owner: 'Sarah Johnson',
      stage: 'Won',
      closeDate: '2025-11-15',
      probability: 100,
      createdDate: '2025-08-10'
    },
    {
      id: 7,
      name: 'Infrastructure Upgrade',
      account: 'Education District 42',
      value: 150000,
      owner: 'Michael Chen',
      stage: 'Negotiation',
      closeDate: '2025-12-20',
      probability: 80,
      createdDate: '2025-09-05'
    },
    {
      id: 8,
      name: 'CRM Implementation',
      account: 'Marketing Agency Pro',
      value: 28000,
      owner: 'Emily Rodriguez',
      stage: 'Lost',
      closeDate: '2025-10-30',
      probability: 0,
      createdDate: '2025-08-20'
    },
    {
      id: 9,
      name: 'AI Integration Services',
      account: 'Innovation Labs',
      value: 95000,
      owner: 'David Kim',
      stage: 'Qualified',
      closeDate: '2026-01-30',
      probability: 55,
      createdDate: '2025-10-10'
    },
    {
      id: 10,
      name: 'Cybersecurity Assessment',
      account: 'Government Agency',
      value: 75000,
      owner: 'Lisa Thompson',
      stage: 'Proposal',
      closeDate: '2025-12-05',
      probability: 65,
      createdDate: '2025-09-25'
    },
    {
      id: 11,
      name: 'E-commerce Platform',
      account: 'Fashion Retailer Co',
      value: 110000,
      owner: 'Sarah Johnson',
      stage: 'New',
      closeDate: '2026-02-15',
      probability: 35,
      createdDate: '2025-11-01'
    },
    {
      id: 12,
      name: 'Business Intelligence Suite',
      account: 'Logistics Partners',
      value: 85000,
      owner: 'Michael Chen',
      stage: 'Qualified',
      closeDate: '2025-12-25',
      probability: 50,
      createdDate: '2025-10-05'
    }
  ];

  // Filter and sort deals
  const filteredAndSortedDeals = useMemo(() => {
    let filtered = mockDeals?.filter(deal => {
      const matchesSearch = !filters?.search || 
        deal?.name?.toLowerCase()?.includes(filters?.search?.toLowerCase()) ||
        deal?.account?.toLowerCase()?.includes(filters?.search?.toLowerCase());
      
      const matchesStage = !filters?.stage || deal?.stage === filters?.stage;
      const matchesOwner = !filters?.owner || deal?.owner === filters?.owner;
      
      const matchesMinValue = !filters?.minValue || deal?.value >= parseInt(filters?.minValue);
      const matchesMaxValue = !filters?.maxValue || deal?.value <= parseInt(filters?.maxValue);
      
      const matchesCloseDateFrom = !filters?.closeDateFrom || 
        new Date(deal.closeDate) >= new Date(filters.closeDateFrom);
      const matchesCloseDateTo = !filters?.closeDateTo || 
        new Date(deal.closeDate) <= new Date(filters.closeDateTo);

      return matchesSearch && matchesStage && matchesOwner && 
             matchesMinValue && matchesMaxValue && 
             matchesCloseDateFrom && matchesCloseDateTo;
    });

    // Sort deals
    if (sortConfig?.key) {
      filtered?.sort((a, b) => {
        let aValue = a?.[sortConfig?.key];
        let bValue = b?.[sortConfig?.key];

        if (sortConfig?.key === 'value') {
          aValue = parseInt(aValue);
          bValue = parseInt(bValue);
        } else if (sortConfig?.key === 'closeDate') {
          aValue = new Date(aValue);
          bValue = new Date(bValue);
        } else if (typeof aValue === 'string') {
          aValue = aValue?.toLowerCase();
          bValue = bValue?.toLowerCase();
        }

        if (aValue < bValue) {
          return sortConfig?.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig?.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return filtered;
  }, [filters, sortConfig]);

  const totalPages = Math.ceil(filteredAndSortedDeals?.length / itemsPerPage);

  const handleMenuToggle = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleSidebarClose = () => {
    setIsSidebarOpen(false);
  };

  const handleDealClick = (deal) => {
    setSelectedDeal(deal);
    setIsDrawerOpen(true);
  };

  const handleDrawerClose = () => {
    setIsDrawerOpen(false);
    setSelectedDeal(null);
  };

  const handleSelectDeal = (dealId, isSelected) => {
    if (isSelected) {
      setSelectedDeals([...selectedDeals, dealId]);
    } else {
      setSelectedDeals(selectedDeals?.filter(id => id !== dealId));
    }
  };

  const handleSelectAll = (isSelected) => {
    if (isSelected) {
      const currentPageDeals = filteredAndSortedDeals?.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)?.map(deal => deal?.id);
      setSelectedDeals([...new Set([...selectedDeals, ...currentPageDeals])]);
    } else {
      const currentPageDeals = filteredAndSortedDeals?.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)?.map(deal => deal?.id);
      setSelectedDeals(selectedDeals?.filter(id => !currentPageDeals?.includes(id)));
    }
  };

  const handleSort = (key) => {
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig?.key === key && prevConfig?.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setFilters({
      search: '',
      stage: '',
      owner: '',
      minValue: '',
      maxValue: '',
      closeDateFrom: '',
      closeDateTo: ''
    });
    setCurrentPage(1);
  };

  const handleBulkAction = (action) => {
    console.log(`Bulk action ${action} for deals:`, selectedDeals);
    // Implement bulk actions here
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  return (
    <>
      <Helmet>
        <title>Deals - CRMPro</title>
        <meta name="description" content="Manage and track your sales deals with comprehensive filtering and pipeline management tools." />
      </Helmet>
      <div className="min-h-screen bg-background">
        <Header onMenuToggle={handleMenuToggle} isSidebarOpen={isSidebarOpen} />
        <Sidebar isOpen={isSidebarOpen} onClose={handleSidebarClose} />
        
        <main className="lg:ml-64 pt-16">
          <div className="p-4 lg:p-6">
            {/* Page Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Deals</h1>
                <p className="text-muted-foreground mt-1">
                  Track and manage your sales opportunities
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <Button variant="outline">
                  <Icon name="Download" size={16} className="mr-2" />
                  Export
                </Button>
                <Button variant="outline">
                  <Icon name="GitBranch" size={16} className="mr-2" />
                  Pipeline View
                </Button>
                <Button>
                  <Icon name="Plus" size={16} className="mr-2" />
                  New Deal
                </Button>
              </div>
            </div>

            {/* Filters */}
            <DealsFilters
              filters={filters}
              onFiltersChange={handleFiltersChange}
              onClearFilters={handleClearFilters}
              dealCount={filteredAndSortedDeals?.length}
              onBulkAction={handleBulkAction}
              selectedCount={selectedDeals?.length}
            />

            {/* Deals Table */}
            <DealsTable
              deals={filteredAndSortedDeals}
              selectedDeals={selectedDeals}
              onSelectDeal={handleSelectDeal}
              onSelectAll={handleSelectAll}
              onDealClick={handleDealClick}
              sortConfig={sortConfig}
              onSort={handleSort}
              currentPage={currentPage}
              itemsPerPage={itemsPerPage}
            />

            {/* Pagination */}
            <TablePagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredAndSortedDeals?.length}
              itemsPerPage={itemsPerPage}
              onPageChange={handlePageChange}
              onItemsPerPageChange={handleItemsPerPageChange}
            />
          </div>
        </main>

        {/* Deal Drawer */}
        <DealDrawer
          deal={selectedDeal}
          isOpen={isDrawerOpen}
          onClose={handleDrawerClose}
        />
      </div>
    </>
  );
};

export default DealsPage;