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

// Compact 400×170 Vendor Detail Card
const VendorMiniCard = ({ vendor, onClose, onEdit, pos }) => {
  if (!vendor) return null;

  const cardStyle = pos
    ? { top: pos.top, left: pos.left }
    : { bottom: 24, right: 24 };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ type: 'spring', damping: 28, stiffness: 320 }}
      className="fixed w-[400px] h-[170px] bg-card border border-border rounded-xl shadow-2xl z-50 flex flex-col overflow-hidden"
      style={cardStyle}
    >
      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 pt-3 pb-2.5 border-b border-border">
        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
          {vendor.name?.charAt(0)?.toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm text-foreground truncate">{vendor.name}</span>
            <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium flex-shrink-0 ${TIER_COLORS[vendor.tier] || 'bg-gray-100 text-gray-700'}`}>
              {TIER_LABELS[vendor.tier] || vendor.tier}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button onClick={() => onEdit(vendor)} className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-colors" title="Edit">
            <Icon name="Pencil" size={13} />
          </button>
          <button onClick={onClose} className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-colors">
            <Icon name="X" size={13} />
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 divide-x divide-border border-b border-border">
        {[
          { label: 'Submissions', value: vendor.submission_count ?? 0, color: 'text-blue-600' },
          { label: 'Placements', value: vendor.placement_count ?? 0, color: 'text-green-600' },
          { label: 'AI Score', value: vendor.ai_score != null ? `${vendor.ai_score}/100` : '—', color: 'text-purple-600' },
        ].map(s => (
          <div key={s.label} className="px-3 py-1.5 text-center">
            <p className={`text-sm font-bold ${s.color}`}>{s.value}</p>
            <p className="text-[10px] text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Contact info */}
      <div className="flex-1 px-4 py-2 flex flex-col gap-1 overflow-hidden">
        {/* Row 1: person + email + status */}
        <div className="flex items-center gap-3 text-xs min-w-0">
          <span className="flex items-center gap-1 text-foreground flex-shrink-0">
            <Icon name="User" size={11} className="text-muted-foreground" />
            {vendor.contact_person || <span className="text-muted-foreground">—</span>}
          </span>
          {vendor.contact_email
            ? <a href={`mailto:${vendor.contact_email}`} className="flex items-center gap-1 text-primary hover:underline min-w-0"><Icon name="Mail" size={11} className="flex-shrink-0" /><span className="truncate">{vendor.contact_email}</span></a>
            : <span className="flex items-center gap-1 text-muted-foreground"><Icon name="Mail" size={11} />—</span>
          }
          <span className={`ml-auto flex items-center gap-1 text-[11px] font-medium flex-shrink-0 ${vendor.is_active ? 'text-green-600' : 'text-gray-400'}`}>
            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${vendor.is_active ? 'bg-green-500' : 'bg-gray-400'}`} />
            {vendor.is_active ? 'Active' : 'Inactive'}
          </span>
        </div>
        {/* Row 2: phone + payment terms (always shown) */}
        <div className="flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1 text-foreground">
            <Icon name="Phone" size={11} className="text-muted-foreground flex-shrink-0" />
            {vendor.contact_phone || <span className="text-muted-foreground">—</span>}
          </span>
          <span className="flex items-center gap-1 text-foreground">
            <Icon name="CreditCard" size={11} className="text-muted-foreground flex-shrink-0" />
            {vendor.payment_terms || <span className="text-muted-foreground">—</span>}
          </span>
          {vendor.created_at && (
            <span className="flex items-center gap-1 text-muted-foreground ml-auto flex-shrink-0">
              <Icon name="CalendarDays" size={11} className="flex-shrink-0" />
              {new Date(vendor.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          )}
        </div>
        {/* Row 3: address (always shown) + website */}
        <div className="flex items-center gap-3 text-xs min-w-0">
          <span className="flex items-center gap-1 text-muted-foreground min-w-0">
            <Icon name="MapPin" size={11} className="flex-shrink-0" />
            {vendor.address
              ? <span className="truncate">{vendor.address}</span>
              : <span>—</span>
            }
          </span>
          {vendor.website && (
            <a href={vendor.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:underline ml-auto flex-shrink-0">
              <Icon name="Globe" size={11} className="flex-shrink-0" />
              <span className="truncate max-w-[120px]">{vendor.website.replace(/^https?:\/\//, '')}</span>
            </a>
          )}
        </div>
      </div>
    </motion.div>
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
  const [cardPos, setCardPos] = useState(null);
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
                          onClick={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            const cardH = 170, cardW = 400;
                            // Prefer below row, flip above if near bottom
                            let top = rect.bottom + 6;
                            if (top + cardH > window.innerHeight - 8) top = rect.top - cardH - 6;
                            // Center horizontally on click, clamped to viewport
                            let left = e.clientX - cardW / 2;
                            left = Math.max(8, Math.min(left, window.innerWidth - cardW - 8));
                            setCardPos({ top, left });
                            setSelectedVendor(vendor);
                          }}
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

      {/* Vendor Detail Mini Card */}
      <AnimatePresence>
        {selectedVendor && (
          <VendorMiniCard
            vendor={selectedVendor}
            onClose={() => { setSelectedVendor(null); setCardPos(null); }}
            onEdit={canEdit ? handleOpenEdit : () => {}}
            pos={cardPos}
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
