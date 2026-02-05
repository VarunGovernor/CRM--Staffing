import React, { useState, useMemo } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import { Checkbox } from '../../../components/ui/Checkbox';

const AccountsTable = ({ accounts, onRowClick, onBulkAction }) => {
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [globalFilter, setGlobalFilter] = useState('');
  const [columnFilters, setColumnFilters] = useState({});
  const [visibleColumns, setVisibleColumns] = useState({
    company: true,
    industry: true,
    revenue: true,
    contacts: true,
    dealValue: true,
    lastActivity: true,
    actions: true
  });

  const columns = [
    { key: 'company', label: 'Company Name', sortable: true },
    { key: 'industry', label: 'Industry', sortable: true },
    { key: 'revenue', label: 'Annual Revenue', sortable: true },
    { key: 'contacts', label: 'Contacts', sortable: true },
    { key: 'dealValue', label: 'Deal Value', sortable: true },
    { key: 'lastActivity', label: 'Last Activity', sortable: true },
    { key: 'actions', label: 'Actions', sortable: false }
  ];

  const pageSizeOptions = [
    { value: 10, label: '10 per page' },
    { value: 25, label: '25 per page' },
    { value: 50, label: '50 per page' },
    { value: 100, label: '100 per page' }
  ];

  // Filter and sort data
  const filteredAndSortedData = useMemo(() => {
    let filtered = accounts?.filter(account => {
      // Global filter
      if (globalFilter) {
        const searchTerm = globalFilter?.toLowerCase();
        const searchableFields = [account?.company, account?.industry, account?.owner];
        if (!searchableFields?.some(field => field?.toLowerCase()?.includes(searchTerm))) {
          return false;
        }
      }

      // Column filters
      for (const [key, value] of Object.entries(columnFilters)) {
        if (value && account?.[key] && !account?.[key]?.toLowerCase()?.includes(value?.toLowerCase())) {
          return false;
        }
      }

      return true;
    });

    // Sort data
    if (sortConfig?.key) {
      filtered?.sort((a, b) => {
        let aValue = a?.[sortConfig?.key];
        let bValue = b?.[sortConfig?.key];

        // Handle different data types
        if (sortConfig?.key === 'revenue' || sortConfig?.key === 'dealValue') {
          aValue = parseFloat(aValue?.replace(/[$,]/g, '')) || 0;
          bValue = parseFloat(bValue?.replace(/[$,]/g, '')) || 0;
        } else if (sortConfig?.key === 'lastActivity') {
          aValue = new Date(aValue);
          bValue = new Date(bValue);
        } else if (typeof aValue === 'string') {
          aValue = aValue?.toLowerCase();
          bValue = bValue?.toLowerCase();
        }

        if (aValue < bValue) return sortConfig?.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig?.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [accounts, globalFilter, columnFilters, sortConfig]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedData?.length / pageSize);
  const paginatedData = filteredAndSortedData?.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev?.key === key && prev?.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedRows(new Set(paginatedData.map(account => account.id)));
    } else {
      setSelectedRows(new Set());
    }
  };

  const handleSelectRow = (id, checked) => {
    const newSelected = new Set(selectedRows);
    if (checked) {
      newSelected?.add(id);
    } else {
      newSelected?.delete(id);
    }
    setSelectedRows(newSelected);
  };

  const handleColumnFilter = (column, value) => {
    setColumnFilters(prev => ({
      ...prev,
      [column]: value
    }));
    setCurrentPage(1);
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    })?.format(parseFloat(value?.replace(/[$,]/g, '')) || 0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString)?.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const isAllSelected = paginatedData?.length > 0 && selectedRows?.size === paginatedData?.length;
  const isIndeterminate = selectedRows?.size > 0 && selectedRows?.size < paginatedData?.length;

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      {/* Table Header with Search and Filters */}
      <div className="p-4 border-b border-border space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex-1 max-w-md">
            <Input
              type="search"
              placeholder="Search accounts..."
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e?.target?.value)}
              className="w-full"
            />
          </div>
          
          <div className="flex items-center gap-2">
            {selectedRows?.size > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {selectedRows?.size} selected
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onBulkAction('delete', Array.from(selectedRows))}
                >
                  <Icon name="Trash2" size={16} className="mr-2" />
                  Delete
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onBulkAction('export', Array.from(selectedRows))}
                >
                  <Icon name="Download" size={16} className="mr-2" />
                  Export
                </Button>
              </div>
            )}
            
            <Button variant="outline" size="sm">
              <Icon name="Settings2" size={16} className="mr-2" />
              Columns
            </Button>
          </div>
        </div>

        {/* Column Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <Input
            type="text"
            placeholder="Filter company..."
            value={columnFilters?.company || ''}
            onChange={(e) => handleColumnFilter('company', e?.target?.value)}
            className="text-sm"
          />
          <Input
            type="text"
            placeholder="Filter industry..."
            value={columnFilters?.industry || ''}
            onChange={(e) => handleColumnFilter('industry', e?.target?.value)}
            className="text-sm"
          />
          <Input
            type="text"
            placeholder="Filter revenue..."
            value={columnFilters?.revenue || ''}
            onChange={(e) => handleColumnFilter('revenue', e?.target?.value)}
            className="text-sm"
          />
          <Input
            type="text"
            placeholder="Filter contacts..."
            value={columnFilters?.contacts || ''}
            onChange={(e) => handleColumnFilter('contacts', e?.target?.value)}
            className="text-sm"
          />
          <Input
            type="text"
            placeholder="Filter deal value..."
            value={columnFilters?.dealValue || ''}
            onChange={(e) => handleColumnFilter('dealValue', e?.target?.value)}
            className="text-sm"
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setColumnFilters({});
              setGlobalFilter('');
            }}
            className="text-muted-foreground"
          >
            <Icon name="X" size={16} className="mr-2" />
            Clear
          </Button>
        </div>
      </div>
      {/* Desktop Table */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="w-12 p-4">
                <Checkbox
                  checked={isAllSelected}
                  indeterminate={isIndeterminate}
                  onChange={(e) => handleSelectAll(e?.target?.checked)}
                />
              </th>
              {columns?.map(column => (
                visibleColumns?.[column?.key] && (
                  <th
                    key={column?.key}
                    className="text-left p-4 font-medium text-muted-foreground"
                  >
                    {column?.sortable ? (
                      <button
                        onClick={() => handleSort(column?.key)}
                        className="flex items-center space-x-1 hover:text-foreground transition-colors"
                      >
                        <span>{column?.label}</span>
                        {sortConfig?.key === column?.key && (
                          <Icon
                            name={sortConfig?.direction === 'asc' ? 'ChevronUp' : 'ChevronDown'}
                            size={16}
                          />
                        )}
                      </button>
                    ) : (
                      column?.label
                    )}
                  </th>
                )
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData?.map((account) => (
              <tr
                key={account?.id}
                className="border-t border-border hover:bg-muted/30 cursor-pointer transition-colors"
                onClick={() => onRowClick(account)}
              >
                <td className="p-4" onClick={(e) => e?.stopPropagation()}>
                  <Checkbox
                    checked={selectedRows?.has(account?.id)}
                    onChange={(e) => handleSelectRow(account?.id, e?.target?.checked)}
                  />
                </td>
                {visibleColumns?.company && (
                  <td className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Icon name="Building2" size={16} className="text-primary" />
                      </div>
                      <div>
                        <div className="font-medium text-foreground">{account?.company}</div>
                        <div className="text-sm text-muted-foreground">{account?.owner}</div>
                      </div>
                    </div>
                  </td>
                )}
                {visibleColumns?.industry && (
                  <td className="p-4 text-foreground">{account?.industry}</td>
                )}
                {visibleColumns?.revenue && (
                  <td className="p-4 text-foreground">{formatCurrency(account?.revenue)}</td>
                )}
                {visibleColumns?.contacts && (
                  <td className="p-4 text-foreground">{account?.contactCount}</td>
                )}
                {visibleColumns?.dealValue && (
                  <td className="p-4 text-foreground">{formatCurrency(account?.dealValue)}</td>
                )}
                {visibleColumns?.lastActivity && (
                  <td className="p-4 text-muted-foreground">{formatDate(account?.lastActivity)}</td>
                )}
                {visibleColumns?.actions && (
                  <td className="p-4" onClick={(e) => e?.stopPropagation()}>
                    <div className="flex items-center space-x-1">
                      <Button variant="ghost" size="icon">
                        <Icon name="Edit" size={16} />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <Icon name="MoreHorizontal" size={16} />
                      </Button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Mobile Card Layout */}
      <div className="lg:hidden">
        {paginatedData?.map((account) => (
          <div
            key={account?.id}
            className="p-4 border-b border-border last:border-b-0 cursor-pointer hover:bg-muted/30 transition-colors"
            onClick={() => onRowClick(account)}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-3">
                <Checkbox
                  checked={selectedRows?.has(account?.id)}
                  onChange={(e) => handleSelectRow(account?.id, e?.target?.checked)}
                  onClick={(e) => e?.stopPropagation()}
                />
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Icon name="Building2" size={20} className="text-primary" />
                </div>
                <div>
                  <div className="font-medium text-foreground">{account?.company}</div>
                  <div className="text-sm text-muted-foreground">{account?.industry}</div>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={(e) => e?.stopPropagation()}>
                <Icon name="MoreVertical" size={16} />
              </Button>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground">Revenue</div>
                <div className="font-medium text-foreground">{formatCurrency(account?.revenue)}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Contacts</div>
                <div className="font-medium text-foreground">{account?.contactCount}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Deal Value</div>
                <div className="font-medium text-foreground">{formatCurrency(account?.dealValue)}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Last Activity</div>
                <div className="font-medium text-foreground">{formatDate(account?.lastActivity)}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
      {/* Pagination */}
      <div className="p-4 border-t border-border">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center space-x-4">
            <Select
              options={pageSizeOptions}
              value={pageSize}
              onChange={setPageSize}
              className="w-32"
            />
            <span className="text-sm text-muted-foreground">
              Showing {Math.min((currentPage - 1) * pageSize + 1, filteredAndSortedData?.length)} to{' '}
              {Math.min(currentPage * pageSize, filteredAndSortedData?.length)} of{' '}
              {filteredAndSortedData?.length} results
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(1)}
            >
              <Icon name="ChevronsLeft" size={16} />
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => prev - 1)}
            >
              <Icon name="ChevronLeft" size={16} />
            </Button>
            
            <div className="flex items-center space-x-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(pageNum)}
                    className="w-8 h-8"
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => prev + 1)}
            >
              <Icon name="ChevronRight" size={16} />
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(totalPages)}
            >
              <Icon name="ChevronsRight" size={16} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountsTable;