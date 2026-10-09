'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Phone,
  MessageSquare,
  FileText,
  Calendar,
  MapPin,
  Building,
  CheckCircle2,
  Clock,
  Sparkles,
  ChevronRight,
  User,
  ArrowLeft,
  BadgePercent,
  Share2,
} from 'lucide-react';
import { AppLayout } from '../../../components/layout/AppLayout';
import { AddNoteModal } from '../../../components/modals/AddNoteModal';
import { ScheduleFollowUpModal } from '../../../components/modals/ScheduleFollowUpModal';
import { ScheduleSiteVisitModal } from '../../../components/modals/ScheduleSiteVisitModal';
import { CreateBookingModal } from '../../../components/modals/CreateBookingModal';
import { api } from '../../../lib/api';
import { LeadStatus, LeadPriority } from '../../../types';
import { formatBudgetRange, formatPrice, formatRelativeDate, formatDateOnly } from '../../../lib/utils';
import Link from 'next/link';

export default function LeadDetailPage() {
  const params = useParams();
  const leadId = params.id as string;
  const router = useRouter();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'overview' | 'matched_properties' | 'timeline' | 'calls' | 'notes' | 'followups' | 'site_visits'>('overview');

  // Modals
  const [addNoteOpen, setAddNoteOpen] = useState(false);
  const [followUpOpen, setFollowUpOpen] = useState(false);
  const [siteVisitOpen, setSiteVisitOpen] = useState(false);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | undefined>();

  const { data: lead, isLoading, error, refetch } = useQuery({
    queryKey: ['lead-detail', leadId],
    queryFn: () => api.getLead(leadId),
  });

  const handleStatusChange = async (newStatus: LeadStatus) => {
    try {
      await api.updateLead(leadId, { status: newStatus });
      refetch();
    } catch (err) {
      console.error(err);
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-muted-foreground">Loading Lead Workspace...</p>
        </div>
      </AppLayout>
    );
  }

  if (error || !lead) {
    return (
      <AppLayout>
        <div className="p-8 text-center space-y-3">
          <p className="text-sm text-urgent font-bold">Lead not found</p>
          <button
            onClick={() => router.push('/leads')}
            className="px-4 py-2 bg-secondary rounded-xl text-xs font-semibold text-foreground"
          >
            Back to Leads
          </button>
        </div>
      </AppLayout>
    );
  }

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

  return (
    <AppLayout>
      <div className="space-y-6 pb-16">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Link href="/leads" className="hover:text-foreground flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>All Leads</span>
          </Link>
          <ChevronRight className="w-3 h-3 text-muted-foreground" />
          <span className="text-foreground font-semibold">{lead.customer?.name}</span>
        </div>

        {/* LEAD WORKSPACE HEADER */}
        <div className="p-6 rounded-3xl bg-card border border-border luxury-card shadow-sm space-y-5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-extrabold text-foreground tracking-tight">
                  {lead.customer?.name}
                </h1>
                <span className="font-mono text-xs text-muted-foreground bg-secondary border border-border px-2.5 py-1 rounded-lg">
                  {lead.customer?.phone}
                </span>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider badge-${lead.status.toLowerCase()}`}
                >
                  {lead.status.replace(/_/g, ' ')}
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-secondary text-foreground border border-border">
                  {lead.priority} Priority
                </span>
              </div>

              {/* Requirement Summary Pill */}
              {lead.requirement && (
                <div className="flex items-center gap-2 text-xs text-foreground flex-wrap">
                  <span className="font-bold text-primary dark:text-accent">
                    {lead.requirement.bhk || ''} {lead.requirement.propertyType}
                  </span>
                  <span>•</span>
                  <span className="text-muted-foreground flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-accent" />
                    {lead.requirement.preferredLocation}
                  </span>
                  <span>•</span>
                  <span className="text-foreground font-semibold font-mono">
                    {formatBudgetRange(lead.requirement.minBudget, lead.requirement.maxBudget)}
                  </span>
                  <span>•</span>
                  <span className="text-muted-foreground">{lead.requirement.purpose}</span>
                  {lead.requirement.possessionPreference && (
                    <>
                      <span>•</span>
                      <span className="text-success">{lead.requirement.possessionPreference}</span>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Quick Action Buttons */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:flex md:items-center gap-2">
              <a
                href={`tel:${lead.customer?.phone}`}
                className="px-3.5 py-2.5 rounded-xl bg-success hover:bg-success/90 text-white font-bold text-xs shadow flex items-center justify-center gap-1.5 transition-all"
              >
                <Phone className="w-4 h-4" />
                <span>Call Client</span>
              </a>

              <a
                href={`https://wa.me/91${lead.customer?.whatsappNumber || lead.customer?.phone}`}
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white font-bold text-xs shadow flex items-center justify-center gap-1.5 transition-all"
              >
                <MessageSquare className="w-4 h-4" />
                <span>WhatsApp</span>
              </a>

              <button
                onClick={() => setAddNoteOpen(true)}
                className="px-3.5 py-2.5 rounded-xl bg-secondary hover:bg-secondary/80 border border-border text-foreground font-semibold text-xs flex items-center justify-center gap-1.5 transition-all"
              >
                <FileText className="w-4 h-4 text-accent" />
                <span>Add Note</span>
              </button>

              <button
                onClick={() => setFollowUpOpen(true)}
                className="px-3.5 py-2.5 rounded-xl bg-secondary hover:bg-secondary/80 border border-border text-foreground font-semibold text-xs flex items-center justify-center gap-1.5 transition-all"
              >
                <Calendar className="w-4 h-4 text-warning" />
                <span>Follow-up</span>
              </button>

              <button
                onClick={() => {
                  setSelectedPropertyId(undefined);
                  setSiteVisitOpen(true);
                }}
                className="px-3.5 py-2.5 rounded-xl bg-secondary hover:bg-secondary/80 border border-border text-foreground font-semibold text-xs flex items-center justify-center gap-1.5 transition-all"
              >
                <MapPin className="w-4 h-4 text-accent" />
                <span>Site Visit</span>
              </button>

              <button
                onClick={() => {
                  setSelectedPropertyId(undefined);
                  setBookingOpen(true);
                }}
                className="px-3.5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs shadow flex items-center justify-center gap-1.5 transition-all col-span-2 sm:col-span-1"
              >
                <BadgePercent className="w-4 h-4" />
                <span>Book Deal</span>
              </button>
            </div>
          </div>

          {/* Pipeline Stage Quick Changer */}
          <div className="pt-3 border-t border-border">
            <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
              Move Pipeline Stage:
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {statuses.map((st) => (
                <button
                  key={st}
                  onClick={() => handleStatusChange(st)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    lead.status === st
                      ? 'bg-primary text-primary-foreground shadow-sm font-bold'
                      : 'bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground border border-border'
                  }`}
                >
                  {st.replace(/_/g, ' ')}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-border overflow-x-auto pb-px">
          {[
            { id: 'overview', label: 'Overview & Requirements' },
            { id: 'matched_properties', label: `Matched Properties (${lead.matchedProperties?.length || 0})` },
            { id: 'timeline', label: `Activity Timeline (${lead.timeline?.length || 0})` },
            { id: 'calls', label: `Call History (${lead.callLogs?.length || 0})` },
            { id: 'notes', label: `Notes (${lead.notes?.length || 0})` },
            { id: 'followups', label: `Follow-ups (${lead.followUps?.length || 0})` },
            { id: 'site_visits', label: `Site Visits (${lead.siteVisits?.length || 0})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2.5 text-xs font-semibold whitespace-nowrap border-b-2 transition-all ${
                activeTab === tab.id
                  ? 'border-primary dark:border-accent text-primary dark:text-accent bg-primary/10 font-bold'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-secondary/50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB 1: Overview & Requirement */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Requirement Details */}
            <div className="lg:col-span-2 p-6 rounded-3xl bg-card border border-border luxury-card shadow-sm space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Building className="w-4 h-4 text-primary dark:text-accent" />
                  <span>Property Requirement Profile</span>
                </h3>
                <span className="text-[11px] text-muted-foreground">Captured in digital repository</span>
              </div>

              {lead.requirement ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                  <div className="p-3.5 rounded-2xl bg-secondary/50 border border-border">
                    <span className="text-muted-foreground text-[10px] uppercase font-bold">Property Type</span>
                    <p className="text-sm font-bold text-foreground mt-1">{lead.requirement.propertyType}</p>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-secondary/50 border border-border">
                    <span className="text-muted-foreground text-[10px] uppercase font-bold">Configuration / BHK</span>
                    <p className="text-sm font-bold text-foreground mt-1">{lead.requirement.bhk || 'Not specified'}</p>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-secondary/50 border border-border">
                    <span className="text-muted-foreground text-[10px] uppercase font-bold">Location</span>
                    <p className="text-sm font-bold text-primary dark:text-accent mt-1">{lead.requirement.preferredLocation}</p>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-secondary/50 border border-border">
                    <span className="text-muted-foreground text-[10px] uppercase font-bold">Budget Range</span>
                    <p className="text-sm font-bold text-foreground mt-1 font-mono">
                      {formatBudgetRange(lead.requirement.minBudget, lead.requirement.maxBudget)}
                    </p>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-secondary/50 border border-border">
                    <span className="text-muted-foreground text-[10px] uppercase font-bold">Purpose</span>
                    <p className="text-sm font-bold text-foreground mt-1">{lead.requirement.purpose}</p>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-secondary/50 border border-border">
                    <span className="text-muted-foreground text-[10px] uppercase font-bold">Possession</span>
                    <p className="text-sm font-bold text-success mt-1">
                      {lead.requirement.possessionPreference || 'Any'}
                    </p>
                  </div>
                  {lead.requirement.furnishingPreference && (
                    <div className="p-3.5 rounded-2xl bg-secondary/50 border border-border">
                      <span className="text-muted-foreground text-[10px] uppercase font-bold">Furnishing</span>
                      <p className="text-sm font-bold text-foreground mt-1">{lead.requirement.furnishingPreference}</p>
                    </div>
                  )}
                  {lead.requirement.notes && (
                    <div className="col-span-2 sm:col-span-3 p-3.5 rounded-2xl bg-secondary/50 border border-border">
                      <span className="text-muted-foreground text-[10px] uppercase font-bold">Requirement Notes</span>
                      <p className="text-xs text-foreground mt-1 leading-relaxed">{lead.requirement.notes}</p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">No requirement recorded yet.</p>
              )}
            </div>

            {/* Customer & Lead Meta Card */}
            <div className="p-6 rounded-3xl bg-card border border-border luxury-card shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <User className="w-4 h-4 text-success" />
                <span>Customer Profile</span>
              </h3>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-1.5 border-b border-border">
                  <span className="text-muted-foreground">Full Name</span>
                  <Link
                    href={`/customers/${lead.customer?.id}`}
                    className="text-primary dark:text-accent hover:underline font-bold"
                  >
                    {lead.customer?.name}
                  </Link>
                </div>
                <div className="flex justify-between py-1.5 border-b border-border">
                  <span className="text-muted-foreground">Mobile Phone</span>
                  <span className="font-mono text-foreground font-bold">{lead.customer?.phone}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-border">
                  <span className="text-muted-foreground">WhatsApp</span>
                  <span className="font-mono text-success">{lead.customer?.whatsappNumber || lead.customer?.phone}</span>
                </div>
                {lead.customer?.email && (
                  <div className="flex justify-between py-1.5 border-b border-border">
                    <span className="text-muted-foreground">Email</span>
                    <span className="text-foreground">{lead.customer.email}</span>
                  </div>
                )}
                <div className="flex justify-between py-1.5 border-b border-border">
                  <span className="text-muted-foreground">Lead Source</span>
                  <span className="text-foreground font-semibold">{lead.source}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-border">
                  <span className="text-muted-foreground">Assigned To</span>
                  <span className="text-foreground font-semibold">{lead.assignedUser?.name || 'Unassigned'}</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-muted-foreground">Added On</span>
                  <span className="text-muted-foreground">{formatDateOnly(lead.createdAt)}</span>
                </div>
              </div>

              <div className="pt-2">
                <Link
                  href={`/customers/${lead.customer?.id}`}
                  className="w-full py-2 rounded-xl bg-secondary hover:bg-secondary/80 border border-border text-xs font-semibold text-foreground flex items-center justify-center gap-1.5 transition-colors"
                >
                  <span>Open Full Customer 360 Profile</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: DETERMINISTIC MATCHED PROPERTIES */}
        {activeTab === 'matched_properties' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-secondary border border-border flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-foreground">
                <Sparkles className="w-4 h-4 text-accent shrink-0" />
                <span>
                  <strong>Deterministic Property Engine:</strong> Scored against location ({lead.requirement?.preferredLocation}), BHK ({lead.requirement?.bhk}), and budget ({formatBudgetRange(lead.requirement?.minBudget, lead.requirement?.maxBudget)}).
                </span>
              </div>
            </div>

            {lead.matchedProperties && lead.matchedProperties.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {lead.matchedProperties.map((prop: any) => (
                  <div
                    key={prop.id}
                    className="rounded-2xl bg-card border border-border luxury-card overflow-hidden shadow-sm flex flex-col justify-between group hover:border-accent transition-all"
                  >
                    <div>
                      {/* Image header */}
                      <div className="h-44 w-full relative bg-secondary overflow-hidden">
                        <img
                          src={prop.images?.[0]?.imageUrl || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80'}
                          alt={prop.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        {/* Dark gradient overlay for adaptive contrast across all image brightness levels */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/40 pointer-events-none" />

                        {/* Match Score Badge */}
                        <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-black/75 backdrop-blur-md border border-amber-400/50 text-amber-300 font-extrabold text-xs shadow-md">
                          {prop.matchPercentage}% Match
                        </div>
                        <div className="absolute bottom-3 left-3 px-3 py-1.5 rounded-xl bg-black/65 backdrop-blur-md text-xs font-bold text-white flex items-center gap-1.5 border border-white/25 shadow-md">
                          <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0 drop-shadow" />
                          <span className="truncate drop-shadow tracking-wide capitalize">{prop.location}</span>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-4 space-y-3">
                        <div>
                          <h4 className="font-bold text-sm text-foreground line-clamp-1">{prop.title}</h4>
                          <div className="text-xs font-mono font-bold text-foreground mt-1">
                            {formatPrice(prop.price)} • {prop.area} sq.ft
                          </div>
                        </div>

                        {/* Match Factors Tags */}
                        <div className="space-y-1">
                          <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Match Factors:</div>
                          <div className="flex flex-wrap gap-1">
                            {prop.matchFactors?.map((f: string, i: number) => (
                              <span
                                key={i}
                                className="px-2 py-0.5 rounded-md bg-accent/10 text-accent text-[10px] font-medium border border-accent/20"
                              >
                                ✓ {f}
                              </span>
                            ))}
                          </div>
                        </div>

                        <p className="text-xs text-muted-foreground line-clamp-2">{prop.description}</p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="p-4 pt-2 border-t border-border flex items-center justify-between gap-2">
                      <a
                        href={`https://wa.me/91${lead.customer?.whatsappNumber || lead.customer?.phone}?text=${encodeURIComponent(
                          `Hi ${lead.customer?.name}, here is a matching property: ${prop.title} in ${prop.location} priced at ${formatPrice(prop.price)}.`,
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 py-1.5 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground text-xs font-semibold flex items-center justify-center gap-1 transition-colors border border-border"
                      >
                        <Share2 className="w-3.5 h-3.5 text-success" />
                        <span>Share on WA</span>
                      </a>
                      <button
                        onClick={() => {
                          setSelectedPropertyId(prop.id);
                          setSiteVisitOpen(true);
                        }}
                        className="flex-1 py-1.5 rounded-xl bg-accent/15 hover:bg-accent/25 text-accent text-xs font-semibold flex items-center justify-center gap-1 transition-colors border border-accent/30"
                      >
                        <MapPin className="w-3.5 h-3.5" />
                        <span>Book Visit</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center rounded-3xl bg-card border border-border luxury-card space-y-2">
                <Building className="w-10 h-10 text-muted-foreground mx-auto" />
                <p className="text-sm font-bold text-foreground">No properties matched this specific requirement.</p>
                <p className="text-xs text-muted-foreground">Try adjusting budget or location preferences.</p>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: DYNAMIC ACTIVITY TIMELINE */}
        {activeTab === 'timeline' && (
          <div className="p-6 rounded-3xl bg-card border border-border luxury-card shadow-sm space-y-6">
            <div>
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary dark:text-accent" />
                <span>Lead Interaction & Event History</span>
              </h3>
              <p className="text-xs text-muted-foreground">Chronological audit trail generated dynamically from database records</p>
            </div>

            <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-[2px] before:bg-border">
              {lead.timeline?.map((ev: any) => (
                <div key={ev.id} className="relative group">
                  <div className="absolute -left-[27px] top-0.5 w-4 h-4 rounded-full bg-card border-2 border-accent group-hover:scale-110 transition-transform" />
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-foreground">{ev.title}</span>
                      <span className="text-[10px] font-mono text-muted-foreground">
                        {formatRelativeDate(ev.timestamp)}
                      </span>
                    </div>
                    {ev.description && (
                      <p className="text-xs text-foreground bg-secondary/50 p-2.5 rounded-xl border border-border leading-relaxed">
                        {ev.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: Call History */}
        {activeTab === 'calls' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-foreground">Logged Phone Calls</h3>
                <p className="text-xs text-muted-foreground">Record of discussions with client</p>
              </div>
            </div>

            {lead.callLogs && lead.callLogs.length > 0 ? (
              <div className="space-y-3">
                {lead.callLogs.map((call: any) => (
                  <div
                    key={call.id}
                    className="p-4 rounded-2xl bg-card border border-border luxury-card shadow-sm flex items-start justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs font-bold px-2 py-0.5 rounded ${
                            call.direction === 'INCOMING'
                              ? 'bg-accent/15 text-accent border border-accent/25'
                              : 'bg-success/15 text-success border border-success/25'
                          }`}
                        >
                          {call.direction}
                        </span>
                        <span className="text-xs font-mono text-muted-foreground">{call.phoneNumber}</span>
                        <span className="text-xs text-muted-foreground">• {Math.floor(call.duration / 60)}m {call.duration % 60}s</span>
                      </div>
                      {call.notes && <p className="text-xs text-foreground mt-2">{call.notes}</p>}
                    </div>
                    <span className="text-[11px] font-mono text-muted-foreground shrink-0">
                      {formatRelativeDate(call.startedAt)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center rounded-2xl bg-card border border-border luxury-card text-xs text-muted-foreground">
                No phone calls logged for this lead yet.
              </div>
            )}
          </div>
        )}

        {/* TAB 5: Notes */}
        {activeTab === 'notes' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-foreground">Sales Notes</h3>
                <p className="text-xs text-muted-foreground">Internal notes & preferences recorded by team</p>
              </div>
              <button
                onClick={() => setAddNoteOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs flex items-center gap-1.5 shadow-md"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Add Note</span>
              </button>
            </div>

            {lead.notes && lead.notes.length > 0 ? (
              <div className="space-y-3">
                {lead.notes.map((n: any) => (
                  <div key={n.id} className="p-4 rounded-2xl bg-card border border-border luxury-card shadow-sm space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-primary dark:text-accent">{n.user?.name || 'Team Member'}</span>
                      <span className="text-[11px] font-mono text-muted-foreground">{formatRelativeDate(n.createdAt)}</span>
                    </div>
                    <p className="text-xs text-foreground leading-relaxed">{n.content}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center rounded-2xl bg-card border border-border luxury-card text-xs text-muted-foreground">
                No notes added for this lead yet.
              </div>
            )}
          </div>
        )}

        {/* TAB 6: Follow-ups */}
        {activeTab === 'followups' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-foreground">Scheduled Follow-ups</h3>
                <p className="text-xs text-muted-foreground">Action items to ensure timely client engagement</p>
              </div>
              <button
                onClick={() => setFollowUpOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs flex items-center gap-1.5 shadow-md"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>New Follow-up</span>
              </button>
            </div>

            {lead.followUps && lead.followUps.length > 0 ? (
              <div className="space-y-3">
                {lead.followUps.map((fu: any) => (
                  <div
                    key={fu.id}
                    className="p-4 rounded-2xl bg-card border border-border luxury-card shadow-sm flex items-start justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                            fu.status === 'COMPLETED'
                              ? 'bg-success/15 text-success border border-success/30'
                              : 'bg-warning/15 text-warning border border-warning/30'
                          }`}
                        >
                          {fu.status}
                        </span>
                        <span className="text-xs font-semibold text-foreground">{fu.type}</span>
                        <span className="text-xs font-mono text-accent">
                          {formatRelativeDate(fu.scheduledAt)}
                        </span>
                      </div>
                      {fu.notes && <p className="text-xs text-foreground mt-1">{fu.notes}</p>}
                    </div>

                    {fu.status === 'PENDING' && (
                      <button
                        onClick={async () => {
                          await api.updateFollowUp(fu.id, { status: 'COMPLETED' });
                          refetch();
                        }}
                        className="px-3 py-1.5 rounded-lg bg-success/15 hover:bg-success/25 text-success text-xs font-semibold shrink-0 flex items-center gap-1 transition-colors border border-success/30"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Mark Done</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center rounded-2xl bg-card border border-border luxury-card text-xs text-muted-foreground">
                No follow-ups recorded for this lead.
              </div>
            )}
          </div>
        )}

        {/* TAB 7: Site Visits */}
        {activeTab === 'site_visits' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-foreground">Site Visits & Property Walkthroughs</h3>
                <p className="text-xs text-muted-foreground">On-site inspections with client</p>
              </div>
              <button
                onClick={() => {
                  setSelectedPropertyId(undefined);
                  setSiteVisitOpen(true);
                }}
                className="px-3.5 py-2 rounded-xl bg-accent hover:bg-accent/90 text-accent-foreground font-semibold text-xs flex items-center gap-1.5 shadow-md"
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>Schedule Visit</span>
              </button>
            </div>

            {lead.siteVisits && lead.siteVisits.length > 0 ? (
              <div className="space-y-3">
                {lead.siteVisits.map((sv: any) => (
                  <div
                    key={sv.id}
                    className="p-4 rounded-2xl bg-card border border-border luxury-card shadow-sm flex items-start justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                            sv.status === 'COMPLETED'
                              ? 'bg-success/15 text-success border border-success/30'
                              : 'bg-warning/15 text-warning border border-warning/30'
                          }`}
                        >
                          {sv.status}
                        </span>
                        <span className="text-xs font-bold text-foreground">{sv.property?.title}</span>
                      </div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-accent" />
                        <span>{sv.property?.location}</span>
                        <span>•</span>
                        <span className="font-mono text-accent">{formatRelativeDate(sv.scheduledAt)}</span>
                      </p>
                      {sv.notes && <p className="text-xs text-foreground mt-1">{sv.notes}</p>}
                    </div>

                    {sv.status === 'SCHEDULED' && (
                      <button
                        onClick={async () => {
                          await api.updateSiteVisit(sv.id, { status: 'COMPLETED' });
                          refetch();
                        }}
                        className="px-3 py-1.5 rounded-lg bg-success/15 hover:bg-success/25 text-success text-xs font-semibold shrink-0 border border-success/30"
                      >
                        Complete Visit
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center rounded-2xl bg-card border border-border luxury-card text-xs text-muted-foreground">
                No site visits recorded yet.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Action Modals */}
      <AddNoteModal
        isOpen={addNoteOpen}
        onClose={() => setAddNoteOpen(false)}
        customerId={lead.customer?.id}
        leadId={lead.id}
        customerName={lead.customer?.name}
        onSuccess={() => refetch()}
      />

      <ScheduleFollowUpModal
        isOpen={followUpOpen}
        onClose={() => setFollowUpOpen(false)}
        leadId={lead.id}
        customerName={lead.customer?.name}
        onSuccess={() => refetch()}
      />

      <ScheduleSiteVisitModal
        isOpen={siteVisitOpen}
        onClose={() => setSiteVisitOpen(false)}
        leadId={lead.id}
        customerId={lead.customer?.id}
        customerName={lead.customer?.name}
        defaultPropertyId={selectedPropertyId}
        onSuccess={() => refetch()}
      />

      <CreateBookingModal
        isOpen={bookingOpen}
        onClose={() => setBookingOpen(false)}
        leadId={lead.id}
        customerId={lead.customer?.id}
        customerName={lead.customer?.name}
        defaultPropertyId={selectedPropertyId}
        onSuccess={() => refetch()}
      />
    </AppLayout>
  );
}
