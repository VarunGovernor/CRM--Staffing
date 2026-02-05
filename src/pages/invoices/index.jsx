import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Header from '../../components/ui/Header';
import Sidebar from '../../components/ui/Sidebar';

import { supabase } from '../../lib/supabase';

const Invoices = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase?.from('invoices')?.select(`
          *,
          candidate:candidates(first_name, last_name),
          placement:placements(job_title, client_name),
          created_by_user:user_profiles!created_by(full_name)
        `)?.order('invoice_date', { ascending: false });

      if (error) throw error;
      setInvoices(data || []);
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'draft': 'bg-gray-100 text-gray-700',
      'pending': 'bg-yellow-100 text-yellow-700',
      'paid': 'bg-green-100 text-green-700',
      'overdue': 'bg-red-100 text-red-700',
      'cancelled': 'bg-red-100 text-red-700'
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
              <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">Invoicing & Timesheets</h1>
              <p className="text-muted-foreground">Manage payroll, invoices, and timesheets</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-6">
              <div className="bg-card p-6 rounded-xl border border-border">
                <p className="text-sm text-muted-foreground mb-1">Total Invoices</p>
                <p className="text-3xl font-bold text-foreground">{invoices?.length}</p>
              </div>
              <div className="bg-card p-6 rounded-xl border border-border">
                <p className="text-sm text-muted-foreground mb-1">Paid</p>
                <p className="text-3xl font-bold text-green-600">
                  {invoices?.filter(i => i?.status === 'paid')?.length}
                </p>
              </div>
              <div className="bg-card p-6 rounded-xl border border-border">
                <p className="text-sm text-muted-foreground mb-1">Pending</p>
                <p className="text-3xl font-bold text-yellow-600">
                  {invoices?.filter(i => i?.status === 'pending')?.length}
                </p>
              </div>
              <div className="bg-card p-6 rounded-xl border border-border">
                <p className="text-sm text-muted-foreground mb-1">Overdue</p>
                <p className="text-3xl font-bold text-red-600">
                  {invoices?.filter(i => i?.status === 'overdue')?.length}
                </p>
              </div>
              <div className="bg-card p-6 rounded-xl border border-border">
                <p className="text-sm text-muted-foreground mb-1">Total Amount</p>
                <p className="text-3xl font-bold text-primary">
                  ${invoices?.reduce((sum, i) => sum + (i?.net_pay || 0), 0)?.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Invoices Table */}
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              {loading ? (
                <div className="p-12 text-center">
                  <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading invoices...</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/50 border-b border-border">
                      <tr>
                        <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Invoice #</th>
                        <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Candidate</th>
                        <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Job Title</th>
                        <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Period</th>
                        <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Hours</th>
                        <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Gross</th>
                        <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Deductions</th>
                        <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Net Pay</th>
                        <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Status</th>
                        <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {invoices?.map((invoice) => (
                        <tr key={invoice?.id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-6 py-4 font-medium text-foreground">
                            {invoice?.invoice_number}
                          </td>
                          <td className="px-6 py-4">
                            <p className="font-medium text-foreground">
                              {invoice?.candidate?.first_name} {invoice?.candidate?.last_name}
                            </p>
                          </td>
                          <td className="px-6 py-4 text-sm text-foreground">
                            {invoice?.placement?.job_title || 'N/A'}
                          </td>
                          <td className="px-6 py-4">
                            <div>
                              <p className="text-sm text-foreground">
                                {new Date(invoice?.period_start)?.toLocaleDateString()}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                to {new Date(invoice?.period_end)?.toLocaleDateString()}
                              </p>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-foreground">
                            {invoice?.hours_worked} hrs
                          </td>
                          <td className="px-6 py-4 text-sm font-medium text-foreground">
                            ${invoice?.gross_earnings?.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-sm text-red-600">
                            -${invoice?.deductions?.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-sm font-bold text-success">
                            ${invoice?.net_pay?.toLocaleString()}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(invoice?.status)}`}>
                              {invoice?.status?.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-muted-foreground">
                            {new Date(invoice?.invoice_date)?.toLocaleDateString()}
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

export default Invoices;