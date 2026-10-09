'use client';

import React, { useState, useEffect } from 'react';
import { PhoneCall, X, Check, Clock, User, Phone, AlertCircle } from 'lucide-react';
import { api } from '../../lib/api';

interface LogCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerId?: string;
  leadId?: string;
  customerName?: string;
  phoneNumber?: string;
  onSuccess?: () => void;
}

export function LogCallModal({
  isOpen,
  onClose,
  customerId: initialCustomerId,
  leadId: initialLeadId,
  customerName: initialCustomerName,
  phoneNumber: initialPhoneNumber,
  onSuccess,
}: LogCallModalProps) {
  const [phoneNumber, setPhoneNumber] = useState(initialPhoneNumber || '');
  const [customerName, setCustomerName] = useState(initialCustomerName || '');
  const [customerId, setCustomerId] = useState(initialCustomerId || '');
  const [direction, setDirection] = useState<'INCOMING' | 'OUTGOING'>('INCOMING');
  const [durationMinutes, setDurationMinutes] = useState('3');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [matchedCustomer, setMatchedCustomer] = useState<any | null>(null);

  useEffect(() => {
    if (isOpen) {
      setPhoneNumber(initialPhoneNumber || '');
      setCustomerName(initialCustomerName || '');
      setCustomerId(initialCustomerId || '');
      setDirection('INCOMING');
      setDurationMinutes('3');
      setNotes('');
      setError(null);
      setMatchedCustomer(null);
    }
  }, [isOpen, initialCustomerId, initialCustomerName, initialPhoneNumber]);

  // Debounced auto-match customer if phone number entered
  useEffect(() => {
    if (!initialCustomerId && phoneNumber.trim().length >= 5) {
      const timer = setTimeout(async () => {
        try {
          const res = await api.checkDuplicateCustomer(phoneNumber);
          if (res.exists && res.customer) {
            setMatchedCustomer(res.customer);
            if (!customerName) {
              setCustomerName(res.customer.name);
            }
            setCustomerId(res.customer.id);
          } else {
            setMatchedCustomer(null);
          }
        } catch (e) {
          // ignore
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [phoneNumber, initialCustomerId, customerName]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber.trim()) {
      setError('Please enter the customer phone number');
      return;
    }
    if (!notes.trim()) {
      setError('Please enter what was discussed on the call');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await api.createCall({
        customerId: customerId || undefined,
        customerName: customerName.trim() || undefined,
        leadId: initialLeadId || undefined,
        phoneNumber: phoneNumber.trim(),
        direction,
        duration: Math.max(10, (parseInt(durationMinutes, 10) || 1) * 60),
        notes: notes.trim(),
        summary: notes.trim().slice(0, 100),
      });

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to log call');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-border bg-card/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center">
              <PhoneCall className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">Log Phone Call</h3>
              <p className="text-xs text-muted-foreground">Record caller conversation into digital memory</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-2.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Caller Details Input (Shown when logging from header or when info not pre-filled) */}
          {!initialCustomerId && (
            <div className="space-y-3 p-3.5 rounded-xl bg-secondary/30 border border-border">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Customer Phone Number <span className="text-destructive">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-3" />
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 9876500001"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-secondary/40 border border-border font-mono text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Customer Name (Optional / New Client)
                </label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder={matchedCustomer?.name || 'e.g. Rahul Kumar'}
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-secondary/40 border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              {matchedCustomer && (
                <div className="text-[11px] text-primary flex items-center gap-1.5 font-medium">
                  <Check className="w-3.5 h-3.5" />
                  <span>Linked to existing client: <strong>{matchedCustomer.name}</strong></span>
                </div>
              )}
            </div>
          )}

          {initialCustomerId && (
            <div className="p-3 rounded-xl bg-secondary/30 border border-border text-xs">
              <span className="text-muted-foreground">Client: </span>
              <strong className="text-foreground">{initialCustomerName}</strong>
              <span className="text-muted-foreground font-mono ml-2">({initialPhoneNumber})</span>
            </div>
          )}

          {/* Direction Toggle */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setDirection('INCOMING')}
              className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                direction === 'INCOMING'
                  ? 'bg-primary/20 border-primary text-primary'
                  : 'bg-secondary/40 border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              Incoming (Client Called)
            </button>
            <button
              type="button"
              onClick={() => setDirection('OUTGOING')}
              className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                direction === 'OUTGOING'
                  ? 'bg-accent/20 border-accent text-accent'
                  : 'bg-secondary/40 border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              Outgoing (You Called)
            </button>
          </div>

          {/* Duration Selector */}
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">Call Duration</label>
            <div className="flex items-center gap-2">
              {['1', '3', '5', '10', '15'].map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => setDurationMinutes(mins)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    durationMinutes === mins
                      ? 'bg-primary/20 border-primary text-primary font-bold'
                      : 'bg-secondary/40 border-border text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {mins}m
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              Discussion Summary & Requirements <span className="text-destructive">*</span>
            </label>
            <textarea
              required
              rows={3}
              placeholder="e.g. Customer wants a 1 BHK flat near Whitefield, budget ₹45-50L, asked to share brochure on WhatsApp."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-secondary/40 border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
            />
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-between border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs shadow-md shadow-primary/20 transition-all disabled:opacity-50"
            >
              {submitting ? 'Saving to Log...' : 'Save Call to Digital Memory'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
