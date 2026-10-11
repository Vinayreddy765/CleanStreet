import React from 'react';
import { Leaf, LayoutDashboard, Plus, ClipboardList, Flame, BarChart3 } from 'lucide-react';

type Page = 'dashboard' | 'report' | 'reports' | 'hotspots' | 'impact';

interface Props {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  children: React.ReactNode;
}

const NAV_ITEMS: { id: Page; label: string; icon: React.ReactNode }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
  { id: 'report', label: 'Report Litter', icon: <Plus className="w-5 h-5" /> },
  { id: 'reports', label: 'Manage Reports', icon: <ClipboardList className="w-5 h-5" /> },
  { id: 'hotspots', label: 'Hotspots', icon: <Flame className="w-5 h-5" /> },
  { id: 'impact', label: 'Impact', icon: <BarChart3 className="w-5 h-5" /> },
];

export function Layout({ currentPage, onNavigate, children }: Props) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-brand-700 text-white shadow-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="bg-brand-500 rounded-lg p-1.5">
              <Leaf className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-none">CleanStreet</h1>
              <p className="text-brand-200 text-xs leading-none mt-0.5">Roadside Litter Reporting</p>
            </div>
          </div>
          <nav className="ml-auto hidden md:flex items-center gap-1">
            {NAV_ITEMS.map(({ id, label, icon }) => (
              <button
                key={id}
                onClick={() => onNavigate(id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  currentPage === id
                    ? 'bg-brand-600 text-white'
                    : 'text-brand-100 hover:bg-brand-600 hover:text-white'
                }`}
              >
                {icon}
                {label}
              </button>
            ))}
          </nav>
        </div>
        {/* Mobile nav */}
        <nav className="md:hidden flex overflow-x-auto border-t border-brand-600">
          {NAV_ITEMS.map(({ id, label, icon }) => (
            <button
              key={id}
              onClick={() => onNavigate(id)}
              className={`flex flex-col items-center gap-0.5 px-3 py-2 text-xs font-medium whitespace-nowrap transition-colors flex-1 ${
                currentPage === id ? 'bg-brand-600 text-white' : 'text-brand-200 hover:text-white'
              }`}
            >
              {icon}
              {label}
            </button>
          ))}
        </nav>
      </header>

      {/* Main content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6">
        {children}
      </main>

      <footer className="border-t border-gray-200 bg-white py-4 text-center text-xs text-gray-400">
        CleanStreet · Environmental Hackathon MVP · Reports are stored in AWS DynamoDB
      </footer>
    </div>
  );
}
