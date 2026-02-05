import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Image from '../../../components/AppImage';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';

const ContactDrawer = ({ contact, isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [newNote, setNewNote] = useState('');

  if (!contact) return null;

  const mockDeals = [
    {
      id: 1,
      name: "Enterprise Software License",
      value: 125000,
      stage: "Proposal",
      probability: 75,
      closeDate: "2025-01-15"
    },
    {
      id: 2,
      name: "Cloud Migration Project",
      value: 85000,
      stage: "Qualified",
      probability: 60,
      closeDate: "2025-02-28"
    }
  ];

  const mockActivities = [
    {
      id: 1,
      type: "call",
      title: "Follow-up call regarding proposal",
      date: "2025-01-02",
      time: "2:30 PM",
      duration: "25 min",
      outcome: "Positive response, scheduling demo next week"
    },
    {
      id: 2,
      type: "email",
      title: "Sent pricing proposal",
      date: "2024-12-28",
      time: "10:15 AM",
      outcome: "Proposal delivered successfully"
    },
    {
      id: 3,
      type: "meeting",
      title: "Initial discovery meeting",
      date: "2024-12-20",
      time: "3:00 PM",
      duration: "45 min",
      outcome: "Identified key requirements and pain points"
    }
  ];

  const mockNotes = [
    {
      id: 1,
      content: "Very interested in our enterprise solution. Mentioned budget approval process takes 2-3 weeks. Key decision maker but needs CFO sign-off for deals over $100k.",
      author: "Sarah Johnson",
      date: "2025-01-02",
      time: "3:45 PM"
    },
    {
      id: 2,
      content: "Prefers email communication over phone calls. Available for meetings on Tuesdays and Thursdays after 2 PM EST.",
      author: "Mike Chen",
      date: "2024-12-28",
      time: "11:30 AM"
    }
  ];

  const getActivityIcon = (type) => {
    const icons = {
      call: 'Phone',
      email: 'Mail',
      meeting: 'Calendar',
      task: 'CheckSquare'
    };
    return icons?.[type] || 'Circle';
  };

  const getActivityColor = (type) => {
    const colors = {
      call: 'text-blue-500',
      email: 'text-green-500',
      meeting: 'text-purple-500',
      task: 'text-orange-500'
    };
    return colors?.[type] || 'text-muted-foreground';
  };

  const handleAddNote = () => {
    if (newNote?.trim()) {
      console.log('Adding note:', newNote);
      setNewNote('');
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: 'User' },
    { id: 'deals', label: 'Deals', icon: 'Target' },
    { id: 'activities', label: 'Activities', icon: 'Clock' },
    { id: 'notes', label: 'Notes', icon: 'FileText' }
  ];

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={onClose}
        />
      )}
      {/* Drawer */}
      <div
        className={`
          fixed top-0 right-0 h-full w-full sm:w-96 lg:w-[480px] bg-background border-l border-border z-50
          transform transition-transform duration-300 ease-out
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border">
            <h2 className="text-lg font-semibold text-foreground">Contact Details</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              aria-label="Close contact details"
            >
              <Icon name="X" size={20} />
            </Button>
          </div>

          {/* Contact Info */}
          <div className="p-6 border-b border-border">
            <div className="flex items-start space-x-4">
              <div className="w-16 h-16 rounded-full overflow-hidden bg-muted flex-shrink-0">
                <Image
                  src={contact?.avatar}
                  alt={contact?.avatarAlt}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-foreground">{contact?.name}</h3>
                <p className="text-muted-foreground">{contact?.title}</p>
                <p className="text-sm text-muted-foreground">{contact?.company}</p>
                <div className="flex items-center space-x-4 mt-3">
                  <Button variant="outline" size="sm">
                    <Icon name="Phone" size={16} className="mr-2" />
                    Call
                  </Button>
                  <Button variant="outline" size="sm">
                    <Icon name="Mail" size={16} className="mr-2" />
                    Email
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-border">
            <nav className="flex space-x-1 px-6">
              {tabs?.map((tab) => (
                <button
                  key={tab?.id}
                  onClick={() => setActiveTab(tab?.id)}
                  className={`
                    flex items-center space-x-2 px-3 py-3 text-sm font-medium border-b-2 transition-colors
                    ${activeTab === tab?.id
                      ? 'border-primary text-primary' :'border-transparent text-muted-foreground hover:text-foreground'
                    }
                  `}
                >
                  <Icon name={tab?.icon} size={16} />
                  <span>{tab?.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {activeTab === 'overview' && (
              <div className="p-6 space-y-6">
                <div>
                  <h4 className="font-medium text-foreground mb-3">Contact Information</h4>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <Icon name="Mail" size={16} className="text-muted-foreground" />
                      <span className="text-sm text-primary hover:underline cursor-pointer">{contact?.email}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Icon name="Phone" size={16} className="text-muted-foreground" />
                      <span className="text-sm text-foreground">{contact?.phone}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Icon name="Building2" size={16} className="text-muted-foreground" />
                      <span className="text-sm text-foreground">{contact?.company}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Icon name="MapPin" size={16} className="text-muted-foreground" />
                      <span className="text-sm text-foreground">New York, NY</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-foreground mb-3">Relationship Status</h4>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${
                    contact?.status === 'Active' ? 'bg-success/10 text-success border-success/20' :
                    contact?.status === 'Customer' ? 'bg-primary/10 text-primary border-primary/20' :
                    contact?.status === 'Prospect'? 'bg-warning/10 text-warning border-warning/20' : 'bg-muted text-muted-foreground border-border'
                  }`}>
                    {contact?.status}
                  </span>
                </div>

                <div>
                  <h4 className="font-medium text-foreground mb-3">Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-2 py-1 bg-accent/10 text-accent-foreground text-xs rounded-md border border-accent/20">
                      Decision Maker
                    </span>
                    <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-md border border-primary/20">
                      Enterprise
                    </span>
                    <span className="px-2 py-1 bg-secondary/10 text-secondary text-xs rounded-md border border-secondary/20">
                      High Value
                    </span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'deals' && (
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium text-foreground">Associated Deals</h4>
                  <Button variant="outline" size="sm">
                    <Icon name="Plus" size={16} className="mr-2" />
                    Add Deal
                  </Button>
                </div>
                <div className="space-y-4">
                  {mockDeals?.map((deal) => (
                    <div key={deal?.id} className="p-4 border border-border rounded-lg">
                      <div className="flex items-start justify-between">
                        <div>
                          <h5 className="font-medium text-foreground">{deal?.name}</h5>
                          <p className="text-sm text-muted-foreground mt-1">
                            ${deal?.value?.toLocaleString()} • {deal?.probability}% probability
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Close date: {new Date(deal.closeDate)?.toLocaleDateString()}
                          </p>
                        </div>
                        <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-md border border-primary/20">
                          {deal?.stage}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'activities' && (
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium text-foreground">Recent Activities</h4>
                  <Button variant="outline" size="sm">
                    <Icon name="Plus" size={16} className="mr-2" />
                    Log Activity
                  </Button>
                </div>
                <div className="space-y-4">
                  {mockActivities?.map((activity) => (
                    <div key={activity?.id} className="flex items-start space-x-3">
                      <div className={`w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0 ${getActivityColor(activity?.type)}`}>
                        <Icon name={getActivityIcon(activity?.type)} size={16} />
                      </div>
                      <div className="flex-1">
                        <h5 className="font-medium text-foreground text-sm">{activity?.title}</h5>
                        <p className="text-xs text-muted-foreground">
                          {activity?.date} at {activity?.time}
                          {activity?.duration && ` • ${activity?.duration}`}
                        </p>
                        {activity?.outcome && (
                          <p className="text-sm text-muted-foreground mt-1">{activity?.outcome}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'notes' && (
              <div className="p-6">
                <div className="mb-4">
                  <h4 className="font-medium text-foreground mb-3">Notes</h4>
                  <div className="space-y-3">
                    <Input
                      placeholder="Add a note about this contact..."
                      value={newNote}
                      onChange={(e) => setNewNote(e?.target?.value)}
                    />
                    <Button 
                      onClick={handleAddNote}
                      disabled={!newNote?.trim()}
                      size="sm"
                    >
                      <Icon name="Plus" size={16} className="mr-2" />
                      Add Note
                    </Button>
                  </div>
                </div>
                <div className="space-y-4">
                  {mockNotes?.map((note) => (
                    <div key={note?.id} className="p-4 border border-border rounded-lg">
                      <p className="text-sm text-foreground mb-2">{note?.content}</p>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{note?.author}</span>
                        <span>{note?.date} at {note?.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ContactDrawer;