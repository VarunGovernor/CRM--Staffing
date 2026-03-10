import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Header from '../../components/ui/Header';
import Sidebar from '../../components/ui/Sidebar';
import KPICard from './components/KPICard';
import PipelineChart from './components/PipelineChart';
import RecentActivities from './components/RecentActivities';
import RightRail from './components/RightRail';
import Icon from '../../components/AppIcon';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

const fmtDate = (d) => d.toISOString().split('T')[0];
const todayDate = () => new Date();
const monthStart = () => new Date(todayDate().getFullYear(), todayDate().getMonth(), 1);

const Dashboard = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [kpis, setKpis] = useState(null);
  const [kpiLoading, setKpiLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    start: fmtDate(monthStart()),
    end: fmtDate(todayDate()),
  });
  const { userProfile } = useAuth();
  const isAdmin = userProfile?.role === 'admin';

  useEffect(() => {
    const handleEscape = (e) => { if (e?.key === 'Escape') setIsSidebarOpen(false); };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  useEffect(() => {
    if (userProfile !== undefined) fetchKpis();
  }, [userProfile, dateRange]);

  const getPreviousPeriod = (start, end) => {
    const s = new Date(start);
    const e = new Date(end);
    const diffMs = e.getTime() - s.getTime();
    const prevEnd = new Date(s.getTime() - 86400000);
    const prevStart = new Date(prevEnd.getTime() - diffMs);
    return { start: fmtDate(prevStart), end: fmtDate(prevEnd) };
  };

  const calcTrend = (curr, prev) => {
    if (prev === 0) return curr > 0 ? 100 : null;
    return ((curr - prev) / prev) * 100;
  };

  const fetchKpis = async () => {
    try {
      setKpiLoading(true);
      const { start, end } = dateRange;
      const prev = getPreviousPeriod(start, end);
      const next30 = fmtDate(new Date(Date.now() + 30 * 86400000));
      const ownerId = !isAdmin && userProfile?.id ? userProfile.id : null;
      const withOwner = (q) => ownerId ? q.eq('submission_owner', ownerId) : q;

      const [
        subsCurr, subsPrev,
        intCurr, intPrev,
        placeCurr, placePrev,
        activePlacementsRes,
        upcomingRes,
        bgcRes,
        pipelineRes,
      ] = await Promise.all([
        // Submissions current
        withOwner(supabase.from('submissions')
          .select('id', { count: 'exact', head: true })
          .gte('submission_date', start).lte('submission_date', end)),
        // Submissions previous
        withOwner(supabase.from('submissions')
          .select('id', { count: 'exact', head: true })
          .gte('submission_date', prev.start).lte('submission_date', prev.end)),
        // Interviews current
        supabase.from('interviews')
          .select('id', { count: 'exact', head: true })
          .gte('interview_date', start).lte('interview_date', end),
        // Interviews previous
        supabase.from('interviews')
          .select('id', { count: 'exact', head: true })
          .gte('interview_date', prev.start).lte('interview_date', prev.end),
        // Placements current (by start_date)
        supabase.from('placements')
          .select('id', { count: 'exact', head: true })
          .gte('start_date', start).lte('start_date', end),
        // Placements previous
        supabase.from('placements')
          .select('id', { count: 'exact', head: true })
          .gte('start_date', prev.start).lte('start_date', prev.end),
        // Active placements for revenue
        supabase.from('placements')
          .select('bill_rate, pay_rate, duration_months')
          .eq('status', 'active'),
        // Upcoming start dates (next 30 days)
        supabase.from('placements')
          .select('id', { count: 'exact', head: true })
          .gte('start_date', fmtDate(todayDate())).lte('start_date', next30),
        // BGC Initiated
        supabase.from('placements')
          .select('id', { count: 'exact', head: true })
          .eq('bgc_status', 'initiated'),
        // Pipeline value
        supabase.from('deals')
          .select('value')
          .in('stage', ['new', 'qualified', 'proposal']),
      ]);

      const submissionsCurr = subsCurr.count || 0;
      const submissionsPrev = subsPrev.count || 0;
      const interviewsCurr = intCurr.count || 0;
      const interviewsPrev = intPrev.count || 0;
      const placementsCurr = placeCurr.count || 0;
      const placementsPrev = placePrev.count || 0;

      // Conversion rate %
      const rateCurr = submissionsCurr > 0 ? (interviewsCurr / submissionsCurr * 100) : 0;
      const ratePrev = submissionsPrev > 0 ? (interviewsPrev / submissionsPrev * 100) : 0;

      const activePlacements = activePlacementsRes.data || [];
      const totalRevenue = activePlacements.reduce((sum, p) =>
        sum + ((p.bill_rate - p.pay_rate) * (p.duration_months || 1) * 160), 0);
      const pipelineValue = (pipelineRes.data || []).reduce((sum, d) => sum + (d.value || 0), 0);

      setKpis({
        submissions: { curr: submissionsCurr, trend: calcTrend(submissionsCurr, submissionsPrev) },
        interviews:  { curr: interviewsCurr,  trend: calcTrend(interviewsCurr,  interviewsPrev)  },
        rate:        { curr: rateCurr,         trend: calcTrend(rateCurr,         ratePrev)        },
        placements:  { curr: placementsCurr,   trend: calcTrend(placementsCurr,   placementsPrev)  },
        upcomingStarts: upcomingRes.count || 0,
        bgcInitiated:   bgcRes.count || 0,
        revenue:        totalRevenue,
        pipeline:       pipelineValue,
      });
    } catch (error) {
      console.error('Dashboard KPI fetch error:', error);
    } finally {
      setKpiLoading(false);
    }
  };

  const fmtCurrency = (n) => {
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
    return `$${n.toFixed(0)}`;
  };

  const kpiData = kpis ? [
    {
      title: 'Submissions',
      value: kpis.submissions.curr.toString(),
      icon: 'Send',
      iconBg: 'bg-blue-100',
      iconColor: '#3B82F6',
      trendPercent: kpis.submissions.trend,
    },
    {
      title: 'Interviews',
      value: kpis.interviews.curr.toString(),
      icon: 'MessageSquare',
      iconBg: 'bg-indigo-100',
      iconColor: '#6366F1',
      trendPercent: kpis.interviews.trend,
    },
    {
      title: 'Conversion Rate',
      value: `${kpis.rate.curr.toFixed(1)}%`,
      icon: 'TrendingUp',
      iconBg: 'bg-emerald-100',
      iconColor: '#10B981',
      trendPercent: kpis.rate.trend,
    },
    {
      title: 'Placements This Period',
      value: kpis.placements.curr.toString(),
      icon: 'Briefcase',
      iconBg: 'bg-green-100',
      iconColor: '#22C55E',
      trendPercent: kpis.placements.trend,
    },
    {
      title: 'Upcoming Start Dates',
      value: kpis.upcomingStarts.toString(),
      change: 'Next 30 days',
      changeType: 'neutral',
      icon: 'Calendar',
      iconBg: 'bg-purple-100',
      iconColor: '#8B5CF6',
    },
    {
      title: 'BGC Pending',
      value: kpis.bgcInitiated.toString(),
      change: 'Initiated / in progress',
      changeType: kpis.bgcInitiated > 0 ? 'negative' : 'positive',
      icon: 'Shield',
      iconBg: 'bg-orange-100',
      iconColor: '#F97316',
    },
    ...(isAdmin ? [
      {
        title: 'Revenue (Active)',
        value: fmtCurrency(kpis.revenue),
        change: 'From active placements',
        changeType: 'positive',
        icon: 'DollarSign',
        iconBg: 'bg-yellow-100',
        iconColor: '#F59E0B',
      },
      {
        title: 'Pipeline Value',
        value: fmtCurrency(kpis.pipeline),
        change: 'Open deals',
        changeType: 'positive',
        icon: 'Target',
        iconBg: 'bg-pink-100',
        iconColor: '#EC4899',
      },
    ] : []),
  ] : [];

  const skeletonCount = isAdmin ? 8 : 6;

  return (
    <div className="min-h-screen bg-background">
      <Header onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)} isSidebarOpen={isSidebarOpen} />
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <main className="lg:ml-64 pt-16">
        <div className="flex">
          <div className="flex-1 p-4 lg:p-6 xl:pr-0">
            <motion.div
              initial={kpis ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {/* Page Header + Date Range */}
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-8 gap-4">
                <div>
                  <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-1">Dashboard</h1>
                  <p className="text-muted-foreground text-sm">
                    Performance overview — comparing selected period vs previous period
                  </p>
                </div>

                {/* Calendar Range Picker */}
                <div className="flex items-center gap-2 bg-card border border-border rounded-xl px-4 py-2.5 self-start">
                  <Icon name="Calendar" size={16} className="text-muted-foreground flex-shrink-0" />
                  <input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                    className="text-sm bg-transparent text-foreground focus:outline-none cursor-pointer"
                  />
                  <span className="text-muted-foreground text-sm">→</span>
                  <input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                    className="text-sm bg-transparent text-foreground focus:outline-none cursor-pointer"
                  />
                </div>
              </div>

              {/* KPI Cards */}
              {kpiLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
                  {[...Array(skeletonCount)].map((_, i) => (
                    <div key={i} className="bg-card border border-border rounded-xl p-6 animate-pulse">
                      <div className="h-4 bg-muted rounded w-2/3 mb-3" />
                      <div className="h-8 bg-muted rounded w-1/2 mb-3" />
                      <div className="h-4 bg-muted rounded w-3/4" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
                  {kpiData.map((kpi, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.07 }}
                    >
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
