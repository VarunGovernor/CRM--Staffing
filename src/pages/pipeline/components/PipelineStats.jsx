import React from 'react';
import { motion } from 'framer-motion';
import Icon from '../../../components/AppIcon';

const PipelineStats = ({ deals }) => {
  const calculateStats = () => {
    const totalDeals = deals?.length;
    const totalValue = deals?.reduce((sum, deal) => sum + deal?.value, 0);
    const avgDealSize = totalDeals > 0 ? totalValue / totalDeals : 0;
    
    const stageStats = deals?.reduce((acc, deal) => {
      if (!acc?.[deal?.stage]) {
        acc[deal.stage] = { count: 0, value: 0 };
      }
      acc[deal.stage].count++;
      acc[deal.stage].value += deal?.value;
      return acc;
    }, {});

    const wonDeals = deals?.filter(deal => deal?.stage === 'won');
    const lostDeals = deals?.filter(deal => deal?.stage === 'lost');
    const activeDeals = deals?.filter(deal => !['won', 'lost']?.includes(deal?.stage));
    
    const winRate = (wonDeals?.length + lostDeals?.length) > 0 
      ? (wonDeals?.length / (wonDeals?.length + lostDeals?.length)) * 100 
      : 0;

    const weightedValue = activeDeals?.reduce((sum, deal) => {
      return sum + (deal?.value * (deal?.probability / 100));
    }, 0);

    return {
      totalDeals,
      totalValue,
      avgDealSize,
      stageStats,
      winRate,
      weightedValue,
      activeDeals: activeDeals?.length,
      wonValue: wonDeals?.reduce((sum, deal) => sum + deal?.value, 0)
    };
  };

  const stats = calculateStats();

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })?.format(amount);
  };

  const formatPercentage = (value) => {
    return `${Math.round(value)}%`;
  };

  const statCards = [
    {
      title: 'Total Pipeline Value',
      value: formatCurrency(stats?.totalValue),
      icon: 'DollarSign',
      color: 'bg-blue-100 text-blue-600',
      bgColor: 'bg-blue-50',
      change: '+12.5%',
      changeType: 'positive'
    },
    {
      title: 'Active Deals',
      value: stats?.activeDeals?.toString(),
      icon: 'Target',
      color: 'bg-purple-100 text-purple-600',
      bgColor: 'bg-purple-50',
      change: '+3',
      changeType: 'positive'
    },
    {
      title: 'Weighted Pipeline',
      value: formatCurrency(stats?.weightedValue),
      icon: 'TrendingUp',
      color: 'bg-green-100 text-green-600',
      bgColor: 'bg-green-50',
      change: '+8.2%',
      changeType: 'positive'
    },
    {
      title: 'Win Rate',
      value: formatPercentage(stats?.winRate),
      icon: 'Award',
      color: 'bg-yellow-100 text-yellow-600',
      bgColor: 'bg-yellow-50',
      change: '-2.1%',
      changeType: 'negative'
    },
    {
      title: 'Average Deal Size',
      value: formatCurrency(stats?.avgDealSize),
      icon: 'BarChart3',
      color: 'bg-indigo-100 text-indigo-600',
      bgColor: 'bg-indigo-50',
      change: '+15.3%',
      changeType: 'positive'
    },
    {
      title: 'Won This Month',
      value: formatCurrency(stats?.wonValue),
      icon: 'Trophy',
      color: 'bg-emerald-100 text-emerald-600',
      bgColor: 'bg-emerald-50',
      change: '+22.7%',
      changeType: 'positive'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
      {statCards?.map((stat, index) => (
        <motion.div
          key={stat?.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className={`${stat?.bgColor} border border-border rounded-xl p-5 hover:shadow-elevation-2 transition-all duration-200 cursor-default`}
        >
          <div className="flex items-center justify-between mb-4">
            <div className={`w-12 h-12 ${stat?.color} rounded-xl flex items-center justify-center shadow-sm`}>
              <Icon name={stat?.icon} size={22} />
            </div>
            <div className={`flex items-center space-x-1 text-xs font-semibold px-2 py-1 rounded-full ${
              stat?.changeType === 'positive' ?'text-green-700 bg-green-100' :'text-red-700 bg-red-100'
            }`}>
              <Icon 
                name={stat?.changeType === 'positive' ? 'TrendingUp' : 'TrendingDown'} 
                size={12} 
              />
              <span>{stat?.change}</span>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="text-2xl font-bold text-foreground tracking-tight">
              {stat?.value}
            </div>
            <div className="text-sm font-medium text-muted-foreground">
              {stat?.title}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default PipelineStats;