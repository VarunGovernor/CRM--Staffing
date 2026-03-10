import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const VISA_COLORS = {
  'US Citizen': 'bg-success/10 text-success border-success/20',
  'Green Card':  'bg-primary/10 text-primary border-primary/20',
  'H1B':         'bg-blue-100 text-blue-700 border-blue-200',
  'H4 EAD':      'bg-indigo-100 text-indigo-700 border-indigo-200',
  'L2 EAD':      'bg-purple-100 text-purple-700 border-purple-200',
  'OPT':         'bg-yellow-100 text-yellow-700 border-yellow-200',
  'CPT':         'bg-orange-100 text-orange-700 border-orange-200',
  'TN':          'bg-cyan-100 text-cyan-700 border-cyan-200',
  'GC EAD':      'bg-teal-100 text-teal-700 border-teal-200',
};

const getInitials = (name = '') =>
  name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

const ContactDrawer = ({ contact, isOpen, onClose, onEdit }) => {
  if (!contact) return null;

  const visaColor = VISA_COLORS[contact.visa] || 'bg-muted text-muted-foreground border-border';

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
      )}
      <div
        className={`
          fixed top-0 right-0 h-full w-full sm:w-96 bg-background border-l border-border z-50
          transform transition-transform duration-300 ease-out
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border">
            <h2 className="text-lg font-semibold text-foreground">Contact Details</h2>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <Icon name="X" size={20} />
            </Button>
          </div>

          {/* Contact Info */}
          <div className="p-6 border-b border-border">
            <div className="flex items-start space-x-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-xl font-bold text-primary">{getInitials(contact.name)}</span>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-foreground">{contact.name}</h3>
                {contact.title && (
                  <p className="text-muted-foreground mt-0.5">{contact.title}</p>
                )}
                {contact.visa && (
                  <span className={`inline-flex items-center mt-2 px-2.5 py-1 rounded-full text-xs font-medium border ${visaColor}`}>
                    <Icon name="CreditCard" size={12} className="mr-1" />
                    {contact.visa}
                  </span>
                )}
                <div className="mt-4">
                  <Button variant="outline" size="sm" onClick={() => onEdit(contact)}>
                    <Icon name="Edit" size={14} className="mr-2" />
                    Edit Contact
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-3">Contact Information</h4>
                <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Full Name</span>
                    <span className="text-sm font-medium text-foreground">{contact.name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Title</span>
                    <span className="text-sm font-medium text-foreground">{contact.title || '—'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">VISA Status</span>
                    {contact.visa ? (
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${visaColor}`}>
                        {contact.visa}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </div>
                </div>
              </div>

              {contact.created_at && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-3">Record Info</h4>
                  <div className="bg-muted/30 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Added</span>
                      <span className="text-sm text-foreground">
                        {new Date(contact.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ContactDrawer;
