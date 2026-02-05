import React, { useState } from 'react';
import Header from '../../components/ui/Header';
import Sidebar from '../../components/ui/Sidebar';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import IntegrationCard from './components/IntegrationCard';
import CategoryFilter from './components/CategoryFilter';
import SetupWizard from './components/SetupWizard';
import ConnectedIntegrationsList from './components/ConnectedIntegrationsList';

const IntegrationsPage = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedIntegration, setSelectedIntegration] = useState(null);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
  { id: 'all', name: 'All Integrations', count: 12 },
  { id: 'email', name: 'Email & Calendar', count: 3 },
  { id: 'communication', name: 'Communication', count: 2 },
  { id: 'payments', name: 'Payments', count: 2 },
  { id: 'productivity', name: 'Productivity', count: 3 },
  { id: 'analytics', name: 'Analytics', count: 2 }];


  const integrations = [
  {
    id: 'google-workspace',
    name: 'Google Workspace',
    category: 'email',
    logo: "https://images.unsplash.com/photo-1730817403196-80d494660640",
    description: 'Sync emails, calendar events, and contacts with your Google Workspace account for seamless productivity.',
    features: [
    'Email synchronization',
    'Calendar integration',
    'Contact management',
    'Drive file sharing'],

    isConnected: true,
    status: 'connected',
    statusText: 'Connected',
    lastSync: '2 minutes ago',
    syncFrequency: 'Every 15 minutes',
    isPopular: true,
    notifications: [
    { label: 'New emails', enabled: true },
    { label: 'Calendar reminders', enabled: true },
    { label: 'Contact updates', enabled: false }]

  },
  {
    id: 'outlook',
    name: 'Microsoft Outlook',
    category: 'email',
    logo: "https://images.unsplash.com/photo-1729860647900-951d7184b5c0",
    description: 'Connect your Outlook account to sync emails, meetings, and contacts across your Microsoft ecosystem.',
    features: [
    'Email synchronization',
    'Meeting integration',
    'Contact sync',
    'Teams integration'],

    isConnected: false,
    status: 'disconnected',
    statusText: 'Not connected',
    lastSync: null,
    syncFrequency: 'Every 30 minutes',
    isPopular: true,
    notifications: []
  },
  {
    id: 'slack',
    name: 'Slack',
    category: 'communication',
    logo: "https://images.unsplash.com/photo-1497565998880-bd009060dcd7",
    description: 'Get real-time CRM notifications and updates directly in your Slack channels for better team collaboration.',
    features: [
    'Deal notifications',
    'Activity updates',
    'Team mentions',
    'Custom alerts'],

    isConnected: true,
    status: 'connected',
    statusText: 'Connected',
    lastSync: '5 minutes ago',
    syncFrequency: 'Real-time',
    isPopular: false,
    notifications: [
    { label: 'Deal updates', enabled: true },
    { label: 'New leads', enabled: true },
    { label: 'Task reminders', enabled: false }]

  },
  {
    id: 'stripe',
    name: 'Stripe',
    category: 'payments',
    logo: "https://images.unsplash.com/photo-1507362569319-ce3cce2b6e32",
    description: 'Automatically sync payment data and customer information from Stripe to track revenue and billing.',
    features: [
    'Payment tracking',
    'Customer sync',
    'Invoice management',
    'Revenue analytics'],

    isConnected: false,
    status: 'disconnected',
    statusText: 'Not connected',
    lastSync: null,
    syncFrequency: 'Every hour',
    isPopular: true,
    notifications: []
  },
  {
    id: 'zapier',
    name: 'Zapier',
    category: 'productivity',
    logo: "https://images.unsplash.com/photo-1648134859182-98df6e93ef58",
    description: 'Connect CRMPro with 5000+ apps through Zapier to automate your workflows and boost productivity.',
    features: [
    'Workflow automation',
    '5000+ app connections',
    'Custom triggers',
    'Data synchronization'],

    isConnected: false,
    status: 'disconnected',
    statusText: 'Not connected',
    lastSync: null,
    syncFrequency: 'Event-based',
    isPopular: false,
    notifications: []
  },
  {
    id: 'hubspot',
    name: 'HubSpot',
    category: 'productivity',
    logo: "https://images.unsplash.com/photo-1632518193201-72278769704a",
    description: 'Migrate and sync data between HubSpot and CRMPro for unified customer relationship management.',
    features: [
    'Data migration',
    'Contact sync',
    'Deal pipeline sync',
    'Marketing automation'],

    isConnected: false,
    status: 'disconnected',
    statusText: 'Not connected',
    lastSync: null,
    syncFrequency: 'Daily',
    isPopular: false,
    notifications: []
  },
  {
    id: 'mailchimp',
    name: 'Mailchimp',
    category: 'email',
    logo: "https://images.unsplash.com/photo-1680459575540-2bbdf72151c2",
    description: 'Sync your email marketing campaigns and subscriber data with CRMPro for better lead nurturing.',
    features: [
    'Email campaign sync',
    'Subscriber management',
    'Campaign analytics',
    'Lead scoring'],

    isConnected: true,
    status: 'syncing',
    statusText: 'Syncing...',
    lastSync: '1 hour ago',
    syncFrequency: 'Every 2 hours',
    isPopular: false,
    notifications: [
    { label: 'Campaign updates', enabled: true },
    { label: 'New subscribers', enabled: false }]

  },
  {
    id: 'zoom',
    name: 'Zoom',
    category: 'communication',
    logo: "https://images.unsplash.com/photo-1585418052482-a987e68cef2c",
    description: 'Schedule and track Zoom meetings directly from CRMPro with automatic meeting notes and recordings.',
    features: [
    'Meeting scheduling',
    'Automatic recordings',
    'Meeting notes sync',
    'Calendar integration'],

    isConnected: false,
    status: 'disconnected',
    statusText: 'Not connected',
    lastSync: null,
    syncFrequency: 'Real-time',
    isPopular: false,
    notifications: []
  }];


  const handleSidebarToggle = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleSidebarClose = () => {
    setIsSidebarOpen(false);
  };

  const handleConnect = (integrationId) => {
    const integration = integrations?.find((int) => int?.id === integrationId);
    setSelectedIntegration(integration);
    setIsWizardOpen(true);
  };

  const handleDisconnect = (integrationId) => {
    console.log('Disconnecting integration:', integrationId);
    // In a real app, this would make an API call to disconnect the integration
  };

  const handleConfigure = (integrationId) => {
    console.log('Configuring integration:', integrationId);
    // In a real app, this would open configuration modal or navigate to settings
  };

  const handleWizardComplete = (integrationId) => {
    console.log('Integration setup completed:', integrationId);
    setIsWizardOpen(false);
    setSelectedIntegration(null);
    // In a real app, this would update the integration status
  };

  const handleWizardClose = () => {
    setIsWizardOpen(false);
    setSelectedIntegration(null);
  };

  const filteredIntegrations = integrations?.filter((integration) => {
    const matchesCategory = activeCategory === 'all' || integration?.category === activeCategory;
    const matchesSearch = integration?.name?.toLowerCase()?.includes(searchQuery?.toLowerCase()) ||
    integration?.description?.toLowerCase()?.includes(searchQuery?.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-background">
      <Header onMenuToggle={handleSidebarToggle} isSidebarOpen={isSidebarOpen} />
      <Sidebar isOpen={isSidebarOpen} onClose={handleSidebarClose} />
      <main className="lg:ml-64 pt-16">
        <div className="p-6 lg:p-8 max-w-7xl mx-auto">
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-foreground">Integrations</h1>
                <p className="text-muted-foreground mt-1">
                  Connect your favorite tools and services to enhance your CRM workflow
                </p>
              </div>
              
              <div className="flex items-center space-x-3">
                <Button
                  variant="outline"
                  iconName="RefreshCw"
                  iconPosition="left">

                  Sync All
                </Button>
                <Button
                  variant="default"
                  iconName="Plus"
                  iconPosition="left">

                  Browse More
                </Button>
              </div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
              <div className="relative flex-1 max-w-md">
                <Icon
                  name="Search"
                  size={20}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />

                <input
                  type="text"
                  placeholder="Search integrations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e?.target?.value)}
                  className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent" />

              </div>
            </div>
            
            <CategoryFilter
              categories={categories}
              activeCategory={activeCategory}
              onCategoryChange={setActiveCategory} />

          </div>

          {/* Connected Integrations Summary */}
          <div className="mb-8">
            <ConnectedIntegrationsList
              integrations={integrations}
              onDisconnect={handleDisconnect}
              onConfigure={handleConfigure} />

          </div>

          {/* Available Integrations */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Available Integrations</h2>
                <p className="text-sm text-muted-foreground">
                  {filteredIntegrations?.length} integration{filteredIntegrations?.length !== 1 ? 's' : ''} available
                </p>
              </div>
            </div>

            {filteredIntegrations?.length === 0 ?
            <div className="bg-card border border-border rounded-lg p-8 text-center">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <Icon name="Search" size={24} className="text-muted-foreground" />
                </div>
                <h3 className="font-semibold text-card-foreground mb-2">No integrations found</h3>
                <p className="text-muted-foreground">
                  Try adjusting your search or filter criteria to find the integration you're looking for.
                </p>
              </div> :

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredIntegrations?.map((integration) =>
              <IntegrationCard
                key={integration?.id}
                integration={integration}
                onConnect={handleConnect}
                onDisconnect={handleDisconnect}
                onConfigure={handleConfigure} />

              )}
              </div>
            }
          </div>

          {/* Help Section */}
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center">
                <Icon name="HelpCircle" size={24} className="text-accent" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-card-foreground mb-2">Need Help with Integrations?</h3>
                <p className="text-muted-foreground mb-4">
                  Our integration guides and support team are here to help you connect your tools seamlessly.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Button variant="outline" size="sm" iconName="Book" iconPosition="left">
                    View Documentation
                  </Button>
                  <Button variant="outline" size="sm" iconName="MessageCircle" iconPosition="left">
                    Contact Support
                  </Button>
                  <Button variant="outline" size="sm" iconName="Video" iconPosition="left">
                    Watch Tutorials
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      {/* Setup Wizard Modal */}
      <SetupWizard
        integration={selectedIntegration}
        isOpen={isWizardOpen}
        onClose={handleWizardClose}
        onComplete={handleWizardComplete} />

    </div>);

};

export default IntegrationsPage;