import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

import Select from '../../../components/ui/Select';

const DealDrawer = ({ deal, isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditing, setIsEditing] = useState(false);

  if (!deal) return null;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    })?.format(amount);
  };

  const formatDate = (date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })?.format(new Date(date));
  };

  const getStageColor = (stage) => {
    const colors = {
      'New': 'bg-blue-100 text-blue-800',
      'Qualified': 'bg-yellow-100 text-yellow-800',
      'Proposal': 'bg-purple-100 text-purple-800',
      'Negotiation': 'bg-orange-100 text-orange-800',
      'Won': 'bg-green-100 text-green-800',
      'Lost': 'bg-red-100 text-red-800'
    };
    return colors?.[stage] || 'bg-gray-100 text-gray-800';
  };

  const stageOptions = [
  { value: 'New', label: 'New' },
  { value: 'Qualified', label: 'Qualified' },
  { value: 'Proposal', label: 'Proposal' },
  { value: 'Negotiation', label: 'Negotiation' },
  { value: 'Won', label: 'Won' },
  { value: 'Lost', label: 'Lost' }];


  const tabs = [
  { id: 'overview', label: 'Overview', icon: 'Eye' },
  { id: 'activities', label: 'Activities', icon: 'Calendar' },
  { id: 'contacts', label: 'Contacts', icon: 'Users' },
  { id: 'notes', label: 'Notes', icon: 'FileText' }];


  const mockActivities = [
  {
    id: 1,
    type: 'call',
    title: 'Follow-up call scheduled',
    description: 'Discussed pricing and implementation timeline',
    date: '2025-11-02T14:30:00',
    user: 'Sarah Johnson',
    userAvatar: "https://images.unsplash.com/photo-1734991032476-bceab8383a59",
    userAvatarAlt: 'Professional headshot of woman with shoulder-length brown hair in business attire'
  },
  {
    id: 2,
    type: 'email',
    title: 'Proposal sent',
    description: 'Comprehensive proposal with pricing breakdown sent to decision makers',
    date: '2025-11-01T09:15:00',
    user: 'Michael Chen',
    userAvatar: "https://images.unsplash.com/photo-1687256457585-3608dfa736c5",
    userAvatarAlt: 'Professional headshot of Asian man with short black hair in navy suit'
  },
  {
    id: 3,
    type: 'meeting',
    title: 'Discovery meeting completed',
    description: 'Identified key requirements and pain points',
    date: '2025-10-28T11:00:00',
    user: 'Sarah Johnson',
    userAvatar: "https://images.unsplash.com/photo-1734991032476-bceab8383a59",
    userAvatarAlt: 'Professional headshot of woman with shoulder-length brown hair in business attire'
  }];


  const mockContacts = [
  {
    id: 1,
    name: 'Jennifer Martinez',
    title: 'VP of Operations',
    email: 'j.martinez@techcorp.com',
    phone: '+1 (555) 123-4567',
    avatar: "https://images.unsplash.com/photo-1719515862094-c6e9354ee7f8",
    avatarAlt: 'Professional headshot of Hispanic woman with long dark hair in white blouse',
    isPrimary: true
  },
  {
    id: 2,
    name: 'Robert Chen',
    title: 'IT Director',
    email: 'r.chen@techcorp.com',
    phone: '+1 (555) 123-4568',
    avatar: "https://images.unsplash.com/photo-1687256457585-3608dfa736c5",
    avatarAlt: 'Professional headshot of Asian man with glasses and short black hair in dark suit',
    isPrimary: false
  }];


  const getActivityIcon = (type) => {
    const icons = {
      call: 'Phone',
      email: 'Mail',
      meeting: 'Users',
      task: 'CheckSquare',
      note: 'FileText'
    };
    return icons?.[type] || 'Circle';
  };

  const getActivityColor = (type) => {
    const colors = {
      call: 'text-blue-600',
      email: 'text-green-600',
      meeting: 'text-purple-600',
      task: 'text-orange-600',
      note: 'text-gray-600'
    };
    return colors?.[type] || 'text-gray-600';
  };

  const handleStageAdvance = () => {
    console.log('Advancing stage for deal:', deal?.id);
  };

  const handleScheduleActivity = () => {
    console.log('Scheduling activity for deal:', deal?.id);
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen &&
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose} />

      }
      {/* Drawer */}
      <div
        className={`
          fixed top-0 right-0 h-full w-full max-w-2xl bg-background border-l border-border z-50
          transform transition-transform duration-300 ease-out
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        `}>

        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border">
            <div className="flex items-center space-x-3">
              <h2 className="text-xl font-semibold text-foreground">{deal?.name}</h2>
              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStageColor(deal?.stage)}`}>
                {deal?.stage}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(!isEditing)}>

                <Icon name="Edit" size={16} className="mr-1" />
                {isEditing ? 'Cancel' : 'Edit'}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}>

                <Icon name="X" size={20} />
              </Button>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center space-x-2 p-4 bg-muted/30 border-b border-border">
            <Button
              variant="default"
              size="sm"
              onClick={handleStageAdvance}>

              <Icon name="ArrowRight" size={16} className="mr-1" />
              Advance Stage
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleScheduleActivity}>

              <Icon name="Calendar" size={16} className="mr-1" />
              Schedule Activity
            </Button>
            <Button
              variant="outline"
              size="sm">

              <Icon name="Mail" size={16} className="mr-1" />
              Send Email
            </Button>
          </div>

          {/* Tabs */}
          <div className="flex items-center space-x-1 p-4 border-b border-border">
            {tabs?.map((tab) =>
            <button
              key={tab?.id}
              onClick={() => setActiveTab(tab?.id)}
              className={`
                  flex items-center space-x-2 px-3 py-2 text-sm font-medium rounded-lg transition-smooth
                  ${activeTab === tab?.id ?
              'bg-primary text-primary-foreground' :
              'text-muted-foreground hover:text-foreground hover:bg-muted'}
                `
              }>

                <Icon name={tab?.icon} size={16} />
                <span>{tab?.label}</span>
              </button>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === 'overview' &&
            <div className="space-y-6">
                {/* Deal Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Account</label>
                      <p className="text-foreground font-medium">{deal?.account}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Value</label>
                      <p className="text-foreground font-medium text-lg">{formatCurrency(deal?.value)}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Probability</label>
                      <p className="text-foreground font-medium">{deal?.probability}%</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Owner</label>
                      <div className="flex items-center space-x-2 mt-1">
                        <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                          <span className="text-xs font-medium text-primary-foreground">
                            {deal?.owner?.split(' ')?.map((n) => n?.[0])?.join('')}
                          </span>
                        </div>
                        <span className="text-foreground">{deal?.owner}</span>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Close Date</label>
                      <p className="text-foreground">{formatDate(deal?.closeDate)}</p>
                    </div>
                    {isEditing &&
                  <div>
                        <Select
                      label="Stage"
                      options={stageOptions}
                      value={deal?.stage}
                      onChange={(value) => console.log('Stage changed to:', value)} />

                      </div>
                  }
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Description</label>
                  {isEditing ?
                <textarea
                  className="w-full mt-1 p-3 border border-border rounded-lg resize-none"
                  rows={4}
                  defaultValue={deal?.description || `Enterprise software solution for ${deal?.account} to streamline their operations and improve efficiency. This deal includes implementation, training, and ongoing support services.`} /> :


                <p className="text-foreground mt-1">
                      {deal?.description || `Enterprise software solution for ${deal?.account} to streamline their operations and improve efficiency. This deal includes implementation, training, and ongoing support services.`}
                    </p>
                }
                </div>
              </div>
            }

            {activeTab === 'activities' &&
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-foreground">Recent Activities</h3>
                  <Button variant="outline" size="sm">
                    <Icon name="Plus" size={16} className="mr-1" />
                    Add Activity
                  </Button>
                </div>
                <div className="space-y-4">
                  {mockActivities?.map((activity) =>
                <div key={activity?.id} className="flex space-x-3 p-4 bg-muted/30 rounded-lg">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getActivityColor(activity?.type)} bg-current/10`}>
                        <Icon name={getActivityIcon(activity?.type)} size={16} className={getActivityColor(activity?.type)} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-foreground">{activity?.title}</h4>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(activity?.date)}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{activity?.description}</p>
                        <div className="flex items-center space-x-2 mt-2">
                          <div className="w-5 h-5 rounded-full overflow-hidden">
                            <img
                          src={activity?.userAvatar}
                          alt={activity?.userAvatarAlt}
                          className="w-full h-full object-cover" />

                          </div>
                          <span className="text-xs text-muted-foreground">{activity?.user}</span>
                        </div>
                      </div>
                    </div>
                )}
                </div>
              </div>
            }

            {activeTab === 'contacts' &&
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-foreground">Associated Contacts</h3>
                  <Button variant="outline" size="sm">
                    <Icon name="Plus" size={16} className="mr-1" />
                    Add Contact
                  </Button>
                </div>
                <div className="space-y-3">
                  {mockContacts?.map((contact) =>
                <div key={contact?.id} className="flex items-center space-x-3 p-4 bg-muted/30 rounded-lg">
                      <div className="w-10 h-10 rounded-full overflow-hidden">
                        <img
                      src={contact?.avatar}
                      alt={contact?.avatarAlt}
                      className="w-full h-full object-cover" />

                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium text-foreground">{contact?.name}</h4>
                          {contact?.isPrimary &&
                      <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs font-medium rounded-full">
                              Primary
                            </span>
                      }
                        </div>
                        <p className="text-sm text-muted-foreground">{contact?.title}</p>
                        <div className="flex items-center space-x-4 mt-1">
                          <span className="text-xs text-muted-foreground">{contact?.email}</span>
                          <span className="text-xs text-muted-foreground">{contact?.phone}</span>
                        </div>
                      </div>
                      <div className="flex space-x-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Icon name="Mail" size={14} />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Icon name="Phone" size={14} />
                        </Button>
                      </div>
                    </div>
                )}
                </div>
              </div>
            }

            {activeTab === 'notes' &&
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-foreground">Notes</h3>
                  <Button variant="outline" size="sm">
                    <Icon name="Plus" size={16} className="mr-1" />
                    Add Note
                  </Button>
                </div>
                <div className="space-y-4">
                  <div className="p-4 bg-muted/30 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-foreground">Meeting Notes - Discovery Call</span>
                      <span className="text-xs text-muted-foreground">Nov 1, 2025</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Key requirements identified:\n• Integration with existing ERP system\n• Multi-location support\n• Advanced reporting capabilities\n• 24/7 customer support\n\nNext steps: Prepare technical proposal with integration timeline.
                    </p>
                  </div>
                  <div className="p-4 bg-muted/30 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-foreground">Competitive Analysis</span>
                      <span className="text-xs text-muted-foreground">Oct 28, 2025</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Currently evaluating our solution against CompetitorX and CompetitorY. Our advantages: better integration capabilities, superior customer support, competitive pricing. Need to emphasize ROI in proposal.
                    </p>
                  </div>
                </div>
              </div>
            }
          </div>
        </div>
      </div>
    </>);

};

export default DealDrawer;