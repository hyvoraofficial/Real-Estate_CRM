'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  Users,
  Search,
  Plus,
  Clock,
  Edit2,
  Trash2,
  ExternalLink,
  CheckSquare,
  Square,
  X,
  Phone,
  MessageSquare,
  MapPin,
  Mic,
} from 'lucide-react';
import { AppLayout } from '../../components/layout/AppLayout';
import { QuickAddLeadModal } from '../../components/modals/QuickAddLeadModal';
import { EditLeadModal } from '../../components/modals/EditLeadModal';
import { DeleteConfirmModal } from '../../components/modals/DeleteConfirmModal';
import { AiVoiceAssistantModal } from '../../components/ai/AiVoiceAssistantModal';
import { api } from '../../lib/api';
import { formatBudgetRange, formatRelativeDate } from '../../lib/utils';
import { LeadStatus } from '../../types';

export default function LeadsPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [page, setPage] = useState(1);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [aiVoiceOpen, setAiVoiceOpen] = useState(false);

  // Row Selection State for Bulk Actions (Active only on Long Press)
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const longPressTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const isLongPressTriggeredRef = React.useRef(false);

  // Edit Modal State
  const [editingLead, setEditingLead] = useState<any | null>(null);

  // Delete Modals State
  const [deletingSingleLead, setDeletingSingleLead] = useState<any | null>(null);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['leads-list', search, status, priority, page],
    queryFn: () =>
      api.getLeads({
        search: search.trim() || undefined,
        status: status || undefined,
        priority: priority || undefined,
        page,
        limit: 20,
      }),
  });

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

  const leadsList = data?.data || [];
  const allCurrentSelected =
    leadsList.length > 0 && leadsList.every((l: any) => selectedLeadIds.includes(l.id));

  // Long Press Handlers
  const handlePressStart = (leadId: string) => {
    isLongPressTriggeredRef.current = false;
    longPressTimeoutRef.current = setTimeout(() => {
      isLongPressTriggeredRef.current = true;
      setIsSelectionMode(true);
      setSelectedLeadIds((prev) => Array.from(new Set([...prev, leadId])));
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(50);
      }
    }, 500);
  };

  const handlePressCancel = () => {
    if (longPressTimeoutRef.current) {
      clearTimeout(longPressTimeoutRef.current);
      longPressTimeoutRef.current = null;
    }
  };

  const handleRowClick = (leadId: string, e: React.MouseEvent) => {
    if (isLongPressTriggeredRef.current) {
      e.preventDefault();
      e.stopPropagation();
      isLongPressTriggeredRef.current = false;
      return;
    }
    if (isSelectionMode) {
      e.preventDefault();
      e.stopPropagation();
      setSelectedLeadIds((prev) => {
        const next = prev.includes(leadId) ? prev.filter((id) => id !== leadId) : [...prev, leadId];
        if (next.length === 0) {
          setIsSelectionMode(false);
        }
        return next;
      });
    }
  };

  const handleToggleSelectAll = () => {
    if (allCurrentSelected) {
      // Unselect all on current page
      setSelectedLeadIds((prev) => {
        const remaining = prev.filter((id) => !leadsList.some((l: any) => l.id === id));
        if (remaining.length === 0) setIsSelectionMode(false);
        return remaining;
      });
    } else {
      // Select all on current page
      const currentIds = leadsList.map((l: any) => l.id);
      setSelectedLeadIds((prev) => Array.from(new Set([...prev, ...currentIds])));
    }
  };

  const handleToggleSelectRow = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedLeadIds((prev) => {
      const next = prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id];
      if (next.length === 0) {
        setIsSelectionMode(false);
      }
      return next;
    });
  };

  const handleExitSelectionMode = () => {
    setSelectedLeadIds([]);
    setIsSelectionMode(false);
  };

  // Single Lead Delete
  const handleConfirmSingleDelete = async () => {
    if (!deletingSingleLead) return;
    setActionLoading(true);
    try {
      await api.deleteLead(deletingSingleLead.id);
      setSelectedLeadIds((prev) => {
        const next = prev.filter((id) => id !== deletingSingleLead.id);
        if (next.length === 0) setIsSelectionMode(false);
        return next;
      });
      setActionMessage(`Lead for ${deletingSingleLead.customer?.name || 'client'} deleted successfully`);
      setTimeout(() => setActionMessage(null), 3000);
      setDeletingSingleLead(null);
      refetch();
    } catch (err: any) {
      alert(err.message || 'Failed to delete lead');
    } finally {
      setActionLoading(false);
    }
  };

  // Bulk Leads Delete
  const handleConfirmBulkDelete = async () => {
    if (selectedLeadIds.length === 0) return;
    setActionLoading(true);
    try {
      await api.bulkDeleteLeads(selectedLeadIds);
      setActionMessage(`${selectedLeadIds.length} leads deleted successfully`);
      setTimeout(() => setActionMessage(null), 3000);
      setSelectedLeadIds([]);
      setIsSelectionMode(false);
      setIsBulkDeleting(false);
      refetch();
    } catch (err: any) {
      alert(err.message || 'Failed to delete selected leads');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6 pb-24">
        {/* Toast / Notification Banner */}
        {actionMessage && (
          <div className="p-3.5 rounded-2xl bg-success/15 border border-success/30 text-success text-xs font-semibold flex items-center justify-between animate-in fade-in slide-in-from-top-2">
            <span>✓ {actionMessage}</span>
            <button onClick={() => setActionMessage(null)} className="text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-foreground tracking-tight flex items-center gap-2.5">
              <span>Leads Management</span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-accent/15 text-accent border border-accent/25">
                {data?.meta?.total || 0} Total
              </span>
            </h1>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-2 flex-wrap">
              <span>Active buyer inquiries and potential client requirements</span>
              {!isSelectionMode ? (
                <span className="text-[11px] text-muted-foreground/80 font-normal">
                  (Tip: Long-press any row to select)
                </span>
              ) : (
                <span className="text-[11px] text-accent font-semibold bg-accent/10 px-2 py-0.5 rounded border border-accent/20">
                  Selection Mode Active
                </span>
              )}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setAiVoiceOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-accent/10 hover:bg-accent/20 border border-accent/30 text-foreground font-semibold text-xs shadow-sm transition-all"
            >
              <Mic className="w-3.5 h-3.5 text-accent animate-pulse" />
              <span>AI Voice Add</span>
            </button>
            <Link
              href="/pipeline"
              className="hidden sm:inline-flex px-3.5 py-2 rounded-xl bg-secondary hover:bg-secondary/80 border border-border text-foreground font-semibold text-xs transition-colors"
            >
              Pipeline Board
            </Link>
            <button
              onClick={() => setQuickAddOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs shadow-md transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>+ Quick Add</span>
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="p-4 rounded-2xl bg-card border border-border luxury-card flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by customer name, phone number, location, BHK, property type..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-secondary/50 border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="px-3 py-2 rounded-xl bg-secondary/50 border border-border text-xs text-foreground focus:outline-none focus:border-primary"
            >
              <option value="">All Statuses</option>
              {statuses.map((s) => (
                <option key={s} value={s}>
                  {s.replace(/_/g, ' ')}
                </option>
              ))}
            </select>

            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="px-3 py-2 rounded-xl bg-secondary/50 border border-border text-xs text-foreground focus:outline-none focus:border-primary"
            >
              <option value="">All Priorities</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>

            {(search || status || priority) && (
              <button
                onClick={() => {
                  setSearch('');
                  setStatus('');
                  setPriority('');
                }}
                className="px-3 py-2 rounded-xl text-xs text-urgent hover:bg-urgent/10 font-semibold"
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>

        {/* MOBILE VIEW (< md): Touch-Friendly Cards */}
        <div className="block md:hidden space-y-3">
          {/* Mobile Select All row in Selection Mode */}
          {isSelectionMode && (
            <div className="p-3 rounded-xl bg-secondary border border-accent/40 flex items-center justify-between text-xs animate-in fade-in duration-150">
              <button
                type="button"
                onClick={handleToggleSelectAll}
                className="flex items-center gap-2 text-accent font-bold"
              >
                {allCurrentSelected ? (
                  <CheckSquare className="w-4 h-4" />
                ) : (
                  <Square className="w-4 h-4" />
                )}
                <span>{allCurrentSelected ? 'Deselect All on Page' : 'Select All on Page'}</span>
              </button>
              <span className="text-muted-foreground text-[11px]">
                {selectedLeadIds.length} Selected
              </span>
            </div>
          )}

          {isLoading ? (
            [...Array(4)].map((_, i) => (
              <div
                key={i}
                className="p-4 rounded-2xl bg-card border border-border animate-pulse h-36"
              />
            ))
          ) : leadsList.length > 0 ? (
            leadsList.map((lead: any) => {
              const isSelected = selectedLeadIds.includes(lead.id);
              let rawPhone = lead.customer?.whatsappNumber || lead.customer?.phone || '';
              let cleanPhone = rawPhone.replace(/[^0-9]/g, '');
              if (cleanPhone.length === 10) cleanPhone = `91${cleanPhone}`;

              return (
                <div
                  key={lead.id}
                  onMouseDown={() => handlePressStart(lead.id)}
                  onMouseUp={handlePressCancel}
                  onMouseLeave={handlePressCancel}
                  onTouchStart={() => handlePressStart(lead.id)}
                  onTouchEnd={handlePressCancel}
                  onTouchMove={handlePressCancel}
                  onClick={(e) => handleRowClick(lead.id, e)}
                  className={`p-4 rounded-2xl bg-card border luxury-card transition-all select-none relative active:scale-[0.99] ${
                    isSelected
                      ? 'border-accent bg-accent/10 shadow-md'
                      : 'border-border hover:border-accent'
                  }`}
                >
                  {/* Top row: Checkbox / Name + Status badge */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      {isSelectionMode && (
                        <button
                          type="button"
                          onClick={(e) => handleToggleSelectRow(lead.id, e)}
                          className="p-1 text-muted-foreground hover:text-accent transition-colors"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-5 h-5 text-accent" />
                          ) : (
                            <Square className="w-5 h-5 text-muted-foreground" />
                          )}
                        </button>
                      )}
                      <div>
                        <Link
                          href={`/leads/${lead.id}`}
                          onClick={(e) => {
                            if (isSelectionMode || isLongPressTriggeredRef.current) {
                              e.preventDefault();
                            }
                          }}
                          className="font-bold text-sm text-foreground hover:text-primary dark:hover:text-accent flex items-center gap-1.5"
                        >
                          <span>{lead.customer?.name}</span>
                          <ExternalLink className="w-3 h-3 text-muted-foreground" />
                        </Link>
                        <div className="text-xs font-mono text-muted-foreground mt-0.5">
                          {lead.customer?.phone}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span
                        className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full badge-${lead.status.toLowerCase()}`}
                      >
                        {lead.status.replace(/_/g, ' ')}
                      </span>
                      <span
                        className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                          lead.priority === 'URGENT'
                            ? 'bg-urgent/15 text-urgent border border-urgent/30'
                            : lead.priority === 'HIGH'
                            ? 'bg-warning/15 text-warning border border-warning/30'
                            : 'bg-secondary text-muted-foreground'
                        }`}
                      >
                        {lead.priority}
                      </span>
                    </div>
                  </div>

                  {/* Requirement & Budget Pills */}
                  <div className="mt-3 pt-3 border-t border-border flex flex-wrap items-center gap-1.5 text-xs">
                    <span className="px-2.5 py-1 rounded-lg bg-secondary border border-border text-foreground font-medium">
                      {lead.requirement?.bhk ? `${lead.requirement.bhk} ` : ''}
                      {lead.requirement?.propertyType || 'Apartment'}
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-accent/10 border border-accent/20 text-accent font-mono font-bold">
                      {formatBudgetRange(lead.requirement?.minBudget, lead.requirement?.maxBudget)}
                    </span>
                    {lead.requirement?.preferredLocation && (
                      <span className="px-2.5 py-1 rounded-lg bg-secondary text-muted-foreground flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-accent" />
                        <span>{lead.requirement.preferredLocation}</span>
                      </span>
                    )}
                  </div>

                  {/* Next Followup Info */}
                  {lead.nextFollowUp && (
                    <div className="mt-2 text-[11px] text-accent flex items-center gap-1.5 bg-accent/10 px-2.5 py-1 rounded-lg border border-accent/20">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Next Follow-up: {formatRelativeDate(lead.nextFollowUp.scheduledAt)}</span>
                    </div>
                  )}

                  {/* Direct Mobile Action Buttons */}
                  <div className="mt-3 pt-3 border-t border-border flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {/* Direct Call Button */}
                      {lead.customer?.phone && (
                        <a
                          href={`tel:${lead.customer.phone}`}
                          onClick={(e) => e.stopPropagation()}
                          title="Call Customer"
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-success/15 hover:bg-success/25 text-success font-semibold text-xs border border-success/30 transition-colors"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>Call</span>
                        </a>
                      )}

                      {/* Direct WhatsApp Button */}
                      {cleanPhone && (
                        <a
                          href={`https://api.whatsapp.com/send?phone=${cleanPhone}`}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          title="Chat on WhatsApp"
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-success/15 hover:bg-success/25 text-success font-semibold text-xs border border-success/30 transition-colors"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>WhatsApp</span>
                        </a>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                      <Link
                        href={`/leads/${lead.id}`}
                        className="px-3 py-1.5 rounded-xl bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground font-semibold text-xs transition-colors"
                      >
                        Open
                      </Link>
                      <button
                        type="button"
                        onClick={() => setEditingLead(lead)}
                        className="p-1.5 rounded-xl bg-secondary hover:bg-warning/20 text-muted-foreground hover:text-warning border border-border"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingSingleLead(lead)}
                        className="p-1.5 rounded-xl bg-secondary hover:bg-urgent/20 text-muted-foreground hover:text-urgent border border-border"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center text-muted-foreground bg-card rounded-2xl border border-border luxury-card">
              <p className="font-semibold text-foreground text-xs">No leads found</p>
            </div>
          )}
        </div>

        {/* DESKTOP VIEW (>= md): Leads Table */}
        <div className="hidden md:block overflow-x-auto rounded-2xl bg-card border border-border luxury-card">
          <table className="w-full text-left text-xs">
            <thead className="bg-secondary/60 border-b border-border text-muted-foreground uppercase tracking-wider text-[10px]">
              <tr>
                {/* Select All Checkbox (Visible only in Selection Mode) */}
                {isSelectionMode && (
                  <th className="py-3.5 px-3 w-10 text-center animate-in fade-in duration-150">
                    <button
                      type="button"
                      onClick={handleToggleSelectAll}
                      title={allCurrentSelected ? 'Deselect all' : 'Select all on page'}
                      className="p-1 text-muted-foreground hover:text-accent transition-colors"
                    >
                      {allCurrentSelected ? (
                        <CheckSquare className="w-4 h-4 text-accent" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </th>
                )}
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4">Requirement</th>
                <th className="py-3.5 px-4">Budget Range</th>
                <th className="py-3.5 px-4">Location</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Priority</th>
                <th className="py-3.5 px-4">Next Follow-up</th>
                <th className="py-3.5 px-4">Assigned To</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                [...Array(6)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={isSelectionMode ? 10 : 9} className="py-5 px-4">
                      <div className="h-4 bg-secondary rounded" />
                    </td>
                  </tr>
                ))
              ) : leadsList.length > 0 ? (
                leadsList.map((lead: any) => {
                  const isSelected = selectedLeadIds.includes(lead.id);

                  return (
                    <tr
                      key={lead.id}
                      onMouseDown={() => handlePressStart(lead.id)}
                      onMouseUp={handlePressCancel}
                      onMouseLeave={handlePressCancel}
                      onTouchStart={() => handlePressStart(lead.id)}
                      onTouchEnd={handlePressCancel}
                      onTouchMove={handlePressCancel}
                      onClick={(e) => handleRowClick(lead.id, e)}
                      className={`transition-colors select-none group ${
                        isSelected ? 'bg-accent/15 hover:bg-accent/20' : 'hover:bg-secondary/40'
                      } ${isSelectionMode ? 'cursor-pointer' : ''}`}
                    >
                      {/* Row Checkbox (Visible only in Selection Mode) */}
                      {isSelectionMode && (
                        <td className="py-3.5 px-3 text-center animate-in fade-in duration-150">
                          <button
                            type="button"
                            onClick={(e) => handleToggleSelectRow(lead.id, e)}
                            className="p-1 text-muted-foreground hover:text-accent transition-colors"
                          >
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-accent" />
                            ) : (
                              <Square className="w-4 h-4 text-muted-foreground" />
                            )}
                          </button>
                        </td>
                      )}

                      {/* Customer Info */}
                      <td className="py-3.5 px-4">
                        <Link
                          href={`/leads/${lead.id}`}
                          onClick={(e) => {
                            if (isSelectionMode || isLongPressTriggeredRef.current) {
                              e.preventDefault();
                            }
                          }}
                          className="font-bold text-foreground hover:text-primary dark:hover:text-accent flex items-center gap-1.5"
                        >
                          <span>{lead.customer?.name}</span>
                          <ExternalLink className="w-3 h-3 text-muted-foreground group-hover:text-accent opacity-0 group-hover:opacity-100 transition-opacity" />
                        </Link>
                        <div className="text-[11px] font-mono text-muted-foreground">{lead.customer?.phone}</div>
                      </td>

                      {/* Requirement */}
                      <td className="py-3.5 px-4 font-semibold text-foreground">
                        {lead.requirement?.bhk ? `${lead.requirement.bhk} ` : ''}
                        {lead.requirement?.propertyType || 'Apartment'}
                        <div className="text-[10px] text-muted-foreground font-normal">
                          {lead.requirement?.purpose || 'Buying'}
                        </div>
                      </td>

                      {/* Budget */}
                      <td className="py-3.5 px-4 font-mono font-medium text-foreground">
                        {formatBudgetRange(lead.requirement?.minBudget, lead.requirement?.maxBudget)}
                      </td>

                      {/* Location */}
                      <td className="py-3.5 px-4 text-muted-foreground">
                        {lead.requirement?.preferredLocation || '—'}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider badge-${lead.status.toLowerCase()}`}
                        >
                          {lead.status.replace(/_/g, ' ')}
                        </span>
                      </td>

                      {/* Priority */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                            lead.priority === 'URGENT'
                              ? 'bg-urgent/15 text-urgent border border-urgent/30'
                              : lead.priority === 'HIGH'
                              ? 'bg-warning/15 text-warning border border-warning/30'
                              : 'bg-secondary text-muted-foreground'
                          }`}
                        >
                          {lead.priority}
                        </span>
                      </td>

                      {/* Next Follow-up */}
                      <td className="py-3.5 px-4 text-muted-foreground">
                        {lead.nextFollowUp ? (
                          <div className="flex items-center gap-1 text-accent text-[11px]">
                            <Clock className="w-3 h-3" />
                            <span>{formatRelativeDate(lead.nextFollowUp.scheduledAt)}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>

                      {/* Assigned User */}
                      <td className="py-3.5 px-4 text-muted-foreground">
                        {lead.assignedUser?.name || 'Unassigned'}
                      </td>

                      {/* Row Action Buttons (Open, Edit, Delete) */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                          {/* Open Workspace */}
                          <Link
                            href={`/leads/${lead.id}`}
                            title="Open Lead Workspace"
                            className="px-2.5 py-1.5 rounded-lg bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground font-semibold text-xs transition-colors"
                          >
                            Open
                          </Link>

                          {/* Edit Lead Button */}
                          <button
                            type="button"
                            title="Edit Lead Record"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingLead(lead);
                            }}
                            className="p-1.5 rounded-lg bg-secondary hover:bg-warning/20 text-muted-foreground hover:text-warning border border-border transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete Lead Button */}
                          <button
                            type="button"
                            title="Delete Lead"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeletingSingleLead(lead);
                            }}
                            className="p-1.5 rounded-lg bg-secondary hover:bg-urgent/20 text-muted-foreground hover:text-urgent border border-border transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={isSelectionMode ? 10 : 9} className="py-12 text-center text-muted-foreground">
                    <p className="font-semibold text-foreground">No leads found</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Click &quot;+ Quick Add&quot; above to log a new inquiry in 20 seconds.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data?.meta && data.meta.totalPages > 1 && (
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Showing page {data.meta.page} of {data.meta.totalPages} ({data.meta.total} records)
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-lg bg-secondary border border-border text-foreground disabled:opacity-40"
              >
                Previous
              </button>
              <button
                disabled={page >= data.meta.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 rounded-lg bg-secondary border border-border text-foreground disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* FLOATING BULK ACTIONS TOOLBAR */}
        {(isSelectionMode || selectedLeadIds.length > 0) && (
          <div className="fixed bottom-20 lg:bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 sm:gap-3 px-3.5 sm:px-5 py-2.5 sm:py-3 rounded-2xl bg-card/95 border border-accent/40 shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-4 duration-200 max-w-[94vw] sm:max-w-none">
            <div className="flex items-center gap-1.5 sm:gap-2 pr-2.5 sm:pr-3 border-r border-border">
              <span className="w-2.5 h-2.5 rounded-full bg-accent animate-pulse shrink-0" />
              <span className="text-xs font-bold text-foreground whitespace-nowrap">
                {selectedLeadIds.length} {selectedLeadIds.length === 1 ? 'Lead' : 'Leads'}
              </span>
            </div>

            {/* Bulk Delete Button */}
            <button
              type="button"
              disabled={selectedLeadIds.length === 0}
              onClick={() => setIsBulkDeleting(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-urgent hover:bg-urgent/90 disabled:opacity-40 text-white font-bold text-xs shadow-md transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Selected ({selectedLeadIds.length})</span>
            </button>

            {/* Exit Selection Mode */}
            <button
              type="button"
              onClick={handleExitSelectionMode}
              className="px-3 py-1.5 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground text-xs font-medium transition-colors"
            >
              Exit Selection
            </button>
          </div>
        )}
      </div>

      {/* Quick Add Modal */}
      <QuickAddLeadModal
        isOpen={quickAddOpen}
        onClose={() => setQuickAddOpen(false)}
        onLeadCreated={() => refetch()}
      />

      {/* Edit Lead Modal */}
      {editingLead && (
        <EditLeadModal
          isOpen={!!editingLead}
          lead={editingLead}
          onClose={() => setEditingLead(null)}
          onSuccess={() => {
            setActionMessage(`Lead updated successfully`);
            setTimeout(() => setActionMessage(null), 3000);
            refetch();
          }}
        />
      )}

      {/* Single Delete Confirmation Modal */}
      {deletingSingleLead && (
        <DeleteConfirmModal
          isOpen={!!deletingSingleLead}
          itemName={deletingSingleLead.customer?.name}
          title="Delete Lead"
          loading={actionLoading}
          onClose={() => setDeletingSingleLead(null)}
          onConfirm={handleConfirmSingleDelete}
        />
      )}

      {/* Bulk Delete Confirmation Modal */}
      {isBulkDeleting && (
        <DeleteConfirmModal
          isOpen={isBulkDeleting}
          count={selectedLeadIds.length}
          title="Delete Selected Leads"
          loading={actionLoading}
          onClose={() => setIsBulkDeleting(false)}
          onConfirm={handleConfirmBulkDelete}
        />
      )}

      {/* AI Voice Assistant Modal */}
      <AiVoiceAssistantModal
        isOpen={aiVoiceOpen}
        onClose={() => setAiVoiceOpen(false)}
        onLeadCreated={() => {
          setActionMessage('Lead created via AI Voice Assistant!');
          setTimeout(() => setActionMessage(null), 3000);
          refetch();
        }}
      />
    </AppLayout>
  );
}
