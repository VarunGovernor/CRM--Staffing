import React from 'react';
import Icon from '../../../components/AppIcon';

const KPICard = ({ title, value, change, changeType, icon, iconBg, iconColor, trendPercent }) => {
  const showTrend = trendPercent !== null && trendPercent !== undefined;
  const trendUp = showTrend && trendPercent >= 0;

  return (
    <div className="bg-card border border-border rounded-xl p-6 shadow-elevation-1 hover:shadow-elevation-2 transition-smooth">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-muted-foreground mb-2">{title}</p>
          <p className="text-3xl font-semibold text-card-foreground mb-3">{value}</p>
          <div className="flex items-center space-x-2">
            <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${
              showTrend
                ? trendUp ? 'bg-success/10 text-success' : 'bg-error/10 text-error'
                : changeType === 'positive' ? 'bg-success/10 text-success'
                : changeType === 'negative' ? 'bg-error/10 text-error'
                : 'bg-muted text-muted-foreground'
            }`}>
              {showTrend
                ? <Icon name={trendUp ? 'TrendingUp' : 'TrendingDown'} size={12} />
                : changeType === 'positive' ? <Icon name="TrendingUp" size={12} />
                : changeType === 'negative' ? <Icon name="TrendingDown" size={12} />
                : null
              }
              <span>
                {showTrend
                  ? `${trendPercent > 0 ? '+' : ''}${trendPercent.toFixed(0)}%`
                  : change
                }
              </span>
            </div>
            <span className="text-xs text-muted-foreground">
              {showTrend ? 'vs prev period' : ''}
            </span>
          </div>
        </div>
        <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ml-3 ${iconBg}`}>
          <Icon name={icon} size={24} color={iconColor} />
        </div>
      </div>
    </div>
  );
};

export default KPICard;
