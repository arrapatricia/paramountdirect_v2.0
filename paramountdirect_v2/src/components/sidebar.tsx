import React, { useState } from 'react';
import {
  LayoutDashboard,
  Search,
  ClipboardCheck,
  CreditCard,
  Wrench,
  FileText,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  LogOut,
  Building2,
  Globe,
  BarChart3,
  Users,
  FolderTree,
  Plane,
  Car,
  Cross,
  CalendarDays,
  Calendar,
  PhoneCall,
  FileSignature,
  Eye,
  ListChecks,
  Sun,
  Moon,
  Wallet
} from 'lucide-react';

import logoImg from '../assets/PD Logo_full color.png';

export type ProductLine = 'PD Life' | 'OFW' | 'CTPL' | 'GTP';

// Only PD Life and OFW have real pages built so far - CTPL and GTP are
// scaffolded in User Management / Role Access Maintenance but don't have
// dashboards yet, so their pills are shown but not selectable.
const BUILT_PRODUCT_LINES: ProductLine[] = ['PD Life', 'OFW', 'CTPL', 'GTP'];

// Display label shown on the product-line switcher pill only - the
// underlying 'PD Life' identifier stays as-is everywhere else (User
// Management, Role Access Maintenance, etc.) to avoid touching those.
const PRODUCT_DISPLAY_LABEL: Record<ProductLine, string> = {
  'PD Life': 'Life',
  'OFW': 'OFW',
  'CTPL': 'CTPL',
  'GTP': 'GTP',
};

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  activeSubTab?: string;
  setActiveSubTab?: (subTab: string) => void;
  onLogout: () => void;
  isOpen?: boolean;
  onClose?: () => void;
  currentUserName?: string;
  currentUserEmail?: string;
  activeProduct?: ProductLine;
  setActiveProduct?: (product: ProductLine) => void;
  darkMode?: boolean;
  onToggleDarkMode?: () => void;
}

