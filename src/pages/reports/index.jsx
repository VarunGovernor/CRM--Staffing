import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts';
import Header from '../../components/ui/Header';
import Sidebar from '../../components/ui/Sidebar';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

const fmtDate = (d) => d.toISOString().split('T')[0];
const monthStart = () => new Date(new Date().getFullYear(), new Date().getMonth(), 1);

// ─── CSV Export ───────────────────────────────────────────────────────────────
const exportToCSV = (rows, filename) => {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(','),
    ...rows.map(r => headers.map(h => `"${r[h] ?? ''}"`).join(','))
  ].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

// ─── Performance Status ───────────────────────────────────────────────────────
const getPerformanceStatus = (recruiter, goals) => {
  const g = goals[recruiter.id] || goals['default'];
  if (!g) return 'neutral';
  if (recruiter.placements === 0 && recruiter.submissionCount > 0) return 'alert';
  if (
    recruiter.submissionCount >= g.submissions_target &&
    recruiter.interviewCount  >= g.interviews_target  &&
    recruiter.placements      >= g.placements_target
  ) return 'on_track';
  if (
    recruiter.submissionCount < g.submissions_target * 0.5 ||
    recruiter.placements      < g.placements_target  * 0.5
  ) return 'below';
  return 'needs_attention';
};

const STATUS_MAP = {
  on_track:        { label: 'On Track',        cls: 'bg-success/10 text-success border-success/20' },
  needs_attention: { label: 'Needs Attention', cls: 'bg-warning/10 text-warning border-warning/20' },
  below:           { label: 'Below Target',    cls: 'bg-orange-100 text-orange-700 border-orange-200' },
  alert:           { label: '0 Placements!',   cls: 'bg-red-100 text-red-700 border-red-200' },
  neutral:         { label: 'No Goals Set',    cls: 'bg-muted text-muted-foreground border-border' },
};

