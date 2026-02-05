import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import Header from '../../components/ui/Header';
import Sidebar from '../../components/ui/Sidebar';
import PlanCard from './components/PlanCard';
import UsageMetrics from './components/UsageMetrics';
import InvoiceTable from './components/InvoiceTable';
import PaymentMethod from './components/PaymentMethod';
import UpgradeCard from './components/UpgradeCard';
import BillingAlerts from './components/BillingAlerts';
import Icon from '../../components/AppIcon';


const BillingPage = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Mock data for billing plans
  const billingPlans = [
    {
      id: 'starter',
      name: 'Starter',
      description: 'Perfect for small teams getting started',
      price: 0,
      billing: 'month',
      features: [
        { name: 'Up to 1,000 contacts', included: true },
        { name: 'Basic pipeline management', included: true },
        { name: 'Email integration', included: true },
        { name: 'Standard support', included: true },
        { name: 'Advanced analytics', included: false },
        { name: 'Custom fields', included: false },
        { name: 'API access', included: false }
      ]
    },
    {
      id: 'professional',
      name: 'Professional',
      description: 'Advanced features for growing businesses',
      price: 29,
      billing: 'month',
      nextPayment: '2025-12-03',
      features: [
        { name: 'Up to 10,000 contacts', included: true },
        { name: 'Advanced pipeline management', included: true },
        { name: 'Email automation', included: true },
        { name: 'Priority support', included: true },
        { name: 'Advanced analytics', included: true },
        { name: 'Custom fields', included: true },
        { name: 'API access', included: false }
      ]
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      description: 'Complete solution for large organizations',
      price: 79,
      billing: 'month',
      badge: 'Most Popular',
      recommended: true,
      features: [
        { name: 'Unlimited contacts', included: true },
        { name: 'Advanced pipeline management', included: true },
        { name: 'Email automation', included: true },
        { name: 'Dedicated support', included: true },
        { name: 'Advanced analytics', included: true },
        { name: 'Custom fields', included: true },
        { name: 'Full API access', included: true }
      ]
    }
  ];

  // Mock current plan (Professional)
  const currentPlanId = 'professional';

  // Mock usage metrics
  const usageMetrics = [
    {
      name: 'Contacts',
      icon: 'Users',
      used: 7500,
      limit: 10000,
      type: 'count'
    },
    {
      name: 'Deals',
      icon: 'Target',
      used: 245,
      limit: 500,
      type: 'count'
    },
    {
      name: 'Storage',
      icon: 'HardDrive',
      used: 8.5 * 1024 * 1024 * 1024, // 8.5 GB in bytes
      limit: 10 * 1024 * 1024 * 1024, // 10 GB in bytes
      type: 'storage'
    },
    {
      name: 'API Calls',
      icon: 'Zap',
      used: 8750,
      limit: 10000,
      type: 'count'
    }
  ];

  // Mock invoice data
  const invoices = [
    {
      id: 'inv_001',
      number: 'INV-2025-001',
      description: 'Professional Plan - November 2025',
      date: '2025-11-01',
      amount: 29.00,
      status: 'Paid'
    },
    {
      id: 'inv_002',
      number: 'INV-2025-002',
      description: 'Professional Plan - October 2025',
      date: '2025-10-01',
      amount: 29.00,
      status: 'Paid'
    },
    {
      id: 'inv_003',
      number: 'INV-2025-003',
      description: 'Professional Plan - September 2025',
      date: '2025-09-01',
      amount: 29.00,
      status: 'Paid'
    },
    {
      id: 'inv_004',
      number: 'INV-2025-004',
      description: 'Professional Plan - August 2025',
      date: '2025-08-01',
      amount: 29.00,
      status: 'Paid'
    },
    {
      id: 'inv_005',
      number: 'INV-2025-005',
      description: 'Professional Plan - July 2025',
      date: '2025-07-01',
      amount: 29.00,
      status: 'Failed'
    },
    {
      id: 'inv_006',
      number: 'INV-2025-006',
      description: 'Professional Plan - June 2025',
      date: '2025-06-01',
      amount: 29.00,
      status: 'Paid'
    }
  ];

  // Mock payment method
  const paymentMethod = {
    type: 'Visa',
    number: '4532123456789012',
    expiry: '12/27',
    name: 'John Doe'
  };

  // Mock billing alerts
  const billingAlerts = [
    {
      id: 'alert_1',
      type: 'warning',
      title: 'Usage Limit Warning',
      message: 'You have used 75% of your contact limit. Consider upgrading to avoid service interruption.',
      timestamp: '2025-11-03T06:30:00Z',
      actions: [
        {
          label: 'Upgrade Plan',
          variant: 'default',
          icon: 'ArrowUp',
          onClick: () => console.log('Upgrade clicked')
        },
        {
          label: 'View Usage',
          variant: 'outline',
          icon: 'BarChart3',
          onClick: () => console.log('View usage clicked')
        }
      ]
    },
    {
      id: 'alert_2',
      type: 'info',
      title: 'Payment Reminder',
      message: 'Your next payment of $29.00 is due on December 3, 2025.',
      timestamp: '2025-11-02T10:00:00Z',
      actions: [
        {
          label: 'Update Payment Method',
          variant: 'outline',
          icon: 'CreditCard',
          onClick: () => console.log('Update payment clicked')
        }
      ]
    }
  ];

  const handleMenuToggle = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleSidebarClose = () => {
    setIsSidebarOpen(false);
  };

  const handlePlanUpgrade = (plan) => {
    console.log('Upgrading to plan:', plan?.name);
    // Mock upgrade functionality
  };

  const handlePaymentUpdate = (paymentData) => {
    console.log('Updating payment method:', paymentData);
    // Mock payment update functionality
  };

  const handleUpgradeClick = () => {
    console.log('Upgrade to premium clicked');
    // Mock upgrade functionality
  };

  const handleAlertDismiss = (alertId) => {
    console.log('Alert dismissed:', alertId);
    // Mock alert dismissal
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Billing & Subscription - CRMPro</title>
        <meta name="description" content="Manage your CRMPro subscription, view usage metrics, and handle billing information" />
      </Helmet>
      <Header onMenuToggle={handleMenuToggle} isSidebarOpen={isSidebarOpen} />
      <Sidebar isOpen={isSidebarOpen} onClose={handleSidebarClose} />
      <main className="lg:ml-64 pt-16">
        <div className="p-4 lg:p-8 max-w-7xl mx-auto">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">
              Billing & Subscription
            </h1>
            <p className="text-muted-foreground">
              Manage your subscription, view usage metrics, and handle billing information
            </p>
          </div>

          {/* Billing Alerts */}
          <div className="mb-8">
            <BillingAlerts alerts={billingAlerts} onDismiss={handleAlertDismiss} />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="xl:col-span-2 space-y-8">
              {/* Current Plan Section */}
              <div>
                <h2 className="text-xl font-semibold text-foreground mb-6">Current Plan</h2>
                <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-2 gap-6">
                  {billingPlans?.map((plan) => (
                    <PlanCard
                      key={plan?.id}
                      plan={plan}
                      isCurrentPlan={plan?.id === currentPlanId}
                      onUpgrade={handlePlanUpgrade}
                    />
                  ))}
                </div>
              </div>

              {/* Usage Metrics */}
              <UsageMetrics metrics={usageMetrics} />

              {/* Payment Method */}
              <PaymentMethod 
                paymentMethod={paymentMethod} 
                onUpdate={handlePaymentUpdate} 
              />

              {/* Invoice History */}
              <InvoiceTable invoices={invoices} />
            </div>

            {/* Sidebar Content */}
            <div className="space-y-8">
              {/* Upgrade Card */}
              <UpgradeCard onUpgrade={handleUpgradeClick} />

              {/* Quick Actions */}
              <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <button className="w-full flex items-center justify-between p-3 text-left hover:bg-muted rounded-lg transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Icon name="Download" size={16} className="text-primary" />
                      </div>
                      <span className="text-sm font-medium text-foreground">Download Invoices</span>
                    </div>
                    <Icon name="ChevronRight" size={16} className="text-muted-foreground" />
                  </button>
                  
                  <button className="w-full flex items-center justify-between p-3 text-left hover:bg-muted rounded-lg transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-success/10 rounded-lg flex items-center justify-center">
                        <Icon name="HelpCircle" size={16} className="text-success" />
                      </div>
                      <span className="text-sm font-medium text-foreground">Billing Support</span>
                    </div>
                    <Icon name="ChevronRight" size={16} className="text-muted-foreground" />
                  </button>
                  
                  <button className="w-full flex items-center justify-between p-3 text-left hover:bg-muted rounded-lg transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-warning/10 rounded-lg flex items-center justify-center">
                        <Icon name="Settings" size={16} className="text-warning" />
                      </div>
                      <span className="text-sm font-medium text-foreground">Billing Settings</span>
                    </div>
                    <Icon name="ChevronRight" size={16} className="text-muted-foreground" />
                  </button>
                </div>
              </div>

              {/* Billing Summary */}
              <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">Billing Summary</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Current Plan</span>
                    <span className="text-sm font-medium text-foreground">Professional</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Monthly Cost</span>
                    <span className="text-sm font-medium text-foreground">$29.00</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Next Payment</span>
                    <span className="text-sm font-medium text-foreground">Dec 3, 2025</span>
                  </div>
                  <div className="border-t border-border pt-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground">Annual Savings</span>
                      <span className="text-sm font-medium text-success">$58.00</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Switch to annual billing and save 20%
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default BillingPage;