import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Search, 
  ClipboardCheck, 
  Wrench, 
  FileText, 
  ChevronDown, 
  ChevronRight, 
  ChevronLeft,
  LogOut, 
  Building2, 
  Globe, 
  BarChart3 
} from 'lucide-react';

import logoImg from '../assets/PD Logo_full color.png';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  activeSubTab?: string;
  setActiveSubTab?: (subTab: string) => void;
  onLogout: () => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({
  activeTab,
  setActiveTab,
  activeSubTab,
  setActiveSubTab,
  onLogout,
  isOpen = false,
  onClose
}: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMaintenanceOpen, setIsMaintenanceOpen] = useState(true);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'inquiry', label: 'Application Inquiry', icon: Search },
    { id: 'screening', label: 'Application Screening', icon: ClipboardCheck },
  ];

  const maintenanceSubItems = [
    { id: 'branch', label: 'Branch Directory', icon: Building2 },
    { id: 'marketing', label: 'Marketing Dashboard', icon: BarChart3 },
    { id: 'cms', label: 'CMS (Website Content)', icon: Globe },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          onClick={onClose} 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden"
        />
      )}

      <aside className={`
        fixed lg:static top-0 left-0 h-screen z-50 overflow-hidden
        bg-white border-r border-slate-200 
        flex flex-col justify-between p-4 transition-all duration-300 ease-in-out font-sans
        ${isCollapsed ? 'w-20' : 'w-64'}
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        
        {/* Header & Logo */}
        <div>
          <div className="flex items-center justify-between h-12 mb-6">
            <div className="flex items-center space-x-2 overflow-hidden">
              <img 
                src={logoImg} 
                alt="Paramount Direct" 
                className={`transition-all duration-300 object-contain ${
                  isCollapsed ? 'h-7 max-w-[50px]' : 'h-8 max-w-[150px]'
                }`} 
              />
            </div>

            {/* Desktop Collapse Toggle */}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden lg:flex p-1.5 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-100 cursor-pointer transition-colors flex-shrink-0"
              title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>

          {/* Section Heading */}
          {!isCollapsed && (
            <p className="text-[10px] font-black uppercase text-slate-400 px-3 mb-2 tracking-wider whitespace-nowrap">
              Main Menu
            </p>
          )}

          {/* Navigation Links */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    if (onClose) onClose();
                  }}
                  title={isCollapsed ? item.label : undefined}
                  className={`
                    w-full flex items-center rounded-2xl transition-all cursor-pointer text-xs font-bold
                    ${isCollapsed ? 'justify-center p-3' : 'px-3.5 py-3 space-x-3'}
                    ${isActive 
                      ? 'bg-[#d0112b] text-white shadow-md shadow-[#d0112b]/20' 
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }
                  `}
                >
                  <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                  {!isCollapsed && <span className="truncate">{item.label}</span>}
                </button>
              );
            })}

            {/* Maintenance Accordion */}
            <div>
              <button
                onClick={() => {
                  if (isCollapsed) setIsCollapsed(false);
                  setActiveTab('maintenance');
                  setIsMaintenanceOpen(!isMaintenanceOpen);
                }}
                title={isCollapsed ? "Maintenance" : undefined}
                className={`
                  w-full flex items-center rounded-2xl transition-all cursor-pointer text-xs font-bold text-slate-600 hover:bg-slate-100
                  ${isCollapsed ? 'justify-center p-3' : 'justify-between px-3.5 py-3'}
                  ${activeTab === 'maintenance' ? 'bg-slate-100 text-slate-900' : ''}
                `}
              >
                <div className={`flex items-center ${isCollapsed ? '' : 'space-x-3'}`}>
                  <Wrench className="w-5 h-5 text-slate-500 flex-shrink-0" />
                  {!isCollapsed && <span className="truncate">Maintenance</span>}
                </div>
                {!isCollapsed && (
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isMaintenanceOpen ? 'rotate-180' : ''}`} />
                )}
              </button>

              {/* Maintenance Sub-menu */}
              {isMaintenanceOpen && !isCollapsed && (
                <div className="ml-8 mt-1 space-y-1 border-l-2 border-slate-100 pl-3">
                  {maintenanceSubItems.map((sub) => {
                    const isSubActive = activeTab === 'maintenance' && activeSubTab === sub.id;

                    return (
                      <button
                        key={sub.id}
                        onClick={() => {
                          setActiveTab('maintenance');
                          if (setActiveSubTab) setActiveSubTab(sub.id);
                          if (onClose) onClose();
                        }}
                        className={`w-full text-left py-2 px-2.5 rounded-xl text-xs font-semibold transition-colors block truncate cursor-pointer ${
                          isSubActive 
                            ? 'text-[#d0112b] bg-red-50 font-bold' 
                            : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                        }`}
                      >
                        {sub.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Audit Logs */}
            <button
              onClick={() => {
                setActiveTab('audit');
                if (onClose) onClose();
              }}
              title={isCollapsed ? "Audit Logs" : undefined}
              className={`
                w-full flex items-center rounded-2xl transition-all cursor-pointer text-xs font-bold
                ${isCollapsed ? 'justify-center p-3' : 'px-3.5 py-3 space-x-3'}
                ${activeTab === 'audit' 
                  ? 'bg-[#d0112b] text-white shadow-md shadow-[#d0112b]/20' 
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }
              `}
            >
              <FileText className={`w-5 h-5 flex-shrink-0 ${activeTab === 'audit' ? 'text-white' : 'text-slate-500'}`} />
              {!isCollapsed && <span className="truncate">Audit Logs</span>}
            </button>
          </nav>
        </div>

        {/* Bottom User Section */}
        <div className="border-t border-slate-100 pt-4">
          <div className={`
            flex items-center rounded-2xl bg-slate-50 border border-slate-100 transition-all
            ${isCollapsed ? 'p-2 justify-center' : 'p-2.5 space-x-3'}
          `}>
            <div className="w-8 h-8 rounded-xl bg-red-100 text-[#d0112b] font-black flex items-center justify-center text-xs flex-shrink-0">
              JD
            </div>

            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-800 truncate">Juan Dela Cruz</p>
                <p className="text-[10px] text-slate-400 truncate">juan.delacruz@paramount.com.ph</p>
              </div>
            )}

            {!isCollapsed && (
              <button
                onClick={onLogout}
                className="p-1.5 text-slate-400 hover:text-[#d0112b] rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                title="Log Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

      </aside>
    </>
  );
}