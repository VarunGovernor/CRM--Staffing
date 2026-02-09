import React, { useState } from 'react';
import Header from '../../components/ui/Header';
import Sidebar from '../../components/ui/Sidebar';
import Icon from '../../components/AppIcon';
import ProfileTab from './components/ProfileTab';
import CompanyTab from './components/CompanyTab';
import TeamTab from './components/TeamTab';
import CustomFieldsTab from './components/CustomFieldsTab';
import PipelineTab from './components/PipelineTab';

const Settings = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');

  const handleSidebarToggle = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleSidebarClose = () => {
    setIsSidebarOpen(false);
  };

  const tabs = [
    {
      id: 'profile',
      label: 'Profile',
      icon: 'User',
      description: 'Personal information and preferences'
    },
    {
      id: 'company',
      label: 'Company',
      icon: 'Building2',
      description: 'Organization details and branding'
    },
    {
      id: 'team',
      label: 'Team & Roles',
      icon: 'Users',
      description: 'Manage team members and permissions'
    },
    {
      id: 'fields',
      label: 'Custom Fields',
      icon: 'Settings',
      description: 'Create and manage custom fields'
    },
    {
      id: 'pipeline',
      label: 'Pipeline',
      icon: 'GitBranch',
      description: 'Configure sales pipeline and automation'
    },
    {
      id: 'automation',
      label: 'Automation',
      icon: 'Zap',
      description: 'Workflow automation rules (Phase 2)'
    }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return <ProfileTab />;
      case 'company':
        return <CompanyTab />;
      case 'team':
        return <TeamTab />;
      case 'fields':
        return <CustomFieldsTab />;
      case 'pipeline':
        return <PipelineTab />;
      case 'automation':
        return (
          <div className="p-6 lg:p-8">
            <div className="max-w-2xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                  <Icon name="Zap" size={24} className="text-amber-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-foreground">Automation Rules</h2>
                  <p className="text-sm text-muted-foreground">Coming in Phase 2</p>
                </div>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 mb-6">
                <p className="text-sm text-amber-800">
                  Workflow automation is planned for Phase 2. This will include:
                </p>
                <ul className="mt-3 space-y-2 text-sm text-amber-700">
                  <li className="flex items-center gap-2"><Icon name="Check" size={14} /> Auto-assign recruiters to new candidates based on rules</li>
                  <li className="flex items-center gap-2"><Icon name="Check" size={14} /> Auto-notify managers on submission status changes</li>
                  <li className="flex items-center gap-2"><Icon name="Check" size={14} /> Auto-update candidate status based on placement events</li>
                  <li className="flex items-center gap-2"><Icon name="Check" size={14} /> Scheduled reports and alert thresholds</li>
                  <li className="flex items-center gap-2"><Icon name="Check" size={14} /> QuickBooks invoice sync triggers</li>
                </ul>
              </div>
              <div className="space-y-4">
                {[
                  { name: 'Auto-assign Recruiter', description: 'Automatically assign a recruiter when a new candidate is created', enabled: false },
                  { name: 'NCA Reminder', description: 'Send reminder after 48h if NCA is not uploaded', enabled: false },
                  { name: 'Submission Follow-up', description: 'Auto-notify sales if no response within 3 days', enabled: false },
                  { name: 'Placement Notification', description: 'Notify HR and Finance when a candidate is placed', enabled: false }
                ].map((rule, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border">
                    <div>
                      <p className="text-sm font-medium text-foreground">{rule.name}</p>
                      <p className="text-xs text-muted-foreground">{rule.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">Phase 2</span>
                      <div className="w-10 h-6 bg-gray-200 rounded-full relative cursor-not-allowed opacity-50">
                        <div className="w-4 h-4 bg-white rounded-full absolute top-1 left-1 shadow-sm"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      default:
        return <ProfileTab />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header onMenuToggle={handleSidebarToggle} isSidebarOpen={isSidebarOpen} />
      <Sidebar isOpen={isSidebarOpen} onClose={handleSidebarClose} />
      <main className="lg:ml-64 pt-16">
        <div className="p-4 lg:p-8">
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex items-center space-x-4 mb-2">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <Icon name="Settings" size={24} className="text-primary" />
              </div>
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Settings</h1>
                <p className="text-muted-foreground">Configure your CRM system and preferences</p>
              </div>
            </div>
          </div>

          {/* Settings Content */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            {/* Desktop Tabs */}
            <div className="hidden lg:block border-b border-border">
              <nav className="flex space-x-8 px-6">
                {tabs?.map((tab) => (
                  <button
                    key={tab?.id}
                    onClick={() => setActiveTab(tab?.id)}
                    className={`
                      flex items-center space-x-2 py-4 px-2 border-b-2 font-medium text-sm transition-smooth
                      ${activeTab === tab?.id
                        ? 'border-primary text-primary' :'border-transparent text-muted-foreground hover:text-foreground hover:border-muted'
                      }
                    `}
                  >
                    <Icon name={tab?.icon} size={18} />
                    <span>{tab?.label}</span>
                  </button>
                ))}
              </nav>
            </div>

            {/* Mobile Tab Selector */}
            <div className="lg:hidden border-b border-border p-4">
              <div className="relative">
                <select
                  value={activeTab}
                  onChange={(e) => setActiveTab(e?.target?.value)}
                  className="w-full appearance-none bg-background border border-border rounded-lg px-4 py-3 pr-10 text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  {tabs?.map((tab) => (
                    <option key={tab?.id} value={tab?.id}>
                      {tab?.label} - {tab?.description}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <Icon name="ChevronDown" size={20} className="text-muted-foreground" />
                </div>
              </div>
            </div>

            {/* Tab Content */}
            <div className="p-6 lg:p-8">
              {/* Tab Description - Desktop Only */}
              <div className="hidden lg:block mb-6">
                <div className="flex items-center space-x-3">
                  <Icon 
                    name={tabs?.find(tab => tab?.id === activeTab)?.icon || 'Settings'} 
                    size={20} 
                    className="text-primary" 
                  />
                  <div>
                    <h2 className="text-lg font-semibold text-card-foreground">
                      {tabs?.find(tab => tab?.id === activeTab)?.label}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {tabs?.find(tab => tab?.id === activeTab)?.description}
                    </p>
                  </div>
                </div>
              </div>

              {/* Render Active Tab Content */}
              {renderTabContent()}
            </div>
          </div>

          {/* Help Section */}
          <div className="mt-8 bg-muted rounded-xl p-6">
            <div className="flex items-start space-x-4">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <Icon name="HelpCircle" size={20} className="text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-card-foreground mb-2">Need Help?</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  If you need assistance with any settings, check out our documentation or contact support.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button className="inline-flex items-center px-4 py-2 bg-background border border-border rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-smooth">
                    <Icon name="Book" size={16} className="mr-2" />
                    View Documentation
                  </button>
                  <button className="inline-flex items-center px-4 py-2 bg-background border border-border rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-smooth">
                    <Icon name="MessageCircle" size={16} className="mr-2" />
                    Contact Support
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Settings;