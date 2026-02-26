import React from 'react';
import { motion } from 'framer-motion';
import Icon from '../../../components/AppIcon';

const RightRail = () => {
  return (
    <div className="space-y-6">
      {/* Stats Card */}
      <motion.div
        className="bg-card border border-border rounded-xl p-6 shadow-elevation-1"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <h3 className="text-lg font-semibold text-card-foreground mb-4">Your Progress</h3>
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Monthly Goal</span>
              <span className="text-sm font-medium text-card-foreground">74%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div className="bg-primary h-2 rounded-full" style={{ width: '74%' }}></div>
            </div>
          </div>
          
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Quarterly Target</span>
              <span className="text-sm font-medium text-card-foreground">89%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div className="bg-accent h-2 rounded-full" style={{ width: '89%' }}></div>
            </div>
          </div>
          
          <div className="pt-2 border-t border-border">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Rank</span>
              <div className="flex items-center space-x-1">
                <Icon name="Trophy" size={16} className="text-accent" />
                <span className="text-sm font-medium text-card-foreground">#3 in team</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default RightRail;