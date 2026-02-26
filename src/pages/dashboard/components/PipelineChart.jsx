import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import { supabase } from '../../../lib/supabase';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const PipelineChart = () => {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChartData(selectedYear);
  }, [selectedYear]);

  const fetchChartData = async (year) => {
    try {
      setLoading(true);
      const startDate = `${year}-01-01`;
      const endDate = `${year}-12-31`;

      const [placementsRes, subsRes] = await Promise.all([
        supabase
          .from('placements')
          .select('start_date, bill_rate, pay_rate, duration_months')
          .gte('start_date', startDate)
          .lte('start_date', endDate),
        supabase
          .from('submissions')
          .select('submission_date')
          .gte('submission_date', startDate)
          .lte('submission_date', endDate),
      ]);

      const placements = placementsRes.data || [];
      const submissions = subsRes.data || [];

      const data = MONTHS.map((month, idx) => {
        const monthPlacements = placements.filter(p => {
          const d = new Date(p.start_date);
          return d.getMonth() === idx;
        });
        const monthSubmissions = submissions.filter(s => {
          const d = new Date(s.submission_date);
          return d.getMonth() === idx;
        });
        const revenue = monthPlacements.reduce((sum, p) => {
          const margin = (p.bill_rate || 0) - (p.pay_rate || 0);
          return sum + margin * (p.duration_months || 1) * 160;
        }, 0);

        return {
          month,
          placements: monthPlacements.length,
          submissions: monthSubmissions.length,
          revenue,
        };
      });

      setChartData(data);
    } catch (err) {
      console.error('PipelineChart fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatRevenue = (val) => {
    if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`;
    if (val >= 1_000) return `$${(val / 1_000).toFixed(0)}K`;
    return `$${val}`;
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const d = payload[0]?.payload;
      return (
        <div className="bg-popover border border-border rounded-lg p-3 shadow-elevation-2">
          <p className="font-medium text-popover-foreground mb-2">{label} {selectedYear}</p>
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-primary rounded-full" />
              <span className="text-sm text-popover-foreground">{d?.placements} placements</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-accent rounded-full" />
              <span className="text-sm text-popover-foreground">{d?.submissions} submissions</span>
            </div>
            <div className="flex items-center space-x-2">
              <Icon name="DollarSign" size={12} className="text-muted-foreground" />
              <span className="text-sm text-popover-foreground">{formatRevenue(d?.revenue)} revenue</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const years = [currentYear - 1, currentYear, currentYear + 1];

  return (
    <motion.div
      className="bg-card border border-border rounded-xl p-6 shadow-elevation-1"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-card-foreground">Pipeline Performance</h3>
          <p className="text-sm text-muted-foreground">Monthly placements and submissions</p>
        </div>
        <div className="flex items-center space-x-2">
          {years.map(y => (
            <Button
              key={y}
              variant={selectedYear === y ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedYear(y)}
            >
              {y}
            </Button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="h-80 flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="h-80" aria-label="Monthly Pipeline Performance Bar Chart">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="month" stroke="var(--color-muted-foreground)" fontSize={12} />
              <YAxis stroke="var(--color-muted-foreground)" fontSize={12} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="placements" fill="var(--color-primary)" radius={[4, 4, 0, 0]} name="Placements" />
              <Bar dataKey="submissions" fill="var(--color-accent)" radius={[4, 4, 0, 0]} name="Submissions" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="flex items-center justify-center space-x-6 mt-4 pt-4 border-t border-border">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-primary rounded-full" />
          <span className="text-sm text-muted-foreground">Placements</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-accent rounded-full" />
          <span className="text-sm text-muted-foreground">Submissions</span>
        </div>
        <div className="flex items-center space-x-2">
          <Icon name="TrendingUp" size={14} className="text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {chartData.reduce((s, d) => s + d.placements, 0)} placements in {selectedYear}
          </span>
        </div>
      </div>
    </motion.div>
  );
};

export default PipelineChart;
