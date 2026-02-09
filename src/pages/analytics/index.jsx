import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Header from '../../components/ui/Header';
import Sidebar from '../../components/ui/Sidebar';
import Icon from '../../components/AppIcon';
import { supabase } from '../../lib/supabase';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const Analytics = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [stats, setStats] = useState({
    candidates: 0,
    placements: 0,
    submissions: 0,
    interviews: 0,
    activeVendors: 0,
    invoiceTotal: 0,
    ncaVerified: 0,
    ncaTotal: 0,
    c2cCandidates: 0,
    avgDaysInMarket: 0,
    submissionToInterview: 0,
    interviewToPlacement: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [candidatesByStatus, setCandidatesByStatus] = useState([]);
  const [submissionsBySource, setSubmissionsBySource] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);

      const [
        candidatesRes,
        placementsRes,
        submissionsRes,
        interviewsRes,
        vendorsRes,
        invoicesRes,
        candidatesDataRes,
        submissionsDataRes,
        recentCandidatesRes,
        recentSubmissionsRes,
        recentPlacementsRes
      ] = await Promise.all([
        supabase?.from('candidates')?.select('*', { count: 'exact', head: true }),
        supabase?.from('placements')?.select('*', { count: 'exact', head: true }),
        supabase?.from('submissions')?.select('*', { count: 'exact', head: true }),
        supabase?.from('interviews')?.select('*', { count: 'exact', head: true }),
        supabase?.from('vendors')?.select('*', { count: 'exact', head: true })?.eq('is_active', true),
        supabase?.from('invoices')?.select('total_amount'),
        supabase?.from('candidates')?.select('status, nca_status, deal_type, days_in_market'),
        supabase?.from('submissions')?.select('submission_source, status'),
        supabase?.from('candidates')?.select('full_name, first_name, last_name, email, status, created_at')?.order('created_at', { ascending: false })?.limit(5),
        supabase?.from('submissions')?.select('job_title, status, submission_date, candidate:candidates(full_name, first_name, last_name)')?.order('submission_date', { ascending: false })?.limit(5),
        supabase?.from('placements')?.select('job_title, status, start_date, candidate:candidates(full_name, first_name, last_name)')?.order('created_at', { ascending: false })?.limit(5)
      ]);

      // Compute stats
      const candidatesData = candidatesDataRes?.data || [];
      const submissionsData = submissionsDataRes?.data || [];
      const invoiceData = invoicesRes?.data || [];

      const ncaVerified = candidatesData.filter(c => c.nca_status === 'verified' || c.nca_status === 'uploaded').length;
      const c2cCount = candidatesData.filter(c => c.deal_type === 'c2c').length;
      const daysArr = candidatesData.filter(c => c.days_in_market != null).map(c => c.days_in_market);
      const avgDays = daysArr.length > 0 ? Math.round(daysArr.reduce((a, b) => a + b, 0) / daysArr.length) : 0;

      const totalInvoice = invoiceData.reduce((sum, inv) => sum + (parseFloat(inv.total_amount) || 0), 0);

      const interviewScheduled = submissionsData.filter(s => s.status === 'interview_scheduled' || s.status === 'selected').length;
      const selectedCount = submissionsData.filter(s => s.status === 'selected').length;
      const totalSubs = submissionsData.length;

      setStats({
        candidates: candidatesRes?.count || 0,
        placements: placementsRes?.count || 0,
        submissions: submissionsRes?.count || 0,
        interviews: interviewsRes?.count || 0,
        activeVendors: vendorsRes?.count || 0,
        invoiceTotal: totalInvoice,
        ncaVerified,
        ncaTotal: candidatesData.length,
        c2cCandidates: c2cCount,
        avgDaysInMarket: avgDays,
        submissionToInterview: totalSubs > 0 ? Math.round((interviewScheduled / totalSubs) * 100) : 0,
        interviewToPlacement: interviewScheduled > 0 ? Math.round((selectedCount / interviewScheduled) * 100) : 0
      });

      // Candidate status distribution
      const statusCounts = {};
      candidatesData.forEach(c => {
        const s = c.status || 'unknown';
        statusCounts[s] = (statusCounts[s] || 0) + 1;
      });
      const statusColors = { in_market: '#3B82F6', active: '#10B981', placed: '#8B5CF6', on_hold: '#F59E0B', inactive: '#6B7280' };
      setCandidatesByStatus(Object.entries(statusCounts).map(([name, value]) => ({
        name: name.replace('_', ' '),
        value,
        color: statusColors[name] || '#9CA3AF'
      })));

      // Submissions by source
      const sourceCounts = {};
      submissionsData.forEach(s => {
        const src = s.submission_source || 'direct';
        sourceCounts[src] = (sourceCounts[src] || 0) + 1;
      });
      setSubmissionsBySource(Object.entries(sourceCounts).map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        count: value
      })));

      // Merge recent activity
      const activities = [];
      (recentCandidatesRes?.data || []).forEach(c => {
        activities.push({
          type: 'candidate',
          icon: 'UserPlus',
          color: 'text-blue-600 bg-blue-100',
          title: `New candidate: ${c.full_name || `${c.first_name} ${c.last_name}`}`,
          subtitle: c.email,
          date: c.created_at
        });
      });
      (recentSubmissionsRes?.data || []).forEach(s => {
        const cName = s.candidate?.full_name || `${s.candidate?.first_name} ${s.candidate?.last_name}`;
        activities.push({
          type: 'submission',
          icon: 'Send',
          color: 'text-purple-600 bg-purple-100',
          title: `Submission: ${cName} → ${s.job_title}`,
          subtitle: `Status: ${s.status?.replace('_', ' ')}`,
          date: s.submission_date
        });
      });
      (recentPlacementsRes?.data || []).forEach(p => {
        const cName = p.candidate?.full_name || `${p.candidate?.first_name} ${p.candidate?.last_name}`;
        activities.push({
          type: 'placement',
          icon: 'Briefcase',
          color: 'text-green-600 bg-green-100',
          title: `Placement: ${cName} — ${p.job_title}`,
          subtitle: `Status: ${p.status}`,
          date: p.start_date
        });
      });
      activities.sort((a, b) => new Date(b.date) - new Date(a.date));
      setRecentActivity(activities.slice(0, 10));

    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  // Static chart data (will be replaced with real data in Phase 2)
  const monthlyData = [
    { month: 'Jan', placements: 12, submissions: 45, interviews: 28 },
    { month: 'Feb', placements: 15, submissions: 52, interviews: 35 },
    { month: 'Mar', placements: 18, submissions: 48, interviews: 32 },
    { month: 'Apr', placements: 14, submissions: 55, interviews: 38 },
    { month: 'May', placements: 20, submissions: 60, interviews: 42 },
    { month: 'Jun', placements: 22, submissions: 58, interviews: 40 }
  ];

  const revenueData = [
    { month: 'Jan', revenue: 125000 },
    { month: 'Feb', revenue: 145000 },
    { month: 'Mar', revenue: 165000 },
    { month: 'Apr', revenue: 155000 },
    { month: 'May', revenue: 185000 },
    { month: 'Jun', revenue: 195000 }
  ];

  const recruiterPerformance = [
    { id: 1, name: 'Sarah Johnson', totalCandidates: 89, placements: 34, fillRate: '38%', revenueGenerated: 850000 },
    { id: 2, name: 'Michael Chen', totalCandidates: 76, placements: 28, fillRate: '37%', revenueGenerated: 720000 },
    { id: 3, name: 'Emily Rodriguez', totalCandidates: 52, placements: 19, fillRate: '37%', revenueGenerated: 485000 },
    { id: 4, name: 'David Kim', totalCandidates: 30, placements: 8, fillRate: '27%', revenueGenerated: 210000 }
  ];

  const formatCurrency = (value) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    return `$${value}`;
  };

  return (
    <div className="min-h-screen bg-background">
      <Header onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)} isSidebarOpen={isSidebarOpen} />
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <main className="lg:ml-64 pt-16">
        <div className="p-4 lg:p-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="mb-8">
              <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">Analytics & Reports</h1>
              <p className="text-muted-foreground">Performance metrics, KPIs, and business insights</p>
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (
              <>
                {/* KPI Row 1 — Core Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
                  <div className="bg-card p-5 rounded-xl border border-border">
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Icon name="Users" size={20} className="text-blue-600" />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mb-1">Total Candidates</p>
                    <p className="text-2xl font-bold text-foreground">{stats.candidates}</p>
                  </div>

                  <div className="bg-card p-5 rounded-xl border border-border">
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <Icon name="Briefcase" size={20} className="text-green-600" />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mb-1">Active Placements</p>
                    <p className="text-2xl font-bold text-foreground">{stats.placements}</p>
                  </div>

                  <div className="bg-card p-5 rounded-xl border border-border">
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                        <Icon name="Send" size={20} className="text-purple-600" />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mb-1">Total Submissions</p>
                    <p className="text-2xl font-bold text-foreground">{stats.submissions}</p>
                  </div>

                  <div className="bg-card p-5 rounded-xl border border-border">
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                        <Icon name="Calendar" size={20} className="text-orange-600" />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mb-1">Interviews Scheduled</p>
                    <p className="text-2xl font-bold text-foreground">{stats.interviews}</p>
                  </div>
                </div>

                {/* KPI Row 2 — Business Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
                  <div className="bg-card p-5 rounded-xl border border-border">
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                        <Icon name="Building" size={20} className="text-emerald-600" />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mb-1">Active Vendors</p>
                    <p className="text-2xl font-bold text-foreground">{stats.activeVendors}</p>
                  </div>

                  <div className="bg-card p-5 rounded-xl border border-border">
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                        <Icon name="DollarSign" size={20} className="text-indigo-600" />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mb-1">Invoice Total</p>
                    <p className="text-2xl font-bold text-foreground">{formatCurrency(stats.invoiceTotal)}</p>
                  </div>

                  <div className="bg-card p-5 rounded-xl border border-border">
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-10 h-10 bg-cyan-100 rounded-lg flex items-center justify-center">
                        <Icon name="Clock" size={20} className="text-cyan-600" />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mb-1">Avg Days in Market</p>
                    <p className="text-2xl font-bold text-foreground">{stats.avgDaysInMarket}</p>
                  </div>

                  <div className="bg-card p-5 rounded-xl border border-border">
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center">
                        <Icon name="FileText" size={20} className="text-pink-600" />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mb-1">C2C Candidates</p>
                    <p className="text-2xl font-bold text-foreground">{stats.c2cCandidates}</p>
                  </div>
                </div>

                {/* KPI Row 3 — Conversion & Compliance */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
                  <div className="bg-card p-5 rounded-xl border border-border">
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                        <Icon name="TrendingUp" size={20} className="text-amber-600" />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mb-1">Submission → Interview</p>
                    <p className="text-2xl font-bold text-foreground">{stats.submissionToInterview}%</p>
                  </div>

                  <div className="bg-card p-5 rounded-xl border border-border">
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                        <Icon name="Target" size={20} className="text-teal-600" />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mb-1">Interview → Placement</p>
                    <p className="text-2xl font-bold text-foreground">{stats.interviewToPlacement}%</p>
                  </div>

                  <div className="bg-card p-5 rounded-xl border border-border">
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <Icon name="ShieldCheck" size={20} className="text-green-600" />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mb-1">NCA Compliance Rate</p>
                    <p className="text-2xl font-bold text-foreground">
                      {stats.ncaTotal > 0 ? Math.round((stats.ncaVerified / stats.ncaTotal) * 100) : 0}%
                    </p>
                    <p className="text-xs text-muted-foreground">{stats.ncaVerified}/{stats.ncaTotal} cleared</p>
                  </div>

                  <div className="bg-card p-5 rounded-xl border border-border">
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center">
                        <Icon name="BarChart3" size={20} className="text-violet-600" />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mb-1">Fill Rate</p>
                    <p className="text-2xl font-bold text-foreground">
                      {stats.submissions > 0 ? Math.round((stats.placements / stats.submissions) * 100) : 0}%
                    </p>
                    <p className="text-xs text-muted-foreground">placements/submissions</p>
                  </div>
                </div>

                {/* Charts Row 1 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  {/* Monthly Performance */}
                  <div className="bg-card p-6 rounded-xl border border-border">
                    <h3 className="text-lg font-semibold text-foreground mb-6">Monthly Performance</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={monthlyData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="placements" fill="#10B981" name="Placements" />
                        <Bar dataKey="submissions" fill="#3B82F6" name="Submissions" />
                        <Bar dataKey="interviews" fill="#8B5CF6" name="Interviews" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Candidate Status Distribution */}
                  <div className="bg-card p-6 rounded-xl border border-border">
                    <h3 className="text-lg font-semibold text-foreground mb-6">Candidate Status Distribution</h3>
                    {candidatesByStatus.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={candidatesByStatus}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {candidatesByStatus.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-[300px] text-muted-foreground">No data</div>
                    )}
                  </div>
                </div>

                {/* Charts Row 2 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  {/* Revenue Trend */}
                  <div className="bg-card p-6 rounded-xl border border-border">
                    <h3 className="text-lg font-semibold text-foreground mb-6">Revenue Trend</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={revenueData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis tickFormatter={(v) => formatCurrency(v)} />
                        <Tooltip formatter={(value) => `$${value?.toLocaleString()}`} />
                        <Legend />
                        <Line type="monotone" dataKey="revenue" stroke="#8B5CF6" strokeWidth={2} name="Revenue" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Submissions by Source */}
                  <div className="bg-card p-6 rounded-xl border border-border">
                    <h3 className="text-lg font-semibold text-foreground mb-6">Submissions by Source</h3>
                    {submissionsBySource.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={submissionsBySource}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="count" fill="#6366F1" name="Submissions" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-[300px] text-muted-foreground">No data</div>
                    )}
                  </div>
                </div>

                {/* Recruiter Performance */}
                <div className="bg-card rounded-xl border border-border mb-6">
                  <div className="p-4 border-b border-border">
                    <h3 className="text-lg font-semibold text-foreground">Recruiter Performance</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Recruiter</th>
                          <th className="px-6 py-3 text-center text-sm font-medium text-muted-foreground">Candidates</th>
                          <th className="px-6 py-3 text-center text-sm font-medium text-muted-foreground">Placements</th>
                          <th className="px-6 py-3 text-center text-sm font-medium text-muted-foreground">Fill Rate</th>
                          <th className="px-6 py-3 text-center text-sm font-medium text-muted-foreground">Revenue</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {recruiterPerformance.map((r) => (
                          <tr key={r.id} className="hover:bg-muted/30 transition-colors">
                            <td className="px-6 py-4 font-medium text-primary">{r.name}</td>
                            <td className="px-6 py-4 text-center text-foreground">{r.totalCandidates}</td>
                            <td className="px-6 py-4 text-center text-orange-600 font-medium">{r.placements}</td>
                            <td className="px-6 py-4 text-center text-foreground">{r.fillRate}</td>
                            <td className="px-6 py-4 text-center text-green-600 font-medium">{formatCurrency(r.revenueGenerated)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Recent Activity Feed */}
                <div className="bg-card rounded-xl border border-border">
                  <div className="p-4 border-b border-border flex items-center gap-2">
                    <Icon name="Activity" size={20} className="text-primary" />
                    <h3 className="text-lg font-semibold text-foreground">Recent Activity</h3>
                  </div>
                  <div className="divide-y divide-border">
                    {recentActivity.length > 0 ? (
                      recentActivity.map((activity, idx) => (
                        <div key={idx} className="flex items-start gap-4 p-4 hover:bg-muted/30 transition-colors">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${activity.color}`}>
                            <Icon name={activity.icon} size={18} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{activity.title}</p>
                            <p className="text-xs text-muted-foreground">{activity.subtitle}</p>
                          </div>
                          <p className="text-xs text-muted-foreground shrink-0">
                            {activity.date ? new Date(activity.date).toLocaleDateString() : ''}
                          </p>
                        </div>
                      ))
                    ) : (
                      <div className="p-8 text-center text-muted-foreground">
                        No recent activity
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default Analytics;
