import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import { supabase } from '../../../lib/supabase';

const RecentActivities = () => {
  const navigate = useNavigate();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivities();
  }, []);

  const getCandidateName = (c) =>
    c?.full_name || `${c?.first_name || ''} ${c?.last_name || ''}`.trim() || 'Unknown';

  const fetchActivities = async () => {
    try {
      setLoading(true);

      const [subsRes, interviewsRes, placementsRes] = await Promise.all([
        supabase
          .from('submissions')
          .select('id, submission_date, status, job_title, candidate:candidates(first_name, last_name, full_name), vendor:vendors(name)')
          .order('submission_date', { ascending: false })
          .limit(3),
        supabase
          .from('interviews')
          .select('id, interview_date, interview_mode, candidate:candidates(first_name, last_name, full_name), submission:submissions(job_title)')
          .gte('interview_date', new Date().toISOString().split('T')[0])
          .order('interview_date', { ascending: true })
          .limit(2),
        supabase
          .from('placements')
          .select('id, start_date, job_title, client_name, candidate:candidates(first_name, last_name, full_name)')
          .order('start_date', { ascending: false })
          .limit(2),
      ]);

      const subActivities = (subsRes.data || []).map(s => ({
        id: `sub-${s.id}`,
        type: 'submission',
        icon: 'Send',
        iconBg: 'bg-purple-100',
        iconColor: 'text-purple-600',
        title: s.job_title || 'Submission',
        description: `${getCandidateName(s.candidate)} → ${s.vendor?.name || 'vendor'}`,
        timestamp: s.submission_date ? new Date(s.submission_date).toLocaleDateString() : '—',
        badge: s.status?.replace('_', ' ') || 'submitted',
        badgeColor: s.status === 'shortlisted' ? 'bg-green-100 text-green-700'
          : s.status === 'rejected' ? 'bg-red-100 text-red-700'
          : 'bg-purple-100 text-purple-700',
        sortDate: new Date(s.submission_date || 0),
      }));

      const intActivities = (interviewsRes.data || []).map(i => ({
        id: `int-${i.id}`,
        type: 'interview',
        icon: 'Calendar',
        iconBg: 'bg-blue-100',
        iconColor: 'text-blue-600',
        title: i.submission?.job_title || 'Interview',
        description: `${getCandidateName(i.candidate)} — ${(i.interview_mode || 'interview').replace('_', ' ')}`,
        timestamp: i.interview_date ? new Date(i.interview_date).toLocaleDateString() : '—',
        badge: 'scheduled',
        badgeColor: 'bg-blue-100 text-blue-700',
        sortDate: new Date(i.interview_date || 0),
      }));

      const plActivities = (placementsRes.data || []).map(p => ({
        id: `pl-${p.id}`,
        type: 'placement',
        icon: 'Briefcase',
        iconBg: 'bg-green-100',
        iconColor: 'text-green-600',
        title: p.job_title || 'Placement',
        description: `${getCandidateName(p.candidate)} placed at ${p.client_name || 'client'}`,
        timestamp: p.start_date ? new Date(p.start_date).toLocaleDateString() : '—',
        badge: 'placed',
        badgeColor: 'bg-green-100 text-green-700',
        sortDate: new Date(p.start_date || 0),
      }));

      const combined = [...subActivities, ...intActivities, ...plActivities]
        .sort((a, b) => b.sortDate - a.sortDate)
        .slice(0, 5);

      setActivities(combined);
    } catch (err) {
      console.error('RecentActivities fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      className="bg-card border border-border rounded-xl p-6 shadow-elevation-1"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-card-foreground">Recent Activities</h3>
          <p className="text-sm text-muted-foreground">Latest submissions, interviews & placements</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => navigate('/activities')}>
          <Icon name="Plus" size={16} className="mr-2" />
          Add Activity
        </Button>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-start space-x-4 p-4 rounded-lg animate-pulse">
              <div className="w-10 h-10 bg-muted rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : activities.length === 0 ? (
        <div className="text-center py-10">
          <Icon name="Activity" size={36} className="mx-auto mb-2 text-muted-foreground opacity-40" />
          <p className="text-sm text-muted-foreground">No recent activity yet</p>
        </div>
      ) : (
        <div className="space-y-1">
          {activities.map((activity, index) => (
            <motion.div
              key={activity.id}
              className="flex items-start space-x-4 p-4 rounded-lg hover:bg-muted/50 transition-smooth cursor-pointer"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.07 }}
            >
              <div className="flex-shrink-0">
                <div className={`w-10 h-10 ${activity.iconBg} rounded-full flex items-center justify-center`}>
                  <Icon name={activity.icon} size={18} className={activity.iconColor} />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-card-foreground truncate">{activity.title}</h4>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{activity.description}</p>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium capitalize ${activity.badgeColor}`}>
                      {activity.badge}
                    </span>
                    <p className="text-xs text-muted-foreground mt-1">{activity.timestamp}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <div className="mt-6 pt-4 border-t border-border">
        <Button variant="ghost" className="w-full" onClick={() => navigate('/activities')}>
          <Icon name="ArrowRight" size={16} className="mr-2" />
          View All Activities
        </Button>
      </div>
    </motion.div>
  );
};

export default RecentActivities;
