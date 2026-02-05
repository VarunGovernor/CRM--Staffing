import React, { useState, useMemo } from 'react';
import Header from '../../components/ui/Header';
import Sidebar from '../../components/ui/Sidebar';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import ContactsTable from './components/ContactsTable';
import ContactFilters from './components/ContactFilters';
import ContactDrawer from './components/ContactDrawer';
import BulkActions from './components/BulkActions';
import ContactsPagination from './components/ContactsPagination';

const ContactsPage = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedContacts, setSelectedContacts] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });
  const [filters, setFilters] = useState({
    company: '',
    role: '',
    status: ''
  });

  // Mock contacts data
  const mockContacts = [
  {
    id: 1,
    name: "Sarah Johnson",
    title: "VP of Sales",
    company: "TechCorp Solutions",
    department: "Sales",
    email: "sarah.johnson@techcorp.com",
    phone: "+1 (555) 123-4567",
    avatar: "https://images.unsplash.com/photo-1637562772116-e01cda44fce8",
    avatarAlt: "Professional headshot of woman with shoulder-length brown hair in navy blazer",
    status: "Active",
    lastContact: "2025-01-02"
  },
  {
    id: 2,
    name: "Michael Chen",
    title: "CTO",
    company: "Global Industries",
    department: "Technology",
    email: "m.chen@globalind.com",
    phone: "+1 (555) 234-5678",
    avatar: "https://images.unsplash.com/photo-1629272039203-7d76fdaf1324",
    avatarAlt: "Professional headshot of Asian man with short black hair in dark suit",
    status: "Customer",
    lastContact: "2024-12-28"
  },
  {
    id: 3,
    name: "Emily Rodriguez",
    title: "Marketing Director",
    company: "Innovation Labs",
    department: "Marketing",
    email: "emily.r@innovationlabs.com",
    phone: "+1 (555) 345-6789",
    avatar: "https://images.unsplash.com/photo-1719515862094-c6e9354ee7f8",
    avatarAlt: "Professional headshot of Hispanic woman with long dark hair in white blouse",
    status: "Prospect",
    lastContact: "2024-12-30"
  },
  {
    id: 4,
    name: "David Thompson",
    title: "CEO",
    company: "Digital Dynamics",
    department: "Executive",
    email: "david@digitaldynamics.com",
    phone: "+1 (555) 456-7890",
    avatar: "https://images.unsplash.com/photo-1735181094336-7fa757df9622",
    avatarAlt: "Professional headshot of middle-aged man with gray hair in charcoal suit",
    status: "Active",
    lastContact: "2025-01-01"
  },
  {
    id: 5,
    name: "Lisa Wang",
    title: "Product Manager",
    company: "Future Systems",
    department: "Product",
    email: "lisa.wang@futuresys.com",
    phone: "+1 (555) 567-8901",
    avatar: "https://images.unsplash.com/photo-1668049221564-862149a48e10",
    avatarAlt: "Professional headshot of Asian woman with short black hair in light blue shirt",
    status: "Inactive",
    lastContact: "2024-11-15"
  },
  {
    id: 6,
    name: "Robert Martinez",
    title: "Sales Manager",
    company: "Smart Solutions",
    department: "Sales",
    email: "r.martinez@smartsol.com",
    phone: "+1 (555) 678-9012",
    avatar: "https://images.unsplash.com/photo-1585066047759-3438c34cf676",
    avatarAlt: "Professional headshot of Hispanic man with beard in navy blue suit",
    status: "Customer",
    lastContact: "2024-12-20"
  },
  {
    id: 7,
    name: "Jennifer Kim",
    title: "Operations Manager",
    company: "NextGen Tech",
    department: "Operations",
    email: "jennifer.k@nextgentech.com",
    phone: "+1 (555) 789-0123",
    avatar: "https://images.unsplash.com/photo-1671741192700-cb7e66a7bd93",
    avatarAlt: "Professional headshot of Korean woman with long straight hair in black blazer",
    status: "Prospect",
    lastContact: "2024-12-25"
  },
  {
    id: 8,
    name: "James Wilson",
    title: "Business Analyst",
    company: "Alpha Enterprises",
    department: "Analytics",
    email: "james.wilson@alphaent.com",
    phone: "+1 (555) 890-1234",
    avatar: "https://images.unsplash.com/photo-1543587204-e5c16a6ac741",
    avatarAlt: "Professional headshot of African American man with short hair in gray suit",
    status: "Active",
    lastContact: "2024-12-31"
  }];


  // Filter and sort contacts
  const filteredAndSortedContacts = useMemo(() => {
    let filtered = mockContacts?.filter((contact) => {
      const matchesSearch = searchTerm === '' ||
      contact?.name?.toLowerCase()?.includes(searchTerm?.toLowerCase()) ||
      contact?.email?.toLowerCase()?.includes(searchTerm?.toLowerCase()) ||
      contact?.company?.toLowerCase()?.includes(searchTerm?.toLowerCase());

      const matchesCompany = filters?.company === '' || contact?.company === filters?.company;
      const matchesRole = filters?.role === '' || contact?.title === filters?.role;
      const matchesStatus = filters?.status === '' || contact?.status === filters?.status;

      return matchesSearch && matchesCompany && matchesRole && matchesStatus;
    });

    // Sort contacts
    filtered?.sort((a, b) => {
      const aValue = a?.[sortConfig?.key];
      const bValue = b?.[sortConfig?.key];

      if (sortConfig?.key === 'lastContact') {
        const aDate = new Date(aValue);
        const bDate = new Date(bValue);
        return sortConfig?.direction === 'asc' ? aDate - bDate : bDate - aDate;
      }

      if (typeof aValue === 'string') {
        return sortConfig?.direction === 'asc' ?
        aValue?.localeCompare(bValue) :
        bValue?.localeCompare(aValue);
      }

      return sortConfig?.direction === 'asc' ? aValue - bValue : bValue - aValue;
    });

    return filtered;
  }, [mockContacts, searchTerm, filters, sortConfig]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedContacts?.length / itemsPerPage);
  const paginatedContacts = filteredAndSortedContacts?.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Active filters count
  const activeFiltersCount = Object.values(filters)?.filter((value) => value !== '')?.length;

  const handleMenuToggle = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleSidebarClose = () => {
    setIsSidebarOpen(false);
  };

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev?.key === key && prev?.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setFilters({ company: '', role: '', status: '' });
    setCurrentPage(1);
  };

  const handleSelectContact = (contactId, checked) => {
    if (checked) {
      setSelectedContacts((prev) => [...prev, contactId]);
    } else {
      setSelectedContacts((prev) => prev?.filter((id) => id !== contactId));
    }
  };

  const handleSelectAllContacts = (checked) => {
    if (checked) {
      setSelectedContacts(paginatedContacts?.map((contact) => contact?.id));
    } else {
      setSelectedContacts([]);
    }
  };

  const handleContactClick = (contact) => {
    setSelectedContact(contact);
    setIsDrawerOpen(true);
  };

  const handleDrawerClose = () => {
    setIsDrawerOpen(false);
    setSelectedContact(null);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    setSelectedContacts([]);
  };

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
    setSelectedContacts([]);
  };

  const handleBulkExport = () => {
    console.log('Exporting contacts:', selectedContacts);
    // Implement export functionality
  };

  const handleBulkEmail = () => {
    console.log('Sending bulk email to contacts:', selectedContacts);
    // Implement bulk email functionality
  };

  const handleBulkTag = (tag) => {
    console.log('Adding tag to contacts:', selectedContacts, tag);
    // Implement bulk tagging functionality
  };

  const handleBulkDelete = () => {
    console.log('Deleting contacts:', selectedContacts);
    // Implement bulk delete functionality
    setSelectedContacts([]);
  };

  const handleAddContact = () => {
    console.log('Add new contact');
    // Implement add contact functionality
  };

  const handleImportContacts = () => {
    console.log('Import contacts');
    // Implement import functionality
  };

  return (
    <div className="min-h-screen bg-background">
      <Header onMenuToggle={handleMenuToggle} isSidebarOpen={isSidebarOpen} />
      <Sidebar isOpen={isSidebarOpen} onClose={handleSidebarClose} />
      <main className="lg:ml-64 pt-16">
        <div className="p-6 max-w-7xl mx-auto">
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Contacts</h1>
              <p className="text-muted-foreground mt-1">
                Manage your individual contacts and relationships
              </p>
            </div>
            <div className="flex items-center space-x-3 mt-4 sm:mt-0">
              <Button variant="outline" onClick={handleImportContacts}>
                <Icon name="Upload" size={16} className="mr-2" />
                Import
              </Button>
              <Button onClick={handleAddContact}>
                <Icon name="Plus" size={16} className="mr-2" />
                Add Contact
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-card rounded-xl border border-border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Contacts</p>
                  <p className="text-2xl font-bold text-foreground">{mockContacts?.length}</p>
                </div>
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <Icon name="Users" size={24} className="text-primary" />
                </div>
              </div>
            </div>
            
            <div className="bg-card rounded-xl border border-border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Contacts</p>
                  <p className="text-2xl font-bold text-foreground">
                    {mockContacts?.filter((c) => c?.status === 'Active')?.length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-success/10 rounded-full flex items-center justify-center">
                  <Icon name="UserCheck" size={24} className="text-success" />
                </div>
              </div>
            </div>
            
            <div className="bg-card rounded-xl border border-border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Prospects</p>
                  <p className="text-2xl font-bold text-foreground">
                    {mockContacts?.filter((c) => c?.status === 'Prospect')?.length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-warning/10 rounded-full flex items-center justify-center">
                  <Icon name="Target" size={24} className="text-warning" />
                </div>
              </div>
            </div>
            
            <div className="bg-card rounded-xl border border-border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Customers</p>
                  <p className="text-2xl font-bold text-foreground">
                    {mockContacts?.filter((c) => c?.status === 'Customer')?.length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center">
                  <Icon name="Crown" size={24} className="text-accent-foreground" />
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <ContactFilters
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            filters={filters}
            onFilterChange={handleFilterChange}
            activeFiltersCount={activeFiltersCount}
            onClearFilters={handleClearFilters} />


          {/* Bulk Actions */}
          <BulkActions
            selectedCount={selectedContacts?.length}
            onExport={handleBulkExport}
            onBulkEmail={handleBulkEmail}
            onBulkTag={handleBulkTag}
            onBulkDelete={handleBulkDelete} />


          {/* Contacts Table */}
          <ContactsTable
            contacts={paginatedContacts}
            selectedContacts={selectedContacts}
            onSelectContact={handleSelectContact}
            onSelectAllContacts={handleSelectAllContacts}
            onContactClick={handleContactClick}
            sortConfig={sortConfig}
            onSort={handleSort} />


          {/* Pagination */}
          <div className="mt-6">
            <ContactsPagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredAndSortedContacts?.length}
              itemsPerPage={itemsPerPage}
              onPageChange={handlePageChange}
              onItemsPerPageChange={handleItemsPerPageChange} />

          </div>
        </div>
      </main>
      {/* Contact Drawer */}
      <ContactDrawer
        contact={selectedContact}
        isOpen={isDrawerOpen}
        onClose={handleDrawerClose} />

    </div>);

};

export default ContactsPage;