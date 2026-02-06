import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Icon from '../components/AppIcon';
import Button from '../components/ui/Button';
import { useAuth } from '../contexts/AuthContext';

const Unauthorized = () => {
  const navigate = useNavigate();
  const { userProfile } = useAuth();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="max-w-md w-full text-center"
      >
        <div className="bg-card border border-border rounded-xl p-8">
          <div className="w-16 h-16 bg-error/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Icon name="ShieldOff" size={32} className="text-error" />
          </div>

          <h1 className="text-2xl font-bold text-foreground mb-2">Access Denied</h1>
          <p className="text-muted-foreground mb-2">
            You don't have permission to access this page.
          </p>
          {userProfile?.role && (
            <p className="text-sm text-muted-foreground mb-6">
              Your current role (<span className="font-medium capitalize">{userProfile.role.replace('_', ' ')}</span>)
              does not include access to this resource.
              Contact your administrator if you believe this is an error.
            </p>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              variant="default"
              onClick={() => navigate('/dashboard')}
              iconName="LayoutDashboard"
              iconPosition="left"
            >
              Go to Dashboard
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate(-1)}
              iconName="ArrowLeft"
              iconPosition="left"
            >
              Go Back
            </Button>
          </div>
        </div>

        <p className="text-xs text-muted-foreground mt-4">
          Error 403 — Forbidden
        </p>
      </motion.div>
    </div>
  );
};

export default Unauthorized;
