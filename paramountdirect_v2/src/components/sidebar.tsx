import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Search, 
  CheckSquare, 
  ShieldCheck, 
  ChevronRight, 
  ChevronLeft, 
  LogOut 
} from 'lucide-react';

import pdLogoFullColor from '../assets/PD Logo_full color.png';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  activeSubTab: string;
  setActiveSubTab: (subTab: string) => void;
  onLogout: () => void;
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({
  activeTab,
  setActiveTab,
  onLogout,
  isOpen,
  onClose
}: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Main Sidebar - Locked Height & Smooth Collapse */}
      <aside className={`
        fixed lg:static top-0 left-0 h-screen max-h-screen z-50 flex flex-col justify-between p-4 font-['Montserrat'] bg-slate-100 text-slate-900 transition-all duration-300 overflow-hidden shrink-0
        ${isCollapsed ? 'w-20' : 'w-72'}
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        
        {/* Main Nav Container */}
        <div className="p-4 rounded-3xl border border-slate-200/80 bg-white shadow-sm flex-1 flex flex-col min-h-0 overflow-hidden">
          
          {/* Header Row with Centered Alignment */}
          <div className={`flex items-center pb-4 mb-3 border-b border-slate-100 shrink-0 ${
            isCollapsed ? 'justify-center' : 'justify-between'
          }`}>
            {!isCollapsed && (
              <img 
                src={pdLogoFullColor} 
                alt="Paramount Direct" 
                className="h-8 w-auto object-contain transition-all"
              />
            )}
            
            {/* Collapse / Expand Switch Button */}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 cursor-pointer flex-shrink-0"
              title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            >
              {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </button>
          </div>

          {!isCollapsed && (
            <h2 className="text-xs font-extrabold text-slate-900 px-2 mb-3 shrink-0">
              Main Menu
            </h2>
          )}

          {/* Navigation Links */}
          <nav className="space-y-1.5 flex-1 overflow-y-auto pr-0.5">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} p-2.5 rounded-2xl font-bold text-xs cursor-pointer transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-[#d0112b] text-white shadow-md shadow-[#d0112b]/20'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
              title="Dashboard"
            >
              <div className="flex items-center space-x-3">
                <LayoutDashboard className="h-4 w-4 flex-shrink-0" />
                {!isCollapsed && <span>Dashboard</span>}
              </div>
              {!isCollapsed && <ChevronRight className="h-4 w-4" />}
            </button>

            <button
              onClick={() => setActiveTab('inquiry')}
              className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'} p-2.5 rounded-2xl font-bold text-xs cursor-pointer transition-all ${
                activeTab === 'inquiry'
                  ? 'bg-[#d0112b] text-white shadow-md shadow-[#d0112b]/20'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
              title="Application Inquiry"
            >
              <Search className="h-4 w-4 flex-shrink-0" />
              {!isCollapsed && <span>Application Inquiry</span>}
            </button>

            <button
              onClick={() => setActiveTab('screening')}
              className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'} p-2.5 rounded-2xl font-bold text-xs cursor-pointer transition-all ${
                activeTab === 'screening'
                  ? 'bg-[#d0112b] text-white shadow-md shadow-[#d0112b]/20'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
              title="Application Screening"
            >
              <CheckSquare className="h-4 w-4 flex-shrink-0" />
              {!isCollapsed && <span>Application Screening</span>}
            </button>

            <button
              onClick={() => setActiveTab('audit')}
              className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'} p-2.5 rounded-2xl font-bold text-xs cursor-pointer transition-all ${
                activeTab === 'audit'
                  ? 'bg-[#d0112b] text-white shadow-md shadow-[#d0112b]/20'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
              title="Audit Logs"
            >
              <ShieldCheck className="h-4 w-4 flex-shrink-0" />
              {!isCollapsed && <span>Audit Logs</span>}
            </button>
          </nav>
        </div>

        {/* Profile Footer Box */}
        <div className="mt-3 p-2.5 rounded-2xl border border-slate-200/80 bg-white flex items-center justify-between shadow-sm shrink-0">
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="w-7 h-7 rounded-full bg-red-100 text-[#d0112b] flex items-center justify-center font-bold text-xs flex-shrink-0">
              JD
            </div>
            {!isCollapsed && (
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 truncate">
                  Juan Dela Cruz
                </p>
                <p className="text-[10px] text-slate-500 truncate">
                  juan.delacruz@paramount.com.ph
                </p>
              </div>
            )}
          </div>

          {!isCollapsed && (
            <button
              onClick={onLogout}
              className="p-1 rounded-lg text-slate-600 hover:text-[#d0112b] cursor-pointer"
              title="Log out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          )}
        </div>

      </aside>
    </>
  );
}