import React from 'react';
import { motion } from 'framer-motion';
import Icon from '../../../components/AppIcon';
import Image from '../../../components/AppImage';
import Button from '../../../components/ui/Button';

const RecentActivities = () => {
  const activities = [
  {
    id: 1,
    type: 'call',
    title: 'Call with Acme Corp',
    description: 'Discussed Q4 requirements and pricing options',
    user: {
      name: 'Sarah Johnson',
      avatar: "https://images.unsplash.com/photo-1684262855358-88f296a2cfc2",
      avatarAlt: 'Professional woman with shoulder-length brown hair in white blazer smiling'
    },
    timestamp: '2 hours ago',
    status: 'completed'
  },
  {
    id: 2,
    type: 'email',
    title: 'Follow-up email sent',
    description: 'Proposal sent to TechStart Inc for review',
    user: {
      name: 'Michael Chen',
      avatar: "https://images.unsplash.com/photo-1629272039203-7d76fdaf1324",
      avatarAlt: 'Asian man with short black hair in navy suit jacket smiling professionally'
    },
    timestamp: '4 hours ago',
    status: 'completed'
  },
  {
    id: 3,
    type: 'meeting',
    title: 'Demo scheduled',
    description: 'Product demo with Global Solutions team',
    user: {
      name: 'Emily Rodriguez',
      avatar: "https://images.unsplash.com/photo-1734178491612-098cd27712e4",
      avatarAlt: 'Hispanic woman with long dark hair in professional blue blouse'
    },
    timestamp: 'Tomorrow 2:00 PM',
    status: 'scheduled'
  },
  {
    id: 4,
    type: 'task',
    title: 'Contract review',
    description: 'Review and update contract terms for MegaCorp deal',
    user: {
      name: 'David Park',
      avatar: "https://images.unsplash.com/photo-1613853213686-e9d5d50fed9e",
      avatarAlt: 'Young man with short brown hair in gray suit jacket with confident smile'
    },
    timestamp: 'Due in 3 days',
    status: 'pending'
  },
  {
    id: 5,
    type: 'deal',
    title: 'Deal closed',
    description: 'Successfully closed $45K deal with InnovateTech',
    user: {
      name: 'Lisa Thompson',
      avatar: "https://images.unsplash.com/photo-1654727169791-7f46d0dfc1a3",
      avatarAlt: 'Professional blonde woman in black blazer with warm smile'
    },
    timestamp: '1 day ago',
    status: 'completed'
  }];


  const getActivityIcon = (type) => {
    switch (type) {
      case 'call':return 'Phone';
      case 'email':return 'Mail';
      case 'meeting':return 'Calendar';
      case 'task':return 'CheckSquare';
      case 'deal':return 'Target';
      default:return 'Activity';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':return 'text-success';
      case 'scheduled':return 'text-warning';
      case 'pending':return 'text-muted-foreground';
      default:return 'text-muted-foreground';
    }
  };

  return (
    <motion.div
      className="bg-card border border-border rounded-xl p-6 shadow-elevation-1"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-card-foreground">Recent Activities</h3>
          <p className="text-sm text-muted-foreground">Latest updates from your sales team</p>
        </div>
        <Button variant="outline" size="sm">
          <Icon name="Plus" size={16} className="mr-2" />
          Add Activity
        </Button>
      </div>
      <div className="space-y-4">
        {activities?.map((activity, index) =>
        <motion.div
          key={activity?.id}
          className="flex items-start space-x-4 p-4 rounded-lg hover:bg-muted/50 transition-smooth cursor-pointer"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: index * 0.1 }}>

            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <Icon
                name={getActivityIcon(activity?.type)}
                size={18}
                className="text-primary" />

              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-card-foreground mb-1">
                    {activity?.title}
                  </h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    {activity?.description}
                  </p>
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      <Image
                      src={activity?.user?.avatar}
                      alt={activity?.user?.avatarAlt}
                      className="w-6 h-6 rounded-full object-cover" />

                      <span className="text-xs text-muted-foreground">
                        {activity?.user?.name}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">•</span>
                    <span className={`text-xs font-medium ${getStatusColor(activity?.status)}`}>
                      {activity?.timestamp}
                    </span>
                  </div>
                </div>
                
                <div className="flex-shrink-0 ml-4">
                  <Button variant="ghost" size="icon" className="w-8 h-8">
                    <Icon name="MoreHorizontal" size={16} />
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
      <div className="mt-6 pt-4 border-t border-border">
        <Button variant="ghost" className="w-full">
          <Icon name="ArrowRight" size={16} className="mr-2" />
          View All Activities
        </Button>
      </div>
    </motion.div>);

};

export default RecentActivities;