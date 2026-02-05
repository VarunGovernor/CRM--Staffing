import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Header from '../../components/ui/Header';
import Sidebar from '../../components/ui/Sidebar';

import { supabase } from '../../lib/supabase';

const Placements = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [placements, setPlacements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlacements();
  }, []);

  const fetchPlacements = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase?.from('placements')?.select(`
          *,
          candidate:candidates(first_name, last_name, email),
          vendor:vendors(name, tier)
        `)?.order('start_date', { ascending: false });

      if (error) throw error;
      setPlacements(data || []);
    } catch (error) {
      console.error('Error fetching placements:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'active': 'bg-green-100 text-green-700',
      'completed': 'bg-blue-100 text-blue-700',
      'terminated': 'bg-red-100 text-red-700',
      'extended': 'bg-purple-100 text-purple-700'
    };
    return colors?.[status] || 'bg-gray-100 text-gray-700';
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
              <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">Placement Management</h1>
              <p className="text-muted-foreground">Track active placements and client engagements</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <div className="bg-card p-6 rounded-xl border border-border">
                <p className="text-sm text-muted-foreground mb-1">Total Placements</p>
                <p className="text-3xl font-bold text-foreground">{placements?.length}</p>
              </div>
              <div className="bg-card p-6 rounded-xl border border-border">
                <p className="text-sm text-muted-foreground mb-1">Active</p>
                <p className="text-3xl font-bold text-green-600">
                  {placements?.filter(p => p?.status === 'active')?.length}
                </p>
              </div>
              <div className="bg-card p-6 rounded-xl border border-border">
                <p className="text-sm text-muted-foreground mb-1">Completed</p>
                <p className="text-3xl font-bold text-blue-600">
                  {placements?.filter(p => p?.status === 'completed')?.length}
                </p>
              </div>
              <div className="bg-card p-6 rounded-xl border border-border">
                <p className="text-sm text-muted-foreground mb-1">Total Revenue</p>
                <p className="text-3xl font-bold text-primary">
                  ${placements?.reduce((sum, p) => sum + ((p?.bill_rate - p?.pay_rate) * (p?.duration_months || 0) * 160), 0)?.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Placements Table */}
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              {loading ? (
                <div className="p-12 text-center">
                  <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading placements...</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/50 border-b border-border">
                      <tr>
                        <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Candidate</th>
                        <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Job Title</th>
                        <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Client</th>
                        <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Vendor</th>
                        <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Duration</th>
                        <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Bill Rate</th>
                        <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Pay Rate</th>
                        <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Margin</th>
                        <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Status</th>
                        <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Location</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {placements?.map((placement) => (
                        <tr key={placement?.id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-6 py-4">
                            <div>
                              <p className="font-medium text-foreground">
                                {placement?.candidate?.first_name} {placement?.candidate?.last_name}
                              </p>
                              <p className="text-sm text-muted-foreground">{placement?.candidate?.email}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-foreground">{placement?.job_title}</td>
                          <td className="px-6 py-4 text-sm text-foreground">{placement?.client_name}</td>
                          <td className="px-6 py-4 text-sm text-foreground">{placement?.vendor?.name}</td>
                          <td className="px-6 py-4">
                            <div>
                              <p className="text-sm font-medium text-foreground">{placement?.duration_months} months</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(placement?.start_date)?.toLocaleDateString()} - {placement?.end_date ? new Date(placement?.end_date)?.toLocaleDateString() : 'Ongoing'}
                              </p>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm font-medium text-foreground">
                            ${placement?.bill_rate}/hr
                          </td>
                          <td className="px-6 py-4 text-sm font-medium text-foreground">
                            ${placement?.pay_rate}/hr
                          </td>
                          <td className="px-6 py-4 text-sm font-medium text-success">
                            ${(placement?.bill_rate - placement?.pay_rate)?.toFixed(2)}/hr
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(placement?.status)}`}>
                              {placement?.status?.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-foreground">{placement?.location}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default Placements;