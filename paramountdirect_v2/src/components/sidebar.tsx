import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  FileText, 
  FileCheck, 
  ShieldCheck, 
  LogOut, 
  User, 
  Sun, 
  Moon, 
  X, 
  ChevronDown, 
  ChevronLeft,
  ChevronRight,
  Package, 
  Settings 
} from 'lucide-react';
import logoImg from '../assets/logo.png';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  activeSubTab: string;
  setActiveSubTab: (subTab: string) => void;
  onLogout: () => void;
  darkMode: boolean;
  setDarkMode: (mode: boolean) => void;
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({
  activeTab,
  setActiveTab,
  activeSubTab,
  setActiveSubTab,
  onLogout,
  darkMode,
  setDarkMode,
  isOpen,
  onClose,
}: SidebarProps) {
  const [isDashboardOpen, setIsDashboardOpen] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const statsMenuItems = [
    'MONTHLY APPLICATIONS',
    'DAILY APPLICATIONS',
    'QUOTATIONS',
    'FOLLOW-UP CALLS',
    'ADVERTISERS',
    'SIGNED APPLICATION',
    'C2C APPLICATION',
    'CTPL APPLICATION',
    'GTPP APPLICATION',
    'OFW APPLICATION',
    'KAAGAPAY APPLICATION',
    'SCREENED APPLICATIONS',
    'APPLICATION STATUSES',
  ];

  return (
    <>
      {/* Mobile Drawer Overlay */}
      {isOpen && (
        <div 
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden transition-opacity duration-300"
        />
      )}

      {/* Sidebar Main Container */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 p-4 flex flex-col justify-between border-r backdrop-blur-2xl transition-all duration-300 ease-in-out transform overflow-y-auto font-sans ${
        isCollapsed ? 'w-20' : 'w-64'
      } ${
        isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      } ${
        darkMode ? 'bg-slate-900/90 border-white/10 text-white' : 'bg-white/80 border-gray-200 text-gray-800'
      }`}>
        <div>
          {/* Header, Logo, and Collapse Toggle */}
          <div className="flex items-center justify-between mb-6 px-1">
            {!isCollapsed && (
              <img src={logoImg} alt="Paramount Direct" className="h-9 w-auto object-contain" />
            )}
            
            {/* Desktop Collapse Button */}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className={`hidden lg:flex p-1.5 rounded-xl border transition-colors cursor-pointer ${
                darkMode ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-gray-100 border-gray-200 hover:bg-gray-200'
              } ${isCollapsed ? 'mx-auto' : ''}`}
              title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </button>

            {/* Mobile Close Button */}
            <button onClick={onClose} className="lg:hidden p-1.5 rounded-xl text-gray-400 hover:text-white">
              <X className="h-5 w-5" />
            </button>
          </div>

          {!isCollapsed && (
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 px-3 mb-2 font-['Montserrat']">
              Main Menu
            </p>
          )}

          <nav className="space-y-1">
            {/* Collapsible Dashboard */}
            <div>
              <button
                onClick={() => {
                  setActiveTab('dashboard');
                  if (isCollapsed) {
                    setIsCollapsed(false);
                    setIsDashboardOpen(true);
                  } else {
                    setIsDashboardOpen(!isDashboardOpen);
                  }
                }}
                title={isCollapsed ? "Dashboard" : ""}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all duration-200 cursor-pointer font-['Montserrat'] ${
                  activeTab === 'dashboard'
                    ? 'bg-[#d0112b] text-white shadow-md shadow-[#d0112b]/30'
                    : darkMode ? 'text-gray-300 hover:bg-white/5' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <div className={`flex items-center space-x-3 ${isCollapsed ? 'mx-auto' : ''}`}>
                  <LayoutDashboard className="h-4 w-4 flex-shrink-0" />
                  {!isCollapsed && <span>Dashboard</span>}
                </div>
                {!isCollapsed && (
                  <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-300 ${isDashboardOpen ? 'rotate-180' : ''}`} />
                )}
              </button>

              {/* Statistics Accordion Sub-Menu */}
              {!isCollapsed && (
                <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
                  isDashboardOpen ? 'max-h-[600px] opacity-100 mt-1' : 'max-h-0 opacity-0 mt-0'
                }`}>
                  <div className="ml-3 border-l-2 border-[#d0112b]/30 pl-2 space-y-0.5">
                    <div className="text-[9px] font-bold uppercase tracking-wider text-gray-400 px-2.5 py-1 font-['Montserrat']">
                      STATISTICS
                    </div>
                    {statsMenuItems.map((item) => {
                      const isSubActive = activeTab === 'dashboard' && activeSubTab === item;
                      return (
                        <button
                          key={item}
                          onClick={() => {
                            setActiveTab('dashboard');
                            setActiveSubTab(item);
                            onClose();
                          }}
                          className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[10px] font-bold tracking-tight transition-all duration-200 cursor-pointer font-['Montserrat'] ${
                            isSubActive
                              ? 'bg-[#d0112b] text-white shadow-sm'
                              : darkMode ? 'text-red-400 hover:bg-white/5' : 'text-red-600 hover:bg-red-50'
                          }`}
                        >
                          {item}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Product Enrollment */}
            <button
              onClick={() => { setActiveTab('enrollment'); onClose(); }}
              title={isCollapsed ? "Product Enrollment" : ""}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold cursor-pointer transition-all duration-200 font-['Montserrat'] ${
                activeTab === 'enrollment' ? 'bg-[#d0112b] text-white shadow-md' : darkMode ? 'text-gray-300 hover:bg-white/5' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Package className={`h-4 w-4 flex-shrink-0 ${isCollapsed ? 'mx-auto' : ''}`} />
              {!isCollapsed && <span>Product Enrollment</span>}
            </button>

            {/* Maintenance */}
            <button
              onClick={() => { setActiveTab('maintenance'); onClose(); }}
              title={isCollapsed ? "Maintenance" : ""}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold cursor-pointer transition-all duration-200 font-['Montserrat'] ${
                activeTab === 'maintenance' ? 'bg-[#d0112b] text-white shadow-md' : darkMode ? 'text-gray-300 hover:bg-white/5' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Settings className={`h-4 w-4 flex-shrink-0 ${isCollapsed ? 'mx-auto' : ''}`} />
              {!isCollapsed && <span>Maintenance</span>}
            </button>

            {/* Application Inquiry */}
            <button
              onClick={() => { setActiveTab('inquiry'); onClose(); }}
              title={isCollapsed ? "Application Inquiry" : ""}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold cursor-pointer transition-all duration-200 font-['Montserrat'] ${
                activeTab === 'inquiry' ? 'bg-[#d0112b] text-white shadow-md' : darkMode ? 'text-gray-300 hover:bg-white/5' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <FileText className={`h-4 w-4 flex-shrink-0 ${isCollapsed ? 'mx-auto' : ''}`} />
              {!isCollapsed && <span>Application Inquiry</span>}
            </button>

            {/* Application Screening */}
            <button
              onClick={() => { setActiveTab('screening'); onClose(); }}
              title={isCollapsed ? "Application Screening" : ""}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold cursor-pointer transition-all duration-200 font-['Montserrat'] ${
                activeTab === 'screening' ? 'bg-[#d0112b] text-white shadow-md' : darkMode ? 'text-gray-300 hover:bg-white/5' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <FileCheck className={`h-4 w-4 flex-shrink-0 ${isCollapsed ? 'mx-auto' : ''}`} />
              {!isCollapsed && <span>Application Screening</span>}
            </button>

            {/* Audit Logs */}
            <button
              onClick={() => { setActiveTab('audit'); onClose(); }}
              title={isCollapsed ? "Audit Logs" : ""}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold cursor-pointer transition-all duration-200 font-['Montserrat'] ${
                activeTab === 'audit' ? 'bg-[#d0112b] text-white shadow-md' : darkMode ? 'text-gray-300 hover:bg-white/5' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <ShieldCheck className={`h-4 w-4 flex-shrink-0 ${isCollapsed ? 'mx-auto' : ''}`} />
              {!isCollapsed && <span>Audit Logs</span>}
            </button>
          </nav>
        </div>

        {/* Footer Actions */}
        <div className="space-y-2 pt-4">
          <button
            onClick={() => setDarkMode(!darkMode)}
            title={isCollapsed ? (darkMode ? "Light Theme" : "Dark Theme") : ""}
            className={`w-full flex items-center justify-between p-3 rounded-2xl border text-xs font-semibold transition-all duration-200 font-['Montserrat'] ${
              darkMode ? 'bg-white/5 border-white/10 text-yellow-400 hover:bg-white/10' : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
            }`}
          >
            <span className={`flex items-center space-x-2 ${isCollapsed ? 'mx-auto' : ''}`}>
              {darkMode ? <Sun className="h-4 w-4 flex-shrink-0" /> : <Moon className="h-4 w-4 flex-shrink-0" />}
              {!isCollapsed && (
                <span className={darkMode ? 'text-white' : 'text-gray-800'}>
                  {darkMode ? 'Light Theme' : 'Dark Theme'}
                </span>
              )}
            </span>
          </button>

          <div className={`p-3 rounded-2xl border flex items-center justify-between transition-all duration-200 ${
            darkMode ? 'bg-white/5 border-white/10' : 'bg-white border-gray-100 shadow-sm'
          }`}>
            <div className="flex items-center space-x-2.5">
              <div className={`p-1.5 rounded-xl bg-red-100 text-[#d0112b] ${isCollapsed ? 'mx-auto' : ''}`}>
                <User className="h-4 w-4 flex-shrink-0" />
              </div>
              {!isCollapsed && (
                <div className="text-left font-['Montserrat']">
                  <p className="text-xs font-bold leading-none">Olivia Rodrigo</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">olivia@paramount.com.ph</p>
                </div>
              )}
            </div>
            {!isCollapsed && (
              <button onClick={onLogout} className="text-gray-400 hover:text-[#d0112b] p-1 cursor-pointer transition-colors">
                <LogOut className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}