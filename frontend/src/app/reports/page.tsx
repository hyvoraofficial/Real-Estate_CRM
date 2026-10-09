'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart3,
  TrendingUp,
  CalendarCheck,
  Building2,
  Award,
} from 'lucide-react';
import { AppLayout } from '../../components/layout/AppLayout';
import { api } from '../../lib/api';
import { formatPrice } from '../../lib/utils';
import { useTheme } from '../../lib/theme';
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
  Legend,
} from 'recharts';

export default function ReportsPage() {
  const { resolvedTheme } = useTheme();
  const { data, isLoading } = useQuery({
    queryKey: ['analytical-reports'],
    queryFn: () => api.getReports(),
  });

  const CHART_COLORS = resolvedTheme === 'dark'
    ? ['#426B54', '#C6A66B', '#78B58A', '#E0B36B', '#397653', '#B89A65', '#A5ADA2', '#E18A7B']
    : ['#244638', '#B89A65', '#397653', '#C58B38', '#426B54', '#777970', '#8F7B54', '#BF6557'];

  return (
    <AppLayout>
      <div className="space-y-8 pb-16">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight flex items-center gap-2.5">
            <BarChart3 className="w-6 h-6 text-primary dark:text-accent" />
            <span>Executive Business Reports</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Comprehensive sales performance, pipeline drop-off, lead source ROI, and property demand metrics
          </p>
        </div>

        {/* Top Summary KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
          <div className="p-4 rounded-2xl bg-card border border-border luxury-card">
            <span className="text-[10px] font-bold uppercase text-muted-foreground">Total Inquiries</span>
            <div className="text-2xl font-extrabold text-foreground mt-1">{data?.summary?.totalLeads || 0}</div>
          </div>
          <div className="p-4 rounded-2xl bg-card border border-border luxury-card">
            <span className="text-[10px] font-bold uppercase text-muted-foreground">Site Visits Done</span>
            <div className="text-2xl font-extrabold text-accent mt-1">{data?.summary?.totalSiteVisits || 0}</div>
          </div>
          <div className="p-4 rounded-2xl bg-card border border-border luxury-card">
            <span className="text-[10px] font-bold uppercase text-muted-foreground">Deals Closed</span>
            <div className="text-2xl font-extrabold text-success mt-1">{data?.summary?.totalBookings || 0}</div>
          </div>
          <div className="p-4 rounded-2xl bg-card border border-border luxury-card">
            <span className="text-[10px] font-bold uppercase text-muted-foreground">Lost Leads</span>
            <div className="text-2xl font-extrabold text-urgent mt-1">{data?.summary?.totalLost || 0}</div>
          </div>
          <div className="p-4 rounded-2xl bg-card border border-border luxury-card">
            <span className="text-[10px] font-bold uppercase text-muted-foreground">Conversion Rate</span>
            <div className="text-2xl font-extrabold text-primary dark:text-accent mt-1">{data?.summary?.conversionRate || '0%'}</div>
          </div>
          <div className="p-4 rounded-2xl bg-card border border-border luxury-card">
            <span className="text-[10px] font-bold uppercase text-muted-foreground">Token Volume</span>
            <div className="text-lg font-mono font-extrabold text-foreground mt-1 truncate">
              {formatPrice(data?.summary?.totalRevenue || 0)}
            </div>
          </div>
        </div>

        {/* Row 1: Pipeline Funnel + Follow-up Completion Health */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Funnel */}
          <div className="p-6 rounded-3xl bg-card border border-border luxury-card space-y-4">
            <div>
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary dark:text-accent" />
                <span>Sales Pipeline Funnel</span>
              </h3>
              <p className="text-xs text-muted-foreground">Conversion from initial inquiry to final deal booking</p>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.funnel || []} layout="vertical" margin={{ top: 10, right: 30, left: 40, bottom: 10 }}>
                  <XAxis type="number" stroke="var(--muted-foreground)" fontSize={11} allowDecimals={false} />
                  <YAxis type="category" dataKey="stage" stroke="var(--muted-foreground)" fontSize={11} width={130} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--card)',
                      borderColor: 'var(--border)',
                      borderRadius: '12px',
                      color: 'var(--foreground)',
                      fontSize: '12px',
                    }}
                    formatter={(val: any) => [`${val} Leads`, 'Count']}
                  />
                  <Bar dataKey="count" fill="var(--primary)" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Follow-up Completion Health */}
          <div className="p-6 rounded-3xl bg-card border border-border luxury-card space-y-4 flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <CalendarCheck className="w-4 h-4 text-success" />
                <span>Follow-up Health & Discipline</span>
              </h3>
              <p className="text-xs text-muted-foreground">Distribution of completed vs overdue action reminders</p>
            </div>

            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data?.followUpStats || []}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                    nameKey="name"
                  >
                    {(data?.followUpStats || []).map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--card)',
                      borderColor: 'var(--border)',
                      borderRadius: '12px',
                      color: 'var(--foreground)',
                      fontSize: '12px',
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Row 2: Salesperson Team Performance */}
        <div className="p-6 rounded-3xl bg-card border border-border luxury-card space-y-4">
          <div>
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Award className="w-4 h-4 text-accent" />
              <span>Sales Executive Performance Leaderboard</span>
            </h3>
            <p className="text-xs text-muted-foreground">Individual executive throughput, site visits conducted, and closed deals</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-secondary/60 border-b border-border text-muted-foreground uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Sales Executive</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Leads Assigned</th>
                  <th className="py-3 px-4">Follow-ups Completed</th>
                  <th className="py-3 px-4">Site Visits Done</th>
                  <th className="py-3 px-4">Deals Closed</th>
                  <th className="py-3 px-4">Token Value</th>
                  <th className="py-3 px-4 text-right">Conversion Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data?.salesPerformance?.map((sp: any) => (
                  <tr key={sp.id} className="hover:bg-secondary/40 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-foreground">{sp.name}</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-secondary text-muted-foreground border border-border">
                        {sp.role === 'ADMIN' ? 'Admin' : 'Sales Executive'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-foreground">{sp.leadsAssigned}</td>
                    <td className="py-3.5 px-4 font-mono text-success">{sp.followUpsCompleted}</td>
                    <td className="py-3.5 px-4 font-mono text-accent">{sp.siteVisitsCompleted}</td>
                    <td className="py-3.5 px-4 font-mono font-bold text-success">{sp.dealsClosed}</td>
                    <td className="py-3.5 px-4 font-mono font-bold text-foreground">
                      {formatPrice(sp.totalRevenue)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-primary dark:text-accent">
                      {sp.conversionRate}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Row 3: Top In-Demand Inventory */}
        <div className="p-6 rounded-3xl bg-card border border-border luxury-card space-y-4">
          <div>
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Building2 className="w-4 h-4 text-primary dark:text-accent" />
              <span>Property Demand & Inspection Analytics</span>
            </h3>
            <p className="text-xs text-muted-foreground">Most requested properties for site visits and bookings</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {data?.propertyStats?.map((ps: any) => (
              <div key={ps.id} className="p-4 rounded-2xl bg-secondary/50 border border-border space-y-2">
                <h4 className="font-bold text-xs text-foreground line-clamp-1">{ps.title}</h4>
                <div className="text-[11px] text-muted-foreground">{ps.location} • {formatPrice(ps.price)}</div>
                <div className="pt-2 border-t border-border flex items-center justify-between text-xs">
                  <span className="text-accent font-semibold">{ps.siteVisits} Site Visits</span>
                  <span className="text-success font-bold">{ps.bookings} Bookings</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