export default function Sidebar({
  activeTab,
  setActiveTab,
  activeSubTab,
  setActiveSubTab,
  onLogout,
  isOpen = false,
  onClose,
  currentUserName = 'Juan Dela Cruz',
  currentUserEmail = 'juan.delacruz@paramount.com.ph',
  activeProduct = 'PD Life',
  setActiveProduct,
  darkMode = false,
  onToggleDarkMode
}: SidebarProps) {
  const userInitials = currentUserName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0])
    .join('')
    .toUpperCase();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMaintenanceOpen, setIsMaintenanceOpen] = useState(true);
  const [isStatisticsOpen, setIsStatisticsOpen] = useState(true);

  const navItemsByProduct: Record<ProductLine, { id: string; label: string; icon: typeof LayoutDashboard }[]> = {
    'PD Life': [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'inquiry', label: 'Application Inquiry', icon: Search },
      { id: 'screening', label: 'Application Screening', icon: ClipboardCheck },
      { id: 'payments', label: 'Payment Transactions', icon: CreditCard },
    ],
    'OFW': [
      { id: 'ofw-dashboard', label: 'OFW Dashboard', icon: LayoutDashboard },
      { id: 'ofw-applications', label: 'OFW Applications', icon: ClipboardCheck },
    ],
    'CTPL': [
      { id: 'ctpl-dashboard', label: 'CTPL Dashboard', icon: LayoutDashboard },
      { id: 'ctpl-applications', label: 'CTPL Applications', icon: ClipboardCheck },
    ],
    'GTP': [
      { id: 'gtp-dashboard', label: 'GTP Dashboard', icon: LayoutDashboard },
      { id: 'gtp-applications', label: 'GTP Applications', icon: ClipboardCheck },
    ],
  };
  const navItems = navItemsByProduct[activeProduct];

  // Statistics sub-pages, PD Life only - mirrors the equivalent section in
  // the legacy admin (Monthly/Daily/Follow-up Calls/Signed/Screened/
  // Application Statuses), narrowed down to just these six per request.
  const statisticsSubItems = [
    { id: 'life-monthly', label: 'Monthly Applications', icon: CalendarDays },
    { id: 'life-daily', label: 'Daily Applications', icon: Calendar },
    { id: 'life-followup-calls', label: 'Follow-up Calls', icon: PhoneCall },
    { id: 'life-signed', label: 'Signed Applications', icon: FileSignature },
    { id: 'life-screened', label: 'Screened Applications', icon: Eye },
    { id: 'life-application-statuses', label: 'Application Statuses', icon: ListChecks },
  ];

  const maintenanceSubItems = [
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'roles', label: 'Role Access Matrix', icon: FolderTree },
    { id: 'premiums', label: 'Premium Maintenance', icon: Wallet },
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
        bg-white border-r border-slate-200 dark:bg-slate-900 dark:border-slate-800
        flex flex-col justify-between p-4 transition-all duration-300 ease-in-out font-sans
        ${isCollapsed ? 'w-20' : 'w-64 max-w-[80vw]'}
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        
        {/* Header & Logo + Navigation - scrolls independently so tall menus
            (Statistics + Maintenance both expanded) don't get clipped on
            short screens; the user section below stays pinned. */}
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden pr-0.5">
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

            <div className="hidden lg:flex items-center space-x-1.5 flex-shrink-0">
              {/* Desktop Dark Mode Toggle */}
              {onToggleDarkMode && (
                <button
                  onClick={onToggleDarkMode}
                  className="p-1.5 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-100 cursor-pointer transition-colors dark:border-slate-700 dark:text-yellow-400 dark:hover:bg-slate-800"
                  title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
                >
                  {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </button>
              )}

              {/* Desktop Collapse Toggle */}
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="p-1.5 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-100 cursor-pointer transition-colors dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
                title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
              >
                {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Product Line Switcher */}
          {!isCollapsed && (
            <div className="mb-4 px-1">
              <p className="text-[10px] font-black uppercase text-slate-400 px-2 mb-2 tracking-wider whitespace-nowrap dark:text-slate-500">
                Product Line
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                {(['PD Life', 'OFW', 'CTPL', 'GTP'] as ProductLine[]).map((product) => {
                  const isBuilt = BUILT_PRODUCT_LINES.includes(product);
                  const isActive = activeProduct === product;
                  return (
                    <button
                      key={product}
                      disabled={!isBuilt}
                      title={isBuilt ? undefined : 'Coming Soon'}
                      onClick={() => {
                        if (!isBuilt || !setActiveProduct) return;
                        setActiveProduct(product);
                        setActiveTab(navItemsByProduct[product][0]?.id || 'dashboard');
                        if (onClose) onClose();
                      }}
                      className={`px-2 py-1.5 rounded-lg text-[10px] font-extrabold transition-all flex items-center justify-center space-x-1 ${
                        !isBuilt
                          ? 'bg-slate-50 text-slate-300 cursor-not-allowed border border-dashed border-slate-200 dark:bg-slate-800/50 dark:text-slate-600 dark:border-slate-700'
                          : isActive
                          ? 'text-white shadow-sm cursor-pointer'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200 cursor-pointer dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                      }`}
                      style={isBuilt && isActive ? { backgroundColor: product === 'PD Life' ? '#d0112b' : '#002f6c' } : undefined}
                    >
                      {product === 'PD Life' && <Cross className="w-3 h-3 flex-shrink-0" />}
                      {product === 'OFW' && <Plane className="w-3 h-3 flex-shrink-0" />}
                      {product === 'CTPL' && <Car className="w-3 h-3 flex-shrink-0" />}
                      {product === 'GTP' && <Plane className="w-3 h-3 flex-shrink-0 rotate-45" />}
                      <span className="truncate">{PRODUCT_DISPLAY_LABEL[product]}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Section Heading */}
          {!isCollapsed && navItems.length > 0 && (
            <p className="text-[10px] font-black uppercase text-slate-400 px-3 mb-2 tracking-wider whitespace-nowrap dark:text-slate-500">
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
                      ? 'text-white shadow-md'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
                    }
                  `}
                  style={isActive ? { backgroundColor: activeProduct === 'PD Life' ? '#d0112b' : '#002f6c' } : undefined}
                >
                  <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`} />
                  {!isCollapsed && <span className="truncate">{item.label}</span>}
                </button>
              );
            })}

            {/* Statistics Accordion - PD Life only */}
            {activeProduct === 'PD Life' && (
              <div>
                <button
                  onClick={() => {
                    if (isCollapsed) setIsCollapsed(false);
                    setIsStatisticsOpen(!isStatisticsOpen);
                  }}
                  title={isCollapsed ? 'Statistics' : undefined}
                  className={`
                    w-full flex items-center rounded-2xl transition-all cursor-pointer text-xs font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800
                    ${isCollapsed ? 'justify-center p-3' : 'justify-between px-3.5 py-3'}
                    ${statisticsSubItems.some((s) => s.id === activeTab) ? 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white' : ''}
                  `}
                >
                  <div className={`flex items-center ${isCollapsed ? '' : 'space-x-3'}`}>
                    <ListChecks className="w-5 h-5 text-slate-500 flex-shrink-0 dark:text-slate-400" />
                    {!isCollapsed && <span className="truncate">Statistics</span>}
                  </div>
                  {!isCollapsed && (
                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isStatisticsOpen ? 'rotate-180' : ''}`} />
                  )}
                </button>

                {isStatisticsOpen && !isCollapsed && (
                  <div className="ml-8 mt-1 space-y-1 border-l-2 border-slate-100 pl-3 dark:border-slate-800">
                    {statisticsSubItems.map((sub) => {
                      const SubIcon = sub.icon;
                      const isSubActive = activeTab === sub.id;

                      return (
                        <button
                          key={sub.id}
                          onClick={() => {
                            setActiveTab(sub.id);
                            if (onClose) onClose();
                          }}
                          className={`w-full text-left py-2 px-2.5 rounded-xl text-xs font-semibold transition-colors flex items-center space-x-2 truncate cursor-pointer ${
                            isSubActive
                              ? 'text-[#d0112b] bg-red-50 font-bold dark:bg-red-950/30'
                              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800'
                          }`}
                        >
                          <SubIcon className={`w-3.5 h-3.5 flex-shrink-0 ${isSubActive ? 'text-[#d0112b]' : 'text-slate-400'}`} />
                          <span className="truncate">{sub.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

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
                  w-full flex items-center rounded-2xl transition-all cursor-pointer text-xs font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800
                  ${isCollapsed ? 'justify-center p-3' : 'justify-between px-3.5 py-3'}
                  ${activeTab === 'maintenance' ? 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white' : ''}
                `}
              >
                <div className={`flex items-center ${isCollapsed ? '' : 'space-x-3'}`}>
                  <Wrench className="w-5 h-5 text-slate-500 flex-shrink-0 dark:text-slate-400" />
                  {!isCollapsed && <span className="truncate">Maintenance</span>}
                </div>
                {!isCollapsed && (
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isMaintenanceOpen ? 'rotate-180' : ''}`} />
                )}
              </button>

              {/* Maintenance Sub-menu */}
              {isMaintenanceOpen && !isCollapsed && (
                <div className="ml-8 mt-1 space-y-1 border-l-2 border-slate-100 pl-3 dark:border-slate-800">
                  {maintenanceSubItems.map((sub) => {
                    const SubIcon = sub.icon;
                    const isSubActive = activeTab === 'maintenance' && activeSubTab === sub.id;

                    return (
                      <button
                        key={sub.id}
                        onClick={() => {
                          setActiveTab('maintenance');
                          if (setActiveSubTab) setActiveSubTab(sub.id);
                          if (onClose) onClose();
                        }}
                        className={`w-full text-left py-2 px-2.5 rounded-xl text-xs font-semibold transition-colors flex items-center space-x-2 truncate cursor-pointer ${
                          isSubActive
                            ? 'text-[#d0112b] bg-red-50 font-bold dark:bg-red-950/30'
                            : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800'
                        }`}
                      >
                        <SubIcon className={`w-3.5 h-3.5 flex-shrink-0 ${isSubActive ? 'text-[#d0112b]' : 'text-slate-400'}`} />
                        <span className="truncate">{sub.label}</span>
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
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
                }
              `}
            >
              <FileText className={`w-5 h-5 flex-shrink-0 ${activeTab === 'audit' ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`} />
              {!isCollapsed && <span className="truncate">Audit Logs</span>}
            </button>
          </nav>
        </div>

        {/* Bottom User Section */}
        <div className="flex-shrink-0 border-t border-slate-100 pt-4 dark:border-slate-800">
          <div className={`
            flex items-center rounded-2xl bg-slate-50 border border-slate-100 transition-all dark:bg-slate-800/60 dark:border-slate-700
            ${isCollapsed ? 'p-2 justify-center' : 'p-2.5 space-x-3'}
          `}>
            <div className="w-8 h-8 rounded-xl bg-red-100 text-[#d0112b] font-black flex items-center justify-center text-xs flex-shrink-0 dark:bg-red-950/40">
              {userInitials}
            </div>

            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-800 truncate dark:text-slate-100">{currentUserName}</p>
                <p className="text-[10px] text-slate-400 truncate dark:text-slate-500">{currentUserEmail}</p>
              </div>
            )}

            {!isCollapsed && (
              <button
                onClick={onLogout}
                className="p-1.5 text-slate-400 hover:text-[#d0112b] rounded-lg hover:bg-red-50 transition-colors cursor-pointer dark:hover:bg-red-950/30"
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