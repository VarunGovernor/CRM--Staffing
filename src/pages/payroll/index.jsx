import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Header from '../../components/ui/Header';
import Sidebar from '../../components/ui/Sidebar';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { supabase } from '../../lib/supabase';

const PayrollPage = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('payroll');
  const [payrollData, setPayrollData] = useState([]);
  const [timesheetData, setTimesheetData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Payment modal state
  const [paymentModal, setPaymentModal] = useState({ isOpen: false, employee: null });
  const [paymentType, setPaymentType] = useState('full');
  const [customAmount, setCustomAmount] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: placements } = await supabase
        ?.from('placements')
        ?.select(`*, candidate:candidates(id, first_name, last_name, email)`)
        ?.eq('status', 'active')
        ?.order('created_at', { ascending: false });

      const payroll = (placements || []).map(p => ({
        id: p.id,
        employee: `${p.candidate?.first_name} ${p.candidate?.last_name}`,
        role: p.job_title,
        payRate: p.pay_rate,
        billableHours: 160,
        totalPay: p.pay_rate * 160,
        paidAmount: 0,
        status: 'Pending'
      }));

      setPayrollData(payroll.length > 0 ? payroll : mockPayrollData);

      const timesheets = (placements || []).map(p => ({
        id: p.id,
        employee: `${p.candidate?.first_name} ${p.candidate?.last_name}`,
        date: new Date().toISOString().split('T')[0],
        checkIn: getRandomTime(8, 10),
        checkOut: getRandomTime(16, 18),
        status: getRandomStatus()
      }));

      setTimesheetData(timesheets.length > 0 ? timesheets : mockTimesheetData);
    } catch (error) {
      console.error('Error fetching data:', error);
      setPayrollData(mockPayrollData);
      setTimesheetData(mockTimesheetData);
    } finally {
      setLoading(false);
    }
  };

  const getRandomTime = (minHour, maxHour) => {
    const hour = Math.floor(Math.random() * (maxHour - minHour + 1)) + minHour;
    const minute = Math.random() > 0.5 ? '00' : '30';
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour;
    return `${String(displayHour).padStart(2, '0')}:${minute} ${period}`;
  };

  const getRandomStatus = () => {
    const statuses = ['Completed', 'Active', 'Not Started'];
    return statuses[Math.floor(Math.random() * statuses.length)];
  };

  const mockPayrollData = [
    { id: 1, employee: 'Sarah Miller', role: 'React Dev', payRate: 65, billableHours: 160, totalPay: 10400, paidAmount: 0, status: 'Pending' },
    { id: 2, employee: 'John Doe', role: 'Backend Eng', payRate: 75, billableHours: 155, totalPay: 11625, paidAmount: 11625, status: 'Processed' },
    { id: 3, employee: 'Emma Wilson', role: 'Designer', payRate: 55, billableHours: 140, totalPay: 7700, paidAmount: 3000, status: 'Partial' },
    { id: 4, employee: 'Mike Ross', role: 'DevOps', payRate: 80, billableHours: 160, totalPay: 12800, paidAmount: 0, status: 'Pending' }
  ];

  const mockTimesheetData = [
    { id: 1, employee: 'Sarah Miller', date: '2025-01-20', checkIn: '09:00 AM', checkOut: '05:00 PM', status: 'Completed' },
    { id: 2, employee: 'John Doe', date: '2025-01-20', checkIn: '09:30 AM', checkOut: '--:--', status: 'Active' },
    { id: 3, employee: 'Emma Wilson', date: '2025-01-20', checkIn: '08:45 AM', checkOut: '04:45 PM', status: 'Completed' },
    { id: 4, employee: 'Mike Ross', date: '2025-01-20', checkIn: '--:--', checkOut: '--:--', status: 'Not Started' }
  ];

  const getStatusColor = (status) => {
    const colors = {
      'Pending': 'bg-orange-100 text-orange-700',
      'Processed': 'bg-green-100 text-green-700',
      'Partial': 'bg-blue-100 text-blue-700',
      'Completed': 'bg-green-100 text-green-700',
      'Active': 'bg-blue-100 text-blue-700',
      'Not Started': 'bg-gray-100 text-gray-700'
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const openPaymentModal = (employee) => {
    setPaymentModal({ isOpen: true, employee });
    setPaymentType('full');
    setCustomAmount('');
  };

  const closePaymentModal = () => {
    setPaymentModal({ isOpen: false, employee: null });
    setPaymentType('full');
    setCustomAmount('');
  };

  const handleProcessPayment = () => {
    const { employee } = paymentModal;
    if (!employee) return;

    const amountToPay = paymentType === 'full'
      ? employee.totalPay - employee.paidAmount
      : parseFloat(customAmount) || 0;

    if (amountToPay <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    const remainingAfterPayment = employee.totalPay - employee.paidAmount - amountToPay;

    setPayrollData(prev => prev.map(p => {
      if (p.id === employee.id) {
        const newPaidAmount = p.paidAmount + amountToPay;
        const newStatus = newPaidAmount >= p.totalPay ? 'Processed' : 'Partial';
        return { ...p, paidAmount: newPaidAmount, status: newStatus };
      }
      return p;
    }));

    closePaymentModal();
  };

  const handleClockIn = (id) => {
    const now = new Date();
    const time = `${String(now.getHours() > 12 ? now.getHours() - 12 : now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} ${now.getHours() >= 12 ? 'PM' : 'AM'}`;
    setTimesheetData(prev => prev.map(t =>
      t.id === id ? { ...t, checkIn: time, status: 'Active' } : t
    ));
  };

  const handleClockOut = (id) => {
    const now = new Date();
    const time = `${String(now.getHours() > 12 ? now.getHours() - 12 : now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} ${now.getHours() >= 12 ? 'PM' : 'AM'}`;
    setTimesheetData(prev => prev.map(t =>
      t.id === id ? { ...t, checkOut: time, status: 'Completed' } : t
    ));
  };

  return (
    <div className="min-h-screen bg-background">
      <Header onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)} isSidebarOpen={isSidebarOpen} />
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <main className="lg:ml-64 pt-16">
        <div className="p-4 lg:p-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">Payroll & Timesheets</h1>
              <p className="text-muted-foreground">Manage employee payroll and track daily timesheets</p>
            </div>

            {/* Tabs */}
            <div className="border-b border-border mb-6">
              <div className="flex gap-8">
                <button
                  onClick={() => setActiveTab('payroll')}
                  className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'payroll'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  PAYROLL & RATES
                </button>
                <button
                  onClick={() => setActiveTab('timesheet')}
                  className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'timesheet'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  DAILY TIMESHEET LOGS
                </button>
              </div>
            </div>

            {/* Content */}
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (
              <>
                {/* Payroll Tab */}
                {activeTab === 'payroll' && (
                  <div>
                    <div className="flex justify-end mb-4">
                      <Button variant="outline" className="flex items-center gap-2">
                        <Icon name="Download" size={16} />
                        Export Payroll Summary
                      </Button>
                    </div>

                    <div className="bg-card rounded-xl border border-border overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-muted/50 border-b border-border">
                            <tr>
                              <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Employee</th>
                              <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Pay Rate</th>
                              <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Billable Hours</th>
                              <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Total Pay</th>
                              <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Paid</th>
                              <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Balance</th>
                              <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Status</th>
                              <th className="px-6 py-4 text-right text-sm font-medium text-muted-foreground">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border">
                            {payrollData.map((row) => {
                              const balance = row.totalPay - row.paidAmount;
                              return (
                                <tr key={row.id} className="hover:bg-muted/30 transition-colors">
                                  <td className="px-6 py-4">
                                    <div>
                                      <p className="font-medium text-foreground">{row.employee}</p>
                                      <p className="text-sm text-muted-foreground">{row.role}</p>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 text-foreground">${row.payRate}/hr</td>
                                  <td className="px-6 py-4 text-foreground">{row.billableHours} hrs</td>
                                  <td className="px-6 py-4 text-foreground font-medium">
                                    ${row.totalPay.toLocaleString()}
                                  </td>
                                  <td className="px-6 py-4 text-green-600 font-medium">
                                    ${row.paidAmount.toLocaleString()}
                                  </td>
                                  <td className="px-6 py-4 text-primary font-semibold">
                                    ${balance.toLocaleString()}
                                  </td>
                                  <td className="px-6 py-4">
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(row.status)}`}>
                                      {row.status}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 text-right">
                                    {row.status !== 'Processed' ? (
                                      <Button
                                        size="sm"
                                        onClick={() => openPaymentModal(row)}
                                        className="flex items-center gap-1"
                                      >
                                        <Icon name="DollarSign" size={14} />
                                        Pay
                                      </Button>
                                    ) : (
                                      <Button variant="outline" size="sm" className="flex items-center gap-1">
                                        <Icon name="Download" size={14} />
                                        Slip
                                      </Button>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* Timesheet Tab */}
                {activeTab === 'timesheet' && (
                  <div>
                    <div className="flex justify-end mb-4">
                      <Button variant="outline" className="flex items-center gap-2">
                        <Icon name="Download" size={16} />
                        Export Daily Logs
                      </Button>
                    </div>

                    <div className="bg-card rounded-xl border border-border overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-muted/50 border-b border-border">
                            <tr>
                              <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Employee</th>
                              <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Date</th>
                              <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Check In</th>
                              <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Check Out</th>
                              <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Status</th>
                              <th className="px-6 py-4 text-right text-sm font-medium text-muted-foreground">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border">
                            {timesheetData.map((row) => (
                              <tr key={row.id} className="hover:bg-muted/30 transition-colors">
                                <td className="px-6 py-4">
                                  <p className="font-medium text-foreground">{row.employee}</p>
                                </td>
                                <td className="px-6 py-4 text-foreground">{row.date}</td>
                                <td className="px-6 py-4 text-primary font-medium">
                                  {row.checkIn === '--:--' ? '--:--' : row.checkIn}
                                </td>
                                <td className="px-6 py-4 text-foreground">
                                  {row.checkOut === '--:--' ? '--:--' : row.checkOut}
                                </td>
                                <td className="px-6 py-4">
                                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(row.status)}`}>
                                    {row.status}
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                  {row.status === 'Not Started' && (
                                    <Button size="sm" onClick={() => handleClockIn(row.id)} className="flex items-center gap-1">
                                      <Icon name="LogIn" size={14} />
                                      Clock In
                                    </Button>
                                  )}
                                  {row.status === 'Active' && (
                                    <Button
                                      size="sm"
                                      onClick={() => handleClockOut(row.id)}
                                      className="flex items-center gap-1 bg-orange-500 hover:bg-orange-600"
                                    >
                                      <Icon name="Send" size={14} />
                                      Clock Out
                                    </Button>
                                  )}
                                  {row.status === 'Completed' && (
                                    <Button variant="outline" size="sm" className="flex items-center gap-1">
                                      <Icon name="Download" size={14} />
                                      Log
                                    </Button>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </motion.div>
        </div>
      </main>

      {/* Payment Modal */}
      <AnimatePresence>
        {paymentModal.isOpen && paymentModal.employee && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={closePaymentModal}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md mx-4 bg-card border border-border rounded-xl shadow-xl"
            >
              <div className="p-6 border-b border-border">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-foreground">Process Payment</h2>
                  <button onClick={closePaymentModal} className="p-2 hover:bg-muted rounded-lg">
                    <Icon name="X" size={20} className="text-muted-foreground" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Employee Info */}
                <div className="bg-muted/30 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">Employee</p>
                  <p className="font-semibold text-foreground">{paymentModal.employee.employee}</p>
                  <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Total Pay</p>
                      <p className="font-medium text-foreground">${paymentModal.employee.totalPay.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Already Paid</p>
                      <p className="font-medium text-green-600">${paymentModal.employee.paidAmount.toLocaleString()}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-muted-foreground">Balance Due</p>
                      <p className="font-semibold text-primary text-lg">
                        ${(paymentModal.employee.totalPay - paymentModal.employee.paidAmount).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Payment Type Selection */}
                <div className="space-y-3">
                  <p className="text-sm font-medium text-foreground">Payment Type</p>
                  <div className="space-y-2">
                    <label className="flex items-center gap-3 p-3 border border-border rounded-lg cursor-pointer hover:bg-muted/30 transition-colors">
                      <input
                        type="radio"
                        name="paymentType"
                        value="full"
                        checked={paymentType === 'full'}
                        onChange={(e) => setPaymentType(e.target.value)}
                        className="w-4 h-4 text-primary"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-foreground">Full Payment</p>
                        <p className="text-sm text-muted-foreground">
                          Pay remaining balance: ${(paymentModal.employee.totalPay - paymentModal.employee.paidAmount).toLocaleString()}
                        </p>
                      </div>
                    </label>
                    <label className="flex items-center gap-3 p-3 border border-border rounded-lg cursor-pointer hover:bg-muted/30 transition-colors">
                      <input
                        type="radio"
                        name="paymentType"
                        value="partial"
                        checked={paymentType === 'partial'}
                        onChange={(e) => setPaymentType(e.target.value)}
                        className="w-4 h-4 text-primary"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-foreground">Partial Payment</p>
                        <p className="text-sm text-muted-foreground">Enter custom amount</p>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Custom Amount Input */}
                {paymentType === 'partial' && (
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">Custom Amount ($)</label>
                    <Input
                      type="number"
                      value={customAmount}
                      onChange={(e) => setCustomAmount(e.target.value)}
                      placeholder="Enter amount"
                      min="0"
                      max={paymentModal.employee.totalPay - paymentModal.employee.paidAmount}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Max: ${(paymentModal.employee.totalPay - paymentModal.employee.paidAmount).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-border flex gap-3 justify-end">
                <Button variant="outline" onClick={closePaymentModal}>Cancel</Button>
                <Button onClick={handleProcessPayment} className="flex items-center gap-2">
                  <Icon name="DollarSign" size={16} />
                  Process Payment
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PayrollPage;
