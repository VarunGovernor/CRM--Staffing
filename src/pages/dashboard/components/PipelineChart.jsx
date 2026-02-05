import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const PipelineChart = () => {
  const [selectedYear, setSelectedYear] = useState(2024);

  const chartData = [
    { month: 'Jan', deals: 45, revenue: 125000 },
    { month: 'Feb', deals: 52, revenue: 142000 },
    { month: 'Mar', deals: 48, revenue: 138000 },
    { month: 'Apr', deals: 61, revenue: 165000 },
    { month: 'May', deals: 55, revenue: 158000 },
    { month: 'Jun', deals: 67, revenue: 185000 },
    { month: 'Jul', deals: 58, revenue: 172000 },
    { month: 'Aug', deals: 63, revenue: 178000 },
    { month: 'Sep', deals: 71, revenue: 195000 },
    { month: 'Oct', deals: 69, revenue: 188000 },
    { month: 'Nov', deals: 74, revenue: 205000 }
  ];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload?.length) {
      return (
        <div className="bg-popover border border-border rounded-lg p-3 shadow-elevation-2">
          <p className="font-medium text-popover-foreground mb-2">{label} {selectedYear}</p>
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-primary rounded-full"></div>
              <span className="text-sm text-popover-foreground">
                {payload?.[0]?.value} deals closed
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-accent rounded-full"></div>
              <span className="text-sm text-popover-foreground">
                ${payload?.[0]?.payload?.revenue?.toLocaleString()} revenue
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

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
          <p className="text-sm text-muted-foreground">Monthly deals closed and revenue generated</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant={selectedYear === 2023 ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedYear(2023)}
          >
            2023
          </Button>
          <Button
            variant={selectedYear === 2024 ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedYear(2024)}
          >
            2024
          </Button>
          <Button
            variant={selectedYear === 2025 ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedYear(2025)}
          >
            2025
          </Button>
        </div>
      </div>
      <div className="h-80" aria-label="Monthly Pipeline Performance Bar Chart">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis 
              dataKey="month" 
              stroke="var(--color-muted-foreground)"
              fontSize={12}
            />
            <YAxis 
              stroke="var(--color-muted-foreground)"
              fontSize={12}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar 
              dataKey="deals" 
              fill="var(--color-primary)"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="flex items-center justify-center space-x-6 mt-4 pt-4 border-t border-border">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-primary rounded-full"></div>
          <span className="text-sm text-muted-foreground">Deals Closed</span>
        </div>
        <div className="flex items-center space-x-2">
          <Icon name="Target" size={16} className="text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Target: 75 deals/month</span>
        </div>
      </div>
    </motion.div>
  );
};

export default PipelineChart;