import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Header from '../../components/ui/Header';
import Sidebar from '../../components/ui/Sidebar';
import Icon from '../../components/AppIcon';
import { supabase } from '../../lib/supabase';

const Compliance = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchForms();
  }, []);

  const fetchForms = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase?.from('compliance_forms')?.select(`
          *,
          candidate:candidates(first_name, last_name, email),
          verified_by_user:user_profiles!verified_by(full_name)
        `)?.order('generated_date', { ascending: false });

      if (error) throw error;
      setForms(data || []);
    } catch (error) {
      console.error('Error fetching compliance forms:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFormTypeColor = (type) => {
    const colors = {
      'i9': 'bg-blue-100 text-blue-700',
      'w2': 'bg-green-100 text-green-700',
      'everify': 'bg-purple-100 text-purple-700',
      'onboarding': 'bg-orange-100 text-orange-700'
    };
    return colors?.[type] || 'bg-gray-100 text-gray-700';
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
              <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">Compliance & Forms</h1>
              <p className="text-muted-foreground">Manage I-9, E-Verify, W-2, and onboarding documents</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-6">
              <div className="bg-card p-6 rounded-xl border border-border">
                <p className="text-sm text-muted-foreground mb-1">Total Forms</p>
                <p className="text-3xl font-bold text-foreground">{forms?.length}</p>
              </div>
              <div className="bg-card p-6 rounded-xl border border-border">
                <p className="text-sm text-muted-foreground mb-1">I-9 Forms</p>
                <p className="text-3xl font-bold text-blue-600">
                  {forms?.filter(f => f?.form_type === 'i9')?.length}
                </p>
              </div>
              <div className="bg-card p-6 rounded-xl border border-border">
                <p className="text-sm text-muted-foreground mb-1">E-Verify</p>
                <p className="text-3xl font-bold text-purple-600">
                  {forms?.filter(f => f?.form_type === 'everify')?.length}
                </p>
              </div>
              <div className="bg-card p-6 rounded-xl border border-border">
                <p className="text-sm text-muted-foreground mb-1">W-2 Forms</p>
                <p className="text-3xl font-bold text-green-600">
                  {forms?.filter(f => f?.form_type === 'w2')?.length}
                </p>
              </div>
              <div className="bg-card p-6 rounded-xl border border-border">
                <p className="text-sm text-muted-foreground mb-1">Verified</p>
                <p className="text-3xl font-bold text-success">
                  {forms?.filter(f => f?.is_verified)?.length}
                </p>
              </div>
            </div>

            {/* Forms Table */}
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              {loading ? (
                <div className="p-12 text-center">
                  <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading compliance forms...</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/50 border-b border-border">
                      <tr>
                        <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Candidate</th>
                        <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Form Type</th>
                        <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Generated Date</th>
                        <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Verified By</th>
                        <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Verified Date</th>
                        <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Status</th>
                        <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Document</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {forms?.map((form) => (
                        <tr key={form?.id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-6 py-4">
                            <div>
                              <p className="font-medium text-foreground">
                                {form?.candidate?.first_name} {form?.candidate?.last_name}
                              </p>
                              <p className="text-sm text-muted-foreground">{form?.candidate?.email}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getFormTypeColor(form?.form_type)}`}>
                              {form?.form_type?.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-foreground">
                            {form?.generated_date ? new Date(form?.generated_date)?.toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="px-6 py-4 text-sm text-foreground">
                            {form?.verified_by_user?.full_name || 'N/A'}
                          </td>
                          <td className="px-6 py-4 text-sm text-foreground">
                            {form?.verified_date ? new Date(form?.verified_date)?.toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="px-6 py-4">
                            {form?.is_verified ? (
                              <span className="flex items-center text-success">
                                <Icon name="CheckCircle" size={16} className="mr-1" />
                                Verified
                              </span>
                            ) : (
                              <span className="flex items-center text-warning">
                                <Icon name="Clock" size={16} className="mr-1" />
                                Pending
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            {form?.document_url ? (
                              <button className="text-primary hover:text-primary/80 flex items-center">
                                <Icon name="Download" size={16} className="mr-1" />
                                Download
                              </button>
                            ) : (
                              <span className="text-muted-foreground text-sm">N/A</span>
                            )}
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

export default Compliance;