import React from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, ResponsiveContainer, Tooltip } from 'recharts';

const ConversionFunnelChart = () => {
  // Small-multiple sparkline data for different reps/stages
  const sparklineData = [
    {
      id: 'sarah_chen',
      name: 'Sarah Chen',
      role: 'Senior Rep',
      trend: [
        { period: 'W1', value: 85 },
        { period: 'W2', value: 88 },
        { period: 'W3', value: 82 },
        { period: 'W4', value: 91 },
        { period: 'W5', value: 95 },
        { period: 'W6', value: 89 },
        { period: 'W7', value: 93 },
        { period: 'W8', value: 97 }
      ],
      current: 97,
      change: '+12%',
      positive: true,
      color: '#10B981'
    },
    {
      id: 'mike_rodriguez',
      name: 'Mike Rodriguez',
      role: 'Account Executive', 
      trend: [
        { period: 'W1', value: 76 },
        { period: 'W2', value: 79 },
        { period: 'W3', value: 74 },
        { period: 'W4', value: 71 },
        { period: 'W5', value: 68 },
        { period: 'W6', value: 72 },
        { period: 'W7', value: 75 },
        { period: 'W8', value: 78 }
      ],
      current: 78,
      change: '+2%',
      positive: true,
      color: '#8B5CF6'
    },
    {
      id: 'emma_watson',
      name: 'Emma Watson',
      role: 'Junior Rep',
      trend: [
        { period: 'W1', value: 65 },
        { period: 'W2', value: 68 },
        { period: 'W3', value: 71 },
        { period: 'W4', value: 69 },
        { period: 'W5', value: 73 },
        { period: 'W6', value: 76 },
        { period: 'W7', value: 79 },
        { period: 'W8', value: 82 }
      ],
      current: 82,
      change: '+17%',
      positive: true,
      color: '#06B6D4'
    },
    {
      id: 'david_kim',
      name: 'David Kim',
      role: 'Team Lead',
      trend: [
        { period: 'W1', value: 92 },
        { period: 'W2', value: 89 },
        { period: 'W3', value: 86 },
        { period: 'W4', value: 88 },
        { period: 'W5', value: 85 },
        { period: 'W6', value: 83 },
        { period: 'W7', value: 81 },
        { period: 'W8', value: 79 }
      ],
      current: 79,
      change: '-13%',
      positive: false,
      color: '#F59E0B'
    },
    {
      id: 'lisa_patel',
      name: 'Lisa Patel',
      role: 'Senior Rep',
      trend: [
        { period: 'W1', value: 88 },
        { period: 'W2', value: 85 },
        { period: 'W3', value: 87 },
        { period: 'W4', value: 90 },
        { period: 'W5', value: 92 },
        { period: 'W6', value: 88 },
        { period: 'W7', value: 91 },
        { period: 'W8', value: 94 }
      ],
      current: 94,
      change: '+6%',
      positive: true,
      color: '#EC4899'
    },
    {
      id: 'james_brown',
      name: 'James Brown',
      role: 'Account Executive',
      trend: [
        { period: 'W1', value: 72 },
        { period: 'W2', value: 75 },
        { period: 'W3', value: 73 },
        { period: 'W4', value: 76 },
        { period: 'W5', value: 78 },
        { period: 'W6', value: 80 },
        { period: 'W7', value: 77 },
        { period: 'W8', value: 81 }
      ],
      current: 81,
      change: '+9%',
      positive: true,
      color: '#84CC16'
    }
  ];

  const SparklineTooltip = ({ active, payload }) => {
    if (active && payload?.length) {
      return (
        <div className="bg-popover border border-border rounded px-2 py-1 text-xs shadow-sm">
          <span className="text-popover-foreground">{payload?.[0]?.value}%</span>
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-card border border-border rounded-xl p-6"
    >
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-foreground mb-1">Conversion Trends</h3>
        <p className="text-sm text-muted-foreground">8-week conversion rate sparklines by rep</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sparklineData?.map((rep) => (
          <motion.div
            key={rep?.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.05 * sparklineData?.indexOf(rep) }}
            className="bg-muted/20 rounded-lg p-4 hover:bg-muted/30 transition-colors"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground truncate">{rep?.name}</p>
                <p className="text-xs text-muted-foreground">{rep?.role}</p>
              </div>
              <div className="text-right ml-2">
                <p className="text-lg font-semibold text-foreground">{rep?.current}%</p>
                <p className={`text-xs font-medium ${
                  rep?.positive ? 'text-green-600' : 'text-red-500'
                }`}>
                  {rep?.change}
                </p>
              </div>
            </div>
            
            <div className="h-12 -mx-1">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={rep?.trend}>
                  <Tooltip 
                    content={<SparklineTooltip />}
                    cursor={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke={rep?.color}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ 
                      r: 3, 
                      fill: rep?.color,
                      strokeWidth: 0
                    }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            
            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div 
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: rep?.color }}
                />
                <span className="text-xs text-muted-foreground">8W Trend</span>
              </div>
              <div className="text-xs text-muted-foreground">
                {rep?.trend?.[0]?.value}% → {rep?.trend?.[rep?.trend?.length - 1]?.value}%
              </div>
            </div>
          </motion.div>
        ))}
      </div>
      {/* Summary section with minimal styling */}
      <div className="mt-6 pt-6 border-t border-border">
        <div className="grid grid-cols-3 gap-6 text-center">
          <div>
            <p className="text-2xl font-semibold text-foreground">86.2%</p>
            <p className="text-xs text-muted-foreground">Avg Rate</p>
          </div>
          <div>
            <p className="text-2xl font-semibold text-green-600">+5.8%</p>
            <p className="text-xs text-muted-foreground">Team Growth</p>
          </div>
          <div>
            <p className="text-2xl font-semibold text-foreground">6</p>
            <p className="text-xs text-muted-foreground">Active Reps</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ConversionFunnelChart;