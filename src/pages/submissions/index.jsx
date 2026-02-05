import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Header from '../../components/ui/Header';
import Sidebar from '../../components/ui/Sidebar';

import { supabase } from '../../lib/supabase';

const Submissions = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase?.from('submissions')?.select(`
          *,
          candidate:candidates(first_name, last_name, email),
          vendor:vendors(name, tier),
          sales_person:user_profiles!sales_person_id(full_name)
        `)?.order('submission_date', { ascending: false });

      if (error) throw error;
      setSubmissions(data || []);
    } catch (error) {
      console.error('Error fetching submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'submitted': 'bg-blue-100 text-blue-700',
      'shortlisted': 'bg-yellow-100 text-yellow-700',
      'rejected': 'bg-red-100 text-red-700',
      'interview_scheduled': 'bg-purple-100 text-purple-700',
      'selected': 'bg-green-100 text-green-700'
    };
    return colors?.[status] || 'bg-gray-100 text-gray-700';
  };

  const getTierColor = (tier) => {
    const colors = {
      'tier_1': 'bg-emerald-100 text-emerald-700',
      'tier_2': 'bg-blue-100 text-blue-700',
      'tier_3': 'bg-orange-100 text-orange-700',
      'direct_client': 'bg-purple-100 text-purple-700'
    };
    return colors?.[tier] || 'bg-gray-100 text-gray-700';
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
              <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">Submission Management</h1>
              <p className="text-muted-foreground">Track candidate submissions to vendors and clients</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-6">
              <div className="bg-card p-6 rounded-xl border border-border">
                <p className="text-sm text-muted-foreground mb-1">Total</p>
                <p className="text-3xl font-bold text-foreground">{submissions?.length}</p>
              </div>
              <div className="bg-card p-6 rounded-xl border border-border">
                <p className="text-sm text-muted-foreground mb-1">Submitted</p>
                <p className="text-3xl font-bold text-blue-600">
                  {submissions?.filter(s => s?.status === 'submitted')?.length}
                </p>
              </div>
              <div className="bg-card p-6 rounded-xl border border-border">
                <p className="text-sm text-muted-foreground mb-1">Shortlisted</p>
                <p className="text-3xl font-bold text-yellow-600">
                  {submissions?.filter(s => s?.status === 'shortlisted')?.length}
                </p>
              </div>
              <div className="bg-card p-6 rounded-xl border border-border">
                <p className="text-sm text-muted-foreground mb-1">Interview</p>
                <p className="text-3xl font-bold text-purple-600">
                  {submissions?.filter(s => s?.status === 'interview_scheduled')?.length}
                </p>
              </div>
              <div className="bg-card p-6 rounded-xl border border-border">
                <p className="text-sm text-muted-foreground mb-1">Selected</p>
                <p className="text-3xl font-bold text-green-600">
                  {submissions?.filter(s => s?.status === 'selected')?.length}
                </p>
              </div>
            </div>

            {/* Submissions Table */}
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              {loading ? (
                <div className="p-12 text-center">
                  <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading submissions...</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/50 border-b border-border">
                      <tr>
                        <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Candidate</th>
                        <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Job Title</th>
                        <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Vendor</th>
                        <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Tier</th>
                        <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Rate</th>
                        <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Status</th>
                        <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Sales Person</th>
                        <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {submissions?.map((submission) => (
                        <tr key={submission?.id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-6 py-4">
                            <div>
                              <p className="font-medium text-foreground">
                                {submission?.candidate?.first_name} {submission?.candidate?.last_name}
                              </p>
                              <p className="text-sm text-muted-foreground">{submission?.candidate?.email}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-foreground">{submission?.job_title}</td>
                          <td className="px-6 py-4 text-sm text-foreground">{submission?.vendor?.name}</td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getTierColor(submission?.vendor?.tier)}`}>
                              {submission?.vendor?.tier?.replace('_', ' ')?.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm font-medium text-foreground">
                            ${submission?.rate}/hr
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(submission?.status)}`}>
                              {submission?.status?.replace('_', ' ')?.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-foreground">
                            {submission?.sales_person?.full_name || 'N/A'}
                          </td>
                          <td className="px-6 py-4 text-sm text-muted-foreground">
                            {new Date(submission?.submission_date)?.toLocaleDateString()}
                          </td>
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

export default Submissions;