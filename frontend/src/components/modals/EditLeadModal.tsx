'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Building,
  MapPin,
  IndianRupee,
  Sparkles,
  AlertTriangle,
  Edit,
  Save,
} from 'lucide-react';
import { api } from '../../lib/api';
import { LeadPriority, LeadStatus } from '../../types';

interface EditLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: any | null;
  onSuccess?: () => void;
}

export function EditLeadModal({ isOpen, onClose, lead, onSuccess }: EditLeadModalProps) {
  // Customer info
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [email, setEmail] = useState('');

  // Lead metadata
  const [status, setStatus] = useState<LeadStatus>('NEW');
  const [priority, setPriority] = useState<LeadPriority>('HIGH');
  const [source, setSource] = useState('Phone');
  const [assignedUserId, setAssignedUserId] = useState('');

  // Requirement info
  const [propertyType, setPropertyType] = useState('Apartment');
  const [customPropertyType, setCustomPropertyType] = useState('');
  const [bhk, setBhk] = useState('2 BHK');
  const [preferredLocation, setPreferredLocation] = useState('');
  const [minBudget, setMinBudget] = useState<number | ''>('');
  const [maxBudget, setMaxBudget] = useState<number | ''>('');
  const [purpose, setPurpose] = useState('Buying');
  const [possessionPreference, setPossessionPreference] = useState('Ready to Move');
  const [furnishingPreference, setFurnishingPreference] = useState('Semi Furnished');
  const [notes, setNotes] = useState('');

  const [salesUsers, setSalesUsers] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const standardTypes = ['Apartment', 'Villa', 'Plot', 'Commercial', 'Office', 'Shop'];

  useEffect(() => {
    if (isOpen && lead) {
      setCustomerName(lead.customer?.name || '');
      setPhone(lead.customer?.phone || '');
      setWhatsappNumber(lead.customer?.whatsappNumber || '');
      setEmail(lead.customer?.email || '');

      setStatus(lead.status || 'NEW');
      setPriority(lead.priority || 'HIGH');
      setSource(lead.source || 'Phone');
      setAssignedUserId(lead.assignedUserId || lead.assignedUser?.id || '');

      const req = lead.requirement;
      if (req) {
        if (standardTypes.includes(req.propertyType)) {
          setPropertyType(req.propertyType);
          setCustomPropertyType('');
        } else if (req.propertyType === 'Other') {
          setPropertyType('Other');
          setCustomPropertyType('');
        } else {
          setPropertyType('Other');
          setCustomPropertyType(req.propertyType || '');
        }

        setBhk(req.bhk || '2 BHK');
        setPreferredLocation(req.preferredLocation || '');
        setMinBudget(req.minBudget !== null && req.minBudget !== undefined ? req.minBudget : '');
        setMaxBudget(req.maxBudget !== null && req.maxBudget !== undefined ? req.maxBudget : '');
        setPurpose(req.purpose || 'Buying');
        setPossessionPreference(req.possessionPreference || 'Ready to Move');
        setFurnishingPreference(req.furnishingPreference || 'Semi Furnished');
        setNotes(req.notes || '');
      }

      api.getUsers()
        .then((users) => setSalesUsers(users))
        .catch(() => {});
    }
  }, [isOpen, lead]);

  if (!isOpen || !lead) return null;

  const handleApplyPreset = (min: number, max: number) => {
    setMinBudget(min);
    setMaxBudget(max);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !phone.trim() || !preferredLocation.trim()) {
      setError('Please fill required fields (Name, Phone, Preferred Location)');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const finalPropertyType =
        propertyType === 'Other'
          ? (customPropertyType.trim() || 'Other')
          : propertyType;

      const payload: any = {
        customerName: customerName.trim(),
        phone: phone.trim(),
        whatsappNumber: whatsappNumber.trim() || phone.trim(),
        email: email.trim() || undefined,
        status,
        priority,
        source,
        assignedUserId: assignedUserId || undefined,
        requirement: {
          propertyType: finalPropertyType,
          bhk,
          preferredLocation: preferredLocation.trim(),
          minBudget: minBudget !== '' ? Number(minBudget) : undefined,
          maxBudget: maxBudget !== '' ? Number(maxBudget) : undefined,
          purpose,
          possessionPreference,
          furnishingPreference,
          notes: notes.trim() || undefined,
        },
      };

      await api.updateLead(lead.id, payload);

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update lead');
    } finally {
      setSubmitting(false);
    }
  };

  const statuses: LeadStatus[] = [
    'NEW',
    'CONTACTED',
    'REQUIREMENT_COLLECTED',
    'PROPERTY_SHARED',
    'SITE_VISIT',
    'NEGOTIATION',
    'BOOKED',
    'LOST',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-md overflow-y-auto animate-in fade-in duration-150">
      <div
        className="w-full max-w-3xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-border bg-card/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-sm">
              <Edit className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                <span>Edit Lead Record</span>
                <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-secondary text-muted-foreground border border-border">
                  ID: {lead.id.slice(0, 8)}...
                </span>
              </h2>
              <p className="text-xs text-muted-foreground">Update customer inquiry details & requirement preferences</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[75vh] space-y-5">
          {error && (
            <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Section 1: Customer Info */}
          <div className="space-y-3">
            <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-accent" />
              <span>Customer Information</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Customer Name <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-secondary/40 border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Phone Number (Mobile) <span className="text-destructive">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-secondary/40 border border-border font-mono text-sm text-foreground focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">WhatsApp Number</label>
                <input
                  type="tel"
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-secondary/40 border border-border font-mono text-sm text-foreground focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-secondary/40 border border-border text-sm text-foreground focus:outline-none focus:border-primary"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Property Requirement */}
          <div className="space-y-3 pt-2 border-t border-border">
            <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5 text-primary" />
              <span>Property Requirement</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Property Type</label>
                <select
                  value={propertyType}
                  onChange={(e) => {
                    const val = e.target.value;
                    setPropertyType(val);
                    if (val === 'Other') {
                      setBhk('Other');
                      setPurpose('Other');
                      setPossessionPreference('Other');
                    } else {
                      setCustomPropertyType('');
                      if (bhk === 'Other') setBhk('2 BHK');
                      if (purpose === 'Other') setPurpose('Buying');
                      if (possessionPreference === 'Other') setPossessionPreference('Ready to Move');
                    }
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-secondary/40 border border-border text-xs text-foreground focus:outline-none focus:border-primary"
                >
                  <option value="Apartment">Apartment</option>
                  <option value="Villa">Villa</option>
                  <option value="Plot">Plot</option>
                  <option value="Commercial">Commercial</option>
                  <option value="Office">Office</option>
                  <option value="Shop">Shop</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">BHK / Config</label>
                <select
                  value={bhk}
                  onChange={(e) => setBhk(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-secondary/40 border border-border text-xs text-foreground focus:outline-none focus:border-primary"
                >
                  <option value="1 BHK">1 BHK</option>
                  <option value="2 BHK">2 BHK</option>
                  <option value="2.5 BHK">2.5 BHK</option>
                  <option value="3 BHK">3 BHK</option>
                  <option value="4 BHK">4 BHK</option>
                  <option value="4+ BHK">4+ BHK / Villa</option>
                  <option value="Plot">Plot</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Purpose</label>
                <select
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-secondary/40 border border-border text-xs text-foreground focus:outline-none focus:border-primary"
                >
                  <option value="Buying">Buying</option>
                  <option value="Renting">Renting</option>
                  <option value="Investment">Investment</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Possession</label>
                <select
                  value={possessionPreference}
                  onChange={(e) => setPossessionPreference(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-secondary/40 border border-border text-xs text-foreground focus:outline-none focus:border-primary"
                >
                  <option value="Ready to Move">Ready to Move</option>
                  <option value="Within 3 Months">Within 3 Months</option>
                  <option value="Within 6 Months">Within 6 Months</option>
                  <option value="Under Construction">Under Construction</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            {/* Custom Property Type Input when 'Other' is selected */}
            {propertyType === 'Other' && (
              <div className="p-3.5 rounded-xl bg-secondary/50 border border-accent/40 shadow-lg animate-in fade-in slide-in-from-top-1 duration-200">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-accent" />
                    <span>Specify Custom Property Type</span>
                  </label>
                  <span className="text-[11px] text-muted-foreground font-normal">
                    Type a custom name or leave empty to keep as &quot;Other&quot;
                  </span>
                </div>
                <input
                  type="text"
                  placeholder="e.g. Penthouse, Studio Apartment, Farmhouse, Duplex, Warehouse..."
                  value={customPropertyType}
                  onChange={(e) => setCustomPropertyType(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-card border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary font-medium"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Preferred Location <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Electronic City, Whitefield, Sarjapur Road..."
                  value={preferredLocation}
                  onChange={(e) => setPreferredLocation(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-secondary/40 border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            {/* Budget Range + Presets */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-foreground">
                  Budget Range (₹) <span className="text-muted-foreground font-normal">(Optional)</span>
                </label>
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                  <span className="text-[10px] text-muted-foreground">Presets:</span>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset(4500000, 5500000)}
                    className={`text-[10px] px-2 py-0.5 rounded transition-all ${
                      minBudget === 4500000 && maxBudget === 5500000
                        ? 'bg-primary/20 text-primary font-bold border border-primary/40'
                        : 'bg-secondary hover:bg-secondary/80 text-foreground border border-border'
                    }`}
                  >
                    45–55L
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset(6500000, 7500000)}
                    className={`text-[10px] px-2 py-0.5 rounded transition-all ${
                      minBudget === 6500000 && maxBudget === 7500000
                        ? 'bg-primary/20 text-primary font-bold border border-primary/40'
                        : 'bg-secondary hover:bg-secondary/80 text-foreground border border-border'
                    }`}
                  >
                    65–75L
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset(11000000, 14000000)}
                    className={`text-[10px] px-2 py-0.5 rounded transition-all ${
                      minBudget === 11000000 && maxBudget === 14000000
                        ? 'bg-primary/20 text-primary font-bold border border-primary/40'
                        : 'bg-secondary hover:bg-secondary/80 text-foreground border border-border'
                    }`}
                  >
                    1.1–1.4Cr
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset(22000000, 26000000)}
                    className={`text-[10px] px-2 py-0.5 rounded transition-all ${
                      minBudget === 22000000 && maxBudget === 26000000
                        ? 'bg-primary/20 text-primary font-bold border border-primary/40'
                        : 'bg-secondary hover:bg-secondary/80 text-foreground border border-border'
                    }`}
                  >
                    2.2–2.6Cr
                  </button>
                  {(minBudget !== '' || maxBudget !== '') && (
                    <button
                      type="button"
                      onClick={() => {
                        setMinBudget('');
                        setMaxBudget('');
                      }}
                      className="text-[10px] px-1.5 py-0.5 rounded text-destructive hover:bg-destructive/10 font-semibold"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <div className="relative">
                    <IndianRupee className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-2.5" />
                    <input
                      type="number"
                      placeholder="Min Budget (e.g. 5000000)"
                      value={minBudget}
                      onChange={(e) => setMinBudget(e.target.value ? Number(e.target.value) : '')}
                      className="w-full pl-8 pr-3.5 py-2 rounded-xl bg-secondary/40 border border-border text-xs font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>
                <div>
                  <div className="relative">
                    <IndianRupee className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-2.5" />
                    <input
                      type="number"
                      placeholder="Max Budget (e.g. 7500000)"
                      value={maxBudget}
                      onChange={(e) => setMaxBudget(e.target.value ? Number(e.target.value) : '')}
                      className="w-full pl-8 pr-3.5 py-2 rounded-xl bg-secondary/40 border border-border text-xs font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Notes & Additional Details
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Looking for East facing, corner property with 2 car parking spaces."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-secondary/40 border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          {/* Section 3: Status, Priority & Assignment */}
          <div className="space-y-3 pt-2 border-t border-border">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Pipeline Stage</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-secondary/40 border border-border text-xs text-foreground focus:outline-none"
                >
                  {statuses.map((s) => (
                    <option key={s} value={s}>
                      {s.replace(/_/g, ' ')}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-secondary/40 border border-border text-xs text-foreground focus:outline-none"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Lead Source</label>
                <select
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-secondary/40 border border-border text-xs text-foreground focus:outline-none"
                >
                  <option value="Phone">Phone</option>
                  <option value="WhatsApp">WhatsApp</option>
                  <option value="Website">Website</option>
                  <option value="Instagram">Instagram</option>
                  <option value="Facebook">Facebook</option>
                  <option value="Referral">Referral</option>
                  <option value="Walk-in">Walk-in</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Assigned Salesperson</label>
                <select
                  value={assignedUserId}
                  onChange={(e) => setAssignedUserId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-secondary/40 border border-border text-xs text-foreground focus:outline-none"
                >
                  <option value="">Unassigned</option>
                  {salesUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.role === 'ADMIN' ? 'Admin' : 'Sales'})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="pt-4 border-t border-border flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs shadow-md shadow-primary/20 transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{submitting ? 'Saving Changes...' : 'Save Lead Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
