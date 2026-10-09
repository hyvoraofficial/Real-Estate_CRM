'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Users,
  PhoneCall,
  CalendarCheck,
  AlertTriangle,
  MapPin,
  BadgePercent,
  TrendingUp,
  Clock,
  ArrowUpRight,
  Plus,
  MessageSquare,
  Building,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { AppLayout } from '../../components/layout/AppLayout';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { useTheme } from '../../lib/theme';
import { formatBudgetRange, formatPrice, formatTimeOnly } from '../../lib/utils';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

export default function DashboardPage() {
  const { user } = useAuth();
  const { resolvedTheme } = useTheme();
  const queryClient = useQueryClient();
  const [filterByUser, setFilterByUser] = useState<string>('');

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['dashboard-stats', filterByUser],
    queryFn: () => api.getDashboardStats(filterByUser || undefined),
  });

  const handleCompleteFollowUp = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.updateFollowUp(id, { status: 'COMPLETED' });
      refetch();
    } catch (err) {
      console.error(err);
    }
  };

  // Luxury Editorial Chart Palette
  const CHART_COLORS = resolvedTheme === 'dark'
    ? ['#426B54', '#C6A66B', '#78B58A', '#E0B36B', '#397653', '#B89A65', '#A5ADA2', '#E18A7B']
    : ['#244638', '#B89A65', '#397653', '#C58B38', '#426B54', '#777970', '#8F7B54', '#BF6557'];

  return (
    <AppLayout>
      <div className="space-y-6 pb-12">
        {/* Top welcome & greeting */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">
              Good day, {user?.name || 'Partner'}
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Here is what your real estate portfolio and pipeline looks like today.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">View:</span>
            <button
              onClick={() => setFilterByUser('')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                filterByUser === ''
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-card border border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              Entire Company
            </button>
            {user?.id && (
              <button
                onClick={() => setFilterByUser(user.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  filterByUser === user.id
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-card border border-border text-muted-foreground hover:text-foreground'
                }`}
              >
                My Pipeline Only
              </button>
            )}
          </div>
        </div>

        {/* OVERDUE FOLLOW-UP WARNING BANNER */}
        {data?.overdueFollowUps && data.overdueFollowUps.length > 0 && (
          <div className="p-4 rounded-2xl bg-urgent/10 border border-urgent/30 text-urgent shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-urgent/20 text-urgent flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">
                  Action Required: {data.overdueFollowUps.length} Overdue Follow-up(s) Detected
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Clients are awaiting contact. Prompt follow-up prevents high-value deals from slipping away.
                </p>
              </div>
            </div>
            <Link
              href="/followups?period=overdue"
              className="px-4 py-2 rounded-xl bg-urgent text-white font-bold text-xs shrink-0 text-center shadow transition-all hover:bg-urgent/90"
            >
              Clear Overdue Follow-ups
            </Link>
          </div>
        )}

        {/* Real KPI Cards Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-24 rounded-2xl bg-card border border-border animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
            {/* KPI 1: Total Leads */}
            <div className="p-4 rounded-2xl bg-card border border-border luxury-card luxury-card-hover relative overflow-hidden group">
              <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold mb-1">
                <span>Total Leads</span>
                <Users className="w-4 h-4 text-primary dark:text-accent" />
              </div>
              <div className="text-2xl font-extrabold text-foreground tracking-tight">
                {data?.kpis?.totalLeads || 0}
              </div>
              <div className="mt-1 text-[11px] text-accent font-medium">
                +{data?.kpis?.newLeadsToday || 0} new today
              </div>
            </div>

            {/* KPI 2: Calls Logged */}
            <div className="p-4 rounded-2xl bg-card border border-border luxury-card luxury-card-hover relative overflow-hidden group">
              <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold mb-1">
                <span>Calls Logged</span>
                <PhoneCall className="w-4 h-4 text-success" />
              </div>
              <div className="text-2xl font-extrabold text-foreground tracking-tight">
                {data?.kpis?.callsToday || 0}
              </div>
              <div className="mt-1 text-[11px] text-success font-medium">
                Active digital memory
              </div>
            </div>

            {/* KPI 3: Follow-ups Today */}
            <div className="p-4 rounded-2xl bg-card border border-border luxury-card luxury-card-hover relative overflow-hidden group">
              <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold mb-1">
                <span>Follow-ups Today</span>
                <CalendarCheck className="w-4 h-4 text-warning" />
              </div>
              <div className="text-2xl font-extrabold text-foreground tracking-tight">
                {data?.kpis?.followUpsToday || 0}
              </div>
              <div className="mt-1 text-[11px] text-warning font-medium">
                {data?.kpis?.overdueFollowUps || 0} overdue
              </div>
            </div>

            {/* KPI 4: Site Visits Today */}
            <div className="p-4 rounded-2xl bg-card border border-border luxury-card luxury-card-hover relative overflow-hidden group">
              <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold mb-1">
                <span>Site Visits</span>
                <MapPin className="w-4 h-4 text-accent" />
              </div>
              <div className="text-2xl font-extrabold text-foreground tracking-tight">
                {data?.kpis?.siteVisitsToday || 0}
              </div>
              <div className="mt-1 text-[11px] text-muted-foreground font-medium">
                Scheduled for today
              </div>
            </div>

            {/* KPI 5: Bookings / Conversion */}
            <div className="p-4 rounded-2xl bg-card border border-border luxury-card luxury-card-hover relative overflow-hidden group col-span-2 sm:col-span-1">
              <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold mb-1">
                <span>Deals Closed</span>
                <BadgePercent className="w-4 h-4 text-success" />
              </div>
              <div className="text-2xl font-extrabold text-success tracking-tight">
                {data?.kpis?.bookingsCount || 0}
              </div>
              <div className="mt-1 text-[11px] text-muted-foreground font-medium truncate">
                {formatPrice(data?.kpis?.totalBookingValue || 0)}
              </div>
            </div>
          </div>
        )}

        {/* Charts Grid: Pipeline distribution + Lead Sources */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Lead Pipeline Bar Chart */}
          <div className="lg:col-span-2 p-5 sm:p-6 rounded-3xl bg-card border border-border luxury-card space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <span>Lead Pipeline Funnel</span>
                </h3>
                <p className="text-xs text-muted-foreground">Current distribution across 8 pipeline stages</p>
              </div>
              <Link
                href="/pipeline"
                className="text-xs font-semibold text-primary dark:text-accent hover:underline flex items-center gap-1"
              >
                <span>Open Kanban</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="h-64 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.charts?.pipeline || []} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <XAxis
                    dataKey="status"
                    stroke="var(--muted-foreground)"
                    fontSize={10}
                    tickFormatter={(val) => val.replace(/_/g, ' ').slice(0, 10)}
                    angle={-25}
                    textAnchor="end"
                  />
                  <YAxis stroke="var(--muted-foreground)" fontSize={11} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--card)',
                      borderColor: 'var(--border)',
                      borderRadius: '12px',
                      color: 'var(--foreground)',
                      fontSize: '12px',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                    }}
                    formatter={(value: any) => [`${value} Leads`, 'Count']}
                    labelFormatter={(label) => label.replace(/_/g, ' ')}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {(data?.charts?.pipeline || []).map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Lead Sources Donut Chart */}
          <div className="p-5 sm:p-6 rounded-3xl bg-card border border-border luxury-card space-y-4 flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-foreground">Lead Ingestion Sources</h3>
              <p className="text-xs text-muted-foreground">Origin channel of incoming inquiries</p>
            </div>

            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data?.charts?.sources || []}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="count"
                    nameKey="source"
                  >
                    {(data?.charts?.sources || []).map((entry: any, index: number) => (
                      <Cell key={`pie-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--card)',
                      borderColor: 'var(--border)',
                      borderRadius: '12px',
                      color: 'var(--foreground)',
                      fontSize: '12px',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-2 gap-1.5 text-xs">
              {(data?.charts?.sources || []).slice(0, 6).map((s: any, idx: number) => (
                <div key={s.source} className="flex items-center gap-1.5 truncate">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }} />
                  <span className="text-muted-foreground truncate">{s.source}</span>
                  <span className="text-foreground font-mono ml-auto font-medium">({s.count})</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Section: Today's Follow-ups */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                <span>Today’s Actionable Follow-ups</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-accent/15 text-accent border border-accent/25">
                  {data?.todayFollowUps?.length || 0} scheduled
                </span>
              </h2>
              <p className="text-xs text-muted-foreground">
                Your primary daily agenda: Call, message, and meet clients to drive conversions.
              </p>
            </div>
            <Link
              href="/followups"
              className="text-xs font-semibold text-primary dark:text-accent hover:underline flex items-center gap-1"
            >
              <span>View All Follow-ups</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {data?.todayFollowUps && data.todayFollowUps.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {data.todayFollowUps.map((fu: any) => (
                <div
                  key={fu.id}
                  className="p-4 rounded-2xl bg-card border border-border luxury-card luxury-card-hover flex flex-col justify-between space-y-3 group"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-accent flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {formatTimeOnly(fu.scheduledAt)}
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-secondary text-foreground border border-border">
                        {fu.type}
                      </span>
                    </div>

                    <div>
                      <Link
                        href={`/leads/${fu.lead?.id}`}
                        className="font-bold text-sm text-foreground hover:text-primary dark:hover:text-accent transition-colors flex items-center gap-1"
                      >
                        <span>{fu.lead?.customer?.name || 'Customer'}</span>
                        <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </Link>
                      <p className="text-xs font-mono text-muted-foreground">{fu.lead?.customer?.phone}</p>
                    </div>

                    {fu.lead?.requirement && (
                      <div className="text-xs text-foreground bg-secondary/50 p-2.5 rounded-xl border border-border">
                        <div className="font-semibold text-primary dark:text-accent">
                          {fu.lead.requirement.bhk || ''} {fu.lead.requirement.propertyType} • {fu.lead.requirement.preferredLocation}
                        </div>
                        <div className="text-[11px] text-muted-foreground mt-0.5 font-medium">
                          {formatBudgetRange(fu.lead.requirement.minBudget, fu.lead.requirement.maxBudget)}
                        </div>
                      </div>
                    )}

                    {fu.notes && <p className="text-xs text-muted-foreground italic line-clamp-2">{fu.notes}</p>}
                  </div>

                  {/* Actions */}
                  <div className="pt-2 border-t border-border flex items-center justify-between gap-2">
                    <a
                      href={`tel:${fu.lead?.customer?.phone}`}
                      className="px-2.5 py-1.5 rounded-lg bg-secondary hover:bg-secondary/80 text-foreground text-xs font-semibold flex items-center gap-1.5 transition-colors border border-border"
                    >
                      <PhoneCall className="w-3 h-3 text-success" />
                      <span>Call</span>
                    </a>
                    <a
                      href={`https://wa.me/91${fu.lead?.customer?.whatsappNumber || fu.lead?.customer?.phone}`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-2.5 py-1.5 rounded-lg bg-secondary hover:bg-secondary/80 text-foreground text-xs font-semibold flex items-center gap-1.5 transition-colors border border-border"
                    >
                      <MessageSquare className="w-3 h-3 text-success" />
                      <span>WhatsApp</span>
                    </a>
                    <button
                      onClick={(e) => handleCompleteFollowUp(fu.id, e)}
                      className="ml-auto px-2.5 py-1.5 rounded-lg bg-success/15 hover:bg-success/25 text-success border border-success/30 text-xs font-semibold flex items-center gap-1 transition-colors"
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Done</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 rounded-2xl bg-card border border-border luxury-card text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-success/10 text-success flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <p className="text-sm font-bold text-foreground">You are all caught up!</p>
              <p className="text-xs text-muted-foreground">No pending follow-ups scheduled for today.</p>
            </div>
          )}
        </div>

        {/* Section: Recent Ingested Leads */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-foreground">Recent Customer Inquiries</h2>
              <p className="text-xs text-muted-foreground">Latest leads stored in your digital repository</p>
            </div>
            <Link
              href="/leads"
              className="text-xs font-semibold text-primary dark:text-accent hover:underline flex items-center gap-1"
            >
              <span>View All Leads</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto rounded-2xl bg-card border border-border luxury-card">
            <table className="w-full text-left text-xs">
              <thead className="bg-secondary/60 border-b border-border text-muted-foreground uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Requirement</th>
                  <th className="py-3 px-4">Budget Range</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Pipeline Status</th>
                  <th className="py-3 px-4">Assigned To</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {(data?.recentLeads || []).map((lead: any) => (
                  <tr
                    key={lead.id}
                    className="hover:bg-secondary/40 transition-colors group cursor-pointer"
                  >
                    <td className="py-3.5 px-4">
                      <Link href={`/leads/${lead.id}`} className="font-bold text-foreground group-hover:text-primary dark:group-hover:text-accent">
                        {lead.customer?.name}
                      </Link>
                      <div className="text-[11px] font-mono text-muted-foreground">{lead.customer?.phone}</div>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-foreground">
                      {lead.requirement?.bhk || ''} {lead.requirement?.propertyType || 'Apartment'}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-medium text-foreground">
                      {formatBudgetRange(lead.requirement?.minBudget, lead.requirement?.maxBudget)}
                    </td>
                    <td className="py-3.5 px-4 text-muted-foreground">
                      {lead.requirement?.preferredLocation || '—'}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider badge-${lead.status.toLowerCase()}`}>
                        {lead.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-muted-foreground">
                      {lead.assignedUser?.name || 'Unassigned'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href={`/leads/${lead.id}`}
                        className="px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground font-semibold text-xs transition-colors inline-block"
                      >
                        Workspace
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
