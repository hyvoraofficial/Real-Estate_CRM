'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  MapPin,
  Clock,
  CheckCircle2,
  ExternalLink,
  Phone,
} from 'lucide-react';
import { AppLayout } from '../../components/layout/AppLayout';
import { api } from '../../lib/api';
import { formatPrice, formatRelativeDate } from '../../lib/utils';

export default function SiteVisitsPage() {
  const [period, setPeriod] = useState<'all' | 'today' | 'upcoming' | 'completed' | 'cancelled'>('all');

  const { data: visits, isLoading, refetch } = useQuery({
    queryKey: ['site-visits-list', period],
    queryFn: () => api.getSiteVisits({ period }),
  });

  const handleComplete = async (id: string) => {
    try {
      await api.updateSiteVisit(id, { status: 'COMPLETED' });
      refetch();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6 pb-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-foreground tracking-tight flex items-center gap-2.5">
              <MapPin className="w-6 h-6 text-accent" />
              <span>Site Visits Management</span>
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Client property walkthroughs, sample flat visits, and site inspections
            </p>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center gap-2 border-b border-border pb-px overflow-x-auto">
          {[
            { id: 'all', label: 'All Visits' },
            { id: 'today', label: "Today's Scheduled" },
            { id: 'upcoming', label: 'Upcoming' },
            { id: 'completed', label: 'Completed' },
            { id: 'cancelled', label: 'Cancelled' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setPeriod(tab.id as any)}
              className={`px-4 py-2.5 text-xs font-semibold whitespace-nowrap border-b-2 transition-all ${
                period === tab.id
                  ? 'border-primary dark:border-accent text-primary dark:text-accent bg-primary/10 font-bold'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-secondary/50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="space-y-3 animate-pulse">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 rounded-2xl bg-card border border-border" />
            ))}
          </div>
        ) : visits && visits.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {visits.map((sv: any) => (
              <div
                key={sv.id}
                className="p-5 rounded-3xl bg-card border border-border luxury-card luxury-card-hover shadow-sm flex flex-col justify-between space-y-4 group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                        sv.status === 'COMPLETED'
                          ? 'bg-success/15 text-success border border-success/30'
                          : sv.status === 'SCHEDULED'
                          ? 'bg-warning/15 text-warning border border-warning/30'
                          : 'bg-urgent/15 text-urgent border border-urgent/30'
                      }`}
                    >
                      {sv.status}
                    </span>
                    <span className="text-xs font-mono font-semibold text-accent flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {formatRelativeDate(sv.scheduledAt)}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-sm text-foreground">{sv.property?.title}</h3>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-accent" />
                      <span>{sv.property?.location}</span>
                      <span>•</span>
                      <span className="font-mono text-foreground font-bold">{formatPrice(sv.property?.price)}</span>
                    </p>
                  </div>

                  <div className="p-3 rounded-2xl bg-secondary/50 border border-border space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <Link
                        href={`/leads/${sv.lead?.id}`}
                        className="font-bold text-primary dark:text-accent hover:underline flex items-center gap-1"
                      >
                        <span>Client: {sv.customer?.name}</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                      <span className="font-mono text-muted-foreground">{sv.customer?.phone}</span>
                    </div>
                    {sv.lead?.assignedUser && (
                      <div className="text-[11px] text-muted-foreground">
                        Sales Executive: <strong className="text-foreground">{sv.lead.assignedUser.name}</strong>
                      </div>
                    )}
                  </div>

                  {sv.notes && <p className="text-xs text-muted-foreground italic">{sv.notes}</p>}
                </div>

                {sv.status === 'SCHEDULED' && (
                  <div className="pt-2 border-t border-border flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5">
                      {sv.customer?.phone && (
                        <a
                          href={`tel:${sv.customer.phone}`}
                          className="px-2.5 py-1.5 rounded-xl bg-success/15 text-success text-xs font-semibold flex items-center gap-1 border border-success/30 active:scale-95"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>Call</span>
                        </a>
                      )}
                      {sv.customer?.phone && (
                        <a
                          href={`https://api.whatsapp.com/send?phone=91${sv.customer.phone.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1.5 rounded-xl bg-success/15 text-success text-xs font-semibold flex items-center gap-1 border border-success/30 active:scale-95"
                        >
                          <span>WhatsApp</span>
                        </a>
                      )}
                    </div>
                    <button
                      onClick={() => handleComplete(sv.id)}
                      className="px-3.5 py-1.5 rounded-xl bg-success hover:bg-success/90 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-sm active:scale-95"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Mark Completed</span>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center rounded-3xl bg-card border border-border luxury-card space-y-2">
            <MapPin className="w-10 h-10 text-accent mx-auto" />
            <p className="text-sm font-bold text-foreground">No site visits found</p>
            <p className="text-xs text-muted-foreground">Schedule site visits directly from any Lead workspace.</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
