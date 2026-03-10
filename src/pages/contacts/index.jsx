/**
 * Contacts page — fields: Name, Title, VISA only.
 * No auto-linking to candidates/deals/accounts.
 *
 * Required Supabase table (run once in SQL editor):
 * CREATE TABLE IF NOT EXISTS contacts (
 *   id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
 *   name text NOT NULL,
 *   title text,
 *   visa text,
 *   created_at timestamptz DEFAULT now(),
 *   created_by uuid REFERENCES auth.users(id)
 * );
 * ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
 * CREATE POLICY "All authenticated users" ON contacts FOR ALL USING (auth.role() = 'authenticated');
 */
import React, { useState, useMemo, useEffect, useRef } from 'react';
import Header from '../../components/ui/Header';
import Sidebar from '../../components/ui/Sidebar';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Modal from '../../components/ui/Modal';
import ContactsTable from './components/ContactsTable';
import ContactFilters from './components/ContactFilters';
import ContactDrawer from './components/ContactDrawer';
import ContactsPagination from './components/ContactsPagination';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

const VISA_OPTIONS_SELECT = [
  { value: '', label: 'Select VISA Type' },
  { value: 'US Citizen', label: 'US Citizen' },
  { value: 'Green Card', label: 'Green Card' },
  { value: 'H1B', label: 'H1B' },
  { value: 'H4 EAD', label: 'H4 EAD' },
  { value: 'L2 EAD', label: 'L2 EAD' },
  { value: 'OPT', label: 'OPT' },
  { value: 'CPT', label: 'CPT' },
  { value: 'TN', label: 'TN' },
  { value: 'GC EAD', label: 'GC EAD' },
];

