import React, { useState, useMemo } from 'react';
import Icon from '../../../components/AppIcon';
import Image from '../../../components/AppImage';
import Button from '../../../components/ui/Button';
import { Checkbox } from '../../../components/ui/Checkbox';

const ContactsTable = ({ 
  contacts, 
  selectedContacts, 
  onSelectContact, 
  onSelectAllContacts, 
  onContactClick, 
  sortConfig, 
  onSort 
}) => {
  const [hoveredRow, setHoveredRow] = useState(null);

  const getSortIcon = (column) => {
    if (sortConfig?.key !== column) return 'ArrowUpDown';
    return sortConfig?.direction === 'asc' ? 'ArrowUp' : 'ArrowDown';
  };

  const handleSort = (column) => {
    onSort(column);
  };

  const handleQuickAction = (e, action, contact) => {
    e?.stopPropagation();
    console.log(`${action} action for contact:`, contact?.name);
  };

  const formatLastContact = (date) => {
    const now = new Date();
    const contactDate = new Date(date);
    const diffTime = Math.abs(now - contactDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    return contactDate?.toLocaleDateString();
  };

  const getStatusColor = (status) => {
    const colors = {
      'Active': 'bg-success/10 text-success border-success/20',
      'Inactive': 'bg-muted text-muted-foreground border-border',
      'Prospect': 'bg-warning/10 text-warning border-warning/20',
      'Customer': 'bg-primary/10 text-primary border-primary/20'
    };
    return colors?.[status] || colors?.['Inactive'];
  };

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      {/* Desktop Table */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/50 border-b border-border">
            <tr>
              <th className="w-12 px-4 py-3">
                <Checkbox
                  checked={selectedContacts?.length === contacts?.length && contacts?.length > 0}
                  indeterminate={selectedContacts?.length > 0 && selectedContacts?.length < contacts?.length}
                  onChange={(e) => onSelectAllContacts(e?.target?.checked)}
                />
              </th>
              {[
                { key: 'name', label: 'Contact' },
                { key: 'title', label: 'Title' },
                { key: 'company', label: 'Company' },
                { key: 'email', label: 'Email' },
                { key: 'phone', label: 'Phone' },
                { key: 'lastContact', label: 'Last Contact' },
                { key: 'status', label: 'Status' }
              ]?.map((column) => (
                <th
                  key={column?.key}
                  className="px-4 py-3 text-left text-sm font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                  onClick={() => handleSort(column?.key)}
                >
                  <div className="flex items-center space-x-2">
                    <span>{column?.label}</span>
                    <Icon 
                      name={getSortIcon(column?.key)} 
                      size={14} 
                      className="opacity-50"
                    />
                  </div>
                </th>
              ))}
              <th className="w-24 px-4 py-3 text-center text-sm font-medium text-muted-foreground">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {contacts?.map((contact) => (
              <tr
                key={contact?.id}
                className="hover:bg-muted/30 cursor-pointer transition-colors"
                onClick={() => onContactClick(contact)}
                onMouseEnter={() => setHoveredRow(contact?.id)}
                onMouseLeave={() => setHoveredRow(null)}
              >
                <td className="px-4 py-4">
                  <Checkbox
                    checked={selectedContacts?.includes(contact?.id)}
                    onChange={(e) => {
                      e?.stopPropagation();
                      onSelectContact(contact?.id, e?.target?.checked);
                    }}
                  />
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-muted flex-shrink-0">
                      <Image
                        src={contact?.avatar}
                        alt={contact?.avatarAlt}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <div className="font-medium text-foreground">{contact?.name}</div>
                      <div className="text-sm text-muted-foreground">{contact?.department}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4 text-sm text-foreground">{contact?.title}</td>
                <td className="px-4 py-4 text-sm text-foreground">{contact?.company}</td>
                <td className="px-4 py-4 text-sm text-primary hover:underline">{contact?.email}</td>
                <td className="px-4 py-4 text-sm text-foreground">{contact?.phone}</td>
                <td className="px-4 py-4 text-sm text-muted-foreground">
                  {formatLastContact(contact?.lastContact)}
                </td>
                <td className="px-4 py-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(contact?.status)}`}>
                    {contact?.status}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <div className={`flex items-center justify-center space-x-1 transition-opacity ${hoveredRow === contact?.id ? 'opacity-100' : 'opacity-0'}`}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => handleQuickAction(e, 'call', contact)}
                    >
                      <Icon name="Phone" size={14} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => handleQuickAction(e, 'email', contact)}
                    >
                      <Icon name="Mail" size={14} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => handleQuickAction(e, 'edit', contact)}
                    >
                      <Icon name="Edit" size={14} />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Mobile Card Layout */}
      <div className="lg:hidden">
        {contacts?.map((contact) => (
          <div
            key={contact?.id}
            className="p-4 border-b border-border last:border-b-0 cursor-pointer hover:bg-muted/30 transition-colors"
            onClick={() => onContactClick(contact)}
          >
            <div className="flex items-start space-x-3">
              <Checkbox
                checked={selectedContacts?.includes(contact?.id)}
                onChange={(e) => {
                  e?.stopPropagation();
                  onSelectContact(contact?.id, e?.target?.checked);
                }}
                className="mt-1"
              />
              <div className="w-12 h-12 rounded-full overflow-hidden bg-muted flex-shrink-0">
                <Image
                  src={contact?.avatar}
                  alt={contact?.avatarAlt}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium text-foreground truncate">{contact?.name}</h3>
                    <p className="text-sm text-muted-foreground">{contact?.title}</p>
                    <p className="text-sm text-muted-foreground">{contact?.company}</p>
                  </div>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(contact?.status)}`}>
                    {contact?.status}
                  </span>
                </div>
                <div className="mt-2 space-y-1">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Icon name="Mail" size={14} className="mr-2" />
                    <span className="truncate">{contact?.email}</span>
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Icon name="Phone" size={14} className="mr-2" />
                    <span>{contact?.phone}</span>
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Icon name="Clock" size={14} className="mr-2" />
                    <span>Last contact: {formatLastContact(contact?.lastContact)}</span>
                  </div>
                </div>
                <div className="flex items-center justify-end space-x-2 mt-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => handleQuickAction(e, 'call', contact)}
                  >
                    <Icon name="Phone" size={16} className="mr-1" />
                    Call
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => handleQuickAction(e, 'email', contact)}
                  >
                    <Icon name="Mail" size={16} className="mr-1" />
                    Email
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ContactsTable;