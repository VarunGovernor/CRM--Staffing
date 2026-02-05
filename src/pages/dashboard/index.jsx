import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Header from '../../components/ui/Header';
import Sidebar from '../../components/ui/Sidebar';
import KPICard from './components/KPICard';
import PipelineChart from './components/PipelineChart';
import RecentActivities from './components/RecentActivities';
import RightRail from './components/RightRail';

const Dashboard = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleMenuToggle = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleSidebarClose = () => {
    setIsSidebarOpen(false);
  };

  // Close sidebar on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e?.key === 'Escape') {
        setIsSidebarOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  const kpiData = [
    {
      title: 'Open Deals',
      value: '247',
      change: '+12.5%',
      changeType: 'positive',
      icon: 'Target',
      iconBg: 'bg-blue-100',
      iconColor: '#3B82F6'
    },
    {
      title: 'New Leads',
      value: '89',
      change: '+8.2%',
      changeType: 'positive',
      icon: 'Users',
      iconBg: 'bg-pink-100',
      iconColor: '#EC4899'
    },
    {
      title: 'Forecast Revenue',
      value: '$2.4M',
      change: '+15.3%',
      changeType: 'positive',
      icon: 'DollarSign',
      iconBg: 'bg-yellow-100',
      iconColor: '#F59E0B'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header onMenuToggle={handleMenuToggle} isSidebarOpen={isSidebarOpen} />
      <Sidebar isOpen={isSidebarOpen} onClose={handleSidebarClose} />
      <main className="lg:ml-64 pt-16">
        <div className="flex">
          {/* Main Content */}
          <div className="flex-1 p-4 lg:p-6 xl:pr-0">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              {/* Page Header */}
              <div className="mb-8">
                <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">
                  Dashboard
                </h1>
                <p className="text-muted-foreground">
                  Welcome back! Here's what's happening with your sales pipeline today.
                </p>
              </div>

              {/* KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
                {kpiData?.map((kpi, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    <KPICard {...kpi} />
                  </motion.div>
                ))}
              </div>

              {/* Pipeline Chart */}
              <div className="mb-8">
                <PipelineChart />
              </div>

              {/* Recent Activities */}
              <div className="mb-8">
                <RecentActivities />
              </div>
            </motion.div>
          </div>

          {/* Right Rail */}
          <div className="hidden xl:block w-80 p-6 border-l border-border bg-background">
            <RightRail />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;