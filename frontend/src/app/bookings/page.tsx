'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  BadgePercent,
  ExternalLink,
  Phone,
  MessageSquare,
} from 'lucide-react';
import { AppLayout } from '../../components/layout/AppLayout';
import { api } from '../../lib/api';
import { formatPrice, formatDateOnly } from '../../lib/utils';

export default function BookingsPage() {
  const { data: bookings, isLoading } = useQuery({
    queryKey: ['bookings-list'],
    queryFn: () => api.getBookings(),
  });

  const totalValue = bookings
    ? bookings.reduce((sum: number, b: any) => sum + (b.status === 'CONFIRMED' ? b.bookingAmount : 0), 0)
    : 0;

  return (
    <AppLayout>
      <div className="space-y-6 pb-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-foreground tracking-tight flex items-center gap-2.5">
              <BadgePercent className="w-6 h-6 text-success" />
              <span>Closed Deals & Bookings</span>
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Confirmed token advances and closed sales transactions
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-success/10 border border-success/30 flex items-center gap-3 shadow-sm">
            <div>
              <div className="text-[10px] uppercase font-bold text-success tracking-wider">
                Total Token Revenue
              </div>
              <div className="text-lg font-mono font-extrabold text-foreground">
                {formatPrice(totalValue)}
              </div>
            </div>
          </div>
        </div>

        {/* MOBILE VIEW (< md): Touch-Optimized Booking Cards */}
        <div className="block md:hidden space-y-3">
          {isLoading ? (
            [...Array(3)].map((_, i) => (
              <div
                key={i}
                className="p-4 rounded-2xl bg-card border border-border animate-pulse h-36"
              />
            ))
          ) : bookings && bookings.length > 0 ? (
            bookings.map((b: any) => {
              let rawPhone = b.customer?.whatsappNumber || b.customer?.phone || '';
              let cleanPhone = rawPhone.replace(/[^0-9]/g, '');
              if (cleanPhone.length === 10) cleanPhone = `91${cleanPhone}`;

              return (
                <div
                  key={b.id}
                  className="p-4 rounded-2xl bg-card border border-border luxury-card luxury-card-hover shadow-sm space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <Link
                        href={`/customers/${b.customer?.id}`}
                        className="font-bold text-sm text-foreground hover:text-primary dark:hover:text-accent flex items-center gap-1"
                      >
                        <span>{b.customer?.name}</span>
                        <ExternalLink className="w-3 h-3 text-muted-foreground" />
                      </Link>
                      <div className="text-xs font-mono text-muted-foreground mt-0.5">{b.customer?.phone}</div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground block">Token Paid</span>
                      <div className="font-mono font-extrabold text-success text-sm">
                        ₹{b.bookingAmount?.toLocaleString('en-IN')}
                      </div>
                    </div>
                  </div>

                  {/* Property & Booking Date Info */}
                  <div className="p-3 rounded-xl bg-secondary/50 border border-border space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-foreground">{b.property?.title}</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                          b.status === 'CONFIRMED'
                            ? 'bg-success/15 text-success border border-success/30'
                            : 'bg-warning/15 text-warning border border-warning/30'
                        }`}
                      >
                        {b.status}
                      </span>
                    </div>
                    <div className="text-[11px] text-muted-foreground flex items-center justify-between">
                      <span>{b.property?.location}</span>
                      <span className="text-foreground font-medium">{formatDateOnly(b.bookingDate)}</span>
                    </div>
                    {b.notes && <p className="text-[11px] text-muted-foreground italic pt-1 border-t border-border">{b.notes}</p>}
                  </div>

                  {/* Actions */}
                  <div className="pt-2 border-t border-border flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {b.customer?.phone && (
                        <a
                          href={`tel:${b.customer.phone}`}
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
                      href={`/leads/${b.leadId}`}
                      className="px-3.5 py-1.5 rounded-xl bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground font-semibold text-xs border border-primary/20 transition-colors"
                    >
                      Lead Workspace
                    </Link>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center text-muted-foreground bg-card rounded-2xl border border-border luxury-card">
              <p className="font-semibold text-foreground text-xs">No bookings recorded yet</p>
            </div>
          )}
        </div>

        {/* DESKTOP VIEW (>= md): Bookings Table */}
        <div className="hidden md:block overflow-x-auto rounded-3xl bg-card border border-border luxury-card shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="bg-secondary/60 border-b border-border text-muted-foreground uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3.5 px-4">Client</th>
                <th className="py-3.5 px-4">Booked Property</th>
                <th className="py-3.5 px-4">Token Amount</th>
                <th className="py-3.5 px-4">Booking Date</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Salesperson</th>
                <th className="py-3.5 px-4">Payment Notes</th>
                <th className="py-3.5 px-4 text-right">Lead</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                [...Array(4)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={8} className="py-5 px-4">
                      <div className="h-4 bg-secondary rounded" />
                    </td>
                  </tr>
                ))
              ) : bookings && bookings.length > 0 ? (
                bookings.map((b: any) => (
                  <tr key={b.id} className="hover:bg-secondary/40 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-foreground">
                      <Link href={`/customers/${b.customer?.id}`} className="hover:text-primary dark:hover:text-accent">
                        {b.customer?.name}
                      </Link>
                      <div className="text-[11px] font-mono text-muted-foreground">{b.customer?.phone}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-foreground">{b.property?.title}</span>
                      <div className="text-[10px] text-muted-foreground">{b.property?.location}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-extrabold text-success text-sm">
                      ₹{b.bookingAmount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4 text-muted-foreground">{formatDateOnly(b.bookingDate)}</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          b.status === 'CONFIRMED'
                            ? 'bg-success/15 text-success border border-success/30'
                            : 'bg-warning/15 text-warning border border-warning/30'
                        }`}
                      >
                        {b.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-foreground font-medium">
                      {b.lead?.assignedUser?.name || 'Admin'}
                    </td>
                    <td className="py-3.5 px-4 text-muted-foreground italic max-w-xs truncate">
                      {b.notes || '—'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href={`/leads/${b.leadId}`}
                        className="px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground font-semibold text-xs transition-colors inline-block"
                      >
                        Lead Workspace
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-muted-foreground">
                    <p className="font-semibold text-foreground">No bookings recorded yet</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Deals can be converted to bookings directly from the Lead Workspace.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  );
}
