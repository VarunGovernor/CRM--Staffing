import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Header from '../../components/ui/Header';
import Sidebar from '../../components/ui/Sidebar';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Modal from '../../components/ui/Modal';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

const PayrollPage = () => {
  const { user } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('payroll');
  const [payrollData, setPayrollData] = useState([]);
  const [timesheetData, setTimesheetData] = useState([]);
  const [loading, setLoading] = useState(true);

  // C2C Timesheet state
  const [c2cTimesheets, setC2cTimesheets] = useState([]);
  const [c2cCandidates, setC2cCandidates] = useState([]);
  const [c2cLoading, setC2cLoading] = useState(true);
  const [timesheetModalOpen, setTimesheetModalOpen] = useState(false);
  const [timesheetForm, setTimesheetForm] = useState({
    candidate_id: '',
    period_start: '',
    period_end: '',
    hours_worked: '',
    screenshot_url: '',
    notes: ''
  });
  const [timesheetErrors, setTimesheetErrors] = useState({});
  const [timesheetSaving, setTimesheetSaving] = useState(false);

  // W2 Timesheet state
  const [w2Timesheets, setW2Timesheets] = useState([]);
  const [w2Candidates, setW2Candidates] = useState([]);
  const [w2Loading, setW2Loading] = useState(true);
  const [w2ModalOpen, setW2ModalOpen] = useState(false);
  const [w2Form, setW2Form] = useState({
    candidate_id: '',
    period_start: '',
    period_end: '',
    hours_worked: '',
    screenshot_url: '',
    notes: ''
  });
  const [w2Errors, setW2Errors] = useState({});
  const [w2Saving, setW2Saving] = useState(false);

  // Search filter
  const [searchTerm, setSearchTerm] = useState('');
  const [payrollStatusFilter, setPayrollStatusFilter] = useState('');

  const filteredPayroll = useMemo(() => {
    return payrollData?.filter(p => {
      const matchesSearch = searchTerm === '' ||
        p?.employee?.toLowerCase()?.includes(searchTerm?.toLowerCase()) ||
        p?.role?.toLowerCase()?.includes(searchTerm?.toLowerCase());
      const matchesStatus = payrollStatusFilter === '' || p?.status === payrollStatusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [payrollData, searchTerm, payrollStatusFilter]);

  const filteredTimesheets = useMemo(() => {
    return timesheetData?.filter(t => {
      return searchTerm === '' ||
        t?.employee?.toLowerCase()?.includes(searchTerm?.toLowerCase());
    });
  }, [timesheetData, searchTerm]);

  const filteredC2c = useMemo(() => {
    return c2cTimesheets?.filter(ts => {
      const name = getCandidateDisplayName(ts?.candidate);
      return searchTerm === '' ||
        name?.toLowerCase()?.includes(searchTerm?.toLowerCase()) ||
        ts?.candidate?.email?.toLowerCase()?.includes(searchTerm?.toLowerCase());
    });
  }, [c2cTimesheets, searchTerm]);

  const filteredW2 = useMemo(() => {
    return w2Timesheets?.filter(ts => {
      const name = getCandidateDisplayName(ts?.candidate);
      return searchTerm === '' ||
        name?.toLowerCase()?.includes(searchTerm?.toLowerCase()) ||
        ts?.candidate?.email?.toLowerCase()?.includes(searchTerm?.toLowerCase());
    });
  }, [w2Timesheets, searchTerm]);

  // Payment modal state
  const [paymentModal, setPaymentModal] = useState({ isOpen: false, employee: null });
  const [paymentType, setPaymentType] = useState('full');
  const [customAmount, setCustomAmount] = useState('');

  useEffect(() => {
    fetchData();
    fetchC2cData();
    fetchW2Data();
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

  const fetchC2cData = async () => {
    setC2cLoading(true);
    try {
      const [candidatesRes, timesheetsRes] = await Promise.all([
        supabase?.from('candidates')?.select('id, first_name, last_name, full_name, email')?.eq('deal_type', 'c2c')?.order('full_name'),
        supabase?.from('timesheets')?.select(`
          *,
          candidate:candidates(id, first_name, last_name, full_name, email),
          submitted_by_user:user_profiles!submitted_by(full_name),
          approved_by_user:user_profiles!approved_by(full_name)
        `)?.order('period_start', { ascending: false })
      ]);

      setC2cCandidates(candidatesRes?.data || []);
      setC2cTimesheets(timesheetsRes?.data || []);
    } catch (error) {
      console.error('Error fetching C2C data:', error);
    } finally {
      setC2cLoading(false);
    }
  };

  const fetchW2Data = async () => {
    setW2Loading(true);
    try {
      const [candidatesRes, timesheetsRes] = await Promise.all([
        supabase?.from('candidates')?.select('id, first_name, last_name, full_name, email')?.eq('deal_type', 'w2')?.order('full_name'),
        supabase?.from('timesheets')?.select(`
          *,
          candidate:candidates!inner(id, first_name, last_name, full_name, email, deal_type),
          submitted_by_user:user_profiles!submitted_by(full_name),
          approved_by_user:user_profiles!approved_by(full_name)
        `)?.eq('candidate.deal_type', 'w2')?.order('period_start', { ascending: false })
      ]);

      setW2Candidates(candidatesRes?.data || []);
      setW2Timesheets(timesheetsRes?.data || []);
    } catch (error) {
      console.error('Error fetching W2 data:', error);
    } finally {
      setW2Loading(false);
    }
  };

  const handleW2FormChange = (e) => {
    const { name, value } = e.target;
    setW2Form(prev => ({ ...prev, [name]: value }));
    if (w2Errors[name]) {
      setW2Errors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleW2Submit = async () => {
    const errors = {};
    if (!w2Form.candidate_id) errors.candidate_id = 'Employee is required';
    if (!w2Form.period_start) errors.period_start = 'Start date is required';
    if (!w2Form.period_end) errors.period_end = 'End date is required';
    if (!w2Form.hours_worked) errors.hours_worked = 'Hours are required';

    if (Object.keys(errors).length > 0) {
      setW2Errors(errors);
      return;
    }

    setW2Saving(true);
    try {
      const { error } = await supabase.from('timesheets').insert({
        candidate_id: w2Form.candidate_id,
        period_start: w2Form.period_start,
        period_end: w2Form.period_end,
        hours_worked: parseFloat(w2Form.hours_worked),
        screenshot_url: w2Form.screenshot_url?.trim() || null,
        notes: w2Form.notes?.trim() || null,
        submitted_by: user?.id
      });

      if (!error) {
        setW2ModalOpen(false);
        setW2Form({ candidate_id: '', period_start: '', period_end: '', hours_worked: '', screenshot_url: '', notes: '' });
        setW2Errors({});
        fetchW2Data();
      }
    } catch (error) {
      console.error('Error submitting W2 timesheet:', error);
    } finally {
      setW2Saving(false);
    }
  };

  const handleApproveW2 = async (timesheetId) => {
    const { error } = await supabase.from('timesheets').update({
      is_approved: true,
      approved_by: user?.id,
      approved_at: new Date().toISOString()
    }).eq('id', timesheetId);

    if (!error) fetchW2Data();
  };

  const handleTimesheetFormChange = (e) => {
    const { name, value } = e.target;
    setTimesheetForm(prev => ({ ...prev, [name]: value }));
    if (timesheetErrors[name]) {
      setTimesheetErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleTimesheetSubmit = async () => {
    const errors = {};
    if (!timesheetForm.candidate_id) errors.candidate_id = 'Candidate is required';
    if (!timesheetForm.period_start) errors.period_start = 'Start date is required';
    if (!timesheetForm.period_end) errors.period_end = 'End date is required';
    if (!timesheetForm.hours_worked) errors.hours_worked = 'Hours are required';

    if (Object.keys(errors).length > 0) {
      setTimesheetErrors(errors);
      return;
    }

    setTimesheetSaving(true);
    try {
      const { error } = await supabase.from('timesheets').insert({
        candidate_id: timesheetForm.candidate_id,
        period_start: timesheetForm.period_start,
        period_end: timesheetForm.period_end,
        hours_worked: parseFloat(timesheetForm.hours_worked),
        screenshot_url: timesheetForm.screenshot_url?.trim() || null,
        notes: timesheetForm.notes?.trim() || null,
        submitted_by: user?.id
      });

      if (!error) {
        setTimesheetModalOpen(false);
        setTimesheetForm({ candidate_id: '', period_start: '', period_end: '', hours_worked: '', screenshot_url: '', notes: '' });
        setTimesheetErrors({});
        fetchC2cData();
      }
    } catch (error) {
      console.error('Error submitting timesheet:', error);
    } finally {
      setTimesheetSaving(false);
    }
  };

  const handleApproveTimesheet = async (timesheetId) => {
    const { error } = await supabase.from('timesheets').update({
      is_approved: true,
      approved_by: user?.id,
      approved_at: new Date().toISOString()
    }).eq('id', timesheetId);

    if (!error) fetchC2cData();
  };

  const getCandidateDisplayName = (c) => {
    return c?.full_name || `${c?.first_name || ''} ${c?.last_name || ''}`.trim();
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
                <button
                  onClick={() => setActiveTab('w2')}
                  className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'w2'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  W2 TIMESHEETS
                </button>
                <button
                  onClick={() => setActiveTab('c2c')}
                  className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'c2c'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  C2C TIMESHEETS
                </button>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-card rounded-xl border border-border p-4 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <Icon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search employee or candidate..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
                {activeTab === 'payroll' && (
                  <select
                    value={payrollStatusFilter}
                    onChange={(e) => setPayrollStatusFilter(e.target.value)}
                    className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  >
                    <option value="">All Statuses</option>
                    <option value="Pending">Pending</option>
                    <option value="Processed">Processed</option>
                    <option value="Partial">Partial</option>
                  </select>
                )}
              </div>
              {searchTerm && (
                <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                  <span>
                    Showing {activeTab === 'payroll' ? filteredPayroll?.length : activeTab === 'timesheet' ? filteredTimesheets?.length : activeTab === 'w2' ? filteredW2?.length : filteredC2c?.length} results
                  </span>
                  <button onClick={() => { setSearchTerm(''); setPayrollStatusFilter(''); }} className="text-primary hover:underline ml-2">Clear</button>
                </div>
              )}
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
                            {filteredPayroll.map((row) => {
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
                            {filteredTimesheets.map((row) => (
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
                {/* W2 Timesheets Tab */}
                {activeTab === 'w2' && (
                  <div>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Manage timesheets for W2 employees. Track hours worked per pay period with tax withholding details.
                        </p>
                      </div>
                      <Button onClick={() => setW2ModalOpen(true)} className="flex items-center gap-2 shrink-0">
                        <Icon name="Plus" size={16} />
                        Submit W2 Timesheet
                      </Button>
                    </div>

                    {/* W2 Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      <div className="bg-card p-5 rounded-xl border border-border">
                        <p className="text-xs text-muted-foreground mb-1">Total Entries</p>
                        <p className="text-2xl font-bold text-foreground">{w2Timesheets.length}</p>
                      </div>
                      <div className="bg-card p-5 rounded-xl border border-border">
                        <p className="text-xs text-muted-foreground mb-1">Pending Approval</p>
                        <p className="text-2xl font-bold text-amber-600">
                          {w2Timesheets.filter(t => !t.is_approved).length}
                        </p>
                      </div>
                      <div className="bg-card p-5 rounded-xl border border-border">
                        <p className="text-xs text-muted-foreground mb-1">Approved</p>
                        <p className="text-2xl font-bold text-green-600">
                          {w2Timesheets.filter(t => t.is_approved).length}
                        </p>
                      </div>
                      <div className="bg-card p-5 rounded-xl border border-border">
                        <p className="text-xs text-muted-foreground mb-1">Total Hours</p>
                        <p className="text-2xl font-bold text-primary">
                          {w2Timesheets.reduce((sum, t) => sum + (parseFloat(t.hours_worked) || 0), 0).toFixed(1)}
                        </p>
                      </div>
                    </div>

                    {w2Loading ? (
                      <div className="flex items-center justify-center h-64">
                        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    ) : (
                      <div className="bg-card rounded-xl border border-border overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead className="bg-muted/50 border-b border-border">
                              <tr>
                                <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Employee</th>
                                <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Pay Period</th>
                                <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Hours</th>
                                <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Screenshot</th>
                                <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Submitted By</th>
                                <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Status</th>
                                <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                              {filteredW2.map((ts) => (
                                <tr key={ts.id} className="hover:bg-muted/30 transition-colors">
                                  <td className="px-6 py-4">
                                    <div>
                                      <p className="font-medium text-foreground">
                                        {getCandidateDisplayName(ts.candidate)}
                                      </p>
                                      <p className="text-xs text-muted-foreground">{ts.candidate?.email}</p>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 text-sm text-foreground">
                                    {ts.period_start && ts.period_end
                                      ? `${new Date(ts.period_start).toLocaleDateString()} - ${new Date(ts.period_end).toLocaleDateString()}`
                                      : '-'
                                    }
                                  </td>
                                  <td className="px-6 py-4 text-sm font-medium text-foreground">
                                    {ts.hours_worked} hrs
                                  </td>
                                  <td className="px-6 py-4">
                                    {ts.screenshot_url ? (
                                      <a
                                        href={ts.screenshot_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-primary hover:text-primary/80 flex items-center gap-1 text-sm"
                                      >
                                        <Icon name="Image" size={14} />
                                        View
                                      </a>
                                    ) : (
                                      <span className="text-muted-foreground text-sm">-</span>
                                    )}
                                  </td>
                                  <td className="px-6 py-4 text-sm text-foreground">
                                    {ts.submitted_by_user?.full_name || '-'}
                                  </td>
                                  <td className="px-6 py-4">
                                    {ts.is_approved ? (
                                      <span className="flex items-center text-green-600 text-xs font-medium gap-1">
                                        <Icon name="CheckCircle" size={14} />
                                        Approved
                                      </span>
                                    ) : (
                                      <span className="flex items-center text-amber-600 text-xs font-medium gap-1">
                                        <Icon name="Clock" size={14} />
                                        Pending
                                      </span>
                                    )}
                                  </td>
                                  <td className="px-6 py-4">
                                    {!ts.is_approved && (
                                      <Button
                                        size="sm"
                                        onClick={() => handleApproveW2(ts.id)}
                                        className="flex items-center gap-1"
                                      >
                                        <Icon name="Check" size={14} />
                                        Approve
                                      </Button>
                                    )}
                                    {ts.is_approved && (
                                      <span className="text-xs text-muted-foreground">
                                        {ts.approved_by_user?.full_name} on {ts.approved_at ? new Date(ts.approved_at).toLocaleDateString() : ''}
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              ))}
                              {filteredW2.length === 0 && (
                                <tr>
                                  <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                                    No W2 timesheets submitted yet
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* C2C Timesheets Tab */}
                {activeTab === 'c2c' && (
                  <div>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Manage timesheets for Corp-to-Corp (C2C) candidates. Upload hours worked per period for invoicing.
                        </p>
                      </div>
                      <Button onClick={() => setTimesheetModalOpen(true)} className="flex items-center gap-2 shrink-0">
                        <Icon name="Plus" size={16} />
                        Submit Timesheet
                      </Button>
                    </div>

                    {/* C2C Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      <div className="bg-card p-5 rounded-xl border border-border">
                        <p className="text-xs text-muted-foreground mb-1">Total Entries</p>
                        <p className="text-2xl font-bold text-foreground">{c2cTimesheets.length}</p>
                      </div>
                      <div className="bg-card p-5 rounded-xl border border-border">
                        <p className="text-xs text-muted-foreground mb-1">Pending Approval</p>
                        <p className="text-2xl font-bold text-amber-600">
                          {c2cTimesheets.filter(t => !t.is_approved).length}
                        </p>
                      </div>
                      <div className="bg-card p-5 rounded-xl border border-border">
                        <p className="text-xs text-muted-foreground mb-1">Approved</p>
                        <p className="text-2xl font-bold text-green-600">
                          {c2cTimesheets.filter(t => t.is_approved).length}
                        </p>
                      </div>
                      <div className="bg-card p-5 rounded-xl border border-border">
                        <p className="text-xs text-muted-foreground mb-1">Total Hours</p>
                        <p className="text-2xl font-bold text-primary">
                          {c2cTimesheets.reduce((sum, t) => sum + (parseFloat(t.hours_worked) || 0), 0).toFixed(1)}
                        </p>
                      </div>
                    </div>

                    {c2cLoading ? (
                      <div className="flex items-center justify-center h-64">
                        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    ) : (
                      <div className="bg-card rounded-xl border border-border overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead className="bg-muted/50 border-b border-border">
                              <tr>
                                <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Candidate</th>
                                <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Period</th>
                                <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Hours</th>
                                <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Screenshot</th>
                                <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Submitted By</th>
                                <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Status</th>
                                <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                              {filteredC2c.map((ts) => (
                                <tr key={ts.id} className="hover:bg-muted/30 transition-colors">
                                  <td className="px-6 py-4">
                                    <div>
                                      <p className="font-medium text-foreground">
                                        {getCandidateDisplayName(ts.candidate)}
                                      </p>
                                      <p className="text-xs text-muted-foreground">{ts.candidate?.email}</p>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 text-sm text-foreground">
                                    {ts.period_start && ts.period_end
                                      ? `${new Date(ts.period_start).toLocaleDateString()} - ${new Date(ts.period_end).toLocaleDateString()}`
                                      : '-'
                                    }
                                  </td>
                                  <td className="px-6 py-4 text-sm font-medium text-foreground">
                                    {ts.hours_worked} hrs
                                  </td>
                                  <td className="px-6 py-4">
                                    {ts.screenshot_url ? (
                                      <a
                                        href={ts.screenshot_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-primary hover:text-primary/80 flex items-center gap-1 text-sm"
                                      >
                                        <Icon name="Image" size={14} />
                                        View
                                      </a>
                                    ) : (
                                      <span className="text-muted-foreground text-sm">-</span>
                                    )}
                                  </td>
                                  <td className="px-6 py-4 text-sm text-foreground">
                                    {ts.submitted_by_user?.full_name || '-'}
                                  </td>
                                  <td className="px-6 py-4">
                                    {ts.is_approved ? (
                                      <span className="flex items-center text-green-600 text-xs font-medium gap-1">
                                        <Icon name="CheckCircle" size={14} />
                                        Approved
                                      </span>
                                    ) : (
                                      <span className="flex items-center text-amber-600 text-xs font-medium gap-1">
                                        <Icon name="Clock" size={14} />
                                        Pending
                                      </span>
                                    )}
                                  </td>
                                  <td className="px-6 py-4">
                                    {!ts.is_approved && (
                                      <Button
                                        size="sm"
                                        onClick={() => handleApproveTimesheet(ts.id)}
                                        className="flex items-center gap-1"
                                      >
                                        <Icon name="Check" size={14} />
                                        Approve
                                      </Button>
                                    )}
                                    {ts.is_approved && (
                                      <span className="text-xs text-muted-foreground">
                                        {ts.approved_by_user?.full_name} on {ts.approved_at ? new Date(ts.approved_at).toLocaleDateString() : ''}
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              ))}
                              {filteredC2c.length === 0 && (
                                <tr>
                                  <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                                    No C2C timesheets submitted yet
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </motion.div>
        </div>
      </main>

      {/* C2C Timesheet Modal */}
      <Modal
        isOpen={timesheetModalOpen}
        onClose={() => { setTimesheetModalOpen(false); setTimesheetErrors({}); }}
        title="Submit C2C Timesheet"
        description="Record hours worked by a C2C candidate for invoicing"
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={() => setTimesheetModalOpen(false)} disabled={timesheetSaving}>Cancel</Button>
            <Button onClick={handleTimesheetSubmit} loading={timesheetSaving} disabled={timesheetSaving}>Submit Timesheet</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">C2C Candidate *</label>
            <Select name="candidate_id" value={timesheetForm.candidate_id} onChange={handleTimesheetFormChange}>
              <option value="">Select C2C Candidate</option>
              {c2cCandidates.map(c => (
                <option key={c.id} value={c.id}>{getCandidateDisplayName(c)} ({c.email})</option>
              ))}
            </Select>
            {timesheetErrors.candidate_id && <p className="text-xs text-red-500">{timesheetErrors.candidate_id}</p>}
            {c2cCandidates.length === 0 && (
              <p className="text-xs text-amber-600">No C2C candidates found. Set a candidate's deal type to C2C first.</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Input
                label="Period Start *"
                type="date"
                name="period_start"
                value={timesheetForm.period_start}
                onChange={handleTimesheetFormChange}
                error={timesheetErrors.period_start}
              />
            </div>
            <div>
              <Input
                label="Period End *"
                type="date"
                name="period_end"
                value={timesheetForm.period_end}
                onChange={handleTimesheetFormChange}
                error={timesheetErrors.period_end}
              />
            </div>
          </div>
          <Input
            label="Hours Worked *"
            type="number"
            name="hours_worked"
            value={timesheetForm.hours_worked}
            onChange={handleTimesheetFormChange}
            error={timesheetErrors.hours_worked}
            placeholder="e.g. 80"
            min="0"
            step="0.5"
          />
          <Input
            label="Screenshot URL"
            name="screenshot_url"
            value={timesheetForm.screenshot_url}
            onChange={handleTimesheetFormChange}
            placeholder="Paste link to timesheet screenshot"
          />
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Notes</label>
            <textarea
              name="notes"
              value={timesheetForm.notes}
              onChange={handleTimesheetFormChange}
              rows={2}
              className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
              placeholder="Additional notes..."
            />
          </div>
        </div>
      </Modal>

      {/* W2 Timesheet Modal */}
      <Modal
        isOpen={w2ModalOpen}
        onClose={() => { setW2ModalOpen(false); setW2Errors({}); }}
        title="Submit W2 Timesheet"
        description="Record hours worked by a W2 employee for the pay period"
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={() => setW2ModalOpen(false)} disabled={w2Saving}>Cancel</Button>
            <Button onClick={handleW2Submit} loading={w2Saving} disabled={w2Saving}>Submit Timesheet</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">W2 Employee *</label>
            <Select name="candidate_id" value={w2Form.candidate_id} onChange={handleW2FormChange}>
              <option value="">Select W2 Employee</option>
              {w2Candidates.map(c => (
                <option key={c.id} value={c.id}>{getCandidateDisplayName(c)} ({c.email})</option>
              ))}
            </Select>
            {w2Errors.candidate_id && <p className="text-xs text-red-500">{w2Errors.candidate_id}</p>}
            {w2Candidates.length === 0 && (
              <p className="text-xs text-amber-600">No W2 employees found. Set a candidate's deal type to W2 first.</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Input
                label="Period Start *"
                type="date"
                name="period_start"
                value={w2Form.period_start}
                onChange={handleW2FormChange}
                error={w2Errors.period_start}
              />
            </div>
            <div>
              <Input
                label="Period End *"
                type="date"
                name="period_end"
                value={w2Form.period_end}
                onChange={handleW2FormChange}
                error={w2Errors.period_end}
              />
            </div>
          </div>
          <Input
            label="Hours Worked *"
            type="number"
            name="hours_worked"
            value={w2Form.hours_worked}
            onChange={handleW2FormChange}
            error={w2Errors.hours_worked}
            placeholder="e.g. 80"
            min="0"
            step="0.5"
          />
          <Input
            label="Screenshot URL"
            name="screenshot_url"
            value={w2Form.screenshot_url}
            onChange={handleW2FormChange}
            placeholder="Paste link to timesheet screenshot"
          />
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Notes</label>
            <textarea
              name="notes"
              value={w2Form.notes}
              onChange={handleW2FormChange}
              rows={2}
              className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
              placeholder="Additional notes..."
            />
          </div>
        </div>
      </Modal>

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
