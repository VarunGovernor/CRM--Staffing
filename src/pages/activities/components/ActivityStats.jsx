import React, { useMemo } from 'react';
import Icon from '../../../components/AppIcon';

const ActivityStats = ({ activities }) => {
  const stats = React.useMemo(() => {
    const total = activities?.length;
    const completed = activities?.filter(a => a?.completed)?.length;
    const pending = activities?.filter(a => !a?.completed && new Date(a.dueDate) >= new Date())?.length;
    const overdue = activities?.filter(a => !a?.completed && new Date(a.dueDate) < new Date())?.length;
    const today = activities?.filter(a => {
      const activityDate = new Date(a.dueDate);
      const todayDate = new Date();
      return activityDate?.toDateString() === todayDate?.toDateString();
    })?.length;

    return { total, completed, pending, overdue, today };
  }, [activities]);

  const statCards = [
    {
      label: 'Total Activities',
      value: stats?.total,
      icon: 'Activity',
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      label: 'Completed',
      value: stats?.completed,
      icon: 'CheckCircle',
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      label: 'Pending',
      value: stats?.pending,
      icon: 'Clock',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100'
    },
    {
      label: 'Overdue',
      value: stats?.overdue,
      icon: 'AlertCircle',
      color: 'text-red-600',
      bgColor: 'bg-red-100'
    },
    {
      label: 'Due Today',
      value: stats?.today,
      icon: 'Calendar',
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
      {statCards?.map((stat) => (
        <div
          key={stat?.label}
          className="bg-card border border-border rounded-lg p-4 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">
                {stat?.label}
              </p>
              <p className="text-2xl font-bold text-foreground">
                {stat?.value}
              </p>
            </div>
            
            <div className={`w-12 h-12 rounded-full ${stat?.bgColor} flex items-center justify-center`}>
              <Icon name={stat?.icon} size={24} className={stat?.color} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ActivityStats;