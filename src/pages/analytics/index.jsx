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
    interviews: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);

      const [candidatesRes, placementsRes, submissionsRes, interviewsRes] = await Promise.all([
        supabase?.from('candidates')?.select('*', { count: 'exact', head: true }),
        supabase?.from('placements')?.select('*', { count: 'exact', head: true }),
        supabase?.from('submissions')?.select('*', { count: 'exact', head: true }),
        supabase?.from('interviews')?.select('*', { count: 'exact', head: true })
      ]);

      setStats({
        candidates: candidatesRes?.count || 0,
        placements: placementsRes?.count || 0,
        submissions: submissionsRes?.count || 0,
        interviews: interviewsRes?.count || 0
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const statusData = [
    { name: 'In Market', value: 35, color: '#3B82F6' },
    { name: 'Active', value: 45, color: '#10B981' },
    { name: 'Placed', value: 15, color: '#8B5CF6' },
    { name: 'On Hold', value: 5, color: '#F59E0B' }
  ];

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

  // Recruiter Performance Data
  const recruiterPerformance = [
    { id: 1, name: 'Sarah Johnson', totalCandidates: 89, placements: 34, fillRate: '38%', revenueGenerated: 850000, avgRevenue: 25000 },
    { id: 2, name: 'Michael Chen', totalCandidates: 76, placements: 28, fillRate: '37%', revenueGenerated: 720000, avgRevenue: 26000 },
    { id: 3, name: 'Emily Rodriguez', totalCandidates: 52, placements: 19, fillRate: '37%', revenueGenerated: 485000, avgRevenue: 26000 },
    { id: 4, name: 'David Kim', totalCandidates: 30, placements: 8, fillRate: '27%', revenueGenerated: 210000, avgRevenue: 26000 }
  ];

  // Client Performance Data
  const clientPerformance = [
    { id: 1, client: 'TechCorp International', placements: 45, avgDuration: 9.2 },
    { id: 2, client: 'FinanceHub Inc', placements: 23, avgDuration: 8.5 },
    { id: 3, client: 'HealthTech Solutions', placements: 15, avgDuration: 7.8 },
    { id: 4, client: 'RetailMax Systems', placements: 6, avgDuration: 6.2 }
  ];

  // Top Clients by Revenue Data
  const topClientsRevenue = [
    { name: 'TechCorp International', revenue: 1250000 },
    { name: 'FinanceHub Inc', revenue: 680000 },
    { name: 'HealthTech Solutions', revenue: 420000 },
    { name: 'RetailMax Systems', revenue: 150000 }
  ];

  const formatCurrency = (value) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    }
    return `$${(value / 1000).toFixed(0)}K`;
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
              <p className="text-muted-foreground">Performance metrics and business insights</p>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-card p-6 rounded-xl border border-border">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Icon name="Users" size={24} className="text-blue-600" />
                  </div>
                  <span className="text-sm text-success flex items-center">
                    <Icon name="TrendingUp" size={16} className="mr-1" />
                    +12%
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mb-1">Total Candidates</p>
                <p className="text-3xl font-bold text-foreground">{stats?.candidates}</p>
              </div>

              <div className="bg-card p-6 rounded-xl border border-border">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <Icon name="Briefcase" size={24} className="text-green-600" />
                  </div>
                  <span className="text-sm text-success flex items-center">
                    <Icon name="TrendingUp" size={16} className="mr-1" />
                    +8%
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mb-1">Active Placements</p>
                <p className="text-3xl font-bold text-foreground">{stats?.placements}</p>
              </div>

              <div className="bg-card p-6 rounded-xl border border-border">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Icon name="Target" size={24} className="text-purple-600" />
                  </div>
                  <span className="text-sm text-success flex items-center">
                    <Icon name="TrendingUp" size={16} className="mr-1" />
                    +15%
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mb-1">Submissions</p>
                <p className="text-3xl font-bold text-foreground">{stats?.submissions}</p>
              </div>

              <div className="bg-card p-6 rounded-xl border border-border">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Icon name="Calendar" size={24} className="text-orange-600" />
                  </div>
                  <span className="text-sm text-success flex items-center">
                    <Icon name="TrendingUp" size={16} className="mr-1" />
                    +10%
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mb-1">Interviews</p>
                <p className="text-3xl font-bold text-foreground">{stats?.interviews}</p>
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
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100)?.toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {statusData?.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry?.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Revenue Trend */}
            <div className="bg-card p-6 rounded-xl border border-border mb-6">
              <h3 className="text-lg font-semibold text-foreground mb-6">Revenue Trend</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => `$${value?.toLocaleString()}`} />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" stroke="#8B5CF6" strokeWidth={2} name="Revenue" />
                </LineChart>
              </ResponsiveContainer>
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
                      <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Recruiter Name</th>
                      <th className="px-6 py-3 text-center text-sm font-medium text-muted-foreground">Total Candidates</th>
                      <th className="px-6 py-3 text-center text-sm font-medium text-muted-foreground">Placements</th>
                      <th className="px-6 py-3 text-center text-sm font-medium text-muted-foreground">Fill Rate</th>
                      <th className="px-6 py-3 text-center text-sm font-medium text-muted-foreground">Revenue Generated</th>
                      <th className="px-6 py-3 text-center text-sm font-medium text-muted-foreground">Avg Revenue/Placement</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {recruiterPerformance.map((recruiter) => (
                      <tr key={recruiter.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-6 py-4">
                          <span className="font-medium text-primary">{recruiter.name}</span>
                        </td>
                        <td className="px-6 py-4 text-center text-foreground">{recruiter.totalCandidates}</td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-orange-600 font-medium">{recruiter.placements}</span>
                        </td>
                        <td className="px-6 py-4 text-center text-foreground">{recruiter.fillRate}</td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-green-600 font-medium">${(recruiter.revenueGenerated / 1000).toFixed(0)}K</span>
                        </td>
                        <td className="px-6 py-4 text-center text-foreground">${(recruiter.avgRevenue / 1000).toFixed(0)}K</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Client Performance and Top Clients by Revenue */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Client Performance Metrics */}
              <div className="bg-card rounded-xl border border-border">
                <div className="p-4 border-b border-border">
                  <h3 className="text-lg font-semibold text-foreground">Client Performance Metrics</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Client</th>
                        <th className="px-6 py-3 text-center text-sm font-medium text-muted-foreground">Placements</th>
                        <th className="px-6 py-3 text-center text-sm font-medium text-muted-foreground">Avg Duration (mo)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {clientPerformance.map((client) => (
                        <tr key={client.id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-6 py-4">
                            <span className="font-medium text-primary">{client.client}</span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="text-orange-600 font-medium">{client.placements}</span>
                          </td>
                          <td className="px-6 py-4 text-center text-foreground">{client.avgDuration}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Top Clients by Revenue */}
              <div className="bg-card p-6 rounded-xl border border-border">
                <h3 className="text-lg font-semibold text-foreground mb-6">Top Clients by Revenue</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={topClientsRevenue} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" tickFormatter={(value) => formatCurrency(value)} />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={150}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip formatter={(value) => `$${value?.toLocaleString()}`} />
                    <Bar dataKey="revenue" fill="#3B82F6" name="Revenue" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default Analytics;
