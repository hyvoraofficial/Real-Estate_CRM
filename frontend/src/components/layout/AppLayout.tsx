'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { MobileNav } from './MobileNav';
import { GlobalSearchModal } from '../modals/GlobalSearchModal';
import { QuickAddLeadModal } from '../modals/QuickAddLeadModal';
import { AiVoiceAssistantModal } from '../ai/AiVoiceAssistantModal';
import { useAuth } from '../../lib/auth';
import { Mic, Sparkles } from 'lucide-react';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [aiAssistantOpen, setAiAssistantOpen] = useState(false);

  // Global Keyboard shortcuts: Cmd+K for search, Cmd+J or Cmd+M for AI voice assistant
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
      if ((e.metaKey || e.ctrlKey) && (e.key === 'j' || e.key === 'm')) {
        e.preventDefault();
        setAiAssistantOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <div className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
            Loading HYVORA...
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex text-foreground">
      {/* Sidebar (Desktop / Drawer on Mobile) */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0 pb-24 lg:pb-8">
        <Header
          onOpenSidebar={() => setSidebarOpen(true)}
          onOpenSearch={() => setSearchOpen(true)}
          onOpenQuickAdd={() => setQuickAddOpen(true)}
          onOpenAiAssistant={() => setAiAssistantOpen(true)}
        />

        <main className="flex-1 p-3.5 sm:p-5 lg:p-8 max-w-7xl w-full mx-auto animate-in fade-in duration-150">
          {children}
        </main>
      </div>

      {/* Floating AI Voice Assistant Trigger Button (Desktop & Mobile) */}
      <div className="fixed bottom-20 right-4 lg:bottom-6 lg:right-6 z-40">
        <button
          type="button"
          onClick={() => setAiAssistantOpen(true)}
          title="Open AI Voice Assistant (Hands-Free Mode)"
          className="flex items-center justify-center gap-2.5 px-3.5 py-3 sm:px-4 sm:py-3 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs shadow-xl border border-accent/30 active:scale-95 transition-all group"
        >
          <div className="relative flex items-center justify-center">
            <Mic className="w-4 h-4 text-accent animate-pulse" />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-accent animate-ping" />
          </div>
          <span className="hidden sm:inline tracking-wide font-medium">AI Assistant</span>
        </button>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <MobileNav
        onOpenQuickAdd={() => setQuickAddOpen(true)}
        onOpenSearch={() => setSearchOpen(true)}
        onOpenAiAssistant={() => setAiAssistantOpen(true)}
      />

      {/* Global Modals */}
      <GlobalSearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
      <QuickAddLeadModal isOpen={quickAddOpen} onClose={() => setQuickAddOpen(false)} />
      <AiVoiceAssistantModal
        isOpen={aiAssistantOpen}
        onClose={() => setAiAssistantOpen(false)}
      />
    </div>
  );
}
