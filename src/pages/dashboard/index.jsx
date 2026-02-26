import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Header from '../../components/ui/Header';
import Sidebar from '../../components/ui/Sidebar';
import KPICard from './components/KPICard';
import PipelineChart from './components/PipelineChart';
import RecentActivities from './components/RecentActivities';
import RightRail from './components/RightRail';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

const Dashboard = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [kpis, setKpis] = useState(null);
  const [kpiLoading, setKpiLoading] = useState(true);
  const { userProfile } = useAuth();
  const isAdmin = userProfile?.role === 'admin';

  const handleMenuToggle = () => setIsSidebarOpen(prev => !prev);
  const handleSidebarClose = () => setIsSidebarOpen(false);

  useEffect(() => {
    const handleEscape = (e) => { if (e?.key === 'Escape') setIsSidebarOpen(false); };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  useEffect(() => {
    fetchKpis();
  }, [userProfile]);

  const fetchKpis = async () => {
    try {
      setKpiLoading(true);
      const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
      const today = new Date().toISOString().split('T')[0];
      const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];

      // Build submissions query — recruiters see only their own
      let submissionsQuery = supabase.from('submissions')
        .select('id', { count: 'exact', head: true })
        .gte('submission_date', startOfMonth);
      if (!isAdmin && userProfile?.id) {
        submissionsQuery = submissionsQuery.eq('submission_owner', userProfile.id);
      }

      const [candidatesRes, activePlacementsRes, thisMonthPlacementsRes, submissionsRes, interviewsRes, pipelineRes] = await Promise.all([
        supabase.from('candidates').select('id', { count: 'exact', head: true }).eq('status', 'in_market'),
        supabase.from('placements').select('bill_rate, pay_rate, duration_months').eq('status', 'active'),
        supabase.from('placements').select('id', { count: 'exact', head: true }).gte('start_date', startOfMonth),
        submissionsQuery,
        supabase.from('interviews').select('id', { count: 'exact', head: true }).gte('interview_date', today).lte('interview_date', nextWeek),
        supabase.from('deals').select('value').in('stage', ['new', 'qualified', 'proposal']),
      ]);

      const activePlacements = activePlacementsRes.data || [];
      const totalRevenue = activePlacements.reduce((sum, p) =>
        sum + ((p.bill_rate - p.pay_rate) * (p.duration_months || 1) * 160), 0);
      const pipelineValue = (pipelineRes.data || []).reduce((sum, d) => sum + (d.value || 0), 0);

      setKpis({
        candidatesInMarket: candidatesRes.count || 0,
        activePlacements: activePlacements.length,
        placementsThisMonth: thisMonthPlacementsRes.count || 0,
        submissionsThisMonth: submissionsRes.count || 0,
        interviewsThisWeek: interviewsRes.count || 0,
        totalRevenue,
        pipelineValue,
      });
    } catch (error) {
      console.error('Dashboard KPI fetch error:', error);
    } finally {
      setKpiLoading(false);
    }
  };

  const formatCurrency = (n) => {
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
    return `$${n.toFixed(0)}`;
  };

  const kpiData = kpis ? [
    {
      title: 'Candidates In Market',
      value: kpis.candidatesInMarket.toString(),
      change: 'Active & available',
      changeType: 'neutral',
      icon: 'Users',
      iconBg: 'bg-blue-100',
      iconColor: '#3B82F6'
    },
    {
      title: 'Active Placements',
      value: kpis.activePlacements.toString(),
      change: `${kpis.placementsThisMonth} added this month`,
      changeType: 'positive',
      icon: 'Briefcase',
      iconBg: 'bg-green-100',
      iconColor: '#10B981'
    },
    {
      title: 'Revenue (Active)',
      value: formatCurrency(kpis.totalRevenue),
      change: 'From active placements',
      changeType: 'positive',
      icon: 'DollarSign',
      iconBg: 'bg-yellow-100',
      iconColor: '#F59E0B'
    },
    {
      title: 'Submissions This Month',
      value: kpis.submissionsThisMonth.toString(),
      change: `${kpis.interviewsThisWeek} interviews this week`,
      changeType: 'neutral',
      icon: 'Send',
      iconBg: 'bg-purple-100',
      iconColor: '#8B5CF6'
    },
    ...(isAdmin ? [{
      title: 'Pipeline Value',
      value: formatCurrency(kpis.pipelineValue),
      change: 'Open deals (new→proposal)',
      changeType: 'positive',
      icon: 'Target',
      iconBg: 'bg-pink-100',
      iconColor: '#EC4899'
    }] : []),
  ] : [];

  return (
    <div className="min-h-screen bg-background">
      <Header onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)} isSidebarOpen={isSidebarOpen} />
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <main className="lg:ml-64 pt-16">
        <div className="flex">
          {/* Main Content */}
          <div className="flex-1 p-4 lg:p-6 xl:pr-0">
            <motion.div
              initial={kpis ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
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
              {kpiLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="bg-card border border-border rounded-xl p-6 animate-pulse">
                      <div className="h-4 bg-muted rounded w-2/3 mb-3" />
                      <div className="h-8 bg-muted rounded w-1/2" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
                  {kpiData?.map((kpi, index) => (
                    <motion.div key={index} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: index * 0.1 }}>
                      <KPICard {...kpi} />
                    </motion.div>
                  ))}
                </div>
              )}

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