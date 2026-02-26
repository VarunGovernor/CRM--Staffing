import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Header from '../../components/ui/Header';
import Sidebar from '../../components/ui/Sidebar';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

const TIER_LABELS = {
  tier_1: 'Tier 1',
  tier_2: 'Tier 2',
  tier_3: 'Tier 3',
  direct_client: 'Direct Client'
};

const TIER_COLORS = {
  tier_1: 'bg-emerald-100 text-emerald-700',
  tier_2: 'bg-blue-100 text-blue-700',
  tier_3: 'bg-orange-100 text-orange-700',
  direct_client: 'bg-purple-100 text-purple-700'
};

const TIERS = Object.keys(TIER_LABELS);

const emptyForm = {
  name: '',
  tier: 'tier_1',
  contact_person: '',
  contact_email: '',
  contact_phone: '',
  address: '',
  website: '',
  payment_terms: '',
  is_active: true
};

// Slide-in Vendor Detail Panel
const VendorDrawer = ({ vendor, onClose, onEdit }) => {
  const [submissions, setSubmissions] = useState([]);
  const [loadingSubs, setLoadingSubs] = useState(true);

  useEffect(() => {
    if (!vendor) return;
    const fetchRecent = async () => {
      setLoadingSubs(true);
      const { data } = await supabase
        .from('submissions')
        .select('id, job_title, status, submission_date, candidate:candidates(first_name, last_name, full_name)')
        .eq('vendor_id', vendor.id)
        .order('submission_date', { ascending: false })
        .limit(5);
      setSubmissions(data || []);
      setLoadingSubs(false);
    };
    fetchRecent();
  }, [vendor?.id]);

  if (!vendor) return null;

  const statusColors = {
    submitted: 'bg-blue-100 text-blue-700',
    shortlisted: 'bg-yellow-100 text-yellow-700',
    rejected: 'bg-red-100 text-red-700',
    interview_scheduled: 'bg-purple-100 text-purple-700',
    selected: 'bg-green-100 text-green-700'
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />
      {/* Drawer */}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="fixed right-0 top-0 h-full w-full max-w-md bg-card border-l border-border shadow-2xl z-50 flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-border">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-lg font-bold text-foreground truncate">{vendor.name}</h2>
              {!vendor.is_active && (
                <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-500">Inactive</span>
              )}
            </div>
            <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${TIER_COLORS[vendor.tier] || 'bg-gray-100 text-gray-700'}`}>
              {TIER_LABELS[vendor.tier] || vendor.tier}
            </span>
          </div>
          <div className="flex items-center gap-2 ml-3">
            <button
              onClick={() => onEdit(vendor)}
              className="p-2 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-colors"
              title="Edit vendor"
            >
              <Icon name="Pencil" size={16} />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-colors"
            >
              <Icon name="X" size={18} />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Submissions', value: vendor.submission_count ?? '—', icon: 'Send', color: 'text-blue-600' },
              { label: 'Placements', value: vendor.placement_count ?? '—', icon: 'Briefcase', color: 'text-green-600' },
              { label: 'AI Score', value: vendor.ai_score != null ? `${vendor.ai_score}/100` : '—', icon: 'Zap', color: 'text-purple-600' },
            ].map(stat => (
              <div key={stat.label} className="bg-muted/50 rounded-xl p-3 text-center">
                <Icon name={stat.icon} size={18} className={`${stat.color} mx-auto mb-1`} />
                <p className="text-lg font-bold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Contact Information</h3>
            <div className="space-y-2.5">
              {vendor.contact_person && (
                <div className="flex items-center gap-3">
                  <Icon name="User" size={15} className="text-muted-foreground flex-shrink-0" />
                  <span className="text-sm text-foreground">{vendor.contact_person}</span>
                </div>
              )}
              {vendor.contact_email && (
                <div className="flex items-center gap-3">
                  <Icon name="Mail" size={15} className="text-muted-foreground flex-shrink-0" />
                  <a href={`mailto:${vendor.contact_email}`} className="text-sm text-primary hover:underline truncate">{vendor.contact_email}</a>
                </div>
              )}
              {vendor.contact_phone && (
                <div className="flex items-center gap-3">
                  <Icon name="Phone" size={15} className="text-muted-foreground flex-shrink-0" />
                  <a href={`tel:${vendor.contact_phone}`} className="text-sm text-foreground">{vendor.contact_phone}</a>
                </div>
              )}
              {vendor.address && (
                <div className="flex items-start gap-3">
                  <Icon name="MapPin" size={15} className="text-muted-foreground flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-foreground">{vendor.address}</span>
                </div>
              )}
              {vendor.website && (
                <div className="flex items-center gap-3">
                  <Icon name="Globe" size={15} className="text-muted-foreground flex-shrink-0" />
                  <a href={vendor.website} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline truncate">{vendor.website}</a>
                </div>
              )}
              {!vendor.contact_person && !vendor.contact_email && !vendor.contact_phone && !vendor.address && !vendor.website && (
                <p className="text-sm text-muted-foreground italic">No contact details added</p>
              )}
            </div>
          </div>

          {/* Business Info */}
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Business Details</h3>
            <div className="space-y-2.5">
              {vendor.payment_terms && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Payment Terms</span>
                  <span className="text-sm font-medium text-foreground">{vendor.payment_terms}</span>
                </div>
              )}
              {vendor.avg_payment_days != null && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Avg Payment Days</span>
                  <span className={`text-sm font-medium ${vendor.avg_payment_days > 45 ? 'text-red-600' : 'text-green-600'}`}>
                    {vendor.avg_payment_days} days
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <span className={`text-sm font-medium ${vendor.is_active ? 'text-green-600' : 'text-muted-foreground'}`}>
                  {vendor.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Added</span>
                <span className="text-sm text-foreground">
                  {new Date(vendor.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
            </div>
          </div>

          {/* Recent Submissions */}
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Recent Submissions</h3>
            {loadingSubs ? (
              <div className="space-y-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-12 bg-muted rounded-lg animate-pulse" />
                ))}
              </div>
            ) : submissions.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">No submissions yet</p>
            ) : (
              <div className="space-y-2">
                {submissions.map(sub => (
                  <div key={sub.id} className="flex items-center justify-between p-3 bg-muted/40 rounded-lg">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{sub.job_title}</p>
                      <p className="text-xs text-muted-foreground">
                        {sub.candidate?.full_name || `${sub.candidate?.first_name} ${sub.candidate?.last_name}`}
                        {' · '}
                        {new Date(sub.submission_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                    <span className={`ml-2 flex-shrink-0 px-2 py-0.5 text-xs rounded-full font-medium ${statusColors[sub.status] || 'bg-gray-100 text-gray-700'}`}>
                      {sub.status?.replace(/_/g, ' ')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </>
  );
};

// Vendor Form Modal
const VendorFormModal = ({ vendor, onClose, onSuccess }) => {
  const isEditing = !!vendor?.id;
  const [formData, setFormData] = useState(vendor ? {
    name: vendor.name || '',
    tier: vendor.tier || 'tier_1',
    contact_person: vendor.contact_person || '',
    contact_email: vendor.contact_email || '',
    contact_phone: vendor.contact_phone || '',
    address: vendor.address || '',
    website: vendor.website || '',
    payment_terms: vendor.payment_terms || '',
    is_active: vendor.is_active ?? true
  } : { ...emptyForm });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) { setError('Vendor name is required'); return; }
    setLoading(true);
    setError('');
    try {
      let result;
      if (isEditing) {
        result = await supabase.from('vendors').update(formData).eq('id', vendor.id).select().single();
      } else {
        result = await supabase.from('vendors').insert(formData).select().single();
      }
      if (result.error) throw result.error;
      onSuccess(result.data);
    } catch (err) {
      setError(err.message || 'Failed to save vendor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-card border border-border rounded-xl shadow-xl w-full max-w-lg p-6"
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-foreground">{isEditing ? 'Edit Vendor' : 'Add Vendor'}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <Icon name="X" size={20} />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Input label="Vendor Name *" name="name" value={formData.name} onChange={handleChange} placeholder="Acme Staffing" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Tier</label>
              <Select name="tier" value={formData.tier} onChange={handleChange}>
                {TIERS.map(t => <option key={t} value={t}>{TIER_LABELS[t]}</option>)}
              </Select>
            </div>
            <Input label="Website" name="website" value={formData.website} onChange={handleChange} placeholder="https://vendor.com" />
            <Input label="Contact Person" name="contact_person" value={formData.contact_person} onChange={handleChange} placeholder="Jane Smith" />
            <Input label="Contact Email" type="email" name="contact_email" value={formData.contact_email} onChange={handleChange} placeholder="jane@vendor.com" />
            <Input label="Contact Phone" name="contact_phone" value={formData.contact_phone} onChange={handleChange} placeholder="(555) 123-4567" />
            <Input label="Payment Terms" name="payment_terms" value={formData.payment_terms} onChange={handleChange} placeholder="Net-30" />
            <div className="col-span-2">
              <Input label="Address" name="address" value={formData.address} onChange={handleChange} placeholder="123 Main St, City, State" />
            </div>
            <div className="col-span-2 flex items-center gap-3">
              <input
                type="checkbox"
                id="is_active"
                name="is_active"
                checked={formData.is_active}
                onChange={handleChange}
                className="w-4 h-4 rounded border-border text-primary"
              />
              <label htmlFor="is_active" className="text-sm font-medium text-foreground cursor-pointer">Active vendor</label>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="outline" type="button" onClick={onClose} disabled={loading} className="flex-1">Cancel</Button>
            <Button type="submit" loading={loading} disabled={loading} className="flex-1">
              {isEditing ? 'Update Vendor' : 'Add Vendor'}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

// Main Vendors Page
const Vendors = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [tierFilter, setTierFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [formVendor, setFormVendor] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const { userProfile } = useAuth();
  const canEdit = ['admin', 'sales'].includes(userProfile?.role);

  const fetchVendors = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('vendors')
      .select('*')
      .order('name');
    if (!error) setVendors(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  const filteredVendors = useMemo(() => {
    return vendors.filter(v => {
      const matchesSearch = searchTerm === '' ||
        v.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.contact_person?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.contact_email?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesTier = tierFilter === '' || v.tier === tierFilter;
      const matchesActive = activeFilter === '' ||
        (activeFilter === 'active' ? v.is_active : !v.is_active);
      return matchesSearch && matchesTier && matchesActive;
    });
  }, [vendors, searchTerm, tierFilter, activeFilter]);

  const handleOpenEdit = (vendor) => {
    setFormVendor(vendor);
    setIsFormOpen(true);
  };

  const handleFormSuccess = (saved) => {
    setIsFormOpen(false);
    fetchVendors();
    // If the drawer was showing this vendor, refresh it
    if (selectedVendor?.id === saved.id) setSelectedVendor(saved);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)} isSidebarOpen={isSidebarOpen} />
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <main className="lg:ml-64 pt-16">
        <div className="p-4 lg:p-6">
          <motion.div initial={false} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>

            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">Vendors</h1>
                <p className="text-muted-foreground">Manage vendor relationships and track performance</p>
              </div>
              {canEdit && (
                <Button onClick={() => { setFormVendor(null); setIsFormOpen(true); }} className="flex items-center gap-2">
                  <Icon name="Plus" size={18} />
                  Add Vendor
                </Button>
              )}
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-card p-4 rounded-xl border border-border">
                <p className="text-sm text-muted-foreground mb-1">Total Vendors</p>
                <p className="text-2xl font-bold text-foreground">{vendors.length}</p>
              </div>
              <div className="bg-card p-4 rounded-xl border border-border">
                <p className="text-sm text-muted-foreground mb-1">Active</p>
                <p className="text-2xl font-bold text-green-600">{vendors.filter(v => v.is_active).length}</p>
              </div>
              <div className="bg-card p-4 rounded-xl border border-border">
                <p className="text-sm text-muted-foreground mb-1">Tier 1</p>
                <p className="text-2xl font-bold text-emerald-600">{vendors.filter(v => v.tier === 'tier_1').length}</p>
              </div>
              <div className="bg-card p-4 rounded-xl border border-border">
                <p className="text-sm text-muted-foreground mb-1">Direct Clients</p>
                <p className="text-2xl font-bold text-purple-600">{vendors.filter(v => v.tier === 'direct_client').length}</p>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-card rounded-xl border border-border p-4 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                  <Icon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search vendor, contact..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
                <select
                  value={tierFilter}
                  onChange={e => setTierFilter(e.target.value)}
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                  <option value="">All Tiers</option>
                  {TIERS.map(t => <option key={t} value={t}>{TIER_LABELS[t]}</option>)}
                </select>
                <select
                  value={activeFilter}
                  onChange={e => setActiveFilter(e.target.value)}
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                  <option value="">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              {(searchTerm || tierFilter || activeFilter) && (
                <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Showing {filteredVendors.length} of {vendors.length} vendors</span>
                  <button onClick={() => { setSearchTerm(''); setTierFilter(''); setActiveFilter(''); }} className="text-primary hover:underline ml-2">Clear filters</button>
                </div>
              )}
            </div>

            {/* Vendors Table */}
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              {loading ? (
                <div className="p-12 text-center">
                  <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-muted-foreground">Loading vendors...</p>
                </div>
              ) : filteredVendors.length === 0 ? (
                <div className="p-12 text-center">
                  <Icon name="Building2" size={40} className="text-muted-foreground opacity-30 mx-auto mb-3" />
                  <p className="text-muted-foreground font-medium">No vendors found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/50 border-b border-border">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Vendor</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Tier</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Contact</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Submissions</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Placements</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">AI Score</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filteredVendors.map(vendor => (
                        <tr
                          key={vendor.id}
                          onClick={() => setSelectedVendor(vendor)}
                          className={`hover:bg-muted/30 transition-colors cursor-pointer ${selectedVendor?.id === vendor.id ? 'bg-primary/5' : ''}`}
                        >
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary flex-shrink-0">
                                {vendor.name?.charAt(0)?.toUpperCase()}
                              </div>
                              <div>
                                <p className="font-medium text-foreground">{vendor.name}</p>
                                {vendor.website && (
                                  <p className="text-xs text-muted-foreground truncate max-w-[160px]">{vendor.website}</p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${TIER_COLORS[vendor.tier] || 'bg-gray-100 text-gray-700'}`}>
                              {TIER_LABELS[vendor.tier] || vendor.tier}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <div>
                              <p className="text-sm text-foreground">{vendor.contact_person || '—'}</p>
                              {vendor.contact_email && (
                                <p className="text-xs text-muted-foreground truncate max-w-[180px]">{vendor.contact_email}</p>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-4 text-sm font-medium text-foreground">
                            {vendor.submission_count ?? 0}
                          </td>
                          <td className="px-4 py-4 text-sm font-medium text-foreground">
                            {vendor.placement_count ?? 0}
                          </td>
                          <td className="px-4 py-4">
                            {vendor.ai_score != null ? (
                              <div className="flex items-center gap-2">
                                <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${vendor.ai_score >= 70 ? 'bg-green-500' : vendor.ai_score >= 40 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                    style={{ width: `${vendor.ai_score}%` }}
                                  />
                                </div>
                                <span className="text-sm font-medium text-foreground">{vendor.ai_score}</span>
                              </div>
                            ) : (
                              <span className="text-sm text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="px-4 py-4">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${vendor.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${vendor.is_active ? 'bg-green-500' : 'bg-gray-400'}`} />
                              {vendor.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </main>

      {/* Vendor Detail Drawer */}
      <AnimatePresence>
        {selectedVendor && (
          <VendorDrawer
            vendor={selectedVendor}
            onClose={() => setSelectedVendor(null)}
            onEdit={canEdit ? handleOpenEdit : () => {}}
          />
        )}
      </AnimatePresence>

      {/* Vendor Form Modal */}
      {isFormOpen && (
        <VendorFormModal
          vendor={formVendor}
          onClose={() => setIsFormOpen(false)}
          onSuccess={handleFormSuccess}
        />
      )}
    </div>
  );
};

export default Vendors;
