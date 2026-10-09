'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Kanban,
  Plus,
  Clock,
  MapPin,
  ExternalLink,
} from 'lucide-react';
import { AppLayout } from '../../components/layout/AppLayout';
import { QuickAddLeadModal } from '../../components/modals/QuickAddLeadModal';
import { api } from '../../lib/api';
import { LeadStatus } from '../../types';
import { formatBudgetRange, formatPrice, formatRelativeDate } from '../../lib/utils';
import { useAuth } from '../../lib/auth';

export default function PipelinePage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [filterUser, setFilterUser] = useState<string>('');
  const [quickAddOpen, setQuickAddOpen] = useState(false);

  const { data: pipeline, isLoading, refetch } = useQuery({
    queryKey: ['lead-pipeline', filterUser],
    queryFn: () => api.getPipeline(filterUser || undefined),
  });

  const columns: { status: LeadStatus; label: string; badgeClass: string }[] = [
    { status: 'NEW', label: 'New Inquiries', badgeClass: 'badge-new' },
    { status: 'CONTACTED', label: 'Contacted', badgeClass: 'badge-contacted' },
    { status: 'REQUIREMENT_COLLECTED', label: 'Requirement Recorded', badgeClass: 'badge-requirement' },
    { status: 'PROPERTY_SHARED', label: 'Property Shared', badgeClass: 'badge-property_shared' },
    { status: 'SITE_VISIT', label: 'Site Visit', badgeClass: 'badge-site_visit' },
    { status: 'NEGOTIATION', label: 'Negotiation', badgeClass: 'badge-negotiation' },
    { status: 'BOOKED', label: 'Booked', badgeClass: 'badge-booked' },
    { status: 'LOST', label: 'Lost', badgeClass: 'badge-lost' },
  ];

  const handleMoveStatus = async (leadId: string, newStatus: LeadStatus, e: React.ChangeEvent<HTMLSelectElement>) => {
    e.stopPropagation();
    try {
      await api.updateLead(leadId, { status: newStatus });
      refetch();
    } catch (err) {
      console.error(err);
    }
  };

  const [selectedMobileStage, setSelectedMobileStage] = useState<string>('ALL');

  return (
    <AppLayout>
      <div className="space-y-6 pb-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-foreground tracking-tight flex items-center gap-2.5">
              <Kanban className="w-6 h-6 text-primary dark:text-accent" />
              <span>Deal Pipeline Kanban</span>
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Visual pipeline from initial inquiry to closed token booking
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setFilterUser('')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  filterUser === ''
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-card border border-border text-muted-foreground hover:text-foreground'
                }`}
              >
                All Team
              </button>
              {user?.id && (
                <button
                  onClick={() => setFilterUser(user.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    filterUser === user.id
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'bg-card border border-border text-muted-foreground hover:text-foreground'
                  }`}
                >
                  My Leads
                </button>
              )}
            </div>

            <button
              onClick={() => setQuickAddOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>+ Quick Add</span>
            </button>
          </div>
        </div>

        {/* MOBILE STAGE SELECTOR TABS (< md) */}
        <div className="block md:hidden">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-border text-xs">
            <button
              onClick={() => setSelectedMobileStage('ALL')}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
                selectedMobileStage === 'ALL'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-secondary text-muted-foreground border border-border'
              }`}
            >
              All Stages ({Object.values(pipeline || {}).reduce((sum: number, c: any) => sum + (c.count || 0), 0)})
            </button>
            {columns.map((col) => {
              const cnt = pipeline?.[col.status]?.count || 0;
              return (
                <button
                  key={col.status}
                  onClick={() => setSelectedMobileStage(col.status)}
                  className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap flex items-center gap-1.5 transition-all ${
                    selectedMobileStage === col.status
                      ? 'bg-primary text-primary-foreground shadow-sm font-bold'
                      : 'bg-secondary text-muted-foreground border border-border'
                  }`}
                >
                  <span>{col.label}</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-card text-foreground">
                    {cnt}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Pipeline Columns Container */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-pulse">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-96 rounded-2xl bg-card border border-border" />
            ))}
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-6 min-h-[calc(100vh-220px)] items-start">
            {columns
              .filter((col) => selectedMobileStage === 'ALL' || selectedMobileStage === col.status)
              .map((col) => {
                const colData = pipeline?.[col.status] || { leads: [], count: 0, totalPotentialValue: 0 };

                return (
                  <div
                    key={col.status}
                    className="w-full sm:w-80 shrink-0 rounded-2xl bg-card border border-border flex flex-col max-h-[calc(100vh-220px)] luxury-card shadow-sm"
                  >
                    {/* Column Header */}
                    <div className="p-3.5 border-b border-border bg-secondary/50 rounded-t-2xl flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-xs tracking-wide uppercase text-foreground">{col.label}</span>
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-card border border-border text-foreground">
                            {colData.count}
                          </span>
                        </div>
                        {colData.totalPotentialValue > 0 && (
                          <div className="text-[10px] text-muted-foreground font-mono mt-0.5 font-medium">
                            {formatPrice(colData.totalPotentialValue)} potential
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Cards Scroll Area */}
                    <div className="p-3 overflow-y-auto space-y-3 flex-1">
                      {colData.leads && colData.leads.length > 0 ? (
                        colData.leads.map((lead: any) => {
                          let rawPhone = lead.customer?.whatsappNumber || lead.customer?.phone || '';
                          let cleanPhone = rawPhone.replace(/[^0-9]/g, '');
                          if (cleanPhone.length === 10) cleanPhone = `91${cleanPhone}`;

                          return (
                            <div
                              key={lead.id}
                              className="p-3.5 rounded-xl bg-card hover:bg-secondary/40 border border-border hover:border-accent transition-all luxury-card shadow-sm space-y-2.5 group cursor-pointer relative"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <Link
                                    href={`/leads/${lead.id}`}
                                    className="font-bold text-xs text-foreground group-hover:text-primary dark:group-hover:text-accent transition-colors flex items-center gap-1"
                                  >
                                    <span>{lead.customer?.name}</span>
                                    <ExternalLink className="w-3 h-3 text-muted-foreground" />
                                  </Link>
                                  <div className="text-[11px] font-mono text-muted-foreground">{lead.customer?.phone}</div>
                                </div>
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

                              {/* Requirement summary */}
                              {lead.requirement && (
                                <div className="text-[11px] text-foreground bg-secondary/50 p-2 rounded-lg border border-border space-y-0.5">
                                  <div className="font-semibold text-primary dark:text-accent">
                                    {lead.requirement.bhk || ''} {lead.requirement.propertyType}
                                  </div>
                                  <div className="text-muted-foreground flex items-center gap-1">
                                    <MapPin className="w-3 h-3 text-accent" />
                                    <span>{lead.requirement.preferredLocation}</span>
                                  </div>
                                  <div className="text-foreground font-mono font-medium">
                                    {formatBudgetRange(lead.requirement.minBudget, lead.requirement.maxBudget)}
                                  </div>
                                </div>
                              )}

                              {/* Next follow-up info */}
                              {lead.nextFollowUp && (
                                <div className="text-[10px] text-accent flex items-center gap-1 font-medium">
                                  <Clock className="w-3 h-3" />
                                  <span>{formatRelativeDate(lead.nextFollowUp.scheduledAt)}</span>
                                </div>
                              )}

                              {/* Quick Direct Actions */}
                              <div className="flex items-center gap-1.5 pt-1">
                                {lead.customer?.phone && (
                                  <a
                                    href={`tel:${lead.customer.phone}`}
                                    onClick={(e) => e.stopPropagation()}
                                    className="px-2 py-1 rounded-lg bg-success/15 text-success text-[10px] font-semibold border border-success/30 flex items-center gap-1"
                                  >
                                    Call
                                  </a>
                                )}
                                {cleanPhone && (
                                  <a
                                    href={`https://api.whatsapp.com/send?phone=${cleanPhone}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="px-2 py-1 rounded-lg bg-success/15 text-success text-[10px] font-semibold border border-success/30 flex items-center gap-1"
                                  >
                                    WhatsApp
                                  </a>
                                )}
                              </div>

                              {/* Quick Stage Mover */}
                              <div className="pt-2 border-t border-border flex items-center justify-between gap-1 text-[10px]">
                                <span className="text-muted-foreground truncate">
                                  {lead.assignedUser?.name || 'Unassigned'}
                                </span>

                                <select
                                  value={lead.status}
                                  onChange={(e) => handleMoveStatus(lead.id, e.target.value as LeadStatus, e)}
                                  className="px-1.5 py-1 rounded-md bg-secondary border border-border text-[10px] text-foreground focus:outline-none"
                                >
                                  {columns.map((c) => (
                                    <option key={c.status} value={c.status}>
                                      → {c.label}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="py-8 text-center text-xs text-muted-foreground border border-dashed border-border rounded-xl">
                          No leads in this stage
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>

      <QuickAddLeadModal
        isOpen={quickAddOpen}
        onClose={() => setQuickAddOpen(false)}
        onLeadCreated={() => refetch()}
      />
    </AppLayout>
  );
}
