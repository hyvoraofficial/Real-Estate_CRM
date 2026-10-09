'use client';

import React, { useState } from 'react';
import { FileText, X } from 'lucide-react';
import { api } from '../../lib/api';

interface AddNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerId?: string;
  leadId?: string;
  customerName?: string;
  onSuccess?: () => void;
}

export function AddNoteModal({
  isOpen,
  onClose,
  customerId,
  leadId,
  customerName,
  onSuccess,
}: AddNoteModalProps) {
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setSubmitting(true);
    setError(null);
    try {
      await api.createNote({
        customerId,
        leadId,
        content: content.trim(),
      });
      setContent('');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to add note');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-md bg-card border border-border luxury-card rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-border bg-secondary/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-accent/15 text-accent flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">Add Note</h3>
              <p className="text-xs text-muted-foreground">{customerName || 'Lead Record'}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && <div className="p-2.5 rounded-lg bg-urgent/15 text-urgent text-xs">{error}</div>}

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">Note Content</label>
            <textarea
              required
              rows={4}
              placeholder="e.g. Customer requested floor plans for East-facing units. Needs loan sanction before final token."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-secondary/50 border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
            />
          </div>

          <div className="pt-2 flex items-center justify-between border-t border-border">
            <button type="button" onClick={onClose} className="px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground">
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold shadow transition-all disabled:opacity-50"
            >
              {submitting ? 'Saving...' : 'Save Note'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
