import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const InvoiceTable = ({ invoices }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const totalPages = Math.ceil(invoices?.length / itemsPerPage);

  const formatDate = (dateString) => {
    return new Date(dateString)?.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    })?.format(amount);
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'paid':
        return 'bg-success/10 text-success border-success/20';
      case 'pending':
        return 'bg-warning/10 text-warning border-warning/20';
      case 'failed':
        return 'bg-error/10 text-error border-error/20';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  const handleDownload = (invoice) => {
    console.log('Downloading invoice:', invoice?.id);
    // Mock download functionality
  };

  const paginatedInvoices = invoices?.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="p-4 lg:p-6 border-b border-border">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 lg:w-10 lg:h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
            <Icon name="Receipt" size={16} className="lg:hidden text-primary" />
            <Icon name="Receipt" size={20} className="hidden lg:block text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-base lg:text-lg font-semibold text-foreground">Invoice History</h2>
            <p className="text-xs lg:text-sm text-muted-foreground break-words">Download and manage your billing history</p>
          </div>
        </div>
      </div>
      {/* Desktop Table */}
      <div className="hidden lg:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left py-3 px-4 lg:px-6 text-sm font-medium text-muted-foreground">
                  Invoice
                </th>
                <th className="text-left py-3 px-4 lg:px-6 text-sm font-medium text-muted-foreground">
                  Date
                </th>
                <th className="text-left py-3 px-4 lg:px-6 text-sm font-medium text-muted-foreground">
                  Amount
                </th>
                <th className="text-left py-3 px-4 lg:px-6 text-sm font-medium text-muted-foreground">
                  Status
                </th>
                <th className="text-right py-3 px-4 lg:px-6 text-sm font-medium text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paginatedInvoices?.map((invoice) => (
                <tr key={invoice?.id} className="hover:bg-muted/30 transition-colors">
                  <td className="py-4 px-4 lg:px-6">
                    <div className="font-medium text-foreground break-words">#{invoice?.number}</div>
                    <div className="text-sm text-muted-foreground break-words">{invoice?.description}</div>
                  </td>
                  <td className="py-4 px-4 lg:px-6 text-sm text-foreground whitespace-nowrap">
                    {formatDate(invoice?.date)}
                  </td>
                  <td className="py-4 px-4 lg:px-6 text-sm font-medium text-foreground whitespace-nowrap">
                    {formatAmount(invoice?.amount)}
                  </td>
                  <td className="py-4 px-4 lg:px-6">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border whitespace-nowrap ${getStatusColor(invoice?.status)}`}>
                      {invoice?.status}
                    </span>
                  </td>
                  <td className="py-4 px-4 lg:px-6 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDownload(invoice)}
                      iconName="Download"
                      iconSize={16}
                      aria-label={`Download invoice ${invoice?.number}`}
                    >
                      Download
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {/* Mobile Cards */}
      <div className="lg:hidden divide-y divide-border">
        {paginatedInvoices?.map((invoice) => (
          <div key={invoice?.id} className="p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div className="min-w-0 flex-1 pr-3">
                <div className="font-medium text-foreground break-words">#{invoice?.number}</div>
                <div className="text-sm text-muted-foreground break-words">{invoice?.description}</div>
              </div>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border whitespace-nowrap ${getStatusColor(invoice?.status)}`}>
                {invoice?.status}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-1 flex-1">
                <div className="text-sm text-muted-foreground">Date</div>
                <div className="text-sm font-medium text-foreground">
                  {formatDate(invoice?.date)}
                </div>
              </div>
              <div className="space-y-1 text-right flex-1">
                <div className="text-sm text-muted-foreground">Amount</div>
                <div className="text-sm font-medium text-foreground">
                  {formatAmount(invoice?.amount)}
                </div>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              fullWidth
              onClick={() => handleDownload(invoice)}
              iconName="Download"
              iconPosition="left"
              iconSize={16}
            >
              Download PDF
            </Button>
          </div>
        ))}
      </div>
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="p-4 border-t border-border">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-sm text-muted-foreground text-center sm:text-left">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, invoices?.length)} of {invoices?.length} invoices
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                iconName="ChevronLeft"
                iconSize={16}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                iconName="ChevronRight"
                iconSize={16}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceTable;