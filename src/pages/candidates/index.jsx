import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import Header from '../../components/ui/Header';
import Sidebar from '../../components/ui/Sidebar';
import Icon from '../../components/AppIcon';

import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useCandidates } from '../../contexts/CandidatesContext';
import CandidateDrawer from './components/CandidateDrawer';
import CandidateForm from './components/CandidateForm';
import Button from '../../components/ui/Button';

const Candidates = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    visaStatus: '',
    location: '',
    recruiter: ''
  });
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCandidate, setEditingCandidate] = useState(null);
  const [recruiters, setRecruiters] = useState([]);
  const { user } = useAuth();
  const { candidates, loading, fetchCandidates } = useCandidates();

  useEffect(() => {
    fetchRecruiters();
  }, []);

  const fetchRecruiters = async () => {
    try {
      const { data, error } = await supabase?.from('user_profiles')?.select('id, full_name')?.eq('role', 'recruiter')?.order('full_name');
      if (error) throw error;
      setRecruiters(data || []);
    } catch (error) {
      console.error('Error fetching recruiters:', error);
    }
  };

  const filteredCandidates = useMemo(() => {
    return candidates?.filter(candidate => {
      const matchesSearch = searchTerm === '' ||
        candidate?.first_name?.toLowerCase()?.includes(searchTerm?.toLowerCase()) ||
        candidate?.last_name?.toLowerCase()?.includes(searchTerm?.toLowerCase()) ||
        candidate?.email?.toLowerCase()?.includes(searchTerm?.toLowerCase());

      const matchesStatus = filters?.status === '' || candidate?.status === filters?.status;
      const matchesVisa = filters?.visaStatus === '' || candidate?.visa_status === filters?.visaStatus;
      const matchesLocation = filters?.location === '' || candidate?.current_location?.toLowerCase()?.includes(filters?.location?.toLowerCase());
      const matchesRecruiter = filters?.recruiter === '' || candidate?.recruiter_id === filters?.recruiter;

      return matchesSearch && matchesStatus && matchesVisa && matchesLocation && matchesRecruiter;
    });
  }, [candidates, searchTerm, filters]);

  const handleCandidateClick = (candidate) => {
    setSelectedCandidate(candidate);
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setTimeout(() => setSelectedCandidate(null), 300);
  };

  const handleAddCandidate = () => {
    setEditingCandidate(null);
    setIsFormOpen(true);
  };

  const handleEditCandidate = (candidate) => {
    setEditingCandidate(candidate);
    setIsFormOpen(true);
    setIsDrawerOpen(false);
  };

  const handleFormSuccess = () => {
    fetchCandidates();
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingCandidate(null);
  };

  const getStatusColor = (status) => {
    const colors = {
      'in_market': 'bg-blue-100 text-blue-700',
      'active': 'bg-green-100 text-green-700',
      'placed': 'bg-purple-100 text-purple-700',
      'on_hold': 'bg-yellow-100 text-yellow-700',
      'inactive': 'bg-gray-100 text-gray-700'
    };
    return colors?.[status] || 'bg-gray-100 text-gray-700';
  };

  const getVisaColor = (visa) => {
    const colors = {
      'us_citizen': 'bg-blue-100 text-blue-700',
      'green_card': 'bg-emerald-100 text-emerald-700',
      'h1b': 'bg-indigo-100 text-indigo-700',
      'h4_ead': 'bg-teal-100 text-teal-700',
      'l1': 'bg-violet-100 text-violet-700',
      'opt': 'bg-orange-100 text-orange-700',
      'cpt': 'bg-pink-100 text-pink-700',
      'tn_visa': 'bg-sky-100 text-sky-700',
      'e3': 'bg-lime-100 text-lime-700',
      'ead': 'bg-cyan-100 text-cyan-700',
      'gc_ead': 'bg-green-100 text-green-700',
      'no_work_auth': 'bg-red-100 text-red-700'
    };
    return colors?.[visa] || 'bg-gray-100 text-gray-700';
  };

  const getVisaLabel = (visa) => {
    const labels = {
      'us_citizen': 'US Citizen',
      'green_card': 'Green Card',
      'h1b': 'H1B',
      'h4_ead': 'H4 EAD',
      'l1': 'L1',
      'opt': 'OPT',
      'cpt': 'CPT',
      'tn_visa': 'TN Visa',
      'e3': 'E3',
      'ead': 'EAD',
      'gc_ead': 'GC EAD',
      'no_work_auth': 'No Work Auth',
      'citizen': 'US Citizen',
    };
    return labels?.[visa] || visa?.replace(/_/g, ' ')?.toUpperCase();
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
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">Candidate Management</h1>
                <p className="text-muted-foreground">Track and manage all candidates in your pipeline</p>
              </div>
              <Button onClick={handleAddCandidate} className="flex items-center gap-2">
                <Icon name="Plus" size={18} />
                Add Candidate
              </Button>
            </div>

            {/* Filters */}
            <div className="bg-card rounded-xl border border-border p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <Input
                  placeholder="Search candidates..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e?.target?.value)}
                  icon="Search"
                />
                <Select
                  value={filters?.status}
                  onChange={(e) => setFilters({ ...filters, status: e?.target?.value })}
                >
                  <option value="">All Status</option>
                  <option value="in_market">In Market</option>
                  <option value="active">Active</option>
                  <option value="placed">Placed</option>
                  <option value="on_hold">On Hold</option>
                  <option value="inactive">Inactive</option>
                </Select>
                <Select
                  value={filters?.visaStatus}
                  onChange={(e) => setFilters({ ...filters, visaStatus: e?.target?.value })}
                >
                  <option value="">All Visa Status</option>
                  <option value="us_citizen">US Citizen</option>
                  <option value="green_card">Green Card (GC)</option>
                  <option value="h1b">H1B</option>
                  <option value="h4_ead">H4 EAD</option>
                  <option value="l1">L1 (L1A/L1B)</option>
                  <option value="opt">OPT</option>
                  <option value="cpt">CPT</option>
                  <option value="tn_visa">TN Visa</option>
                  <option value="e3">E3</option>
                  <option value="ead">EAD</option>
                  <option value="gc_ead">GC EAD</option>
                  <option value="no_work_auth">No Work Authorization</option>
                </Select>
                <Input
                  placeholder="Location..."
                  value={filters?.location}
                  onChange={(e) => setFilters({ ...filters, location: e?.target?.value })}
                />
                <Select
                  value={filters?.recruiter}
                  onChange={(e) => setFilters({ ...filters, recruiter: e?.target?.value })}
                >
                  <option value="">All Recruiters</option>
                  {recruiters?.map((recruiter) => (
                    <option key={recruiter?.id} value={recruiter?.id}>
                      {recruiter?.full_name}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <div className="bg-card p-6 rounded-xl border border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Total Candidates</p>
                    <p className="text-3xl font-bold text-foreground">{candidates?.length}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Icon name="Users" size={24} className="text-blue-600" />
                  </div>
                </div>
              </div>
              <div className="bg-card p-6 rounded-xl border border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Active</p>
                    <p className="text-3xl font-bold text-foreground">
                      {candidates?.filter(c => c?.status === 'active')?.length}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <Icon name="CheckCircle" size={24} className="text-green-600" />
                  </div>
                </div>
              </div>
              <div className="bg-card p-6 rounded-xl border border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Placed</p>
                    <p className="text-3xl font-bold text-foreground">
                      {candidates?.filter(c => c?.status === 'placed')?.length}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Icon name="Briefcase" size={24} className="text-purple-600" />
                  </div>
                </div>
              </div>
              <div className="bg-card p-6 rounded-xl border border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">In Market</p>
                    <p className="text-3xl font-bold text-foreground">
                      {candidates?.filter(c => c?.status === 'in_market')?.length}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Icon name="TrendingUp" size={24} className="text-orange-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Candidates Table */}
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              {loading ? (
                <div className="p-12 text-center">
                  <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading candidates...</p>
                </div>
              ) : filteredCandidates?.length === 0 ? (
                <div className="p-12 text-center">
                  <Icon name="Users" size={48} className="text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No candidates found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/50 border-b border-border">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Name</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Contact</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Skills</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Visa Status</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Status</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Location</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Recruiter</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Days in Market</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filteredCandidates?.map((candidate) => (
                        <tr 
                          key={candidate?.id} 
                          className="hover:bg-muted/30 transition-colors cursor-pointer"
                          onClick={() => handleCandidateClick(candidate)}
                        >
                          <td className="px-6 py-4">
                            <div>
                              <p className="font-medium text-foreground">
                                {candidate?.first_name} {candidate?.last_name}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {candidate?.experience_years} years exp
                              </p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div>
                              <p className="text-sm text-foreground">{candidate?.email}</p>
                              <p className="text-sm text-muted-foreground">{candidate?.phone}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-wrap gap-1">
                              {candidate?.skills?.slice(0, 3)?.map((skill, idx) => (
                                <span key={idx} className="px-2 py-1 bg-muted text-xs rounded">
                                  {skill}
                                </span>
                              ))}
                              {candidate?.skills?.length > 3 && (
                                <span className="px-2 py-1 bg-muted text-xs rounded">
                                  +{candidate?.skills?.length - 3}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getVisaColor(candidate?.visa_status)}`}>
                              {getVisaLabel(candidate?.visa_status)}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(candidate?.status)}`}>
                              {candidate?.status?.replace('_', ' ')?.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-foreground">
                            {candidate?.current_location}
                          </td>
                          <td className="px-6 py-4 text-sm text-foreground">
                            {candidate?.recruiter?.full_name || 'N/A'}
                          </td>
                          <td className="px-6 py-4 text-sm text-foreground">
                            {candidate?.days_in_market} days
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
      {/* Candidate Drawer */}
      <CandidateDrawer
        candidate={selectedCandidate}
        isOpen={isDrawerOpen}
        onClose={handleCloseDrawer}
        onEdit={handleEditCandidate}
      />

      {/* Candidate Form Modal */}
      <CandidateForm
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        candidate={editingCandidate}
        onSuccess={handleFormSuccess}
      />
    </div>
  );
};

export default Candidates;