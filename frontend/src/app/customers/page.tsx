'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  UserCheck,
  Search,
  Plus,
  Phone,
  MessageSquare,
  MapPin,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { AppLayout } from '../../components/layout/AppLayout';
import { QuickAddLeadModal } from '../../components/modals/QuickAddLeadModal';
import { api } from '../../lib/api';
import { formatBudgetRange, formatRelativeDate } from '../../lib/utils';

export default function CustomersPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [quickAddOpen, setQuickAddOpen] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['customers-list', search, page],
    queryFn: () =>
      api.getCustomers({
        search: search.trim() || undefined,
        page,
        limit: 20,
      }),
  });

  return (
    <AppLayout>
      <div className="space-y-6 pb-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-foreground tracking-tight flex items-center gap-2.5">
              <span>Customer Directory</span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-accent/15 text-accent border border-accent/25">
                {data?.meta?.total || 0} Clients
              </span>
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              Searchable client database with duplicate detection and complete interaction history
            </p>
          </div>

          <button
            onClick={() => setQuickAddOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs shadow-md self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>+ Quick Add Lead</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 rounded-2xl bg-card border border-border luxury-card">
          <div className="relative">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by client mobile number (e.g. 9876500001), name, or email..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-secondary/50 border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
            />
          </div>
        </div>

        {/* MOBILE VIEW (< md): Touch-Optimized Customer Cards */}
        <div className="block md:hidden space-y-3">
          {isLoading ? (
            [...Array(4)].map((_, i) => (
              <div
                key={i}
                className="p-4 rounded-2xl bg-card border border-border animate-pulse h-36"
              />
            ))
          ) : data?.data && data.data.length > 0 ? (
            data.data.map((c: any) => {
              let rawPhone = c.whatsappNumber || c.phone || '';
              let cleanPhone = rawPhone.replace(/[^0-9]/g, '');
              if (cleanPhone.length === 10) cleanPhone = `91${cleanPhone}`;

              return (
                <div
                  key={c.id}
                  className="p-4 rounded-2xl bg-card border border-border luxury-card luxury-card-hover space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <Link
                        href={`/customers/${c.id}`}
                        className="font-bold text-sm text-foreground hover:text-primary dark:hover:text-accent flex items-center gap-1"
                      >
                        <span>{c.name}</span>
                        <ExternalLink className="w-3 h-3 text-muted-foreground" />
                      </Link>
                      <div className="text-xs font-mono text-muted-foreground mt-0.5">{c.phone}</div>
                      <span className="text-[10px] text-muted-foreground">Source: {c.source || 'Direct'}</span>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-secondary text-foreground border border-border">
                        {c.totalLeads} {c.totalLeads === 1 ? 'Lead' : 'Leads'}
                      </span>
                      {c.latestLead && (
                        <span
                          className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full badge-${c.latestLead.status.toLowerCase()}`}
                        >
                          {c.latestLead.status.replace(/_/g, ' ')}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Latest Requirement Pill */}
                  {c.latestLead?.requirement && (
                    <div className="pt-2 border-t border-border flex flex-wrap items-center gap-1.5 text-xs">
                      <span className="px-2 py-0.5 rounded-lg bg-secondary border border-border text-foreground font-medium text-[11px]">
                        {c.latestLead.requirement.bhk ? `${c.latestLead.requirement.bhk} ` : ''}
                        {c.latestLead.requirement.propertyType || 'Apartment'}
                      </span>
                      <span className="px-2 py-0.5 rounded-lg bg-accent/10 border border-accent/20 text-accent font-mono font-bold text-[11px]">
                        {formatBudgetRange(
                          c.latestLead.requirement.minBudget,
                          c.latestLead.requirement.maxBudget,
                        )}
                      </span>
                      {c.latestLead.requirement.preferredLocation && (
                        <span className="px-2 py-0.5 rounded-lg bg-secondary text-muted-foreground flex items-center gap-1 text-[11px]">
                          <MapPin className="w-3 h-3 text-accent" />
                          <span>{c.latestLead.requirement.preferredLocation}</span>
                        </span>
                      )}
                    </div>
                  )}

                  {/* Next Follow-up */}
                  {c.nextFollowUp && (
                    <div className="text-[11px] text-accent flex items-center gap-1.5 bg-accent/10 px-2.5 py-1 rounded-lg border border-accent/20">
                      <Clock className="w-3.5 h-3.5 shrink-0" />
                      <span>Follow-up: {formatRelativeDate(c.nextFollowUp.scheduledAt)}</span>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="pt-2 border-t border-border flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {c.phone && (
                        <a
                          href={`tel:${c.phone}`}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-success/15 text-success font-semibold text-xs border border-success/30 active:scale-95"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>Call</span>
                        </a>
                      )}
                      {cleanPhone && (
                        <a
                          href={`https://api.whatsapp.com/send?phone=${cleanPhone}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-success/15 text-success font-semibold text-xs border border-success/30 active:scale-95"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>WhatsApp</span>
                        </a>
                      )}
                    </div>

                    <Link
                      href={`/customers/${c.id}`}
                      className="px-3.5 py-1.5 rounded-xl bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground font-semibold text-xs border border-primary/20 transition-colors"
                    >
                      Profile 360°
                    </Link>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center text-muted-foreground bg-card rounded-2xl border border-border luxury-card">
              <p className="font-semibold text-foreground text-xs">No customers found</p>
            </div>
          )}
        </div>

        {/* DESKTOP VIEW (>= md): Customers Table */}
        <div className="hidden md:block overflow-x-auto rounded-2xl bg-card border border-border luxury-card">
          <table className="w-full text-left text-xs">
            <thead className="bg-secondary/60 border-b border-border text-muted-foreground uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3.5 px-4">Client Name</th>
                <th className="py-3.5 px-4">Phone Numbers</th>
                <th className="py-3.5 px-4">Latest Requirement</th>
                <th className="py-3.5 px-4">Lead Status</th>
                <th className="py-3.5 px-4">Last Interaction</th>
                <th className="py-3.5 px-4">Next Follow-up</th>
                <th className="py-3.5 px-4">Total Leads</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                [...Array(6)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={8} className="py-5 px-4">
                      <div className="h-4 bg-secondary rounded" />
                    </td>
                  </tr>
                ))
              ) : data?.data && data.data.length > 0 ? (
                data.data.map((c: any) => (
                  <tr
                    key={c.id}
                    className="hover:bg-secondary/40 transition-colors group cursor-pointer"
                  >
                    <td className="py-3.5 px-4">
                      <Link
                        href={`/customers/${c.id}`}
                        className="font-bold text-foreground group-hover:text-primary dark:group-hover:text-accent text-sm flex items-center gap-1.5"
                      >
                        <span>{c.name}</span>
                        <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground" />
                      </Link>
                      <span className="text-[10px] text-muted-foreground">Source: {c.source}</span>
                    </td>
                    <td className="py-3.5 px-4 font-mono">
                      <div className="text-foreground font-bold">{c.phone}</div>
                      {c.whatsappNumber && c.whatsappNumber !== c.phone && (
                        <div className="text-[10px] text-success">WA: {c.whatsappNumber}</div>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      {c.latestLead?.requirement ? (
                        <div>
                          <span className="font-semibold text-foreground">
                            {c.latestLead.requirement.bhk || ''} {c.latestLead.requirement.propertyType}
                          </span>
                          <div className="text-[11px] text-muted-foreground">
                            {c.latestLead.requirement.preferredLocation} •{' '}
                            <span className="text-foreground font-mono font-medium">
                              {formatBudgetRange(
                                c.latestLead.requirement.minBudget,
                                c.latestLead.requirement.maxBudget,
                              )}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      {c.latestLead ? (
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider badge-${c.latestLead.status.toLowerCase()}`}
                        >
                          {c.latestLead.status.replace(/_/g, ' ')}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-muted-foreground">
                      {formatRelativeDate(c.lastInteraction)}
                    </td>
                    <td className="py-3.5 px-4 text-muted-foreground">
                      {c.nextFollowUp ? (
                        <div className="flex items-center gap-1 text-accent font-medium">
                          <Clock className="w-3 h-3" />
                          <span>{formatRelativeDate(c.nextFollowUp.scheduledAt)}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-foreground">
                      {c.totalLeads}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href={`/customers/${c.id}`}
                        className="px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground font-semibold text-xs transition-colors inline-block"
                      >
                        Profile 360°
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-muted-foreground">
                    <p className="font-semibold text-foreground">No customers found</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      New customers are automatically indexed whenever a lead or call is logged.
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
              Page {data.meta.page} of {data.meta.totalPages} ({data.meta.total} records)
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
      </div>

      <QuickAddLeadModal
        isOpen={quickAddOpen}
        onClose={() => setQuickAddOpen(false)}
        onLeadCreated={() => refetch()}
      />
    </AppLayout>
  );
}
