import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Header from '../../components/ui/Header';
import Sidebar from '../../components/ui/Sidebar';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import { Checkbox } from '../../components/ui/Checkbox';
import { useAuth } from '../../contexts/AuthContext';
import { usePermissions } from '../../components/ProtectedRoute';
import { getAccountSettingsSections, ROLES } from '../../lib/permissions';

const AccountSettings = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { userProfile } = useAuth();
  const { userRole, permissionLevel } = usePermissions();

  const availableSections = getAccountSettingsSections(userRole);
  const [activeSection, setActiveSection] = useState(availableSections[0]?.id || 'general');

  const renderSectionContent = () => {
    switch (activeSection) {
      case 'general':
        return <GeneralSection />;
      case 'security':
        return <SecuritySection />;
      case 'notifications':
        return <NotificationsSection />;
      case 'integrations':
        return <IntegrationsSection />;
      case 'hr':
        return <HRSettingsSection />;
      case 'finance':
        return <FinanceSettingsSection />;
      case 'api':
        return <APIAccessSection />;
      default:
        return (
          <div className="text-center py-12 text-muted-foreground">
            <Icon name="Settings" size={48} className="mx-auto mb-4 opacity-50" />
            <p>Select a section to configure</p>
          </div>
        );
    }
  };

  const sectionIcons = {
    general: 'Settings',
    security: 'Shield',
    notifications: 'Bell',
    integrations: 'Puzzle',
    hr: 'Users',
    finance: 'DollarSign',
    api: 'Code'
  };

  return (
    <div className="min-h-screen bg-background">
      <Header onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)} isSidebarOpen={isSidebarOpen} />
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <main className="lg:ml-64 pt-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="p-4 lg:p-8"
        >
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex items-center space-x-4 mb-2">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <Icon name="Settings" size={24} className="text-primary" />
              </div>
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Account Settings</h1>
                <p className="text-muted-foreground">
                  {permissionLevel === 'full'
                    ? 'Configure system-wide account settings'
                    : `Manage ${userRole === 'hr' ? 'HR' : 'Finance'}-related configurations`
                  }
                </p>
              </div>
            </div>
            {permissionLevel === 'limited' && (
              <div className="mt-4 flex items-center space-x-2 text-sm px-4 py-3 bg-warning/10 text-warning border border-warning/20 rounded-lg">
                <Icon name="Info" size={16} />
                <span>
                  You have limited access to account settings. Only {userRole === 'hr' ? 'HR' : 'Finance'}-related
                  configurations are available.
                </span>
              </div>
            )}
          </div>

          {/* Settings Layout */}
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Section Navigation */}
            <div className="lg:w-64 flex-shrink-0">
              <div className="bg-card border border-border rounded-xl p-2">
                <nav className="space-y-1">
                  {availableSections.map((section) => (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-smooth ${
                        activeSection === section.id
                          ? 'bg-primary/10 text-primary'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      }`}
                    >
                      <Icon name={sectionIcons[section.id] || 'Settings'} size={18} />
                      <span>{section.label}</span>
                    </button>
                  ))}
                </nav>
              </div>
            </div>

            {/* Section Content */}
            <div className="flex-1 min-w-0">
              {renderSectionContent()}
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

/* ========== Section Components ========== */

const GeneralSection = () => {
  const [companyName, setCompanyName] = useState('Acme Corp');
  const [companyDomain, setCompanyDomain] = useState('acme.crmpro.com');
  const [dateFormat, setDateFormat] = useState('MM/DD/YYYY');
  const [currency, setCurrency] = useState('USD');

  return (
    <div className="space-y-6">
      <SectionCard
        icon="Building2"
        title="General Settings"
        description="Configure basic account information"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Company Name" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
          <Input label="Company Domain" value={companyDomain} onChange={(e) => setCompanyDomain(e.target.value)} />
          <Select
            label="Date Format"
            options={[
              { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
              { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
              { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' }
            ]}
            value={dateFormat}
            onChange={setDateFormat}
          />
          <Select
            label="Default Currency"
            options={[
              { value: 'USD', label: 'USD ($)' },
              { value: 'EUR', label: 'EUR (\u20AC)' },
              { value: 'GBP', label: 'GBP (\u00A3)' },
              { value: 'INR', label: 'INR (\u20B9)' }
            ]}
            value={currency}
            onChange={setCurrency}
          />
        </div>
        <div className="flex justify-end mt-6">
          <Button variant="default" iconName="Save" iconPosition="left">Save Changes</Button>
        </div>
      </SectionCard>
    </div>
  );
};

const SecuritySection = () => (
  <div className="space-y-6">
    <SectionCard
      icon="Shield"
      title="Security Settings"
      description="Manage authentication and security policies"
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
          <div>
            <div className="font-medium text-foreground">Two-Factor Authentication</div>
            <div className="text-sm text-muted-foreground">Add an extra layer of security to accounts</div>
          </div>
          <Button variant="outline" size="sm">Configure</Button>
        </div>
        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
          <div>
            <div className="font-medium text-foreground">Session Timeout</div>
            <div className="text-sm text-muted-foreground">Auto-logout after period of inactivity</div>
          </div>
          <Select
            options={[
              { value: '15', label: '15 minutes' },
              { value: '30', label: '30 minutes' },
              { value: '60', label: '1 hour' },
              { value: '480', label: '8 hours' }
            ]}
            value="30"
            onChange={() => {}}
          />
        </div>
        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
          <div>
            <div className="font-medium text-foreground">Password Policy</div>
            <div className="text-sm text-muted-foreground">Minimum password requirements for all users</div>
          </div>
          <Button variant="outline" size="sm">Configure</Button>
        </div>
        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
          <div>
            <div className="font-medium text-foreground">IP Allowlist</div>
            <div className="text-sm text-muted-foreground">Restrict access to specific IP addresses</div>
          </div>
          <Button variant="outline" size="sm">Manage</Button>
        </div>
      </div>
    </SectionCard>
  </div>
);

const NotificationsSection = () => {
  const [systemAlerts, setSystemAlerts] = useState(true);
  const [securityAlerts, setSecurityAlerts] = useState(true);
  const [billingAlerts, setBillingAlerts] = useState(true);
  const [usageAlerts, setUsageAlerts] = useState(false);

  return (
    <div className="space-y-6">
      <SectionCard
        icon="Bell"
        title="System Notifications"
        description="Configure account-wide notification settings"
      >
        <div className="space-y-4">
          <Checkbox
            label="System Alerts"
            description="Downtime, maintenance, and critical system notifications"
            checked={systemAlerts}
            onChange={(e) => setSystemAlerts(e.target.checked)}
          />
          <Checkbox
            label="Security Alerts"
            description="Suspicious login attempts and security events"
            checked={securityAlerts}
            onChange={(e) => setSecurityAlerts(e.target.checked)}
          />
          <Checkbox
            label="Billing Alerts"
            description="Payment failures, subscription changes, and invoice reminders"
            checked={billingAlerts}
            onChange={(e) => setBillingAlerts(e.target.checked)}
          />
          <Checkbox
            label="Usage Alerts"
            description="Approaching plan limits for contacts, storage, or API calls"
            checked={usageAlerts}
            onChange={(e) => setUsageAlerts(e.target.checked)}
          />
        </div>
        <div className="flex justify-end mt-6">
          <Button variant="default" iconName="Save" iconPosition="left">Save Preferences</Button>
        </div>
      </SectionCard>
    </div>
  );
};

const IntegrationsSection = () => (
  <div className="space-y-6">
    <SectionCard
      icon="Puzzle"
      title="Integrations"
      description="Manage third-party service connections"
    >
      <div className="space-y-4">
        {[
          { name: 'Slack', desc: 'Send CRM notifications to Slack channels', icon: 'MessageSquare', connected: true },
          { name: 'Google Workspace', desc: 'Sync contacts, calendar, and email', icon: 'Mail', connected: true },
          { name: 'Stripe', desc: 'Process payments and manage subscriptions', icon: 'CreditCard', connected: false },
          { name: 'Zapier', desc: 'Automate workflows with 5000+ apps', icon: 'Zap', connected: false }
        ].map((integration) => (
          <div key={integration.name} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-background border border-border rounded-lg flex items-center justify-center">
                <Icon name={integration.icon} size={20} className="text-foreground" />
              </div>
              <div>
                <div className="font-medium text-foreground">{integration.name}</div>
                <div className="text-sm text-muted-foreground">{integration.desc}</div>
              </div>
            </div>
            <Button
              variant={integration.connected ? 'outline' : 'default'}
              size="sm"
            >
              {integration.connected ? 'Configure' : 'Connect'}
            </Button>
          </div>
        ))}
      </div>
    </SectionCard>
  </div>
);

const HRSettingsSection = () => {
  const [probationDays, setProbationDays] = useState('90');
  const [autoOnboarding, setAutoOnboarding] = useState(true);
  const [complianceReminders, setComplianceReminders] = useState(true);

  return (
    <div className="space-y-6">
      <SectionCard
        icon="Users"
        title="HR Settings"
        description="Configure HR workflows and policies"
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Default Probation Period"
              options={[
                { value: '30', label: '30 days' },
                { value: '60', label: '60 days' },
                { value: '90', label: '90 days' },
                { value: '180', label: '180 days' }
              ]}
              value={probationDays}
              onChange={setProbationDays}
            />
          </div>
          <div className="space-y-4">
            <Checkbox
              label="Auto-create Onboarding Tasks"
              description="Automatically generate onboarding checklists for new hires"
              checked={autoOnboarding}
              onChange={(e) => setAutoOnboarding(e.target.checked)}
            />
            <Checkbox
              label="Compliance Reminders"
              description="Send reminders for expiring documents and compliance deadlines"
              checked={complianceReminders}
              onChange={(e) => setComplianceReminders(e.target.checked)}
            />
          </div>
          <div className="flex justify-end">
            <Button variant="default" iconName="Save" iconPosition="left">Save HR Settings</Button>
          </div>
        </div>
      </SectionCard>
    </div>
  );
};

const FinanceSettingsSection = () => {
  const [invoicePrefix, setInvoicePrefix] = useState('INV');
  const [defaultPaymentTerms, setDefaultPaymentTerms] = useState('net30');
  const [autoInvoice, setAutoInvoice] = useState(false);
  const [taxRate, setTaxRate] = useState('0');

  return (
    <div className="space-y-6">
      <SectionCard
        icon="DollarSign"
        title="Finance Settings"
        description="Configure invoicing and financial preferences"
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Invoice Prefix"
              value={invoicePrefix}
              onChange={(e) => setInvoicePrefix(e.target.value)}
              placeholder="INV"
            />
            <Select
              label="Default Payment Terms"
              options={[
                { value: 'due_on_receipt', label: 'Due on Receipt' },
                { value: 'net15', label: 'Net 15' },
                { value: 'net30', label: 'Net 30' },
                { value: 'net45', label: 'Net 45' },
                { value: 'net60', label: 'Net 60' }
              ]}
              value={defaultPaymentTerms}
              onChange={setDefaultPaymentTerms}
            />
            <Input
              label="Default Tax Rate (%)"
              type="number"
              value={taxRate}
              onChange={(e) => setTaxRate(e.target.value)}
              placeholder="0"
            />
          </div>
          <div className="space-y-4">
            <Checkbox
              label="Auto-generate Invoices"
              description="Automatically create invoices for completed placements"
              checked={autoInvoice}
              onChange={(e) => setAutoInvoice(e.target.checked)}
            />
          </div>
          <div className="flex justify-end">
            <Button variant="default" iconName="Save" iconPosition="left">Save Finance Settings</Button>
          </div>
        </div>
      </SectionCard>
    </div>
  );
};

const APIAccessSection = () => (
  <div className="space-y-6">
    <SectionCard
      icon="Code"
      title="API Access"
      description="Manage API keys and developer access"
    >
      <div className="space-y-6">
        <div className="p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="font-medium text-foreground">Production API Key</div>
            <Button variant="outline" size="sm" iconName="Copy" iconPosition="left">Copy</Button>
          </div>
          <code className="text-sm text-muted-foreground font-mono bg-background px-3 py-2 rounded border border-border block">
            sk_live_••••••••••••••••••••••••
          </code>
        </div>
        <div className="p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="font-medium text-foreground">Test API Key</div>
            <Button variant="outline" size="sm" iconName="Copy" iconPosition="left">Copy</Button>
          </div>
          <code className="text-sm text-muted-foreground font-mono bg-background px-3 py-2 rounded border border-border block">
            sk_test_••••••••••••••••••••••••
          </code>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" iconName="RefreshCw" iconPosition="left">Regenerate Keys</Button>
          <Button variant="outline" iconName="ExternalLink" iconPosition="left">API Documentation</Button>
        </div>
      </div>
    </SectionCard>
  </div>
);

/* ========== Shared UI ========== */

const SectionCard = ({ icon, title, description, children }) => (
  <div className="bg-card border border-border rounded-xl p-6">
    <div className="flex items-center space-x-4 mb-6">
      <Icon name={icon} size={24} className="text-primary" />
      <div>
        <h3 className="text-lg font-semibold text-card-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
    {children}
  </div>
);

export default AccountSettings;
