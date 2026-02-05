import React from 'react';
import Icon from '../../../components/AppIcon';

const UsageMetrics = ({ metrics }) => {
  const getUsageColor = (percentage) => {
    if (percentage >= 90) return 'text-error';
    if (percentage >= 75) return 'text-warning';
    return 'text-success';
  };

  const getProgressColor = (percentage) => {
    if (percentage >= 90) return 'bg-error';
    if (percentage >= 75) return 'bg-warning';
    return 'bg-success';
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-US')?.format(num);
  };

  const formatStorage = (bytes) => {
    const gb = bytes / (1024 * 1024 * 1024);
    return `${gb?.toFixed(1)} GB`;
  };

  return (
    <div className="bg-card border border-border rounded-xl p-4 lg:p-6">
      <div className="flex items-center space-x-3 mb-4 lg:mb-6">
        <div className="w-8 h-8 lg:w-10 lg:h-10 bg-accent/20 rounded-lg flex items-center justify-center flex-shrink-0">
          <Icon name="BarChart3" size={16} className="lg:hidden text-accent-foreground" />
          <Icon name="BarChart3" size={20} className="hidden lg:block text-accent-foreground" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-base lg:text-lg font-semibold text-foreground">Usage Metrics</h2>
          <p className="text-xs lg:text-sm text-muted-foreground break-words">Current month usage and limits</p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
        {metrics?.map((metric, index) => {
          const percentage = (metric?.used / metric?.limit) * 100;
          
          return (
            <div key={index} className="space-y-2 lg:space-y-3 p-3 lg:p-0 bg-muted/30 lg:bg-transparent rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 lg:space-x-3 min-w-0 flex-1">
                  <Icon name={metric?.icon} size={16} className="text-muted-foreground flex-shrink-0" />
                  <span className="font-medium text-foreground text-sm lg:text-base truncate">{metric?.name}</span>
                </div>
                <div className="text-right ml-2">
                  <div className={`text-xs lg:text-sm font-semibold ${getUsageColor(percentage)}`}>
                    {metric?.type === 'storage' 
                      ? `${formatStorage(metric?.used)} / ${formatStorage(metric?.limit)}`
                      : `${formatNumber(metric?.used)} / ${formatNumber(metric?.limit)}`
                    }
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {percentage?.toFixed(1)}% used
                  </div>
                </div>
              </div>
              {/* Progress Bar */}
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(percentage)}`}
                  style={{ width: `${Math.min(percentage, 100)}%` }}
                />
              </div>
              {/* Warning Message */}
              {percentage >= 90 && (
                <div className="flex items-start space-x-2 p-2 lg:p-3 bg-error/10 border border-error/20 rounded-lg">
                  <Icon name="AlertTriangle" size={14} className="text-error mt-0.5 flex-shrink-0" />
                  <span className="text-xs lg:text-sm text-error font-medium break-words">
                    Usage limit almost reached. Consider upgrading your plan.
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default UsageMetrics;