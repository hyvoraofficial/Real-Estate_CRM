'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Settings,
  Building2,
  Users,
  Shield,
  Plus,
  CheckCircle2,
  Bell,
  Sun,
  Moon,
  Laptop,
} from 'lucide-react';
import { AppLayout } from '../../components/layout/AppLayout';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { useTheme } from '../../lib/theme';
import { cn } from '../../lib/utils';

export default function SettingsPage() {
  const { user, isAdmin } = useAuth();
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<'theme' | 'company' | 'team' | 'sources' | 'notifications'>('theme');

  // New User modal / form
  const [showAddUser, setShowAddUser] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('password123');
  const [role, setRole] = useState<'SALES_EXECUTIVE' | 'ADMIN'>('SALES_EXECUTIVE');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const { data: usersList, isLoading, refetch } = useQuery({
    queryKey: ['users-list'],
    queryFn: () => api.getUsers(),
  });

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.createUser({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        password,
        role,
      });
      setSuccessMsg('Sales Executive created successfully!');
      setName('');
      setEmail('');
      setPhone('');
      setShowAddUser(false);
      refetch();
    } catch (err: any) {
      alert(err.message || 'Failed to create user');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6 pb-16">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight flex items-center gap-2.5">
            <Settings className="w-6 h-6 text-primary dark:text-accent" />
            <span>CRM & Workspace Settings</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Visual appearance, portfolio management, and team access configuration
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-border pb-px overflow-x-auto">
          {[
            { id: 'theme', label: 'Appearance & Theme' },
            { id: 'company', label: 'Company Profile' },
            { id: 'team', label: `Sales Team Members (${usersList?.length || 0})` },
            { id: 'sources', label: 'Lead Sources & Types' },
            { id: 'notifications', label: 'Notification Settings' },
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

        {/* TAB 0: Appearance & Theme */}
        {activeTab === 'theme' && (
          <div className="max-w-3xl space-y-6">
            <div className="p-6 rounded-3xl bg-card border border-border luxury-card space-y-6">
              <div>
                <h3 className="text-base font-bold text-foreground">Visual Theme & Aesthetics</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Select your preferred luxury color palette. Changes are saved automatically and persist across browser reloads.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Light Mode Card */}
                <button
                  type="button"
                  onClick={() => setTheme('light')}
                  className={cn(
                    'p-5 rounded-2xl border text-left transition-all relative overflow-hidden group',
                    theme === 'light'
                      ? 'border-accent ring-2 ring-accent/30 bg-accent/5'
                      : 'border-border bg-card hover:border-accent/50',
                  )}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-9 h-9 rounded-xl bg-[#F7F5F0] border border-[#E8E4DB] flex items-center justify-center text-[#244638]">
                      <Sun className="w-5 h-5 text-[#B89A65]" />
                    </div>
                    {theme === 'light' && (
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-accent/15 text-accent border border-accent/30">
                        Active
                      </span>
                    )}
                  </div>
                  <h4 className="text-sm font-bold text-foreground">Ivory & Champagne</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Warm ivory background (#F7F5F0) with deep forest green brand (#244638) and champagne gold accents.
                  </p>
                  <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-border">
                    <span className="w-4 h-4 rounded-full bg-[#F7F5F0] border border-[#E8E4DB]" title="#F7F5F0" />
                    <span className="w-4 h-4 rounded-full bg-[#244638]" title="#244638" />
                    <span className="w-4 h-4 rounded-full bg-[#B89A65]" title="#B89A65" />
                    <span className="w-4 h-4 rounded-full bg-[#397653]" title="#397653" />
                  </div>
                </button>

                {/* Dark Mode Card */}
                <button
                  type="button"
                  onClick={() => setTheme('dark')}
                  className={cn(
                    'p-5 rounded-2xl border text-left transition-all relative overflow-hidden group',
                    theme === 'dark'
                      ? 'border-primary ring-2 ring-primary/30 bg-primary/10'
                      : 'border-border bg-card hover:border-primary/50',
                  )}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-9 h-9 rounded-xl bg-[#141714] border border-[#303830] flex items-center justify-center text-[#F3F0E8]">
                      <Moon className="w-5 h-5 text-[#426B54]" />
                    </div>
                    {theme === 'dark' && (
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/20 text-primary-foreground border border-primary/30">
                        Active
                      </span>
                    )}
                  </div>
                  <h4 className="text-sm font-bold text-foreground">Midnight Forest</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Deep charcoal forest (#141714) with emerald forest green (#426B54) and warm champagne gold accents.
                  </p>
                  <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-border">
                    <span className="w-4 h-4 rounded-full bg-[#141714] border border-[#303830]" title="#141714" />
                    <span className="w-4 h-4 rounded-full bg-[#426B54]" title="#426B54" />
                    <span className="w-4 h-4 rounded-full bg-[#C6A66B]" title="#C6A66B" />
                    <span className="w-4 h-4 rounded-full bg-[#78B58A]" title="#78B58A" />
                  </div>
                </button>

                {/* System Mode Card */}
                <button
                  type="button"
                  onClick={() => setTheme('system')}
                  className={cn(
                    'p-5 rounded-2xl border text-left transition-all relative overflow-hidden group',
                    theme === 'system'
                      ? 'border-accent ring-2 ring-accent/30 bg-accent/5'
                      : 'border-border bg-card hover:border-accent/50',
                  )}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center text-foreground">
                      <Laptop className="w-5 h-5 text-accent" />
                    </div>
                    {theme === 'system' && (
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-accent/15 text-accent border border-accent/30">
                        Active
                      </span>
                    )}
                  </div>
                  <h4 className="text-sm font-bold text-foreground">System Preference</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Automatically adapts to your device&apos;s OS daylight and dark mode schedule.
                  </p>
                  <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-border">
                    <span className="text-[11px] text-muted-foreground font-medium">
                      Currently resolved: <strong className="text-foreground capitalize">{resolvedTheme}</strong>
                    </span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 1: Company Profile */}
        {activeTab === 'company' && (
          <div className="max-w-2xl space-y-6">
            <div className="p-6 rounded-3xl bg-card border border-border luxury-card space-y-5">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shadow-md border border-accent/30">
                  <Building2 className="w-8 h-8 text-accent" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-foreground">HYVORA Real Estate</h3>
                  <p className="text-xs text-muted-foreground">Standalone Enterprise Installation</p>
                </div>
              </div>

              <div className="space-y-3 text-xs pt-2 border-t border-border">
                <div className="flex justify-between py-2 border-b border-border">
                  <span className="text-muted-foreground">Product Name</span>
                  <span className="font-bold text-foreground">HYVORA Real Estate CRM</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border">
                  <span className="text-muted-foreground">Architecture</span>
                  <span className="text-success font-semibold">Single Company (Zero Multi-tenant Overhead)</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border">
                  <span className="text-muted-foreground">Database Engine</span>
                  <span className="font-mono text-foreground">PostgreSQL (Prisma ORM)</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border">
                  <span className="text-muted-foreground">Daily Ingestion Capacity</span>
                  <span className="text-foreground font-semibold">50+ Calls & Leads / day</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-muted-foreground">Digital Repository Status</span>
                  <span className="text-success font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Synchronized & Active</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Sales Team Members */}
        {activeTab === 'team' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-foreground">Sales Executives & Team Members</h3>
                <p className="text-xs text-muted-foreground">Users authorized to manage leads and close deals</p>
              </div>

              {isAdmin && (
                <button
                  onClick={() => setShowAddUser(true)}
                  className="px-3.5 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs flex items-center gap-1.5 shadow-md"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Sales Executive</span>
                </button>
              )}
            </div>

            {/* Add User Modal */}
            {showAddUser && (
              <div className="p-6 rounded-3xl bg-card border border-border luxury-card space-y-4 animate-in fade-in duration-150">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-foreground">Create New Team Account</h4>
                  <button onClick={() => setShowAddUser(false)} className="text-muted-foreground hover:text-foreground text-xs">
                    Cancel
                  </button>
                </div>

                <form onSubmit={handleCreateUser} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ramesh Chandra"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-secondary/50 border border-border text-xs text-slate-900 placeholder:text-slate-500 focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1">Email Address</label>
                    <input
                      type="email"
                      required
                      placeholder="ramesh@hyvora.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-secondary/50 border border-border text-xs text-slate-900 placeholder:text-slate-500 focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1">Phone Number</label>
                    <input
                      type="tel"
                      placeholder="+91 9845011111"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-secondary/50 border border-border text-xs text-slate-900 placeholder:text-slate-500 focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1">Role</label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl bg-secondary/50 border border-border text-xs text-slate-900 font-medium focus:outline-none focus:border-primary"
                    >
                      <option value="SALES_EXECUTIVE">Sales Executive</option>
                      <option value="ADMIN">Administrator</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2 flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddUser(false)}
                      className="px-4 py-2 text-xs text-muted-foreground hover:text-foreground"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-5 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs shadow-md"
                    >
                      {submitting ? 'Creating...' : 'Create Account'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Users Table */}
            <div className="overflow-x-auto rounded-2xl bg-card border border-border luxury-card">
              <table className="w-full text-left text-xs">
                <thead className="bg-secondary/60 border-b border-border text-muted-foreground uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Name</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Assigned Leads</th>
                    <th className="py-3 px-4">Follow-ups</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {usersList?.map((u: any) => (
                    <tr key={u.id} className="hover:bg-secondary/40 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-foreground">{u.name}</td>
                      <td className="py-3.5 px-4 text-muted-foreground font-mono">{u.email}</td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-secondary text-foreground border border-border">
                          {u.role === 'ADMIN' ? 'Admin' : 'Sales Executive'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-foreground">{u._count?.assignedLeads || 0}</td>
                      <td className="py-3.5 px-4 font-mono text-foreground">{u._count?.assignedFollowUps || 0}</td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-success/15 text-success border border-success/30">
                          Active
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: Lead Sources & Types */}
        {activeTab === 'sources' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 rounded-3xl bg-card border border-border luxury-card space-y-4">
              <h3 className="text-sm font-bold text-foreground">Configured Lead Ingestion Sources</h3>
              <div className="space-y-2">
                {['Phone Call', 'WhatsApp Inquiry', 'Website Form', 'Instagram Ads', 'Facebook Ads', 'Referral / Colleague', 'Walk-in / Office Visit', 'Other'].map((s) => (
                  <div key={s} className="p-2.5 rounded-xl bg-secondary/50 border border-border text-xs text-foreground flex items-center justify-between">
                    <span>{s}</span>
                    <span className="text-[10px] text-success font-semibold">Enabled</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-card border border-border luxury-card space-y-4">
              <h3 className="text-sm font-bold text-foreground">Supported Property Categories</h3>
              <div className="space-y-2">
                {['Apartment / Flat', 'Independent Villa / Row House', 'Gated Community Plot', 'Commercial Retail / Shop', 'Commercial Office Space', 'Penthouse / Duplex'].map((p) => (
                  <div key={p} className="p-2.5 rounded-xl bg-secondary/50 border border-border text-xs text-foreground flex items-center justify-between">
                    <span>{p}</span>
                    <span className="text-[10px] text-accent font-semibold">Standard</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: Notification Settings */}
        {activeTab === 'notifications' && (
          <div className="max-w-2xl p-6 rounded-3xl bg-card border border-border luxury-card space-y-5">
            <div>
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Bell className="w-4 h-4 text-accent" />
                <span>Follow-up Reminders & Alerts</span>
              </h3>
              <p className="text-xs text-muted-foreground">Configured notification channels for the sales team</p>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-4 rounded-2xl bg-secondary/50 border border-border flex items-center justify-between">
                <div>
                  <div className="font-bold text-foreground">In-App Dashboard Alerts</div>
                  <div className="text-muted-foreground text-[11px]">Displays overdue and today follow-up alerts on top bar</div>
                </div>
                <span className="text-success font-bold">Enabled</span>
              </div>

              <div className="p-4 rounded-2xl bg-secondary/50 border border-border flex items-center justify-between">
                <div>
                  <div className="font-bold text-foreground">WhatsApp Business API Webhooks</div>
                  <div className="text-muted-foreground text-[11px]">Architecture ready for official Cloud API integration</div>
                </div>
                <span className="text-accent font-semibold">Ready</span>
              </div>

              <div className="p-4 rounded-2xl bg-secondary/50 border border-border flex items-center justify-between">
                <div>
                  <div className="font-bold text-foreground">Telephony Webhook Interface</div>
                  <div className="text-muted-foreground text-[11px]">Incoming caller identification endpoint active</div>
                </div>
                <span className="text-accent font-semibold">Ready</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
