import React from 'react';
import { motion } from 'framer-motion';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import DealCard from './DealCard';

const PipelineColumn = ({ 
  stage, 
  deals, 
  onDealMove, 
  onAddDeal, 
  onEditDeal, 
  onDeleteDeal,
  onCloneDeal 
}) => {
  const getStageColor = (stageName) => {
    const colors = {
      'New': 'bg-blue-100 text-blue-800 border-blue-200',
      'Qualified': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'Proposal': 'bg-purple-100 text-purple-800 border-purple-200',
      'Won': 'bg-green-100 text-green-800 border-green-200',
      'Lost': 'bg-red-100 text-red-800 border-red-200'
    };
    return colors?.[stageName] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getTotalValue = () => {
    return deals?.reduce((sum, deal) => sum + deal?.value, 0);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })?.format(amount);
  };

  const handleDragOver = (e) => {
    e?.preventDefault();
  };

  const handleDrop = (e) => {
    e?.preventDefault();
    const dealId = e?.dataTransfer?.getData('text/plain');
    if (dealId && onDealMove) {
      onDealMove(dealId, stage?.id);
    }
  };

  return (
    <div className="flex flex-col h-full bg-muted/30 rounded-xl border border-border">
      {/* Column Header */}
      <div className="p-4 border-b border-border bg-background/50">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <span className={`px-3 py-1.5 text-sm font-semibold rounded-full border ${getStageColor(stage?.name)}`}>
              {stage?.name}
            </span>
            <span className="text-sm font-medium text-foreground bg-muted px-2 py-1 rounded-full">
              {deals?.length} deal{deals?.length !== 1 ? 's' : ''}
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onAddDeal(stage?.id)}
            className="h-8 w-8 hover:bg-primary/10"
            aria-label={`Add deal to ${stage?.name}`}
          >
            <Icon name="Plus" size={16} />
          </Button>
        </div>
        
        <div className="text-xl font-bold text-primary">
          {formatCurrency(getTotalValue())}
        </div>
      </div>
      {/* Deals Container */}
      <div 
        className="flex-1 p-3 space-y-3 overflow-y-auto min-h-0"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {deals?.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <Icon name="Target" size={28} className="text-muted-foreground" />
            </div>
            <p className="text-base font-medium text-foreground mb-2">No deals in {stage?.name}</p>
            <p className="text-sm text-muted-foreground mb-4">Get started by adding your first deal</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onAddDeal(stage?.id)}
              iconName="Plus"
              iconPosition="left"
              iconSize={14}
              className="font-medium"
            >
              Add Deal
            </Button>
          </div>
        ) : (
          deals?.map((deal, index) => (
            <motion.div
              key={deal?.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <DealCard
                deal={deal}
                onEdit={() => onEditDeal(deal)}
                onDelete={() => onDeleteDeal(deal?.id)}
                onClone={() => onCloneDeal(deal)}
              />
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default PipelineColumn;