import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Image from '../../../components/AppImage';

const ConnectedIntegrationsList = ({ integrations, onDisconnect, onConfigure }) => {
  const connectedIntegrations = integrations?.filter(integration => integration?.isConnected);

  if (connectedIntegrations?.length === 0) {
    return (
      <div className="bg-card border border-border rounded-lg p-8 text-center">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
          <Icon name="Link" size={24} className="text-muted-foreground" />
        </div>
        <h3 className="font-semibold text-card-foreground mb-2">No Connected Integrations</h3>
        <p className="text-muted-foreground">
          Connect your first integration to start syncing data with CRMPro.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-lg">
      <div className="p-4 border-b border-border">
        <h3 className="font-semibold text-card-foreground">Connected Integrations</h3>
        <p className="text-sm text-muted-foreground">
          {connectedIntegrations?.length} integration{connectedIntegrations?.length !== 1 ? 's' : ''} active
        </p>
      </div>
      <div className="divide-y divide-border">
        {connectedIntegrations?.map((integration) => (
          <div key={integration?.id} className="p-4 hover:bg-muted/50 transition-smooth">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                  <Image 
                    src={integration?.logo} 
                    alt={`${integration?.name} connected service logo`}
                    className="w-6 h-6 object-contain"
                  />
                </div>
                
                <div>
                  <div className="flex items-center space-x-2">
                    <h4 className="font-medium text-card-foreground">{integration?.name}</h4>
                    <div className="flex items-center space-x-1">
                      <Icon 
                        name={integration?.status === 'connected' ? 'CheckCircle' : 'AlertCircle'} 
                        size={14} 
                        className={integration?.status === 'connected' ? 'text-success' : 'text-error'}
                      />
                      <span className={`text-xs ${
                        integration?.status === 'connected' ? 'text-success' : 'text-error'
                      }`}>
                        {integration?.statusText}
                      </span>
                    </div>
                  </div>
                  
                  {integration?.lastSync && (
                    <p className="text-sm text-muted-foreground">
                      Last synced: {integration?.lastSync}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onConfigure(integration?.id)}
                  iconName="Settings"
                  iconPosition="left"
                >
                  Configure
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDisconnect(integration?.id)}
                  iconName="Unlink"
                  iconPosition="left"
                >
                  Disconnect
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ConnectedIntegrationsList;