import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import Header from '../../components/ui/Header';
import Sidebar from '../../components/ui/Sidebar';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import { supabase } from '../../lib/supabase';
import PlacementForm from './components/PlacementForm';

const Placements = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [placements, setPlacements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPlacement, setEditingPlacement] = useState(null);

  const filteredPlacements = useMemo(() => {
    return placements?.filter(p => {
      const candidateName = `${p?.candidate?.first_name || ''} ${p?.candidate?.last_name || ''}`;
      const matchesSearch = searchTerm === '' ||
        candidateName?.toLowerCase()?.includes(searchTerm?.toLowerCase()) ||
        p?.candidate?.email?.toLowerCase()?.includes(searchTerm?.toLowerCase()) ||
        p?.job_title?.toLowerCase()?.includes(searchTerm?.toLowerCase()) ||
        p?.client_name?.toLowerCase()?.includes(searchTerm?.toLowerCase()) ||
        p?.vendor?.name?.toLowerCase()?.includes(searchTerm?.toLowerCase()) ||
        p?.location?.toLowerCase()?.includes(searchTerm?.toLowerCase());
      const matchesStatus = statusFilter === '' || p?.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [placements, searchTerm, statusFilter]);

  useEffect(() => {
    fetchPlacements();
  }, []);

  const handleEdit = (placement) => {
    setEditingPlacement(placement);
    setIsFormOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this placement?')) return;
    const { error } = await supabase.from('placements').delete().eq('id', id);
    if (!error) setPlacements(prev => prev.filter(p => p.id !== id));
  };

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
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">Placement Management</h1>
                <p className="text-muted-foreground">Track active placements and client engagements</p>
              </div>
              <Button onClick={() => { setEditingPlacement(null); setIsFormOpen(true); }} className="flex items-center gap-2">
                <Icon name="Plus" size={18} />
                Add Placement
              </Button>
            </div>

            {/* Filters */}
            <div className="bg-card rounded-xl border border-border p-4 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <Icon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search candidate, job, client, vendor..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                  <option value="">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="terminated">Terminated</option>
                  <option value="extended">Extended</option>
                </select>
              </div>
              {(searchTerm || statusFilter) && (
                <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Showing {filteredPlacements?.length} of {placements?.length} placements</span>
                  <button onClick={() => { setSearchTerm(''); setStatusFilter(''); }} className="text-primary hover:underline ml-2">Clear filters</button>
                </div>
              )}
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
                        <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filteredPlacements?.map((placement) => (
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
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2">
                              <button onClick={() => handleEdit(placement)} className="p-1.5 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-colors" title="Edit">
                                <Icon name="Pencil" size={14} />
                              </button>
                              <button onClick={() => handleDelete(placement?.id)} className="p-1.5 hover:bg-red-50 rounded text-muted-foreground hover:text-red-600 transition-colors" title="Delete">
                                <Icon name="Trash2" size={14} />
                              </button>
                            </div>
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

      <PlacementForm
        isOpen={isFormOpen}
        onClose={() => { setIsFormOpen(false); setEditingPlacement(null); }}
        placement={editingPlacement}
        onSuccess={() => { setIsFormOpen(false); setEditingPlacement(null); fetchPlacements(); }}
      />
    </div>
  );
};

export default Placements;