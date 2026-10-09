'use client';

import React, { useState } from 'react';
import { Building2, Sparkles, ArrowRight, Lock, Mail, Shield, User } from 'lucide-react';
import { useAuth } from '../../lib/auth';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('admin@hyvora.com');
  const [password, setPassword] = useState('password123');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickLogin = async (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('password123');
    setSubmitting(true);
    setError(null);
    try {
      await login(demoEmail, 'password123');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-center items-center p-4 relative overflow-hidden transition-colors">
      {/* Subtle luxury ambient glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[300px] h-[300px] bg-accent/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary text-primary-foreground shadow-xl border border-accent/30 mb-2">
            <Building2 className="w-7 h-7 text-accent" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground flex items-center justify-center gap-2">
            <span>HYVORA Real Estate CRM</span>
          </h1>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            The Luxury Portfolio Management and Follow-Up Workspace for Real Estate Professionals.
          </p>
        </div>

        {/* Login Card */}
        <div className="p-7 rounded-3xl bg-card border border-border luxury-card shadow-2xl backdrop-blur-xl space-y-5">
          {error && (
            <div className="p-3 rounded-xl bg-urgent/15 border border-urgent/30 text-urgent text-xs font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">Business Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-muted-foreground absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@hyvora.com"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-secondary/50 border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-muted-foreground absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-secondary/50 border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {submitting ? (
                <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In to CRM</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick 1-Click Demo Accounts */}
          <div className="pt-4 border-t border-border space-y-2.5">
            <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground text-center flex items-center justify-center gap-1.5">
              <Sparkles className="w-3 h-3 text-accent" />
              <span>Instant Demo Accounts</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin@hyvora.com')}
                className="p-2.5 rounded-xl bg-secondary hover:bg-secondary/80 border border-border hover:border-accent text-left transition-all group"
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-foreground group-hover:text-accent">
                  <Shield className="w-3.5 h-3.5 text-accent" />
                  <span>Rajesh Sharma</span>
                </div>
                <div className="text-[10px] text-muted-foreground">Admin Role</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('vikram@hyvora.com')}
                className="p-2.5 rounded-xl bg-secondary hover:bg-secondary/80 border border-border hover:border-accent text-left transition-all group"
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-foreground group-hover:text-accent">
                  <User className="w-3.5 h-3.5 text-muted-foreground group-hover:text-accent" />
                  <span>Vikram Reddy</span>
                </div>
                <div className="text-[10px] text-muted-foreground">Sales Executive</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('sneha@hyvora.com')}
                className="p-2.5 rounded-xl bg-secondary hover:bg-secondary/80 border border-border hover:border-accent text-left transition-all group sm:col-span-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-foreground group-hover:text-accent">
                    <User className="w-3.5 h-3.5 text-muted-foreground group-hover:text-accent" />
                    <span>Sneha Patil</span>
                  </div>
                  <div className="text-[10px] text-muted-foreground">Sales Executive</div>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground">
          Built with precision by <strong>HYVORA</strong> for Luxury Real Estate.
        </p>
      </div>
    </div>
  );
}
