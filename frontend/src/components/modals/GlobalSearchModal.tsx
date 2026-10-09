'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  X,
  User,
  Phone,
  Building2,
  Calendar,
  ArrowRight,
  Sparkles,
  MapPin,
  Clock,
} from 'lucide-react';
import { api } from '../../lib/api';
import { formatBudgetRange, formatPrice, formatRelativeDate } from '../../lib/utils';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GlobalSearchModal({ isOpen, onClose }: GlobalSearchModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ customers: any[]; leads: any[]; properties: any[] }>({
    customers: [],
    leads: [],
    properties: [],
  });
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setResults({ customers: [], leads: [], properties: [] });
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults({ customers: [], leads: [], properties: [] });
      setLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await api.globalSearch(query);
        setResults(data);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  const totalResults =
    results.customers.length + results.leads.length + results.properties.length;

  const handleSelectCustomer = (id: string) => {
    onClose();
    router.push(`/customers/${id}`);
  };

  const handleSelectLead = (id: string) => {
    onClose();
    router.push(`/leads/${id}`);
  };

  const handleSelectProperty = (id: string) => {
    onClose();
    router.push(`/properties?id=${id}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-3 sm:pt-20 p-3 sm:p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-150">
      <div
        className="w-full max-w-2xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-border bg-card/60 gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search phone number (e.g. 9876500001), name, location, property..."
              className="w-full pl-10 pr-9 py-2 rounded-xl bg-white border border-border text-sm text-slate-900 placeholder:text-slate-500 focus:outline-none focus:border-primary"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-2.5 top-2.5 p-1 rounded-md text-slate-500 hover:text-slate-900"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <kbd className="hidden sm:inline-block text-[11px] font-mono px-2 py-0.5 rounded bg-secondary text-muted-foreground border border-border">
            ESC
          </kbd>
        </div>

        {/* Results Area */}
        <div className="overflow-y-auto flex-1 p-4 space-y-4">
          {loading && (
            <div className="py-8 text-center text-muted-foreground text-xs flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span>Searching database records...</span>
            </div>
          )}

          {!loading && query && totalResults === 0 && (
            <div className="py-12 text-center">
              <div className="w-10 h-10 rounded-full bg-secondary mx-auto flex items-center justify-center text-muted-foreground mb-2">
                <Search className="w-5 h-5" />
              </div>
              <p className="text-sm font-medium text-foreground">No matching records found</p>
              <p className="text-xs text-muted-foreground mt-1">
                Try searching by a 10-digit mobile number, client name, or area name.
              </p>
            </div>
          )}

          {!query && (
            <div className="py-8 text-center text-xs text-muted-foreground">
              <p className="font-semibold text-foreground mb-1">Instant Digital Memory Lookup</p>
              <p>Type a phone number like <span className="text-accent font-mono">9876500001</span> to instantly recall client requirements and follow-ups.</p>
            </div>
          )}

          {/* Customer Matches */}
          {results.customers.length > 0 && (
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-accent mb-2 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" />
                <span>Customers ({results.customers.length})</span>
              </div>
              <div className="space-y-2">
                {results.customers.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => handleSelectCustomer(c.id)}
                    className="p-3 rounded-xl bg-secondary/40 hover:bg-secondary border border-border hover:border-accent/40 cursor-pointer transition-all flex items-start justify-between group"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-foreground group-hover:text-accent transition-colors">
                          {c.name}
                        </span>
                        <span className="text-xs font-mono text-muted-foreground bg-secondary px-2 py-0.5 rounded border border-border">
                          {c.phone}
                        </span>
                      </div>

                      {c.latestLead?.requirement && (
                        <div className="mt-1.5 text-xs text-foreground/80 flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-primary">
                            {c.latestLead.requirement.bhk || ''} {c.latestLead.requirement.propertyType}
                          </span>
                          <span>•</span>
                          <span className="text-muted-foreground flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {c.latestLead.requirement.preferredLocation}
                          </span>
                          <span>•</span>
                          <span className="text-accent font-medium">
                            {formatBudgetRange(
                              c.latestLead.requirement.minBudget,
                              c.latestLead.requirement.maxBudget,
                            )}
                          </span>
                        </div>
                      )}

                      {c.latestLead?.nextFollowUp && (
                        <div className="mt-1 text-[11px] text-accent flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>
                            Next Follow-up: {formatRelativeDate(c.latestLead.nextFollowUp.scheduledAt)}
                          </span>
                        </div>
                      )}
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-accent group-hover:translate-x-1 transition-all mt-1" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Lead Matches */}
          {results.leads.length > 0 && (
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-primary mb-2 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Leads ({results.leads.length})</span>
              </div>
              <div className="space-y-2">
                {results.leads.map((l) => (
                  <div
                    key={l.id}
                    onClick={() => handleSelectLead(l.id)}
                    className="p-3 rounded-xl bg-secondary/40 hover:bg-secondary border border-border hover:border-primary/40 cursor-pointer transition-all flex items-start justify-between group"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">
                          {l.customer.name}
                        </span>
                        <span className="text-xs font-mono text-muted-foreground">({l.customer.phone})</span>
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                          {l.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                      {l.requirement && (
                        <div className="mt-1 text-xs text-foreground/80">
                          {l.requirement.bhk || ''} {l.requirement.propertyType} in {l.requirement.preferredLocation} •{' '}
                          {formatBudgetRange(l.requirement.minBudget, l.requirement.maxBudget)}
                        </div>
                      )}
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all mt-1" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Property Matches */}
          {results.properties.length > 0 && (
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-accent mb-2 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5" />
                <span>Properties ({results.properties.length})</span>
              </div>
              <div className="space-y-2">
                {results.properties.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => handleSelectProperty(p.id)}
                    className="p-3 rounded-xl bg-secondary/40 hover:bg-secondary border border-border hover:border-accent/40 cursor-pointer transition-all flex items-start justify-between group"
                  >
                    <div>
                      <div className="font-semibold text-sm text-foreground group-hover:text-accent transition-colors">
                        {p.title}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                        <span>{p.location}</span>
                        <span>•</span>
                        <span className="font-semibold text-primary">{formatPrice(p.price)}</span>
                        <span>•</span>
                        <span>{p.bhk || p.propertyType}</span>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-accent group-hover:translate-x-1 transition-all mt-1" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-secondary/50 border-t border-border flex items-center justify-between text-[11px] text-muted-foreground">
          <span>Press <strong>ESC</strong> to close</span>
          <span className="font-semibold text-foreground/80">HYVORA Real Estate CRM</span>
        </div>
      </div>
    </div>
  );
}
