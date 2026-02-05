import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Image from '../../../components/AppImage';

const DealCard = ({ deal, onEdit, onDelete, onClone }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })?.format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString)?.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getPriorityColor = (priority) => {
    const colors = {
      'High': 'bg-red-100 text-red-800 border-red-200',
      'Medium': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'Low': 'bg-green-100 text-green-800 border-green-200'
    };
    return colors?.[priority] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getCloseDateStatus = (closeDate) => {
    const today = new Date();
    const close = new Date(closeDate);
    const diffTime = close - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { color: 'text-red-600', text: 'Overdue' };
    if (diffDays <= 7) return { color: 'text-yellow-600', text: 'Due Soon' };
    return { color: 'text-muted-foreground', text: formatDate(closeDate) };
  };

  const handleDragStart = (e) => {
    setIsDragging(true);
    e?.dataTransfer?.setData('text/plain', deal?.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const closeDateStatus = getCloseDateStatus(deal?.closeDate);

  return (
    <motion.div
      className={`
        relative bg-card border border-border rounded-lg p-4 cursor-move
        transition-all duration-200 hover:shadow-elevation-2
        ${isDragging ? 'opacity-50 rotate-2 scale-105' : ''}
      `}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ y: -2 }}
      layout
    >
      {/* Actions Menu */}
      {isHovered && !isDragging && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute top-2 right-2 flex space-x-1 bg-background border border-border rounded-md shadow-elevation-1 p-1 z-10"
        >
          <Button
            variant="ghost"
            size="icon"
            onClick={onEdit}
            className="h-6 w-6"
            aria-label="Edit deal"
          >
            <Icon name="Edit2" size={12} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClone}
            className="h-6 w-6"
            aria-label="Clone deal"
          >
            <Icon name="Copy" size={12} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onDelete}
            className="h-6 w-6 text-destructive hover:text-destructive"
            aria-label="Delete deal"
          >
            <Icon name="Trash2" size={12} />
          </Button>
        </motion.div>
      )}
      {/* Deal Header */}
      <div className="space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base text-card-foreground truncate pr-8 leading-tight">
              {deal?.title}
            </h3>
            <p className="text-sm text-muted-foreground truncate mt-1">
              {deal?.accountName}
            </p>
          </div>
        </div>

        {/* Deal Value */}
        <div className="text-xl font-bold text-primary">
          {formatCurrency(deal?.value)}
        </div>

        {/* Deal Details */}
        <div className="space-y-2.5">
          {/* Owner */}
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-full overflow-hidden bg-muted flex-shrink-0 ring-2 ring-background">
              <Image
                src={deal?.owner?.avatar}
                alt={deal?.owner?.avatarAlt}
                className="w-full h-full object-cover"
              />
            </div>
            <span className="text-sm font-medium text-foreground truncate">
              {deal?.owner?.name}
            </span>
          </div>

          {/* Close Date */}
          <div className="flex items-center space-x-2">
            <Icon name="Calendar" size={16} className="text-muted-foreground flex-shrink-0" />
            <span className={`text-sm font-medium ${closeDateStatus?.color}`}>
              {closeDateStatus?.text}
            </span>
          </div>

          {/* Priority */}
          <div className="flex items-center justify-between">
            <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${getPriorityColor(deal?.priority)}`}>
              {deal?.priority}
            </span>
            
            {/* Probability */}
            <div className="flex items-center space-x-1">
              <Icon name="TrendingUp" size={14} className="text-muted-foreground" />
              <span className="text-sm font-semibold text-foreground">
                {deal?.probability}%
              </span>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-medium text-foreground">
            <span>Progress</span>
            <span>{deal?.probability}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300 shadow-sm"
              style={{ width: `${deal?.probability}%` }}
            />
          </div>
        </div>

        {/* Tags */}
        {deal?.tags && deal?.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {deal?.tags?.slice(0, 2)?.map((tag, index) => (
              <span
                key={index}
                className="px-2.5 py-1 text-xs font-medium bg-accent text-accent-foreground rounded-full"
              >
                {tag}
              </span>
            ))}
            {deal?.tags?.length > 2 && (
              <span className="px-2.5 py-1 text-xs font-medium bg-muted text-muted-foreground rounded-full">
                +{deal?.tags?.length - 2}
              </span>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default DealCard;