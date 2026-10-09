'use client';

import React, { useState } from 'react';
import {
  Menu,
  Search,
  Plus,
  LogOut,
  ChevronDown,
  Shield,
  User as UserIcon,
  Sun,
  Moon,
  Laptop,
  Mic,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../lib/auth';
import { useTheme } from '../../lib/theme';
import { cn } from '../../lib/utils';

interface HeaderProps {
  onOpenSidebar: () => void;
  onOpenSearch: () => void;
  onOpenQuickAdd: () => void;
  onOpenAiAssistant?: () => void;
}

export function Header({
  onOpenSidebar,
  onOpenSearch,
  onOpenQuickAdd,
  onOpenAiAssistant,
}: HeaderProps) {
  const { user, logout, switchDemoUser, isAdmin } = useAuth();
  const { theme, resolvedTheme, setTheme, toggleTheme } = useTheme();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);

  return (
    <header className="h-16 sticky top-0 z-30 bg-card/85 backdrop-blur-md border-b border-border px-4 lg:px-8 flex items-center justify-between gap-4 transition-colors">
      {/* Left section */}
      <div className="flex items-center gap-2 sm:gap-3 flex-1 max-w-md">
        <button
          onClick={onOpenSidebar}
          className="lg:hidden p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors shrink-0"
          aria-label="Toggle navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Global Search button / shortcut */}
        <button
          onClick={onOpenSearch}
          className="flex items-center gap-2 sm:gap-3 px-3.5 py-2 rounded-xl bg-secondary/50 border border-border text-muted-foreground hover:text-foreground hover:border-accent transition-all text-xs font-medium w-full sm:w-60 md:w-72 group"
        >
          <Search className="w-3.5 h-3.5 text-muted-foreground group-hover:text-accent transition-colors shrink-0" />
          <span className="truncate">Search phone, name, property...</span>
          <kbd className="hidden sm:inline-flex items-center gap-0.5 ml-auto text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-card text-muted-foreground border border-border">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
        {/* Luxury Theme Switcher Button */}
        <div className="relative">
          <button
            onClick={toggleTheme}
            title={`Switch to ${resolvedTheme === 'dark' ? 'Light' : 'Dark'} mode`}
            className="p-2 rounded-xl bg-secondary/50 hover:bg-secondary border border-border text-muted-foreground hover:text-foreground transition-all flex items-center justify-center"
            aria-label="Toggle Theme"
          >
            {resolvedTheme === 'dark' ? (
              <Sun className="w-4 h-4 text-accent transition-transform hover:rotate-45" />
            ) : (
              <Moon className="w-4 h-4 text-primary transition-transform hover:-rotate-12" />
            )}
          </button>
        </div>

        {/* AI Voice Assistant button */}
        {onOpenAiAssistant && (
          <button
            onClick={onOpenAiAssistant}
            title="AI Voice Assistant (Hands-Free Mode)"
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl bg-accent/10 hover:bg-accent/20 border border-accent/30 text-foreground text-xs font-semibold shadow-sm transition-all active:scale-95"
          >
            <Mic className="w-3.5 h-3.5 text-accent shrink-0 animate-pulse" />
            <span className="hidden sm:inline">AI Voice</span>
          </button>
        )}

        {/* Quick Add Lead button (PRIMARY CTA - Forest Green) */}
        <button
          onClick={onOpenQuickAdd}
          className="flex items-center gap-1 sm:gap-1.5 px-3 sm:px-3.5 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold shadow-md transition-all transform active:scale-95"
        >
          <Plus className="w-4 h-4 shrink-0" />
          <span className="hidden sm:inline">New Lead</span>
        </button>

        <div className="h-5 w-[1px] bg-border mx-0.5 hidden sm:block" />

        {/* User Account Menu */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2.5 p-1.5 pr-2.5 rounded-xl hover:bg-secondary transition-colors border border-transparent hover:border-border text-left"
          >
            <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold border border-accent/20 shadow-sm">
              {user?.name ? user.name.slice(0, 2).toUpperCase() : 'HY'}
            </div>
            <div className="hidden md:block">
              <div className="text-xs font-semibold text-foreground leading-tight truncate max-w-[120px]">
                {user?.name || 'Sales User'}
              </div>
              <div className="text-[10px] font-medium text-muted-foreground capitalize flex items-center gap-1">
                {user?.role === 'ADMIN' ? (
                  <>
                    <Shield className="w-2.5 h-2.5 text-accent" />
                    <span className="text-accent font-semibold">Admin</span>
                  </>
                ) : (
                  <>
                    <UserIcon className="w-2.5 h-2.5 text-muted-foreground" />
                    <span>Sales Exec</span>
                  </>
                )}
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
          </button>

          {/* User Menu Dropdown */}
          {showUserMenu && (
            <div
              className="absolute right-0 mt-2 w-64 rounded-2xl bg-card border border-border shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 duration-100"
              onMouseLeave={() => setShowUserMenu(false)}
            >
              <div className="px-4 py-3 border-b border-border">
                <p className="text-xs font-semibold text-foreground">{user?.name}</p>
                <p className="text-[11px] text-muted-foreground truncate">{user?.email}</p>
                <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-accent/10 text-accent border border-accent/20">
                  {user?.role === 'ADMIN' ? 'Company Administrator' : 'Sales Executive'}
                </div>
              </div>

              {/* Theme Selector inside User Menu */}
              <div className="px-3 py-2 border-b border-border">
                <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Theme Appearance
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    onClick={() => setTheme('light')}
                    className={cn(
                      'px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors border',
                      theme === 'light'
                        ? 'bg-accent/15 border-accent text-foreground font-semibold'
                        : 'border-border text-muted-foreground hover:bg-secondary',
                    )}
                  >
                    <Sun className="w-3.5 h-3.5 text-accent" />
                    <span>Ivory Light</span>
                  </button>
                  <button
                    onClick={() => setTheme('dark')}
                    className={cn(
                      'px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors border',
                      theme === 'dark'
                        ? 'bg-primary/20 border-primary text-foreground font-semibold'
                        : 'border-border text-muted-foreground hover:bg-secondary',
                    )}
                  >
                    <Moon className="w-3.5 h-3.5 text-primary" />
                    <span>Midnight Dark</span>
                  </button>
                </div>
              </div>

              {/* Demo Account Switcher */}
              <div className="px-2 py-1.5">
                <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Switch Demo Account
                </div>
                <button
                  onClick={() => {
                    switchDemoUser('admin@hyvora.com');
                    setShowUserMenu(false);
                  }}
                  className={cn(
                    'w-full text-left px-3 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors',
                    user?.email === 'admin@hyvora.com'
                      ? 'bg-primary/15 text-primary font-semibold'
                      : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
                  )}
                >
                  <span>Rajesh Sharma (Admin)</span>
                  {user?.email === 'admin@hyvora.com' && <span className="text-[10px]">Active</span>}
                </button>
                <button
                  onClick={() => {
                    switchDemoUser('vikram@hyvora.com');
                    setShowUserMenu(false);
                  }}
                  className={cn(
                    'w-full text-left px-3 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors',
                    user?.email === 'vikram@hyvora.com'
                      ? 'bg-primary/15 text-primary font-semibold'
                      : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
                  )}
                >
                  <span>Vikram Reddy (Sales)</span>
                  {user?.email === 'vikram@hyvora.com' && <span className="text-[10px]">Active</span>}
                </button>
                <button
                  onClick={() => {
                    switchDemoUser('sneha@hyvora.com');
                    setShowUserMenu(false);
                  }}
                  className={cn(
                    'w-full text-left px-3 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors',
                    user?.email === 'sneha@hyvora.com'
                      ? 'bg-primary/15 text-primary font-semibold'
                      : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
                  )}
                >
                  <span>Sneha Patil (Sales)</span>
                  {user?.email === 'sneha@hyvora.com' && <span className="text-[10px]">Active</span>}
                </button>
              </div>

              <div className="border-t border-border my-1" />

              <button
                onClick={() => {
                  setShowUserMenu(false);
                  logout();
                }}
                className="w-full text-left px-4 py-2 text-xs text-urgent hover:bg-urgent/10 flex items-center gap-2 transition-colors font-medium"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