const StatusBadge = ({ status }) => {
  const { label, cls } = STATUS_MAP[status] || STATUS_MAP.neutral;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${cls}`}>
      {status === 'alert' && <Icon name="AlertTriangle" size={11} />}
      {label}
    </span>
  );
};

// ─── Goal Settings Modal ──────────────────────────────────────────────────────
const GoalSettingsModal = ({ isOpen, onClose, recruiters, goals, onSave }) => {
  const [localGoals, setLocalGoals] = useState({});

  useEffect(() => {
    if (isOpen) setLocalGoals(JSON.parse(JSON.stringify(goals)));
  }, [isOpen, goals]);

  const handleChange = (id, field, val) => {
    setLocalGoals(prev => ({
      ...prev,
      [id]: { ...(prev[id] || {}), [field]: parseInt(val) || 0 },
    }));
  };

  const defaultGoals = localGoals['default'] || { submissions_target: 10, interviews_target: 3, placements_target: 1 };

  const footer = (
    <>
      <Button variant="outline" onClick={onClose}>Cancel</Button>
      <Button onClick={() => { onSave(localGoals); onClose(); }}>Save Goals</Button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Recruiter Goal Settings"
      description="Set monthly performance targets per recruiter"
      size="lg"
      footer={footer}
    >
      <div className="space-y-4">
        {/* Default */}
        <div className="bg-muted/40 rounded-lg p-4 border border-border">
          <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <Icon name="Settings" size={14} />
            Default Monthly Targets
          </h4>
          <div className="grid grid-cols-3 gap-3">
            {[
              { field: 'submissions_target', label: 'Submissions' },
              { field: 'interviews_target',  label: 'Interviews'  },
              { field: 'placements_target',  label: 'Placements'  },
            ].map(({ field, label }) => (
              <div key={field} className="space-y-1">
                <label className="text-xs text-muted-foreground">{label}</label>
                <Input
                  type="number" min="0"
                  value={defaultGoals[field] ?? 0}
                  onChange={e => handleChange('default', field, e.target.value)}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Per recruiter */}
        {recruiters.map(r => (
          <div key={r.id} className="rounded-lg p-4 border border-border">
            <h4 className="text-sm font-medium text-foreground mb-3">{r.full_name}</h4>
            <div className="grid grid-cols-3 gap-3">
              {[
                { field: 'submissions_target', label: 'Submissions' },
                { field: 'interviews_target',  label: 'Interviews'  },
                { field: 'placements_target',  label: 'Placements'  },
              ].map(({ field, label }) => (
                <div key={field} className="space-y-1">
                  <label className="text-xs text-muted-foreground">
                    {label} <span className="opacity-50">(default: {defaultGoals[field] ?? 0})</span>
                  </label>
                  <Input
                    type="number" min="0"
                    placeholder={String(defaultGoals[field] ?? 0)}
                    value={localGoals[r.id]?.[field] ?? ''}
                    onChange={e => handleChange(r.id, field, e.target.value)}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Modal>
  );
};

// ─── Main Reports Page ────────────────────────────────────────────────────────
const Reports = () => {
  const { userProfile } = useAuth();
  const isAdmin = userProfile?.role === 'admin';

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [recruiters, setRecruiters] = useState([]);
  const [performanceData, setPerformanceData] = useState([]);
  const [selectedRecruiter, setSelectedRecruiter] = useState('all');
  const [dateRange, setDateRange] = useState({
    start: fmtDate(monthStart()),
    end:   fmtDate(new Date()),
  });
  const [goals, setGoals] = useState({
    default: { submissions_target: 10, interviews_target: 3, placements_target: 1 }
  });
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);

  useEffect(() => {
    if (userProfile) fetchReports();
  }, [userProfile, dateRange]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const { start, end } = dateRange;

      // Load goals from DB
      const { data: goalsData } = await supabase.from('recruiter_goals').select('*');
      if (goalsData?.length) {
        const goalsMap = { default: { submissions_target: 10, interviews_target: 3, placements_target: 1 } };
        goalsData.forEach(g => {
          const key = g.recruiter_id || 'default';
          goalsMap[key] = {
            submissions_target: g.submissions_target,
            interviews_target:  g.interviews_target,
            placements_target:  g.placements_target,
          };
        });
        setGoals(goalsMap);
      }

      // Get recruiter list
      let recruiterList;
      if (isAdmin) {
        const { data } = await supabase
          .from('user_profiles')
          .select('id, full_name')
          .eq('role', 'recruiter')
          .eq('is_active', true)
          .order('full_name');
        recruiterList = data || [];
      } else {
        recruiterList = userProfile ? [{ id: userProfile.id, full_name: userProfile.full_name }] : [];
      }
      setRecruiters(recruiterList);

      // Fetch submissions
      const { data: submissions } = await supabase
        .from('submissions')
        .select('id, submission_owner, offer_type')
        .gte('submission_date', start)
        .lte('submission_date', end);

      // Fetch interviews + submission owner via join
      const { data: interviews } = await supabase
        .from('interviews')
        .select('id, submission_id, submission:submissions(submission_owner)')
        .gte('interview_date', start)
        .lte('interview_date', end);

      // Fetch placements + submission owner via join
      const { data: placements } = await supabase
        .from('placements')
        .select('id, submission_id, submission:submissions(submission_owner)')
        .gte('start_date', start)
        .lte('start_date', end);

      const subs   = submissions || [];
      const ints   = interviews  || [];
      const places = placements  || [];

      const perf = recruiterList.map(r => {
        const rSubs   = subs.filter(s => s.submission_owner === r.id);
        const rInts   = ints.filter(i => i.submission?.submission_owner === r.id);
        const rPlaces = places.filter(p => p.submission?.submission_owner === r.id);
        const rFT     = rSubs.filter(s => s.offer_type === 'full_time');
        const convRate  = rSubs.length  > 0 ? +(rInts.length   / rSubs.length  * 100).toFixed(1) : 0;
        const placeRate = rInts.length  > 0 ? +(rPlaces.length / rInts.length  * 100).toFixed(1) : 0;

        return {
          id: r.id, full_name: r.full_name,
          submissionCount: rSubs.length,
          ftApps:          rFT.length,
          interviewCount:  rInts.length,
          placements:      rPlaces.length,
          convRate, placeRate,
        };
      });

      setPerformanceData(perf);
    } catch (err) {
      console.error('Reports fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveGoals = async (newGoals) => {
    setGoals(newGoals);
    try {
      const rows = Object.entries(newGoals).map(([rid, g]) => ({
        recruiter_id:       rid === 'default' ? null : rid,
        submissions_target: g.submissions_target || 0,
        interviews_target:  g.interviews_target  || 0,
        placements_target:  g.placements_target  || 0,
        updated_at:         new Date().toISOString(),
      }));
      await supabase.from('recruiter_goals').upsert(rows, { onConflict: 'recruiter_id' });
    } catch (err) {
      console.error('Goals save error:', err);
    }
  };

  const filtered = useMemo(() => {
    if (!isAdmin || selectedRecruiter === 'all') return performanceData;
    return performanceData.filter(r => r.id === selectedRecruiter);
  }, [performanceData, selectedRecruiter, isAdmin]);

  const totals = useMemo(() => ({
    submissions: filtered.reduce((s, r) => s + r.submissionCount, 0),
    interviews:  filtered.reduce((s, r) => s + r.interviewCount,  0),
    placements:  filtered.reduce((s, r) => s + r.placements,      0),
    ftApps:      filtered.reduce((s, r) => s + r.ftApps,          0),
  }), [filtered]);

  const alerts = useMemo(() =>
    filtered.filter(r => getPerformanceStatus(r, goals) === 'alert'),
  [filtered, goals]);

  const chartData = filtered.map(r => ({
    name:        r.full_name.split(' ')[0],
    Submissions: r.submissionCount,
    Interviews:  r.interviewCount,
    Placements:  r.placements,
  }));

  const handleExportCSV = () => {
    exportToCSV(
      filtered.map(r => ({
        'Recruiter':           r.full_name,
        'Submissions':         r.submissionCount,
        'FT Applications':     r.ftApps,
        'Interviews':          r.interviewCount,
        'Placements':          r.placements,
        'Conversion Rate (%)': r.convRate,
        'Placement Rate (%)':  r.placeRate,
        'Status':              STATUS_MAP[getPerformanceStatus(r, goals)]?.label || '',
      })),
      `recruiter-performance-${dateRange.start}-to-${dateRange.end}.csv`
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Header onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)} isSidebarOpen={isSidebarOpen} />
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <main className="lg:ml-64 pt-16">
        <div className="p-4 lg:p-6 max-w-7xl mx-auto">

          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Reports</h1>
              <p className="text-muted-foreground mt-1 text-sm">Recruiter performance analytics</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {/* Date range picker */}
              <div className="flex items-center gap-2 bg-card border border-border rounded-xl px-3 py-2">
                <Icon name="Calendar" size={14} className="text-muted-foreground flex-shrink-0" />
                <input type="date" value={dateRange.start}
                  onChange={e => setDateRange(p => ({ ...p, start: e.target.value }))}
                  className="text-sm bg-transparent text-foreground focus:outline-none" />
                <span className="text-muted-foreground text-sm">→</span>
                <input type="date" value={dateRange.end}
                  onChange={e => setDateRange(p => ({ ...p, end: e.target.value }))}
                  className="text-sm bg-transparent text-foreground focus:outline-none" />
              </div>

              {isAdmin && (
                <select
                  value={selectedRecruiter}
                  onChange={e => setSelectedRecruiter(e.target.value)}
                  className="px-3 py-2 border border-border rounded-xl bg-card text-foreground text-sm focus:outline-none"
                >
                  <option value="all">All Recruiters</option>
                  {recruiters.map(r => <option key={r.id} value={r.id}>{r.full_name}</option>)}
                </select>
              )}

              <Button variant="outline" onClick={handleExportCSV} disabled={loading || !filtered.length}>
                <Icon name="FileSpreadsheet" size={16} className="mr-2 text-success" />
                Excel/CSV
              </Button>
              <Button variant="outline" onClick={() => window.print()} disabled={loading}>
                <Icon name="Printer" size={16} className="mr-2" />
                Print/PDF
              </Button>
              {isAdmin && (
                <Button onClick={() => setIsGoalModalOpen(true)}>
                  <Icon name="Target" size={16} className="mr-2" />
                  Goal Settings
                </Button>
              )}
            </div>
          </div>

          {/* Performance Alerts */}
          {alerts.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3"
            >
              <Icon name="AlertTriangle" size={20} className="text-red-500 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-semibold text-red-800 mb-1">
                  {alerts.length} recruiter{alerts.length > 1 ? 's' : ''} with 0 placements this period
                </h3>
                <div className="flex flex-wrap gap-2 mt-1">
                  {alerts.map(r => (
                    <span key={r.id} className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full border border-red-200 font-medium">
                      {r.full_name}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* KPI Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Submissions',    value: totals.submissions, icon: 'Send',         color: 'bg-blue-100 text-blue-600'    },
              { label: 'FT Applications',value: totals.ftApps,      icon: 'FileText',     color: 'bg-indigo-100 text-indigo-600'},
              { label: 'Interviews',     value: totals.interviews,  icon: 'MessageSquare',color: 'bg-purple-100 text-purple-600'},
              { label: 'Placements',     value: totals.placements,  icon: 'Briefcase',    color: 'bg-green-100 text-green-600'  },
            ].map((s, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                className="bg-card border border-border rounded-xl p-5"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{s.label}</p>
                    <p className="text-3xl font-bold text-foreground mt-1">{loading ? '…' : s.value}</p>
                  </div>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${s.color}`}>
                    <Icon name={s.icon} size={20} />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Bar Chart */}
          {!loading && chartData.length > 0 && (
            <div className="bg-card border border-border rounded-xl p-6 mb-8">
              <h2 className="text-base font-semibold text-foreground mb-5">Performance by Recruiter</h2>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={chartData} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: 8, fontSize: 12, border: '1px solid #e5e7eb' }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
                  <Bar dataKey="Submissions" fill="#3B82F6" radius={[4,4,0,0]} />
                  <Bar dataKey="Interviews"  fill="#6366F1" radius={[4,4,0,0]} />
                  <Bar dataKey="Placements"  fill="#22C55E" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Performance Table */}
          <div className="bg-card border border-border rounded-xl overflow-hidden mb-8">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <h2 className="text-base font-semibold text-foreground">Recruiter Performance</h2>
              <span className="text-xs text-muted-foreground">{dateRange.start} → {dateRange.end}</span>
            </div>

            {loading ? (
              <div className="p-8 space-y-3">
                {[...Array(4)].map((_, i) => <div key={i} className="h-12 bg-muted rounded-lg animate-pulse" />)}
              </div>
            ) : filtered.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground">
                <Icon name="BarChart3" size={40} className="mx-auto mb-3 opacity-30" />
                No data for the selected period.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50 border-b border-border">
                    <tr>
                      {['Recruiter','Submissions','FT Apps','Interviews','Conv %','Placements','Place %','Status'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filtered.map((r, i) => {
                      const status = getPerformanceStatus(r, goals);
                      return (
                        <motion.tr key={r.id}
                          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                          transition={{ delay: i * 0.04 }}
                          className={`hover:bg-muted/30 transition-colors ${status === 'alert' ? 'bg-red-50/50' : ''}`}
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                <span className="text-xs font-bold text-primary">
                                  {r.full_name.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase()}
                                </span>
                              </div>
                              <span className="font-medium text-foreground text-sm">{r.full_name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3"><span className="text-sm font-semibold text-blue-600">{r.submissionCount}</span></td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">{r.ftApps}</td>
                          <td className="px-4 py-3"><span className="text-sm font-semibold text-indigo-600">{r.interviewCount}</span></td>
                          <td className="px-4 py-3">
                            <span className={`text-sm font-medium ${r.convRate >= 30 ? 'text-success' : r.convRate >= 15 ? 'text-warning' : 'text-muted-foreground'}`}>
                              {r.convRate}%
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-sm font-bold ${r.placements > 0 ? 'text-green-600' : 'text-red-500'}`}>
                              {r.placements}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">{r.placeRate}%</td>
                          <td className="px-4 py-3"><StatusBadge status={status} /></td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Status Legend */}
          {isAdmin && (
            <div className="bg-card border border-border rounded-xl p-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Status Legend</p>
              <div className="flex flex-wrap gap-3">
                {Object.entries(STATUS_MAP).map(([status, { label }]) => (
                  <div key={status} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <StatusBadge status={status} />
                    <span>— {{
                      on_track:        'meets all monthly targets',
                      needs_attention: '50–100% of target',
                      below:           'below 50% of target',
                      alert:           '0 placements — critical',
                      neutral:         'no goals configured',
                    }[status]}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      <GoalSettingsModal
        isOpen={isGoalModalOpen}
        onClose={() => setIsGoalModalOpen(false)}
        recruiters={recruiters}
        goals={goals}
        onSave={handleSaveGoals}
      />
    </div>
  );
};

export default Reports;