const parseCSV = (text) => {
  const lines = text.trim().split('\n').filter(Boolean);
  if (lines.length < 2) return [];
  const raw = lines[0].replace(/\r/g, '');
  const headers = raw.split(',').map(h => h.trim().toLowerCase().replace(/"/g, '').replace(/\s+/g, '_'));
  return lines.slice(1).map(line => {
    const values = line.replace(/\r/g, '').split(',').map(v => v.trim().replace(/"/g, ''));
    const row = {};
    headers.forEach((h, i) => { row[h] = values[i] || ''; });
    return {
      name:  row.name  || row.full_name  || row.contact_name || '',
      title: row.title || row.job_title  || row.position     || '',
      visa:  row.visa  || row.visa_type  || row.visa_status  || '',
    };
  }).filter(r => r.name.trim() !== '');
};

const EMPTY_FORM = { name: '', title: '', visa: '' };

const ContactsPage = () => {
  const { user } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [visaFilter, setVisaFilter] = useState('');
  const [selectedContacts, setSelectedContacts] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(25);
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });

  // Add / Edit modal
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [formSaving, setFormSaving] = useState(false);

  // CSV import modal
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [csvPreview, setCsvPreview] = useState([]);
  const [csvError, setCsvError] = useState('');
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .order('name');
      if (!error) setContacts(data || []);
    } catch {
      // Table may not exist yet — start empty
    } finally {
      setLoading(false);
    }
  };

  // Filter + sort
  const filtered = useMemo(() => {
    let list = contacts.filter(c => {
      const q = searchTerm.toLowerCase();
      const matchSearch = !q ||
        c.name?.toLowerCase().includes(q) ||
        c.title?.toLowerCase().includes(q);
      const matchVisa = !visaFilter || c.visa === visaFilter;
      return matchSearch && matchVisa;
    });
    list = [...list].sort((a, b) => {
      const av = (a[sortConfig.key] || '').toLowerCase();
      const bv = (b[sortConfig.key] || '').toLowerCase();
      return sortConfig.direction === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
    });
    return list;
  }, [contacts, searchTerm, visaFilter, sortConfig]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Stats
  const stats = useMemo(() => ({
    total: contacts.length,
    withVisa: contacts.filter(c => c.visa).length,
    usCitizen: contacts.filter(c => c.visa === 'US Citizen').length,
    workAuth: contacts.filter(c => ['H1B', 'OPT', 'CPT', 'H4 EAD', 'L2 EAD', 'TN'].includes(c.visa)).length,
  }), [contacts]);

  // Handlers
  const handleSort = (key) => {
    setSortConfig(prev => ({ key, direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc' }));
  };

  const openAdd = () => {
    setEditingContact(null);
    setFormData(EMPTY_FORM);
    setFormError('');
    setIsFormOpen(true);
  };

  const openEdit = (contact) => {
    setEditingContact(contact);
    setFormData({ name: contact.name || '', title: contact.title || '', visa: contact.visa || '' });
    setFormError('');
    setIsFormOpen(true);
    setIsDrawerOpen(false);
  };

  const handleFormSave = async () => {
    if (!formData.name.trim()) { setFormError('Name is required'); return; }
    setFormSaving(true);
    setFormError('');
    try {
      if (editingContact) {
        const { error } = await supabase
          .from('contacts')
          .update({ name: formData.name.trim(), title: formData.title.trim() || null, visa: formData.visa || null })
          .eq('id', editingContact.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('contacts')
          .insert({ name: formData.name.trim(), title: formData.title.trim() || null, visa: formData.visa || null, created_by: user?.id });
        if (error) throw error;
      }
      await fetchContacts();
      setIsFormOpen(false);
    } catch (err) {
      setFormError(err.message || 'Failed to save contact');
    } finally {
      setFormSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this contact?')) return;
    await supabase.from('contacts').delete().eq('id', id);
    setContacts(prev => prev.filter(c => c.id !== id));
  };

  const handleBulkDelete = async () => {
    if (!selectedContacts.length) return;
    if (!window.confirm(`Delete ${selectedContacts.length} contact(s)?`)) return;
    await supabase.from('contacts').delete().in('id', selectedContacts);
    setContacts(prev => prev.filter(c => !selectedContacts.includes(c.id)));
    setSelectedContacts([]);
  };

  // CSV import
  const handleFileChange = (e) => {
    setCsvError('');
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const parsed = parseCSV(ev.target.result);
      if (!parsed.length) {
        setCsvError('No valid rows found. Columns expected: name, title, visa');
      } else {
        setCsvPreview(parsed);
      }
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!csvPreview.length) return;
    setImporting(true);
    try {
      const rows = csvPreview.map(r => ({
        name: r.name,
        title: r.title || null,
        visa: r.visa || null,
        created_by: user?.id,
      }));
      const { error } = await supabase.from('contacts').insert(rows);
      if (error) throw error;
      await fetchContacts();
      setIsImportOpen(false);
      setCsvPreview([]);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      setCsvError(err.message || 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  const formFooter = (
    <>
      <Button variant="outline" onClick={() => setIsFormOpen(false)} disabled={formSaving}>Cancel</Button>
      <Button onClick={handleFormSave} loading={formSaving} disabled={formSaving}>
        {editingContact ? 'Update Contact' : 'Add Contact'}
      </Button>
    </>
  );

  const importFooter = (
    <>
      <Button variant="outline" onClick={() => { setIsImportOpen(false); setCsvPreview([]); setCsvError(''); }}>Cancel</Button>
      <Button onClick={handleImport} loading={importing} disabled={importing || !csvPreview.length}>
        Import {csvPreview.length > 0 ? `${csvPreview.length} Contacts` : ''}
      </Button>
    </>
  );

  return (
    <div className="min-h-screen bg-background">
      <Header onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)} isSidebarOpen={isSidebarOpen} />
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <main className="lg:ml-64 pt-16">
        <div className="p-4 lg:p-6 max-w-7xl mx-auto">

          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Contacts</h1>
              <p className="text-muted-foreground mt-1">Manage your contacts — Name, Title, and VISA status</p>
            </div>
            <div className="flex items-center space-x-3 mt-4 sm:mt-0">
              {selectedContacts.length > 0 && (
                <Button variant="outline" onClick={handleBulkDelete} className="text-error border-error/30 hover:bg-error/5">
                  <Icon name="Trash2" size={16} className="mr-2" />
                  Delete ({selectedContacts.length})
                </Button>
              )}
              <Button variant="outline" onClick={() => { setIsImportOpen(true); setCsvPreview([]); setCsvError(''); }}>
                <Icon name="Upload" size={16} className="mr-2" />
                Import CSV
              </Button>
              <Button onClick={openAdd}>
                <Icon name="Plus" size={16} className="mr-2" />
                Add Contact
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Total Contacts', value: stats.total, icon: 'Users', color: 'bg-primary/10 text-primary' },
              { label: 'VISA on File', value: stats.withVisa, icon: 'CreditCard', color: 'bg-blue-100 text-blue-600' },
              { label: 'US Citizens', value: stats.usCitizen, icon: 'Flag', color: 'bg-success/10 text-success' },
              { label: 'Work Auth (H1B/OPT etc.)', value: stats.workAuth, icon: 'FileCheck', color: 'bg-warning/10 text-warning' },
            ].map((s, i) => (
              <div key={i} className="bg-card rounded-xl border border-border p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{s.label}</p>
                    <p className="text-2xl font-bold text-foreground mt-1">
                      {loading ? '…' : s.value}
                    </p>
                  </div>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${s.color}`}>
                    <Icon name={s.icon} size={20} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Filters */}
          <ContactFilters
            searchTerm={searchTerm}
            onSearchChange={(v) => { setSearchTerm(v); setCurrentPage(1); }}
            visaFilter={visaFilter}
            onVisaFilterChange={(v) => { setVisaFilter(v); setCurrentPage(1); }}
            onClearFilters={() => { setSearchTerm(''); setVisaFilter(''); setCurrentPage(1); }}
          />

          {/* Table */}
          {loading ? (
            <div className="bg-card rounded-xl border border-border p-8">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4 py-3 border-b border-border last:border-0">
                  <div className="w-10 h-10 rounded-full bg-muted animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded animate-pulse w-1/4" />
                    <div className="h-3 bg-muted rounded animate-pulse w-1/6" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <ContactsTable
              contacts={paginated}
              selectedContacts={selectedContacts}
              onSelectContact={(id, checked) =>
                setSelectedContacts(prev => checked ? [...prev, id] : prev.filter(x => x !== id))}
              onSelectAllContacts={(checked) =>
                setSelectedContacts(checked ? paginated.map(c => c.id) : [])}
              onContactClick={(c) => { setSelectedContact(c); setIsDrawerOpen(true); }}
              onEdit={openEdit}
              onDelete={handleDelete}
              sortConfig={sortConfig}
              onSort={handleSort}
            />
          )}

          {/* Pagination */}
          <div className="mt-6">
            <ContactsPagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filtered.length}
              itemsPerPage={itemsPerPage}
              onPageChange={(p) => { setCurrentPage(p); setSelectedContacts([]); }}
              onItemsPerPageChange={() => setCurrentPage(1)}
            />
          </div>
        </div>
      </main>

      {/* Contact Drawer */}
      <ContactDrawer
        contact={selectedContact}
        isOpen={isDrawerOpen}
        onClose={() => { setIsDrawerOpen(false); setSelectedContact(null); }}
        onEdit={openEdit}
      />

      {/* Add / Edit Contact Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingContact ? 'Edit Contact' : 'Add Contact'}
        size="sm"
        footer={formFooter}
      >
        <div className="space-y-4">
          {formError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center gap-2">
              <Icon name="AlertCircle" size={16} className="text-red-500 flex-shrink-0" />
              {formError}
            </div>
          )}
          <Input
            label="Full Name *"
            value={formData.name}
            onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
            placeholder="e.g. John Smith"
            disabled={formSaving}
          />
          <Input
            label="Title"
            value={formData.title}
            onChange={(e) => setFormData(p => ({ ...p, title: e.target.value }))}
            placeholder="e.g. Software Engineer"
            disabled={formSaving}
          />
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">VISA Status</label>
            <Select
              options={VISA_OPTIONS_SELECT}
              value={formData.visa}
              onChange={(v) => setFormData(p => ({ ...p, visa: v }))}
              disabled={formSaving}
            />
          </div>
        </div>
      </Modal>

      {/* CSV Import Modal */}
      <Modal
        isOpen={isImportOpen}
        onClose={() => { setIsImportOpen(false); setCsvPreview([]); setCsvError(''); }}
        title="Import Contacts from CSV"
        description="CSV columns: name, title, visa — header row required"
        size="lg"
        footer={importFooter}
      >
        <div className="space-y-4">
          {/* Template hint */}
          <div className="p-3 bg-muted/50 rounded-lg border border-border text-sm text-muted-foreground font-mono">
            name,title,visa<br />
            John Smith,Software Engineer,H1B<br />
            Jane Doe,Project Manager,US Citizen
          </div>

          {/* File input */}
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">Select CSV File</label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              onChange={handleFileChange}
              className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border file:border-border file:text-sm file:font-medium file:bg-card file:text-foreground hover:file:bg-muted cursor-pointer"
            />
          </div>

          {csvError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center gap-2">
              <Icon name="AlertCircle" size={16} className="text-red-500" />
              {csvError}
            </div>
          )}

          {/* Preview */}
          {csvPreview.length > 0 && (
            <div>
              <p className="text-sm font-medium text-foreground mb-2">
                Preview — {csvPreview.length} contact{csvPreview.length !== 1 ? 's' : ''} found
              </p>
              <div className="border border-border rounded-lg overflow-hidden max-h-64 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 border-b border-border">
                    <tr>
                      <th className="px-3 py-2 text-left text-muted-foreground font-medium">Name</th>
                      <th className="px-3 py-2 text-left text-muted-foreground font-medium">Title</th>
                      <th className="px-3 py-2 text-left text-muted-foreground font-medium">VISA</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {csvPreview.slice(0, 50).map((row, i) => (
                      <tr key={i} className="hover:bg-muted/30">
                        <td className="px-3 py-2 text-foreground">{row.name}</td>
                        <td className="px-3 py-2 text-muted-foreground">{row.title || '—'}</td>
                        <td className="px-3 py-2 text-muted-foreground">{row.visa || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {csvPreview.length > 50 && (
                  <p className="px-3 py-2 text-sm text-muted-foreground border-t border-border">
                    + {csvPreview.length - 50} more rows
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default ContactsPage;
