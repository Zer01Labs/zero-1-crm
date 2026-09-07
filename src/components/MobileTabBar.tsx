import React from 'react';
import { PieChart, Briefcase, DollarSign, Users, StickyNote } from 'lucide-react';
import { Tab } from '../types';

const ITEMS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'dashboard', label: 'Home', icon: PieChart },
  { id: 'clients', label: 'Clients', icon: Briefcase },
  { id: 'transactions', label: 'Txns', icon: DollarSign },
  { id: 'notes', label: 'Notes', icon: StickyNote },
  { id: 'payroll', label: 'Payroll', icon: Users },
];

export default function MobileTabBar({
  activeTab,
  onTabChange,
}: {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}) {
  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-surface border-t border-border px-2 py-2 flex justify-around shadow-pop">
      {ITEMS.map(({ id, label, icon: Icon }) => {
        const active = activeTab === id;
        return (
          <button
            key={id}
            onClick={() => onTabChange(id)}
            className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-[10px] font-medium cursor-pointer transition-colors ${
              active ? 'text-brand font-bold' : 'text-ink-faint'
            }`}
          >
            <Icon size={17} />
            {label}
          </button>
        );
      })}
    </nav>
  );
}
