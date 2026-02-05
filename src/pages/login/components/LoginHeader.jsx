import React from 'react';
import Icon from '../../../components/AppIcon';

const LoginHeader = () => {
  return (
    <div className="text-center mb-8">
      {/* Logo and Brand */}
      <div className="flex items-center justify-center space-x-3 mb-6">
        <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center shadow-lg">
          <Icon name="Zap" size={28} color="white" />
        </div>
        <div className="flex items-center space-x-2">
          <h1 className="text-2xl font-bold text-foreground">CRMPro</h1>
          <span className="px-3 py-1 text-xs font-medium bg-accent text-accent-foreground rounded-full">
            v2.1
          </span>
        </div>
      </div>

      {/* Welcome Message */}
      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">
          Welcome back
        </h2>
        <p className="text-muted-foreground">
          Sign in to your CRM workspace to manage your sales pipeline and customer relationships
        </p>
      </div>
    </div>
  );
};

export default LoginHeader;