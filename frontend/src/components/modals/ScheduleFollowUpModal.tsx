'use client';

import React, { useState } from 'react';
import { Calendar, Clock, X, Check } from 'lucide-react';
import { api } from '../../lib/api';

interface ScheduleFollowUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  leadId: string;
  customerName?: string;
  onSuccess?: () => void;
}

export function ScheduleFollowUpModal({
  isOpen,
  onClose,
  leadId,
  customerName,
  onSuccess,
}: ScheduleFollowUpModalProps) {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const yyyy = tomorrow.getFullYear();
  const mm = String(tomorrow.getMonth() + 1).padStart(2, '0');
  const dd = String(tomorrow.getDate()).padStart(2, '0');

  const dateInputRef = React.useRef<HTMLInputElement>(null);
  const timeInputRef = React.useRef<HTMLInputElement>(null);

  const [date, setDate] = useState(`${yyyy}-${mm}-${dd}`);
  const [time, setTime] = useState('11:00');
  const [type, setType] = useState('CALL');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const scheduledAt = new Date(`${date}T${time}:00`).toISOString();
      await api.createFollowUp({
        leadId,
        scheduledAt,
        type,
        notes: notes.trim() || undefined,
      });

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to schedule follow-up');
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
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">Schedule Follow-up</h3>
              <p className="text-xs text-muted-foreground">{customerName || 'Lead Action'}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && <div className="p-2.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs">{error}</div>}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Date</label>
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
              <label className="block text-xs font-semibold text-foreground mb-1">Time</label>
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
            <label className="block text-xs font-semibold text-foreground mb-1">Follow-up Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-secondary/40 border border-border text-xs text-foreground focus:outline-none focus:border-primary"
            >
              <option value="CALL">Phone Call</option>
              <option value="WHATSAPP">WhatsApp Message</option>
              <option value="SITE_VISIT">Site Visit Walkthrough</option>
              <option value="MEETING">In-person Meeting</option>
              <option value="OTHER">Other Action</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">Follow-up Goal / Notes</label>
            <textarea
              rows={3}
              placeholder="e.g. Call customer to confirm weekend site visit for 2 BHK in Electronic City."
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
              className="px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold shadow-md shadow-primary/20 transition-all disabled:opacity-50"
            >
              {submitting ? 'Scheduling...' : 'Set Reminder'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
