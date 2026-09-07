import React from 'react';
import { PieChart, Briefcase, DollarSign, Users, LogOut, Settings, StickyNote } from 'lucide-react';
import { CompanySettings, Tab } from '../types';

interface SidebarProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  companySettings: CompanySettings;
  onBrandClick: () => void;
  onSignOut: () => void;
  userLabel?: string;
  notesCount?: number;
}

const NAV_ITEMS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: PieChart },
  { id: 'clients', label: 'Clients & Leads', icon: Briefcase },
  { id: 'transactions', label: 'Transactions', icon: DollarSign },
  { id: 'notes', label: 'Keep Notes', icon: StickyNote },
  { id: 'payroll', label: 'Payroll & Personnel', icon: Users },
];

export default function Sidebar({
  activeTab,
  onTabChange,
  companySettings,
  onBrandClick,
  onSignOut,
  userLabel,
  notesCount = 0,
}: SidebarProps) {
  return (
    <aside className="hidden lg:flex w-64 flex-col bg-surface border-r border-border min-h-screen sticky top-0 h-screen z-40 p-4 justify-between">
      <div className="space-y-6">
        {/* BRAND / LOGO */}
        <div
          onClick={onBrandClick}
          className="flex items-center gap-3 p-2 rounded-xl hover:bg-surface-2 transition-colors cursor-pointer group"
          title="Click to customize company settings"
        >
          {companySettings.logoUrl ? (
            <img
              src={companySettings.logoUrl}
              alt={companySettings.companyName}
              className="w-9 h-9 rounded-xl object-contain bg-surface-2 border border-border p-1 group-hover:border-brand/50 transition-colors"
            />
          ) : (
            <div className="w-9 h-9 rounded-xl bg-brand text-white font-bold font-display text-sm flex items-center justify-center shadow-card group-hover:shadow-pop transition-all">
              {companySettings.companyName ? companySettings.companyName.charAt(0).toUpperCase() : 'S'}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <span className="font-display font-bold text-sm text-ink truncate block group-hover:text-brand transition-colors">
              {companySettings.companyName || 'ScarletCRM'}
            </span>
            <span className="text-[10px] text-ink-faint uppercase font-mono tracking-wider truncate block">
              {companySettings.companyTagline || 'Operations Portal'}
            </span>
          </div>
          <Settings size={14} className="text-ink-faint group-hover:text-ink transition-colors" />
        </div>

        {/* NAVIGATION LINKS */}
        <nav className="space-y-1">
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => onTabChange(id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                  isActive
                    ? 'bg-brand text-white shadow-card'
                    : 'text-ink-soft hover:text-ink hover:bg-surface-2'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon size={16} className={isActive ? 'text-white' : 'text-ink-faint'} />
                  <span>{label}</span>
                </div>
                {id === 'notes' && notesCount > 0 && (
                  <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold ${
                    isActive ? 'bg-white/20 text-white' : 'bg-brand/20 text-brand'
                  }`}>
                    {notesCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* FOOTER USER / SIGN OUT */}
      <div className="pt-4 border-t border-border-soft space-y-2">
        {userLabel && (
          <div className="px-3 py-1.5 rounded-lg bg-surface-2 border border-border text-[11px] font-mono text-ink-soft truncate">
            {userLabel}
          </div>
        )}
        <button
          onClick={onSignOut}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-surface-2 hover:bg-loss-soft text-ink-soft hover:text-loss border border-border hover:border-loss/30 transition-all text-xs font-mono font-medium cursor-pointer"
        >
          <LogOut size={14} />
          <span>SIGN OUT</span>
        </button>
      </div>
    </aside>
  );
}
