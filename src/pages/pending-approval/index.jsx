import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';

const ROLE_LABELS = {
  recruiter: 'Recruiter',
  sales: 'Sales',
  hr: 'HR',
  finance: 'Finance / Payroll',
  employee: 'Employee',
  admin: 'Admin',
};

const PendingApproval = () => {
  const { userProfile, signOut } = useAuth();
  const requestedRole = userProfile?.requested_role || userProfile?.role;

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />

      <div className="relative w-full max-w-md text-center">
        <div className="bg-card border border-border rounded-xl shadow-elevation-2 p-10 space-y-6">
          {/* Icon */}
          <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto">
            <Icon name="Clock" size={36} className="text-yellow-600" />
          </div>

          {/* Heading */}
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-2">Awaiting Approval</h1>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Your account has been created. An admin needs to review and approve your access before you can use the CRM.
            </p>
          </div>

          {/* User info summary */}
          <div className="bg-muted rounded-lg p-4 text-left space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Name</span>
              <span className="font-medium text-foreground">{userProfile?.full_name || '—'}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Email</span>
              <span className="font-medium text-foreground">{userProfile?.email || '—'}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Requested Role</span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                {ROLE_LABELS[requestedRole] || requestedRole || 'Not specified'}
              </span>
            </div>
          </div>

          {/* What happens next */}
          <div className="text-left space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">What happens next</p>
            {[
              { icon: 'Bell', text: 'Admin receives a notification about your registration' },
              { icon: 'UserCheck', text: 'Admin reviews and assigns your role' },
              { icon: 'Mail', text: 'You\'ll be able to log in with full access once approved' },
            ].map((step, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-7 h-7 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Icon name={step.icon} size={14} className="text-primary" />
                </div>
                <p className="text-sm text-muted-foreground">{step.text}</p>
              </div>
            ))}
          </div>

          {/* Sign out */}
          <Button
            variant="outline"
            size="md"
            fullWidth
            onClick={handleSignOut}
            className="flex items-center justify-center gap-2"
          >
            <Icon name="LogOut" size={16} />
            Sign Out
          </Button>
        </div>

        <p className="mt-6 text-xs text-muted-foreground">
          © {new Date().getFullYear()} San Synapse-CRM. All rights reserved.
        </p>
      </div>

      <div className="absolute top-10 left-10 w-20 h-20 bg-primary/10 rounded-full blur-xl" />
      <div className="absolute bottom-10 right-10 w-32 h-32 bg-secondary/10 rounded-full blur-xl" />
    </div>
  );
};

export default PendingApproval;
