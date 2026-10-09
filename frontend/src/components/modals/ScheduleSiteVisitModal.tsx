'use client';

import React, { useState, useEffect } from 'react';
import { MapPin, X, Building, Calendar, Clock } from 'lucide-react';
import { api } from '../../lib/api';
import { formatPrice } from '../../lib/utils';

interface ScheduleSiteVisitModalProps {
  isOpen: boolean;
  onClose: () => void;
  leadId: string;
  customerId?: string;
  customerName?: string;
  defaultPropertyId?: string;
  onSuccess?: () => void;
}

export function ScheduleSiteVisitModal({
  isOpen,
  onClose,
  leadId,
  customerId,
  customerName,
  defaultPropertyId,
  onSuccess,
}: ScheduleSiteVisitModalProps) {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const yyyy = tomorrow.getFullYear();
  const mm = String(tomorrow.getMonth() + 1).padStart(2, '0');
  const dd = String(tomorrow.getDate()).padStart(2, '0');

  const dateInputRef = React.useRef<HTMLInputElement>(null);
  const timeInputRef = React.useRef<HTMLInputElement>(null);

  const [date, setDate] = useState(`${yyyy}-${mm}-${dd}`);
  const [time, setTime] = useState('11:00');
  const [propertyId, setPropertyId] = useState(defaultPropertyId || '');
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

    setSubmitting(true);
    setError(null);

    try {
      const scheduledAt = new Date(`${date}T${time}:00`).toISOString();
      await api.createSiteVisit({
        leadId,
        customerId,
        propertyId,
        scheduledAt,
        notes: notes.trim() || undefined,
      });

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to schedule site visit');
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
            <div className="w-8 h-8 rounded-xl bg-accent/15 border border-accent/30 text-accent flex items-center justify-center">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">Schedule Site Visit</h3>
              <p className="text-xs text-muted-foreground">{customerName || 'Lead Walkthrough'}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && <div className="p-2.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs">{error}</div>}

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">Select Property</label>
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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Visit Date</label>
              <div className="flex items-center gap-1.5">
                <input
                  ref={dateInputRef}
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-2.5 py-2 rounded-xl bg-secondary/40 border border-border text-xs text-foreground focus:outline-none focus:border-primary"
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

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Visit Time</label>
              <div className="flex items-center gap-1.5">
                <input
                  ref={timeInputRef}
                  type="time"
                  required
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full px-2.5 py-2 rounded-xl bg-secondary/40 border border-border text-xs text-foreground focus:outline-none focus:border-primary"
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
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">Visit Logistics / Notes</label>
            <textarea
              rows={3}
              placeholder="e.g. Client visiting with family, arrange site executive for key handover, meet at gate #2."
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
              className="px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs shadow-md shadow-primary/20 transition-all disabled:opacity-50"
            >
              {submitting ? 'Scheduling...' : 'Confirm Site Visit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
