'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CalendarCheck,
  Clock,
  Phone,
  MessageSquare,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { AppLayout } from '../../components/layout/AppLayout';
import { api } from '../../lib/api';
import { formatBudgetRange, formatRelativeDate } from '../../lib/utils';
import { useAuth } from '../../lib/auth';

export default function FollowUpsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [period, setPeriod] = useState<'today' | 'upcoming' | 'overdue' | 'completed' | 'all'>('today');
  const [filterUser, setFilterUser] = useState<string>('');

  const { data: followUps, isLoading, refetch } = useQuery({
    queryKey: ['followups-list', period, filterUser],
    queryFn: () =>
      api.getFollowUps({
        period,
        assignedUserId: filterUser || undefined,
      }),
  });

  const handleComplete = async (id: string) => {
    try {
      await api.updateFollowUp(id, { status: 'COMPLETED' });
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
              <CalendarCheck className="w-6 h-6 text-accent" />
              <span>Follow-ups & Action Agenda</span>
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Digital reminders preventing any customer inquiry from being forgotten
            </p>
          </div>

          <div className="flex items-center gap-2">
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
                My Agenda
              </button>
            )}
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center gap-2 border-b border-border pb-px overflow-x-auto">
          {[
            { id: 'today', label: "Today's Agenda" },
            { id: 'overdue', label: 'Overdue Warnings' },
            { id: 'upcoming', label: 'Upcoming' },
            { id: 'completed', label: 'Completed History' },
            { id: 'all', label: 'All Follow-ups' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setPeriod(tab.id as any)}
              className={`px-4 py-2.5 text-xs font-semibold whitespace-nowrap border-b-2 transition-all ${
                period === tab.id
                  ? tab.id === 'overdue'
                    ? 'border-urgent text-urgent bg-urgent/10 font-bold'
                    : 'border-primary dark:border-accent text-primary dark:text-accent bg-primary/10 font-bold'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-secondary/50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content List */}
        {isLoading ? (
          <div className="space-y-3 animate-pulse">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-28 rounded-2xl bg-card border border-border" />
            ))}
          </div>
        ) : followUps && followUps.length > 0 ? (
          <div className="space-y-3.5">
            {followUps.map((fu: any) => {
              const isOverdue = period === 'overdue' || (new Date(fu.scheduledAt) < new Date() && fu.status === 'PENDING');

              return (
                <div
                  key={fu.id}
                  className={`p-4 rounded-2xl bg-card border luxury-card luxury-card-hover shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${
                    isOverdue
                      ? 'border-urgent/40 bg-urgent/5'
                      : 'border-border hover:border-accent'
                  }`}
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                          fu.status === 'COMPLETED'
                            ? 'bg-success/15 text-success border border-success/30'
                            : isOverdue
                            ? 'bg-urgent/20 text-urgent border border-urgent/30'
                            : 'bg-warning/15 text-warning border border-warning/30'
                        }`}
                      >
                        {isOverdue && fu.status === 'PENDING' ? '⚠️ OVERDUE' : fu.status}
                      </span>
                      <span className="text-xs font-bold text-foreground uppercase tracking-wide bg-secondary px-2 py-0.5 rounded border border-border">
                        {fu.type}
                      </span>
                      <span className="text-xs font-mono font-semibold text-accent flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{formatRelativeDate(fu.scheduledAt)}</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-3 flex-wrap">
                      <Link
                        href={`/leads/${fu.lead?.id}`}
                        className="font-bold text-sm text-foreground hover:text-primary dark:hover:text-accent transition-colors flex items-center gap-1"
                      >
                        <span>{fu.lead?.customer?.name || 'Customer'}</span>
                        <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
                      </Link>
                      <span className="text-xs font-mono text-muted-foreground">{fu.lead?.customer?.phone}</span>
                      <span className="text-xs text-muted-foreground">• Assigned to: <strong className="text-foreground">{fu.assignedUser?.name || 'Unassigned'}</strong></span>
                    </div>

                    {fu.lead?.requirement && (
                      <div className="text-xs text-foreground flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-primary dark:text-accent">
                          {fu.lead.requirement.bhk || ''} {fu.lead.requirement.propertyType}
                        </span>
                        <span>•</span>
                        <span className="text-muted-foreground">{fu.lead.requirement.preferredLocation}</span>
                        <span>•</span>
                        <span className="text-foreground font-mono font-medium">
                          {formatBudgetRange(fu.lead.requirement.minBudget, fu.lead.requirement.maxBudget)}
                        </span>
                      </div>
                    )}

                    {fu.notes && <p className="text-xs text-muted-foreground italic">{fu.notes}</p>}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <a
                      href={`tel:${fu.lead?.customer?.phone}`}
                      className="px-3 py-2 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground font-semibold text-xs flex items-center gap-1.5 border border-border"
                    >
                      <Phone className="w-3.5 h-3.5 text-success" />
                      <span>Call</span>
                    </a>
                    <a
                      href={`https://wa.me/91${fu.lead?.customer?.whatsappNumber || fu.lead?.customer?.phone}`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-2 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground font-semibold text-xs flex items-center gap-1.5 border border-border"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-success" />
                      <span>WhatsApp</span>
                    </a>
                    {fu.status === 'PENDING' && (
                      <button
                        onClick={() => handleComplete(fu.id)}
                        className="px-3.5 py-2 rounded-xl bg-success hover:bg-success/90 text-white font-bold text-xs shadow flex items-center gap-1.5 transition-all"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Complete</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-12 text-center rounded-3xl bg-card border border-border luxury-card space-y-2">
            <CheckCircle2 className="w-10 h-10 text-success mx-auto" />
            <p className="text-sm font-bold text-foreground">All clear!</p>
            <p className="text-xs text-muted-foreground">No follow-ups found under this view.</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
