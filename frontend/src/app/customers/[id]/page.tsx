'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  User,
  Phone,
  MessageSquare,
  Building,
  Clock,
  MapPin,
  ArrowLeft,
  ChevronRight,
  FileText,
} from 'lucide-react';
import { AppLayout } from '../../../components/layout/AppLayout';
import { AddNoteModal } from '../../../components/modals/AddNoteModal';
import { api } from '../../../lib/api';
import { formatBudgetRange, formatRelativeDate, formatDateOnly } from '../../../lib/utils';
import Link from 'next/link';

export default function CustomerProfilePage() {
  const params = useParams();
  const customerId = params.id as string;
  const router = useRouter();

  const [addNoteOpen, setAddNoteOpen] = useState(false);

  const { data: customer, isLoading, error, refetch } = useQuery({
    queryKey: ['customer-detail', customerId],
    queryFn: () => api.getCustomer(customerId),
  });

  if (isLoading) {
    return (
      <AppLayout>
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-muted-foreground">Loading Customer 360° Profile...</p>
        </div>
      </AppLayout>
    );
  }

  if (error || !customer) {
    return (
      <AppLayout>
        <div className="p-8 text-center space-y-3">
          <p className="text-sm text-urgent font-bold">Customer not found</p>
          <button
            onClick={() => router.push('/customers')}
            className="px-4 py-2 bg-secondary rounded-xl text-xs font-semibold text-foreground"
          >
            Back to Customer Directory
          </button>
        </div>
      </AppLayout>
    );
  }

  const latestLead = customer.leads?.[0] || null;

  return (
    <AppLayout>
      <div className="space-y-6 pb-16">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Link href="/customers" className="hover:text-foreground flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Customer Directory</span>
          </Link>
          <ChevronRight className="w-3 h-3 text-muted-foreground" />
          <span className="text-foreground font-semibold">{customer.name}</span>
        </div>

        {/* CUSTOMER 360 HEADER */}
        <div className="p-6 rounded-3xl bg-card border border-border luxury-card shadow-sm space-y-5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="w-12 h-12 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center font-extrabold text-lg shadow-md border border-accent/30">
                  {customer.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h1 className="text-2xl font-extrabold text-foreground tracking-tight">
                    {customer.name}
                  </h1>
                  <p className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                    <span>Source: {customer.source}</span>
                    <span>•</span>
                    <span>Client since {formatDateOnly(customer.createdAt)}</span>
                  </p>
                </div>
              </div>

              {/* Requirement Summary Pill */}
              {latestLead?.requirement && (
                <div className="p-3 rounded-2xl bg-secondary/50 border border-border flex items-center gap-2 text-xs text-foreground flex-wrap">
                  <span className="font-bold text-primary dark:text-accent">
                    {latestLead.requirement.bhk || ''} {latestLead.requirement.propertyType}
                  </span>
                  <span>•</span>
                  <span className="text-muted-foreground flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-accent" />
                    {latestLead.requirement.preferredLocation}
                  </span>
                  <span>•</span>
                  <span className="text-foreground font-bold font-mono">
                    {formatBudgetRange(latestLead.requirement.minBudget, latestLead.requirement.maxBudget)}
                  </span>
                  <span>•</span>
                  <span className="text-muted-foreground">{latestLead.requirement.purpose}</span>
                  {latestLead.requirement.possessionPreference && (
                    <>
                      <span>•</span>
                      <span className="text-success font-medium">
                        {latestLead.requirement.possessionPreference}
                      </span>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2 flex-wrap">
              <a
                href={`tel:${customer.phone}`}
                className="px-3.5 py-2 rounded-xl bg-success hover:bg-success/90 text-white font-bold text-xs shadow flex items-center gap-1.5 transition-all"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Call Client</span>
              </a>

              <a
                href={`https://wa.me/91${customer.whatsappNumber || customer.phone}`}
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-2 rounded-xl bg-success hover:bg-success/90 text-white font-bold text-xs shadow flex items-center gap-1.5 transition-all"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
              </a>

              <button
                onClick={() => setAddNoteOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-secondary hover:bg-secondary/80 border border-border text-foreground font-semibold text-xs flex items-center gap-1.5 transition-all"
              >
                <FileText className="w-3.5 h-3.5 text-accent" />
                <span>Add Note</span>
              </button>
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Column 1: Client Metadata & Leads */}
          <div className="space-y-6">
            {/* Contact Details Card */}
            <div className="p-6 rounded-3xl bg-card border border-border luxury-card shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <User className="w-4 h-4 text-primary dark:text-accent" />
                <span>Contact Details</span>
              </h3>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-1.5 border-b border-border">
                  <span className="text-muted-foreground">Primary Mobile</span>
                  <span className="font-mono text-foreground font-bold">{customer.phone}</span>
                </div>
                {customer.alternatePhone && (
                  <div className="flex justify-between py-1.5 border-b border-border">
                    <span className="text-muted-foreground">Alternate Phone</span>
                    <span className="font-mono text-foreground">{customer.alternatePhone}</span>
                  </div>
                )}
                <div className="flex justify-between py-1.5 border-b border-border">
                  <span className="text-muted-foreground">WhatsApp</span>
                  <span className="font-mono text-success">{customer.whatsappNumber || customer.phone}</span>
                </div>
                {customer.email && (
                  <div className="flex justify-between py-1.5 border-b border-border">
                    <span className="text-muted-foreground">Email</span>
                    <span className="text-foreground">{customer.email}</span>
                  </div>
                )}
                {customer.notes && (
                  <div className="pt-2">
                    <span className="text-muted-foreground text-[10px] uppercase font-bold">Client Background Note</span>
                    <p className="text-xs text-foreground mt-1 leading-relaxed bg-secondary/50 p-2.5 rounded-xl border border-border">
                      {customer.notes}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Inquiries / Leads under this customer */}
            <div className="p-6 rounded-3xl bg-card border border-border luxury-card shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Building className="w-4 h-4 text-primary dark:text-accent" />
                  <span>Leads ({customer.leads?.length || 0})</span>
                </h3>
              </div>

              <div className="space-y-3">
                {customer.leads?.map((l: any) => (
                  <Link
                    key={l.id}
                    href={`/leads/${l.id}`}
                    className="p-3.5 rounded-2xl bg-secondary/50 hover:bg-secondary border border-border hover:border-accent block transition-all group"
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded badge-${l.status.toLowerCase()}`}
                      >
                        {l.status.replace(/_/g, ' ')}
                      </span>
                      <span className="text-[10px] font-mono text-muted-foreground">
                        {formatDateOnly(l.createdAt)}
                      </span>
                    </div>

                    {l.requirement && (
                      <div className="mt-2 text-xs">
                        <div className="font-semibold text-foreground group-hover:text-primary dark:group-hover:text-accent transition-colors">
                          {l.requirement.bhk || ''} {l.requirement.propertyType} in {l.requirement.preferredLocation}
                        </div>
                        <div className="text-foreground font-mono font-medium mt-0.5">
                          {formatBudgetRange(l.requirement.minBudget, l.requirement.maxBudget)}
                        </div>
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Column 2 & 3: CHRONOLOGICAL INTERACTION TIMELINE */}
          <div className="lg:col-span-2 p-6 rounded-3xl bg-card border border-border luxury-card shadow-sm space-y-6">
            <div>
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary dark:text-accent" />
                <span>Interaction Timeline & Digital Memory Audit</span>
              </h3>
              <p className="text-xs text-muted-foreground">
                Complete history of all incoming/outgoing phone calls, recorded requirements, notes, and site visits
              </p>
            </div>

            <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-[2px] before:bg-border">
              {customer.timeline && customer.timeline.length > 0 ? (
                customer.timeline.map((ev: any) => (
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
                ))
              ) : (
                <div className="py-8 text-center text-xs text-muted-foreground">
                  No interaction records found.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <AddNoteModal
        isOpen={addNoteOpen}
        onClose={() => setAddNoteOpen(false)}
        customerId={customer.id}
        customerName={customer.name}
        onSuccess={() => refetch()}
      />
    </AppLayout>
  );
}
