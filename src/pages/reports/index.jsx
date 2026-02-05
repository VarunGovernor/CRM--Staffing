import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet';
import Header from '../../components/ui/Header';
import Sidebar from '../../components/ui/Sidebar';
import MetricsCard from './components/MetricsCard';
import FilterControls from './components/FilterControls';
import ConversionFunnelChart from './components/ConversionFunnelChart';
import WinRateChart from './components/WinRateChart';
import RevenueChart from './components/RevenueChart';
import ExportControls from './components/ExportControls';

const Reports = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState({
    dateRange: 'last-30-days',
    selectedOwner: 'all',
    selectedStage: 'all'
  });

  const handleSidebarToggle = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleSidebarClose = () => {
    setIsSidebarOpen(false);
  };

  const handleFiltersChange = (newFilters) => {
    setIsLoading(true);
    setFilters(newFilters);
    
    // Simulate data loading
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  };

  // Close sidebar on route change or outside click
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const metricsData = [
    {
      title: 'Conversion Rate',
      value: '13.2%',
      change: '+2.4%',
      changeType: 'positive',
      icon: 'TrendingUp',
      iconColor: 'bg-success',
      description: 'Lead to deal conversion'
    },
    {
      title: 'Average Deal Size',
      value: '$24,500',
      change: '+$1,200',
      changeType: 'positive',
      icon: 'DollarSign',
      iconColor: 'bg-primary',
      description: 'Mean deal value'
    },
    {
      title: 'Sales Velocity',
      value: '28 days',
      change: '-3 days',
      changeType: 'positive',
      icon: 'Clock',
      iconColor: 'bg-accent',
      description: 'Average sales cycle'
    },
    {
      title: 'Win Rate',
      value: '72.4%',
      change: '+5.1%',
      changeType: 'positive',
      icon: 'Target',
      iconColor: 'bg-secondary',
      description: 'Deals won vs total'
    }
  ];

  return (
    <>
      <Helmet>
        <title>Reports - CRMPro</title>
        <meta name="description" content="Comprehensive sales analytics with interactive visualizations and export capabilities for data-driven decision making" />
      </Helmet>
      <div className="min-h-screen bg-background">
        <Header onMenuToggle={handleSidebarToggle} isSidebarOpen={isSidebarOpen} />
        <Sidebar isOpen={isSidebarOpen} onClose={handleSidebarClose} />
        
        <main className="lg:ml-64 pt-16">
          <div className="p-4 lg:p-8">
            {/* Page Header */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="mb-8"
            >
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                <div>
                  <h1 className="text-3xl font-bold text-foreground">Reports & Analytics</h1>
                  <p className="text-muted-foreground mt-2">
                    Comprehensive sales insights and performance metrics
                  </p>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
                    <span>Live data</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Filter Controls */}
            <FilterControls onFiltersChange={handleFiltersChange} isLoading={isLoading} />

            {/* Key Metrics Cards */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8"
            >
              {metricsData?.map((metric, index) => (
                <MetricsCard
                  key={metric?.title}
                  title={metric?.title}
                  value={metric?.value}
                  change={metric?.change}
                  changeType={metric?.changeType}
                  icon={metric?.icon}
                  iconColor={metric?.iconColor}
                  description={metric?.description}
                />
              ))}
            </motion.div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-8">
              {/* Conversion Funnel */}
              <ConversionFunnelChart />
              
              {/* Win Rate Analytics */}
              <WinRateChart />
            </div>

            {/* Revenue Forecasting - Full Width */}
            <div className="mb-8">
              <RevenueChart />
            </div>

            {/* Export Controls */}
            <ExportControls />

            {/* Additional Insights */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="mt-8 bg-card border border-border rounded-xl p-6"
            >
              <h3 className="text-lg font-semibold text-foreground mb-4">Key Insights</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <h4 className="font-medium text-foreground">Top Performing Month</h4>
                  <p className="text-sm text-muted-foreground">
                    October 2024 achieved the highest win rate at 81% with 54 deals closed
                  </p>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium text-foreground">Revenue Trend</h4>
                  <p className="text-sm text-muted-foreground">
                    Revenue is tracking 97% to target with strong Q4 forecast of $635K
                  </p>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium text-foreground">Conversion Opportunity</h4>
                  <p className="text-sm text-muted-foreground">
                    Improving proposal to negotiation conversion could add $50K monthly
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </main>
      </div>
    </>
  );
};

export default Reports;