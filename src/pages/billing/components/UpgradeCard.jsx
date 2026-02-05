import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const UpgradeCard = ({ onUpgrade }) => {
  const premiumFeatures = [
    "Unlimited contacts and deals",
    "Advanced analytics & reporting", 
    "Custom pipeline stages",
    "Email automation workflows",
    "Priority customer support",
    "Advanced integrations",
    "Team collaboration tools",
    "Custom fields & properties"
  ];

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-primary via-primary to-secondary rounded-xl p-6 text-primary-foreground">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-4 right-4 w-32 h-32 border border-white/20 rounded-full" />
        <div className="absolute bottom-4 left-4 w-24 h-24 border border-white/20 rounded-full" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-40 h-40 border border-white/10 rounded-full" />
      </div>
      <div className="relative z-10 space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
            <Icon name="Crown" size={24} color="white" />
          </div>
          <div>
            <h3 className="text-xl font-bold">Upgrade to Premium</h3>
            <p className="text-primary-foreground/80">Unlock the full potential of CRMPro</p>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {premiumFeatures?.map((feature, index) => (
            <div key={index} className="flex items-center space-x-2">
              <Icon name="Check" size={16} className="text-white flex-shrink-0" />
              <span className="text-sm text-primary-foreground/90">{feature}</span>
            </div>
          ))}
        </div>

        {/* Pricing */}
        <div className="bg-white/10 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold">$49/month</div>
              <div className="text-sm text-primary-foreground/80">
                Save 20% with annual billing
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-primary-foreground/80 line-through">$79/month</div>
              <div className="text-xs text-primary-foreground/70">Regular price</div>
            </div>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="space-y-3">
          <Button
            variant="secondary"
            fullWidth
            size="lg"
            onClick={onUpgrade}
            className="bg-white/20 hover:bg-white/30 text-white border-white/30 font-semibold"
          >
            <Icon name="ArrowUp" size={18} className="mr-2" />
            Upgrade Now - 30% Off
          </Button>
          
          <div className="flex items-center justify-center space-x-4 text-xs text-primary-foreground/70">
            <div className="flex items-center space-x-1">
              <Icon name="Shield" size={12} />
              <span>30-day money back</span>
            </div>
            <div className="flex items-center space-x-1">
              <Icon name="Zap" size={12} />
              <span>Instant activation</span>
            </div>
          </div>
        </div>

        {/* Limited Time Offer */}
        <div className="bg-accent/20 border border-accent/30 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <Icon name="Clock" size={16} className="text-accent" />
            <div>
              <div className="text-sm font-medium text-accent">Limited Time Offer</div>
              <div className="text-xs text-primary-foreground/80">
                30% discount expires in 5 days
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpgradeCard;