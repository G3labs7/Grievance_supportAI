import React from 'react';
import { Landmark, BarChart3, ListCollapse, MessageSquareCode, Settings, LogOut, X } from 'lucide-react';

export type SidebarTab = 'dashboard' | 'grievances' | 'digest' | 'settings';

interface SidebarProps {
  activeTab: SidebarTab;
  setActiveTab: (tab: SidebarTab) => void;
  staffName: string;
  staffEmail: string;
  onLogout: () => void;
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ 
  activeTab, 
  setActiveTab, 
  staffName, 
  staffEmail, 
  onLogout,
  isOpen,
  onClose
}: SidebarProps) {
  const menuItems = [
    { id: 'dashboard' as SidebarTab, label: 'Dashboard', icon: BarChart3 },
    { id: 'grievances' as SidebarTab, label: 'All Grievances', icon: ListCollapse },
    { id: 'digest' as SidebarTab, label: 'Generate Digest', icon: MessageSquareCode },
    { id: 'settings' as SidebarTab, label: 'Settings', icon: Settings },
  ];

  const handleTabClick = (tabId: SidebarTab) => {
    setActiveTab(tabId);
    onClose(); // Automatically close mobile sidebar when tab is chosen
  };

  return (
    <div className={`w-[240px] bg-white text-slate-700 flex flex-col h-screen fixed left-0 top-0 border-r border-slate-200 shadow-sm z-50 select-none transition-transform duration-300 lg:translate-x-0 ${
      isOpen ? 'translate-x-0' : '-translate-x-full'
    }`}>
      {/* Top Brand Logo Section */}
      <div className="p-6 border-b border-slate-200 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center font-bold text-white shrink-0 shadow-sm">
            <Landmark className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold leading-none text-slate-900 tracking-tight">JAN AWAAZ AI</h1>
            <p className="text-[9px] text-indigo-600 font-bold tracking-wider uppercase mt-1">National Intelligence</p>
          </div>
        </div>
        {/* Mobile Close Button */}
        <button 
          onClick={onClose}
          className="lg:hidden p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Navigation menu items */}
      <nav className="flex-1 px-4 py-6 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleTabClick(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-semibold rounded-lg cursor-pointer transition-all ${
                isActive
                  ? 'bg-indigo-50 text-indigo-600 border-l-4 border-indigo-600'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Staff ID & Sign Out section */}
      <div className="p-4 border-t border-slate-200">
        <div className="bg-slate-50 p-3 rounded-xl flex items-center gap-3 border border-slate-200 mb-3">
          <div className="w-8 h-8 rounded-full bg-indigo-600/10 flex items-center justify-center text-[10px] font-bold text-indigo-600 uppercase select-none shrink-0">
            {staffName ? staffName.charAt(0) : 'U'}
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-bold text-slate-800 truncate">{staffName}</p>
            <p className="text-[10px] text-slate-500 truncate font-mono">{staffEmail}</p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 bg-white hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 text-xs text-slate-600 py-2.5 px-3 rounded-lg border border-slate-200 transition-all cursor-pointer font-semibold"
        >
          <LogOut className="w-3.5 h-3.5" />
          Logout Session
        </button>
      </div>
    </div>
  );
}
