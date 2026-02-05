import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const PlanCard = ({ plan, isCurrentPlan, onUpgrade }) => {
  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    })?.format(price);
  };

  const formatDate = (dateString) => {
    return new Date(dateString)?.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className={`
      relative p-4 lg:p-6 rounded-xl border-2 transition-all duration-200
      ${isCurrentPlan 
        ? 'border-primary bg-primary/5 shadow-lg' 
        : 'border-border bg-card hover:border-primary/30 hover:shadow-md'
      }
    `}>
      {isCurrentPlan && (
        <div className="absolute -top-3 left-4 lg:left-6">
          <span className="px-3 py-1 text-xs font-semibold bg-primary text-primary-foreground rounded-full">
            Current Plan
          </span>
        </div>
      )}
      <div className="space-y-3 lg:space-y-4">
        {/* Plan Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg lg:text-xl font-semibold text-foreground truncate">{plan?.name}</h3>
            <p className="text-xs lg:text-sm text-muted-foreground mt-1 break-words">{plan?.description}</p>
          </div>
          {plan?.badge && (
            <span className="ml-2 px-2 py-1 text-xs font-medium bg-accent text-accent-foreground rounded-full whitespace-nowrap">
              {plan?.badge}
            </span>
          )}
        </div>

        {/* Pricing */}
        <div className="flex items-baseline space-x-2">
          <span className="text-2xl lg:text-3xl font-bold text-foreground">
            {formatPrice(plan?.price)}
          </span>
          <span className="text-sm lg:text-base text-muted-foreground">/{plan?.billing}</span>
        </div>

        {/* Features */}
        <div className="space-y-2 lg:space-y-3">
          {plan?.features?.map((feature, index) => (
            <div key={index} className="flex items-start space-x-2 lg:space-x-3">
              <Icon 
                name={feature?.included ? "Check" : "X"} 
                size={14} 
                className={`mt-0.5 flex-shrink-0 ${
                  feature?.included ? 'text-success' : 'text-muted-foreground'
                }`}
              />
              <span className={`text-xs lg:text-sm leading-tight break-words ${
                feature?.included ? 'text-foreground' : 'text-muted-foreground'
              }`}>
                {feature?.name}
              </span>
            </div>
          ))}
        </div>

        {/* Next Payment (for current plan) */}
        {isCurrentPlan && plan?.nextPayment && (
          <div className="pt-3 lg:pt-4 border-t border-border">
            <div className="flex items-center justify-between text-xs lg:text-sm">
              <span className="text-muted-foreground">Next payment:</span>
              <span className="font-medium text-foreground">
                {formatDate(plan?.nextPayment)}
              </span>
            </div>
          </div>
        )}

        {/* Action Button */}
        <div className="pt-2">
          {isCurrentPlan ? (
            <Button variant="outline" fullWidth disabled size="sm">
              <Icon name="Check" size={14} className="mr-2" />
              Current Plan
            </Button>
          ) : (
            <Button 
              variant={plan?.recommended ? "default" : "outline"} 
              fullWidth
              size="sm"
              onClick={() => onUpgrade(plan)}
              className={plan?.recommended ? "bg-gradient-to-r from-primary to-secondary" : ""}
            >
              <Icon name="ArrowUp" size={14} className="mr-2" />
              {plan?.price > 0 ? 'Upgrade' : 'Downgrade'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlanCard;