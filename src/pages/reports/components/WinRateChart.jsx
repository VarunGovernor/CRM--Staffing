import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const WinRateChart = () => {
  const [chartType, setChartType] = useState('line');

  const winRateData = [
    { month: 'Jan', winRate: 65, deals: 45, won: 29, lost: 16 },
    { month: 'Feb', winRate: 72, deals: 52, won: 37, lost: 15 },
    { month: 'Mar', winRate: 68, deals: 48, won: 33, lost: 15 },
    { month: 'Apr', winRate: 75, deals: 56, won: 42, lost: 14 },
    { month: 'May', winRate: 71, deals: 49, won: 35, lost: 14 },
    { month: 'Jun', winRate: 78, deals: 64, won: 50, lost: 14 },
    { month: 'Jul', winRate: 73, deals: 58, won: 42, lost: 16 },
    { month: 'Aug', winRate: 76, deals: 61, won: 46, lost: 15 },
    { month: 'Sep', winRate: 69, deals: 55, won: 38, lost: 17 },
    { month: 'Oct', winRate: 81, deals: 67, won: 54, lost: 13 },
    { month: 'Nov', winRate: 74, deals: 59, won: 44, lost: 15 }
  ];

  const pieData = [
    { name: 'Won', value: 430, fill: '#10B981' },
    { name: 'Lost', value: 164, fill: '#EF4444' }
  ];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload?.length) {
      const data = payload?.[0]?.payload;
      return (
        <div className="bg-popover border border-border rounded-lg p-3 shadow-elevation-2">
          <p className="font-medium text-popover-foreground">{label} 2024</p>
          <p className="text-sm text-success">Won: {data?.won} deals</p>
          <p className="text-sm text-error">Lost: {data?.lost} deals</p>
          <p className="text-sm text-muted-foreground">Win Rate: {data?.winRate}%</p>
        </div>
      );
    }
    return null;
  };

  const PieTooltip = ({ active, payload }) => {
    if (active && payload && payload?.length) {
      const data = payload?.[0];
      const total = pieData?.reduce((sum, item) => sum + item?.value, 0);
      const percentage = ((data?.value / total) * 100)?.toFixed(1);
      
      return (
        <div className="bg-popover border border-border rounded-lg p-3 shadow-elevation-2">
          <p className="font-medium text-popover-foreground">{data?.name}</p>
          <p className="text-sm text-muted-foreground">{data?.value} deals ({percentage}%)</p>
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="bg-card border border-border rounded-xl p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Win Rate Analytics</h3>
          <p className="text-sm text-muted-foreground">Monthly win rate trends and distribution</p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant={chartType === 'line' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setChartType('line')}
            iconName="TrendingUp"
            iconPosition="left"
          >
            Trend
          </Button>
          <Button
            variant={chartType === 'pie' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setChartType('pie')}
            iconName="PieChart"
            iconPosition="left"
          >
            Distribution
          </Button>
        </div>
      </div>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'line' ? (
            <LineChart data={winRateData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis 
                dataKey="month" 
                stroke="#64748B"
                fontSize={12}
              />
              <YAxis 
                stroke="#64748B"
                fontSize={12}
                domain={[0, 100]}
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="winRate"
                stroke="#8B5CF6"
                strokeWidth={3}
                dot={{ fill: '#8B5CF6', strokeWidth: 2, r: 6 }}
                activeDot={{ r: 8, stroke: '#8B5CF6', strokeWidth: 2 }}
                animationDuration={1500}
              />
            </LineChart>
          ) : (
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={120}
                paddingAngle={5}
                dataKey="value"
                animationDuration={1000}
              >
                {pieData?.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry?.fill} />
                ))}
              </Pie>
              <Tooltip content={<PieTooltip />} />
            </PieChart>
          )}
        </ResponsiveContainer>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-6 border-t border-border">
        <div className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <div className="w-3 h-3 bg-success rounded-full" />
            <span className="text-sm font-medium text-foreground">Total Won</span>
          </div>
          <p className="text-2xl font-semibold text-foreground">430</p>
          <p className="text-xs text-muted-foreground">deals closed</p>
        </div>
        
        <div className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <div className="w-3 h-3 bg-error rounded-full" />
            <span className="text-sm font-medium text-foreground">Total Lost</span>
          </div>
          <p className="text-2xl font-semibold text-foreground">164</p>
          <p className="text-xs text-muted-foreground">deals lost</p>
        </div>
        
        <div className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <Icon name="Target" size={16} className="text-primary" />
            <span className="text-sm font-medium text-foreground">Win Rate</span>
          </div>
          <p className="text-2xl font-semibold text-foreground">72.4%</p>
          <p className="text-xs text-muted-foreground">this year</p>
        </div>
        
        <div className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <Icon name="TrendingUp" size={16} className="text-success" />
            <span className="text-sm font-medium text-foreground">Best Month</span>
          </div>
          <p className="text-2xl font-semibold text-foreground">81%</p>
          <p className="text-xs text-muted-foreground">October 2024</p>
        </div>
      </div>
    </motion.div>
  );
};

export default WinRateChart;