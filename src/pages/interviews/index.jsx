import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import Header from '../../components/ui/Header';
import Sidebar from '../../components/ui/Sidebar';
import Icon from '../../components/AppIcon';
import { supabase } from '../../lib/supabase';

const Interviews = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [modeFilter, setModeFilter] = useState('');
  const [roundFilter, setRoundFilter] = useState('');

  const filteredInterviews = useMemo(() => {
    return interviews?.filter(i => {
      const candidateName = `${i?.candidate?.first_name || ''} ${i?.candidate?.last_name || ''}`;
      const matchesSearch = searchTerm === '' ||
        candidateName?.toLowerCase()?.includes(searchTerm?.toLowerCase()) ||
        i?.candidate?.email?.toLowerCase()?.includes(searchTerm?.toLowerCase()) ||
        i?.submission?.job_title?.toLowerCase()?.includes(searchTerm?.toLowerCase()) ||
        i?.interviewer_name?.toLowerCase()?.includes(searchTerm?.toLowerCase()) ||
        i?.mentor?.full_name?.toLowerCase()?.includes(searchTerm?.toLowerCase());
      const matchesMode = modeFilter === '' || i?.interview_mode === modeFilter;
      const matchesRound = roundFilter === '' || i?.interview_round === roundFilter;
      return matchesSearch && matchesMode && matchesRound;
    });
  }, [interviews, searchTerm, modeFilter, roundFilter]);

  useEffect(() => {
    fetchInterviews();
  }, []);

  const fetchInterviews = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase?.from('interviews')?.select(`
          *,
          candidate:candidates(first_name, last_name, email),
          submission:submissions(job_title, vendor:vendors(name)),
          mentor:user_profiles!mentor_id(full_name)
        `)?.order('interview_date', { ascending: true });

      if (error) throw error;
      setInterviews(data || []);
    } catch (error) {
      console.error('Error fetching interviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const getModeColor = (mode) => {
    const colors = {
      'phone': 'bg-blue-100 text-blue-700',
      'video': 'bg-purple-100 text-purple-700',
      'in_person': 'bg-green-100 text-green-700',
      'technical': 'bg-orange-100 text-orange-700',
      'hr_round': 'bg-pink-100 text-pink-700'
    };
    return colors?.[mode] || 'bg-gray-100 text-gray-700';
  };

  const getRoundColor = (round) => {
    const colors = {
      'round_1': 'bg-blue-100 text-blue-700',
      'round_2': 'bg-purple-100 text-purple-700',
      'round_3': 'bg-orange-100 text-orange-700',
      'final': 'bg-green-100 text-green-700'
    };
    return colors?.[round] || 'bg-gray-100 text-gray-700';
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
              <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">Interview Management</h1>
              <p className="text-muted-foreground">Schedule and track candidate interviews</p>
            </div>

            {/* Filters */}
            <div className="bg-card rounded-xl border border-border p-4 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                  <Icon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search candidate, job, interviewer..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
                <select
                  value={modeFilter}
                  onChange={(e) => setModeFilter(e.target.value)}
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                  <option value="">All Modes</option>
                  <option value="phone">Phone</option>
                  <option value="video">Video</option>
                  <option value="in_person">In Person</option>
                  <option value="technical">Technical</option>
                  <option value="hr_round">HR Round</option>
                </select>
                <select
                  value={roundFilter}
                  onChange={(e) => setRoundFilter(e.target.value)}
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                  <option value="">All Rounds</option>
                  <option value="round_1">Round 1</option>
                  <option value="round_2">Round 2</option>
                  <option value="round_3">Round 3</option>
                  <option value="final">Final</option>
                </select>
              </div>
              {(searchTerm || modeFilter || roundFilter) && (
                <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Showing {filteredInterviews?.length} of {interviews?.length} interviews</span>
                  <button onClick={() => { setSearchTerm(''); setModeFilter(''); setRoundFilter(''); }} className="text-primary hover:underline ml-2">Clear filters</button>
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <div className="bg-card p-6 rounded-xl border border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Total Interviews</p>
                    <p className="text-3xl font-bold text-foreground">{interviews?.length}</p>
                  </div>
                  <Icon name="Calendar" size={32} className="text-primary" />
                </div>
              </div>
              <div className="bg-card p-6 rounded-xl border border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Upcoming</p>
                    <p className="text-3xl font-bold text-blue-600">
                      {interviews?.filter(i => new Date(i?.interview_date) >= new Date())?.length}
                    </p>
                  </div>
                  <Icon name="Clock" size={32} className="text-blue-600" />
                </div>
              </div>
              <div className="bg-card p-6 rounded-xl border border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Completed</p>
                    <p className="text-3xl font-bold text-green-600">
                      {interviews?.filter(i => new Date(i?.interview_date) < new Date())?.length}
                    </p>
                  </div>
                  <Icon name="CheckCircle" size={32} className="text-green-600" />
                </div>
              </div>
              <div className="bg-card p-6 rounded-xl border border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">This Week</p>
                    <p className="text-3xl font-bold text-purple-600">
                      {interviews?.filter(i => {
                        const date = new Date(i?.interview_date);
                        const now = new Date();
                        const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
                        return date >= now && date <= weekFromNow;
                      })?.length}
                    </p>
                  </div>
                  <Icon name="TrendingUp" size={32} className="text-purple-600" />
                </div>
              </div>
            </div>

            {/* Interviews Table */}
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              {loading ? (
                <div className="p-12 text-center">
                  <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading interviews...</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/50 border-b border-border">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Candidate</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Job Title</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Date & Time</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Mode</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Round</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Mentor</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Interviewer</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filteredInterviews?.map((interview) => (
                        <tr key={interview?.id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-6 py-4">
                            <div>
                              <p className="font-medium text-foreground">
                                {interview?.candidate?.first_name} {interview?.candidate?.last_name}
                              </p>
                              <p className="text-sm text-muted-foreground">{interview?.candidate?.email}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-foreground">
                            {interview?.submission?.job_title}
                          </td>
                          <td className="px-6 py-4">
                            <div>
                              <p className="text-sm font-medium text-foreground">
                                {new Date(interview?.interview_date)?.toLocaleDateString()}
                              </p>
                              <p className="text-sm text-muted-foreground">{interview?.interview_time}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getModeColor(interview?.interview_mode)}`}>
                              {interview?.interview_mode?.replace('_', ' ')?.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRoundColor(interview?.interview_round)}`}>
                              {interview?.interview_round?.replace('_', ' ')?.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-foreground">
                            {interview?.mentor?.full_name || 'N/A'}
                          </td>
                          <td className="px-6 py-4 text-sm text-foreground">
                            {interview?.interviewer_name || 'TBD'}
                          </td>
                          <td className="px-6 py-4">
                            {new Date(interview?.interview_date) >= new Date() ? (
                              <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                                UPCOMING
                              </span>
                            ) : (
                              <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                COMPLETED
                              </span>
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

export default Interviews;