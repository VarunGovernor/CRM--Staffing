import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import { Checkbox } from '../../../components/ui/Checkbox';

const VISA_COLORS = {
  'US Citizen':  'bg-success/10 text-success border-success/20',
  'Green Card':  'bg-primary/10 text-primary border-primary/20',
  'H1B':         'bg-blue-100 text-blue-700 border-blue-200',
  'H4 EAD':      'bg-indigo-100 text-indigo-700 border-indigo-200',
  'L2 EAD':      'bg-purple-100 text-purple-700 border-purple-200',
  'OPT':         'bg-yellow-100 text-yellow-700 border-yellow-200',
  'CPT':         'bg-orange-100 text-orange-700 border-orange-200',
  'TN':          'bg-cyan-100 text-cyan-700 border-cyan-200',
  'GC EAD':      'bg-teal-100 text-teal-700 border-teal-200',
};

const getVisaColor = (visa) =>
  VISA_COLORS[visa] || 'bg-muted text-muted-foreground border-border';

const getInitials = (name = '') =>
  name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

const ContactsTable = ({
  contacts,
  selectedContacts,
  onSelectContact,
  onSelectAllContacts,
  onContactClick,
  onEdit,
  onDelete,
  sortConfig,
  onSort,
}) => {
  const [hoveredRow, setHoveredRow] = useState(null);

  const getSortIcon = (col) => {
    if (sortConfig?.key !== col) return 'ArrowUpDown';
    return sortConfig?.direction === 'asc' ? 'ArrowUp' : 'ArrowDown';
  };

  const columns = [
    { key: 'name',  label: 'Name'  },
    { key: 'title', label: 'Title' },
    { key: 'visa',  label: 'VISA'  },
  ];

  if (!contacts?.length) {
    return (
      <div className="bg-card rounded-xl border border-border p-12 text-center">
        <Icon name="Users" size={40} className="text-muted-foreground mx-auto mb-3" />
        <p className="text-muted-foreground">No contacts found. Add one or import from CSV.</p>
      </div>
    );
  }

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
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-4 py-3 text-left text-sm font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                  onClick={() => onSort(col.key)}
                >
                  <div className="flex items-center space-x-2">
                    <span>{col.label}</span>
                    <Icon name={getSortIcon(col.key)} size={14} className="opacity-50" />
                  </div>
                </th>
              ))}
              <th className="w-28 px-4 py-3 text-center text-sm font-medium text-muted-foreground">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {contacts.map((contact) => (
              <tr
                key={contact.id}
                className="hover:bg-muted/30 cursor-pointer transition-colors"
                onClick={() => onContactClick(contact)}
                onMouseEnter={() => setHoveredRow(contact.id)}
                onMouseLeave={() => setHoveredRow(null)}
              >
                <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={selectedContacts?.includes(contact.id)}
                    onChange={(e) => onSelectContact(contact.id, e.target.checked)}
                  />
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-semibold text-primary">
                        {getInitials(contact.name)}
                      </span>
                    </div>
                    <span className="font-medium text-foreground">{contact.name}</span>
                  </div>
                </td>
                <td className="px-4 py-4 text-sm text-foreground">{contact.title || '—'}</td>
                <td className="px-4 py-4">
                  {contact.visa ? (
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getVisaColor(contact.visa)}`}>
                      {contact.visa}
                    </span>
                  ) : (
                    <span className="text-muted-foreground text-sm">—</span>
                  )}
                </td>
                <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                  <div className={`flex items-center justify-center space-x-1 transition-opacity ${hoveredRow === contact.id ? 'opacity-100' : 'opacity-0'}`}>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(contact)}>
                      <Icon name="Edit" size={14} />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-error hover:text-error" onClick={() => onDelete(contact.id)}>
                      <Icon name="Trash2" size={14} />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="lg:hidden">
        {contacts.map((contact) => (
          <div
            key={contact.id}
            className="p-4 border-b border-border last:border-b-0 cursor-pointer hover:bg-muted/30 transition-colors"
            onClick={() => onContactClick(contact)}
          >
            <div className="flex items-start space-x-3">
              <Checkbox
                checked={selectedContacts?.includes(contact.id)}
                onChange={(e) => { e.stopPropagation(); onSelectContact(contact.id, e.target.checked); }}
                className="mt-1"
              />
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-semibold text-primary">{getInitials(contact.name)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium text-foreground">{contact.name}</h3>
                    <p className="text-sm text-muted-foreground">{contact.title || '—'}</p>
                  </div>
                  {contact.visa && (
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getVisaColor(contact.visa)}`}>
                      {contact.visa}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-end space-x-2 mt-3" onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="sm" onClick={() => onEdit(contact)}>
                    <Icon name="Edit" size={14} className="mr-1" /> Edit
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
