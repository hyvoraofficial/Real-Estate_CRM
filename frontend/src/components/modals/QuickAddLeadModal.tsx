'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  X,
  Phone,
  User,
  Building,
  MapPin,
  IndianRupee,
  Clock,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Send,
  MessageSquare,
} from 'lucide-react';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { formatBudgetRange, formatRelativeDate } from '../../lib/utils';

interface QuickAddLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLeadCreated?: (lead: any) => void;
}

export function QuickAddLeadModal({ isOpen, onClose, onLeadCreated }: QuickAddLeadModalProps) {
  const { user } = useAuth();
  const router = useRouter();

  const dateInputRef = useRef<HTMLInputElement>(null);
  const timeInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [email, setEmail] = useState('');
  const [source, setSource] = useState('Phone');
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'>('HIGH');
  const [assignedUserId, setAssignedUserId] = useState(user?.id || '');

  // Requirement State
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

  // Initial Follow-up State
  const [scheduleFollowUp, setScheduleFollowUp] = useState(true);
  const [followUpDate, setFollowUpDate] = useState('');
  const [followUpTime, setFollowUpTime] = useState('11:00');
  const [followUpType, setFollowUpType] = useState('CALL');

  // Duplicate Customer State
  const [checkingDuplicate, setCheckingDuplicate] = useState(false);
  const [duplicateCustomer, setDuplicateCustomer] = useState<any | null>(null);

  // Users List for Assignment
  const [salesUsers, setSalesUsers] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Set default follow-up to tomorrow 11:00 AM
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const yyyy = tomorrow.getFullYear();
      const mm = String(tomorrow.getMonth() + 1).padStart(2, '0');
      const dd = String(tomorrow.getDate()).padStart(2, '0');
      setFollowUpDate(`${yyyy}-${mm}-${dd}`);

      if (user?.id) {
        setAssignedUserId(user.id);
      }

      api.getUsers()
        .then((users) => setSalesUsers(users))
        .catch(() => {});
    } else {
      // Reset form
      setCustomerName('');
      setPhone('');
      setWhatsappNumber('');
      setEmail('');
      setPropertyType('Apartment');
      setCustomPropertyType('');
      setBhk('2 BHK');
      setPurpose('Buying');
      setPossessionPreference('Ready to Move');
      setPreferredLocation('');
      setMinBudget('');
      setMaxBudget('');
      setNotes('');
      setDuplicateCustomer(null);
      setError(null);
    }
  }, [isOpen, user]);

  // Duplicate Phone Number Detection (Feature #20)
  useEffect(() => {
    const clean = phone.replace(/[^0-9]/g, '');
    if (clean.length >= 10) {
      setCheckingDuplicate(true);
      const timer = setTimeout(async () => {
        try {
          const res = await api.checkDuplicateCustomer(clean);
          if (res.exists && res.customer) {
            setDuplicateCustomer(res.customer);
            if (!customerName && res.customer.name) {
              setCustomerName(res.customer.name);
            }
            if (!email && res.customer.email) {
              setEmail(res.customer.email);
            }
          } else {
            setDuplicateCustomer(null);
          }
        } catch (err) {
          console.error(err);
        } finally {
          setCheckingDuplicate(false);
        }
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setDuplicateCustomer(null);
      setCheckingDuplicate(false);
    }
  }, [phone]);

  if (!isOpen) return null;

  const handlePhoneChange = (val: string) => {
    setPhone(val);
    if (!whatsappNumber || whatsappNumber === phone) {
      setWhatsappNumber(val);
    }
  };

  const handleApplyPreset = (min: number, max: number) => {
    setMinBudget(min);
    setMaxBudget(max);
  };

  const handleUseDuplicate = () => {
    if (duplicateCustomer) {
      setCustomerName(duplicateCustomer.name);
      if (duplicateCustomer.email) setEmail(duplicateCustomer.email);
      if (duplicateCustomer.whatsappNumber) setWhatsappNumber(duplicateCustomer.whatsappNumber);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!customerName.trim()) {
      setError('Please enter the customer name');
      return;
    }
    if (!phone.trim()) {
      setError('Please enter a phone number');
      return;
    }
    if (!preferredLocation.trim()) {
      setError('Please enter a preferred location');
      return;
    }

    setSubmitting(true);
    try {
      const finalPropertyType =
        propertyType === 'Other'
          ? (customPropertyType.trim() || 'Other')
          : propertyType;

      const payload: any = {
        customerName: customerName.trim(),
        phone: phone.trim(),
        alternatePhone: null,
        whatsappNumber: whatsappNumber.trim() || phone.trim(),
        email: email.trim() || undefined,
        source,
        priority,
        assignedUserId: assignedUserId || undefined,
        propertyType: finalPropertyType,
        bhk,
        preferredLocation: preferredLocation.trim(),
        minBudget: minBudget !== '' ? Number(minBudget) : undefined,
        maxBudget: maxBudget !== '' ? Number(maxBudget) : undefined,
        purpose,
        possessionPreference,
        furnishingPreference,
        notes: notes.trim() || undefined,
      };

      if (scheduleFollowUp && followUpDate) {
        payload.followUpDate = followUpDate;
        payload.followUpTime = followUpTime;
        payload.followUpType = followUpType;
        payload.followUpNotes = `Follow-up on ${bhk} ${finalPropertyType} in ${preferredLocation}`;
      }

      const newLead = await api.createLead(payload);

      if (onLeadCreated) {
        onLeadCreated(newLead);
      }

      onClose();
      router.push(`/leads/${newLead.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to create lead');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-md overflow-y-auto animate-in fade-in duration-150">
      <div
        className="w-full max-w-3xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-border bg-card/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-sm">
              <Phone className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                <span>Quick Add Lead</span>
                <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                  ⚡ 20s Rapid Ingestion
                </span>
              </h2>
              <p className="text-xs text-muted-foreground">Capture call details & property requirement immediately</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[75vh] space-y-5">
          {error && (
            <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* DUPLICATE CUSTOMER ALERT BANNER (Feature #20) */}
          {duplicateCustomer && (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-foreground text-xs animate-in fade-in duration-200 shadow-lg shadow-amber-500/5">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-sm text-foreground">
                      Existing Customer Found: {duplicateCustomer.name} ({duplicateCustomer.phone})
                    </p>
                    {duplicateCustomer.latestLead?.requirement && (
                      <p className="mt-1 text-muted-foreground">
                        <strong className="text-foreground">Previous Lead:</strong> {duplicateCustomer.latestLead.requirement.bhk || ''}{' '}
                        {duplicateCustomer.latestLead.requirement.propertyType} in{' '}
                        {duplicateCustomer.latestLead.requirement.preferredLocation} (
                        {formatBudgetRange(
                          duplicateCustomer.latestLead.requirement.minBudget,
                          duplicateCustomer.latestLead.requirement.maxBudget,
                        )}
                        ) • Status: <span className="text-accent font-semibold">{duplicateCustomer.latestLead.status}</span>
                      </p>
                    )}
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      Customer has <strong>{duplicateCustomer.totalLeads}</strong> previous lead(s) in system. A new lead will be linked to this client.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleUseDuplicate}
                  className="px-3 py-1.5 rounded-lg bg-accent text-accent-foreground font-bold text-xs shrink-0 transition-colors shadow"
                >
                  Use Info
                </button>
              </div>
            </div>
          )}

          {/* Section 1: Caller / Customer Details */}
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
                  placeholder="e.g. Rahul Kumar"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-secondary/40 border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1 flex items-center justify-between">
                  <span>Phone Number (Mobile) <span className="text-destructive">*</span></span>
                  {checkingDuplicate && (
                    <span className="text-[10px] text-primary flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
                      Checking duplicate...
                    </span>
                  )}
                </label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. 9876500001"
                  value={phone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-secondary/40 border border-border font-mono text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">WhatsApp Number</label>
                <input
                  type="tel"
                  placeholder="e.g. 9876500001"
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-secondary/40 border border-border font-mono text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Email Address</label>
                <input
                  type="email"
                  placeholder="e.g. rahul.kumar@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-secondary/40 border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
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
                  autoFocus
                  placeholder="e.g. Penthouse, Studio Apartment, Farmhouse, Duplex, Warehouse, Agricultural Land..."
                  value={customPropertyType}
                  onChange={(e) => setCustomPropertyType(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-card border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary font-medium"
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
                  placeholder="e.g. Electronic City, Whitefield, Sarjapur Road, Indiranagar..."
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
                {/* Indian Budget Quick Presets */}
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

            {/* Call Notes */}
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Conversation Notes / Specifics
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Customer wants ready-to-move property. Will discuss with family on weekend. Looking for East facing."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-secondary/40 border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          {/* Section 3: Lead Meta & Follow-up Scheduling */}
          <div className="space-y-3 pt-2 border-t border-border">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                <label className="block text-xs font-semibold text-foreground mb-1">Assign Salesperson</label>
                <select
                  value={assignedUserId}
                  onChange={(e) => setAssignedUserId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-secondary/40 border border-border text-xs text-foreground focus:outline-none"
                >
                  {salesUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.role === 'ADMIN' ? 'Admin' : 'Sales'})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Follow-up Section */}
            <div className="p-3.5 rounded-xl bg-secondary/30 border border-border space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-foreground">
                  <input
                    type="checkbox"
                    checked={scheduleFollowUp}
                    onChange={(e) => setScheduleFollowUp(e.target.checked)}
                    className="w-4 h-4 rounded text-primary bg-secondary border-border focus:ring-0"
                  />
                  <span>Schedule Immediate Follow-up</span>
                </label>
                <span className="text-[10px] text-accent font-mono">Digital Reminder</span>
              </div>

              {scheduleFollowUp && (
                <div className="space-y-2 pt-1">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {/* Date Input with Calendar Trigger */}
                    <div>
                      <label className="block text-[10px] font-semibold text-foreground mb-1">
                        Follow-up Date
                      </label>
                      <div className="flex items-center gap-1.5">
                        <input
                          ref={dateInputRef}
                          type="date"
                          value={followUpDate}
                          onChange={(e) => setFollowUpDate(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-xl bg-card border border-border text-xs text-foreground focus:outline-none focus:border-primary"
                        />
                        <button
                          type="button"
                          title="Open Calendar Picker"
                          onClick={() => {
                            try {
                              const el = dateInputRef.current as any;
                              if (el && typeof el.showPicker === 'function') {
                                el.showPicker();
                              } else if (el && typeof el.focus === 'function') {
                                el.focus();
                              }
                            } catch (e) {
                              dateInputRef.current?.focus();
                            }
                          }}
                          className="p-2 rounded-xl bg-secondary hover:bg-secondary/80 border border-border text-foreground transition-colors shrink-0"
                        >
                          <Calendar className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Time Input with Clock Trigger */}
                    <div>
                      <label className="block text-[10px] font-semibold text-foreground mb-1">
                        Follow-up Time
                      </label>
                      <div className="flex items-center gap-1.5">
                        <input
                          ref={timeInputRef}
                          type="time"
                          value={followUpTime}
                          onChange={(e) => setFollowUpTime(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-xl bg-card border border-border text-xs text-foreground focus:outline-none focus:border-primary"
                        />
                        <button
                          type="button"
                          title="Open Time Picker"
                          onClick={() => {
                            try {
                              const el = timeInputRef.current as any;
                              if (el && typeof el.showPicker === 'function') {
                                el.showPicker();
                              } else if (el && typeof el.focus === 'function') {
                                el.focus();
                              }
                            } catch (e) {
                              timeInputRef.current?.focus();
                            }
                          }}
                          className="p-2 rounded-xl bg-secondary hover:bg-secondary/80 border border-border text-foreground transition-colors shrink-0"
                        >
                          <Clock className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Follow-up Action Type */}
                    <div>
                      <label className="block text-[10px] font-semibold text-foreground mb-1">
                        Action
                      </label>
                      <select
                        value={followUpType}
                        onChange={(e) => setFollowUpType(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-xl bg-card border border-border text-xs text-foreground focus:outline-none focus:border-primary"
                      >
                        <option value="CALL">Call Client</option>
                        <option value="WHATSAPP">WhatsApp Message</option>
                        <option value="SITE_VISIT">Site Visit</option>
                        <option value="MEETING">In-person Meeting</option>
                      </select>
                    </div>
                  </div>

                  {/* Quick Time Setter Chips */}
                  <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5 text-primary" /> Time Presets:
                    </span>
                    {['10:00', '11:30', '15:00', '17:30', '19:00'].map((presetTime) => {
                      const label =
                        presetTime === '10:00'
                          ? '10:00 AM'
                          : presetTime === '11:30'
                          ? '11:30 AM'
                          : presetTime === '15:00'
                          ? '03:00 PM'
                          : presetTime === '17:30'
                          ? '05:30 PM'
                          : '07:00 PM';
                      return (
                        <button
                          key={presetTime}
                          type="button"
                          onClick={() => setFollowUpTime(presetTime)}
                          className={`text-[10px] px-2 py-0.5 rounded-lg border transition-all ${
                            followUpTime === presetTime
                              ? 'bg-primary/20 border-primary/50 text-primary font-bold'
                              : 'bg-card border-border text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
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
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs shadow-md shadow-primary/20 transition-all disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                  <span>Saving to Digital Memory...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Save Lead & View Workspace</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
