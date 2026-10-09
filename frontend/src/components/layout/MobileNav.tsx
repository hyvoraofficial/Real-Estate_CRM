'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Building2,
  CalendarCheck,
  Plus,
  UserPlus,
  Search,
  X,
  Sparkles,
  Mic,
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface MobileNavProps {
  onOpenQuickAdd: () => void;
  onOpenSearch: () => void;
  onOpenAiAssistant?: () => void;
}

export function MobileNav({
  onOpenQuickAdd,
  onOpenSearch,
  onOpenAiAssistant,
}: MobileNavProps) {
  const pathname = usePathname();
  const [actionSheetOpen, setActionSheetOpen] = useState(false);

  return (
    <>
      {/* Action Sheet Backdrop */}
      {actionSheetOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm lg:hidden animate-in fade-in duration-150"
          onClick={() => setActionSheetOpen(false)}
        />
      )}

      {/* Action Sheet Popup (Triggered by Center + button) */}
      {actionSheetOpen && (
        <div
          className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border rounded-t-3xl p-5 pb-8 space-y-4 shadow-2xl lg:hidden animate-in slide-in-from-bottom duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <div className="flex items-center gap-2 text-foreground font-bold text-sm">
              <Sparkles className="w-4 h-4 text-accent" />
              <span>Quick Actions</span>
            </div>
            <button
              onClick={() => setActionSheetOpen(false)}
              className="p-1 rounded-full text-muted-foreground hover:text-foreground bg-secondary"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* AI Voice Assistant - Full Width Banner */}
            {onOpenAiAssistant && (
              <button
                onClick={() => {
                  setActionSheetOpen(false);
                  onOpenAiAssistant();
                }}
                className="p-4 rounded-2xl bg-secondary border border-accent/30 text-left flex items-center justify-between gap-3 active:scale-98 transition-transform col-span-2 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-md shrink-0">
                    <Mic className="w-5 h-5 text-accent animate-pulse" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <span>AI Assistant</span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-accent/20 text-accent font-semibold">
                        Voice
                      </span>
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      Speak or dictate to create leads instantly
                    </div>
                  </div>
                </div>
                <Sparkles className="w-4 h-4 text-accent" />
              </button>
            )}

            {/* Quick Add Lead */}
            <button
              onClick={() => {
                setActionSheetOpen(false);
                onOpenQuickAdd();
              }}
              className="p-3.5 rounded-2xl bg-primary text-primary-foreground text-left flex items-center gap-3 active:scale-98 transition-transform col-span-2 shadow-sm"
            >
              <div className="w-9 h-9 rounded-xl bg-primary-hover text-white flex items-center justify-center shadow-sm shrink-0">
                <UserPlus className="w-4 h-4 text-accent" />
              </div>
              <div>
                <div className="text-xs font-bold text-primary-foreground">Add New Lead</div>
                <div className="text-[10px] text-primary-foreground/80">Quick buyer inquiry form</div>
              </div>
            </button>

            {/* Global Search */}
            <button
              onClick={() => {
                setActionSheetOpen(false);
                onOpenSearch();
              }}
              className="p-3.5 rounded-2xl bg-secondary border border-border text-left flex items-center gap-3 active:scale-98 transition-transform col-span-2"
            >
              <div className="w-8 h-8 rounded-xl bg-card text-muted-foreground flex items-center justify-center border border-border">
                <Search className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-foreground">Search Everything</div>
                <div className="text-[10px] text-muted-foreground">Find any lead, phone, or property</div>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-lg border-t border-border px-3 py-2 flex items-center justify-around lg:hidden safe-bottom shadow-2xl">
        {/* Nav Item 1: Home */}
        <Link
          href="/dashboard"
          className={cn(
            'flex flex-col items-center justify-center gap-1 py-1 px-3 rounded-xl transition-colors',
            pathname === '/dashboard'
              ? 'text-primary dark:text-accent font-bold'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[10px]">Home</span>
        </Link>

        {/* Nav Item 2: Leads */}
        <Link
          href="/leads"
          className={cn(
            'flex flex-col items-center justify-center gap-1 py-1 px-3 rounded-xl transition-colors',
            pathname.startsWith('/leads')
              ? 'text-primary dark:text-accent font-bold'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          <Users className="w-5 h-5" />
          <span className="text-[10px]">Leads</span>
        </Link>

        {/* Center Prominent Action Button */}
        <div className="relative -top-3">
          <button
            type="button"
            onClick={() => setActionSheetOpen(true)}
            aria-label="Quick Actions"
            className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg border-2 border-card active:scale-95 transition-transform"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        {/* Nav Item 3: Properties */}
        <Link
          href="/properties"
          className={cn(
            'flex flex-col items-center justify-center gap-1 py-1 px-3 rounded-xl transition-colors',
            pathname.startsWith('/properties')
              ? 'text-primary dark:text-accent font-bold'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          <Building2 className="w-5 h-5" />
          <span className="text-[10px]">Properties</span>
        </Link>

        {/* Nav Item 4: Follow-ups */}
        <Link
          href="/followups"
          className={cn(
            'flex flex-col items-center justify-center gap-1 py-1 px-3 rounded-xl transition-colors',
            pathname.startsWith('/followups')
              ? 'text-primary dark:text-accent font-bold'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          <CalendarCheck className="w-5 h-5" />
          <span className="text-[10px]">Follow-ups</span>
        </Link>
      </nav>
    </>
  );
}
