import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const BillingAlerts = ({ alerts, onDismiss }) => {
  const [dismissedAlerts, setDismissedAlerts] = useState([]);

  const getAlertIcon = (type) => {
    switch (type) {
      case 'warning':
        return 'AlertTriangle';
      case 'error':
        return 'AlertCircle';
      case 'info':
        return 'Info';
      case 'success':
        return 'CheckCircle';
      default:
        return 'Bell';
    }
  };

  const getAlertStyles = (type) => {
    switch (type) {
      case 'warning':
        return 'bg-warning/10 border-warning/20 text-warning';
      case 'error':
        return 'bg-error/10 border-error/20 text-error';
      case 'info':
        return 'bg-primary/10 border-primary/20 text-primary';
      case 'success':
        return 'bg-success/10 border-success/20 text-success';
      default:
        return 'bg-muted border-border text-muted-foreground';
    }
  };

  const handleDismiss = (alertId) => {
    setDismissedAlerts(prev => [...prev, alertId]);
    if (onDismiss) {
      onDismiss(alertId);
    }
  };

  const visibleAlerts = alerts?.filter(alert => !dismissedAlerts?.includes(alert?.id));

  if (visibleAlerts?.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {visibleAlerts?.map((alert) => (
        <div
          key={alert?.id}
          className={`
            relative p-4 border rounded-lg transition-all duration-200
            ${getAlertStyles(alert?.type)}
          `}
        >
          <div className="flex items-start space-x-3">
            <Icon 
              name={getAlertIcon(alert?.type)} 
              size={20} 
              className="flex-shrink-0 mt-0.5"
            />
            
            <div className="flex-1 space-y-2">
              <div>
                <h4 className="font-semibold text-foreground">{alert?.title}</h4>
                <p className="text-sm text-muted-foreground mt-1">{alert?.message}</p>
              </div>

              {alert?.actions && alert?.actions?.length > 0 && (
                <div className="flex items-center space-x-2">
                  {alert?.actions?.map((action, index) => (
                    <Button
                      key={index}
                      variant={action?.variant || "outline"}
                      size="sm"
                      onClick={action?.onClick}
                      iconName={action?.icon}
                      iconSize={16}
                    >
                      {action?.label}
                    </Button>
                  ))}
                </div>
              )}

              {alert?.timestamp && (
                <div className="text-xs text-muted-foreground">
                  {new Date(alert.timestamp)?.toLocaleString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              )}
            </div>

            {alert?.dismissible !== false && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDismiss(alert?.id)}
                className="flex-shrink-0 w-8 h-8"
                aria-label="Dismiss alert"
              >
                <Icon name="X" size={16} />
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default BillingAlerts;