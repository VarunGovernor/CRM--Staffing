import React, { useState, useMemo } from 'react';
import Header from '../../components/ui/Header';
import Sidebar from '../../components/ui/Sidebar';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import AccountsTable from './components/AccountsTable';
import AccountsFilters from './components/AccountsFilters';
import AccountDrawer from './components/AccountDrawer';

const AccountsPage = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [filters, setFilters] = useState({
    industry: '',
    revenue: '',
    region: ''
  });

  // Mock accounts data
  const mockAccounts = [
    {
      id: 1,
      company: "TechCorp Solutions",
      industry: "Technology",
      revenue: "$15,000,000",
      contactCount: 12,
      dealValue: "$250,000",
      lastActivity: "2025-01-02",
      owner: "John Doe",
      region: "north-america"
    },
    {
      id: 2,
      company: "HealthFirst Medical",
      industry: "Healthcare",
      revenue: "$8,500,000",
      contactCount: 8,
      dealValue: "$180,000",
      lastActivity: "2025-01-01",
      owner: "Jane Smith",
      region: "north-america"
    },
    {
      id: 3,
      company: "Global Finance Corp",
      industry: "Finance",
      revenue: "$45,000,000",
      contactCount: 25,
      dealValue: "$500,000",
      lastActivity: "2024-12-30",
      owner: "Mike Johnson",
      region: "europe"
    },
    {
      id: 4,
      company: "Manufacturing Plus",
      industry: "Manufacturing",
      revenue: "$22,000,000",
      contactCount: 15,
      dealValue: "$320,000",
      lastActivity: "2024-12-28",
      owner: "Sarah Wilson",
      region: "asia-pacific"
    },
    {
      id: 5,
      company: "RetailMax Inc",
      industry: "Retail",
      revenue: "$12,000,000",
      contactCount: 18,
      dealValue: "$150,000",
      lastActivity: "2024-12-27",
      owner: "David Brown",
      region: "north-america"
    },
    {
      id: 6,
      company: "EduTech Academy",
      industry: "Education",
      revenue: "$3,200,000",
      contactCount: 6,
      dealValue: "$75,000",
      lastActivity: "2024-12-26",
      owner: "Lisa Garcia",
      region: "latin-america"
    },
    {
      id: 7,
      company: "PropertyPro Real Estate",
      industry: "Real Estate",
      revenue: "$18,500,000",
      contactCount: 22,
      dealValue: "$400,000",
      lastActivity: "2024-12-25",
      owner: "Tom Anderson",
      region: "north-america"
    },
    {
      id: 8,
      company: "ConsultCorp Advisory",
      industry: "Consulting",
      revenue: "$6,800,000",
      contactCount: 10,
      dealValue: "$120,000",
      lastActivity: "2024-12-24",
      owner: "Emma Davis",
      region: "europe"
    },
    {
      id: 9,
      company: "MediaMax Entertainment",
      industry: "Media",
      revenue: "$9,200,000",
      contactCount: 14,
      dealValue: "$200,000",
      lastActivity: "2024-12-23",
      owner: "Chris Miller",
      region: "north-america"
    },
    {
      id: 10,
      company: "AutoTech Motors",
      industry: "Automotive",
      revenue: "$35,000,000",
      contactCount: 28,
      dealValue: "$600,000",
      lastActivity: "2024-12-22",
      owner: "Alex Thompson",
      region: "asia-pacific"
    },
    {
      id: 11,
      company: "CloudFirst Technologies",
      industry: "Technology",
      revenue: "$28,000,000",
      contactCount: 20,
      dealValue: "$450,000",
      lastActivity: "2024-12-21",
      owner: "Rachel Green",
      region: "north-america"
    },
    {
      id: 12,
      company: "MedDevice Innovations",
      industry: "Healthcare",
      revenue: "$16,500,000",
      contactCount: 16,
      dealValue: "$280,000",
      lastActivity: "2024-12-20",
      owner: "Kevin Lee",
      region: "europe"
    }
  ];

  // Filter accounts based on active filters
  const filteredAccounts = useMemo(() => {
    return mockAccounts?.filter(account => {
      if (filters?.industry && account?.industry?.toLowerCase() !== filters?.industry) {
        return false;
      }
      
      if (filters?.revenue) {
        const revenue = parseFloat(account?.revenue?.replace(/[$,]/g, ''));
        switch (filters?.revenue) {
          case '0-1M':
            if (revenue >= 1000000) return false;
            break;
          case '1M-10M':
            if (revenue < 1000000 || revenue >= 10000000) return false;
            break;
          case '10M-50M':
            if (revenue < 10000000 || revenue >= 50000000) return false;
            break;
          case '50M-100M':
            if (revenue < 50000000 || revenue >= 100000000) return false;
            break;
          case '100M+':
            if (revenue < 100000000) return false;
            break;
        }
      }
      
      if (filters?.region && account?.region !== filters?.region) {
        return false;
      }
      
      return true;
    });
  }, [mockAccounts, filters]);

  const handleSidebarToggle = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleSidebarClose = () => {
    setIsSidebarOpen(false);
  };

  const handleRowClick = (account) => {
    setSelectedAccount(account);
    setIsDrawerOpen(true);
  };

  const handleDrawerClose = () => {
    setIsDrawerOpen(false);
    setSelectedAccount(null);
  };

  const handleBulkAction = (action, selectedIds) => {
    console.log(`Bulk ${action} for accounts:`, selectedIds);
    // Implement bulk actions here
  };

  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header onMenuToggle={handleSidebarToggle} isSidebarOpen={isSidebarOpen} />
      <Sidebar isOpen={isSidebarOpen} onClose={handleSidebarClose} />
      <main className="lg:ml-64 pt-16">
        <div className="p-4 lg:p-6">
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Accounts</h1>
              <p className="text-muted-foreground mt-1">
                Manage your customer companies and relationships
              </p>
            </div>
            
            <div className="flex items-center space-x-3 mt-4 sm:mt-0">
              <Button variant="outline">
                <Icon name="Upload" size={16} className="mr-2" />
                Import
              </Button>
              <Button>
                <Icon name="Plus" size={16} className="mr-2" />
                Add Account
              </Button>
            </div>
          </div>

          {/* Filters */}
          <AccountsFilters
            onFiltersChange={handleFiltersChange}
            activeFilters={filters}
            resultCount={filteredAccounts?.length}
          />

          {/* Accounts Table */}
          <AccountsTable
            accounts={filteredAccounts}
            onRowClick={handleRowClick}
            onBulkAction={handleBulkAction}
          />
        </div>
      </main>
      {/* Account Details Drawer */}
      <AccountDrawer
        account={selectedAccount}
        isOpen={isDrawerOpen}
        onClose={handleDrawerClose}
      />
    </div>
  );
};

export default AccountsPage;