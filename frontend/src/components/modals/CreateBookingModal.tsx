'use client';

import React, { useState, useEffect } from 'react';
import { BadgePercent, X, Check, IndianRupee } from 'lucide-react';
import { api } from '../../lib/api';
import { formatPrice } from '../../lib/utils';

interface CreateBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  leadId: string;
  customerId?: string;
  customerName?: string;
  defaultPropertyId?: string;
  onSuccess?: () => void;
}

export function CreateBookingModal({
  isOpen,
  onClose,
  leadId,
  customerId,
  customerName,
  defaultPropertyId,
  onSuccess,
}: CreateBookingModalProps) {
  const [propertyId, setPropertyId] = useState(defaultPropertyId || '');
  const [bookingAmount, setBookingAmount] = useState('200000');
  const [status, setStatus] = useState<'PENDING' | 'CONFIRMED'>('CONFIRMED');
  const [notes, setNotes] = useState('');
  const [properties, setProperties] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      api.getProperties({ limit: 100 })
        .then((res) => {
          setProperties(res.data);
          if (!propertyId && res.data.length > 0) {
            setPropertyId(defaultPropertyId || res.data[0].id);
          }
        })
        .catch(() => {});
    }
  }, [isOpen, defaultPropertyId]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!propertyId) {
      setError('Please select a property');
      return;
    }
    if (!bookingAmount || Number(bookingAmount) <= 0) {
      setError('Please enter a valid booking amount');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await api.createBooking({
        leadId,
        customerId,
        propertyId,
        bookingAmount: Number(bookingAmount),
        status,
        notes: notes.trim() || undefined,
      });

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to record booking');
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
              <BadgePercent className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">Record Deal Booking</h3>
              <p className="text-xs text-muted-foreground">{customerName || 'Lead Conversion'}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && <div className="p-2.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs">{error}</div>}

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">Booked Property</label>
            <select
              required
              value={propertyId}
              onChange={(e) => setPropertyId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-secondary/40 border border-border text-xs text-foreground focus:outline-none focus:border-primary"
            >
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title} ({p.location} • {formatPrice(p.price)})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">Token / Advance Amount (₹)</label>
            <input
              type="number"
              required
              placeholder="e.g. 200000"
              value={bookingAmount}
              onChange={(e) => setBookingAmount(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-secondary/40 border border-border text-sm font-mono text-foreground focus:outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">Booking Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="w-full px-3 py-2 rounded-xl bg-secondary/40 border border-border text-xs text-foreground focus:outline-none focus:border-primary"
            >
              <option value="CONFIRMED">CONFIRMED (Token Received • Closes Lead as Booked)</option>
              <option value="PENDING">PENDING (Awaiting Cheque Realization)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">Payment Reference & Notes</label>
            <textarea
              rows={3}
              placeholder="e.g. Cheque #449210 HDFC Bank, Unit 1204, Agreement scheduled next week."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-secondary/40 border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
            />
          </div>

          <div className="pt-2 flex items-center justify-between border-t border-border">
            <button type="button" onClick={onClose} className="px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs shadow-md shadow-primary/20 transition-all disabled:opacity-50"
            >
              {submitting ? 'Recording...' : 'Confirm & Mark Booked 🎉'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
