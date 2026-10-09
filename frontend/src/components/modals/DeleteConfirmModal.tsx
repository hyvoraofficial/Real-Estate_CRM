'use client';

import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  itemName?: string;
  count?: number;
  loading?: boolean;
}

export function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Delete Confirmation',
  description,
  itemName,
  count,
  loading = false,
}: DeleteConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-md bg-card border border-border luxury-card rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-border bg-secondary/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-urgent/15 text-urgent flex items-center justify-center">
              <Trash2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">{title}</h3>
              <p className="text-[11px] text-muted-foreground">This action cannot be undone</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="p-3.5 rounded-xl bg-urgent/10 border border-urgent/20 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-urgent shrink-0 mt-0.5" />
            <div className="text-xs text-foreground">
              {description ? (
                <p>{description}</p>
              ) : count && count > 1 ? (
                <p>
                  Are you sure you want to delete <strong className="text-urgent">{count} selected leads</strong>?
                  All associated requirements, notes, and activity timeline links will be removed.
                </p>
              ) : (
                <p>
                  Are you sure you want to delete lead <strong className="text-urgent">{itemName || 'this lead'}</strong>?
                  All associated timeline events and requirements will be removed.
                </p>
              )}
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between border-t border-border">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={onConfirm}
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-urgent hover:bg-urgent/90 text-white font-bold text-xs shadow-md transition-all disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
              <span>{loading ? 'Deleting...' : count && count > 1 ? `Delete ${count} Leads` : 'Confirm Delete'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
