import React, { useState, useEffect } from 'react';
import { Menu, Sun, Moon } from 'lucide-react';
import Login from './components/login';
import Sidebar from './components/sidebar';
import Dashboard from './components/dashboard';
import ApplicationInquiry from './components/application_inquiry';
import ApplicationScreening from './components/application_screening';
import ApplicationDetail from './components/application_detail';
import ProductEnrollment from './components/product_enrollment';
import Maintenance from './components/maintenance';
import AuditLogs from './components/audit_logs';
import logoImg from './assets/logo.png';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [activeSubTab, setActiveSubTab] = useState('MONTHLY APPLICATIONS');
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Synchronize 'dark' class on <html> without triggering forced React layout recalculations
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode((prev) => !prev);

  if (!isAuthenticated) {
    return (
      <Login
        onLoginSuccess={() => setIsAuthenticated(true)}
        darkMode={darkMode}
        setDarkMode={toggleDarkMode}
      />
    );
  }

  // --- FIX: Rely on CSS dark:text classes instead of conflicting JS text color ---
  return (
    <div className={`flex flex-col lg:flex-row h-screen overflow-hidden font-sans transition-colors duration-200 ${
      darkMode ? 'bg-slate-950' : 'bg-gray-50'
    }`}>
      {/* Mobile Navigation Header */}
      <div className={`lg:hidden flex items-center justify-between px-4 py-3 border-b z-30 ${
        darkMode ? 'bg-slate-900 border-white/10' : 'bg-white border-gray-200'
      }`}>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 rounded-xl border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 cursor-pointer"
            aria-label="Open sidebar"
          >
            <Menu className="h-5 w-5" />
          </button>
          <img src={logoImg} alt="Paramount Direct" className="h-8 w-auto" />
        </div>
        <button
          onClick={toggleDarkMode}
          className="p-2 rounded-xl border border-gray-200 dark:border-white/10 text-gray-600 dark:text-yellow-400 cursor-pointer"
          aria-label="Toggle theme"
        >
          {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
      </div>

      {/* Collapsible Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          setSelectedAppId(null);
        }}
        activeSubTab={activeSubTab}
        setActiveSubTab={setActiveSubTab}
        onLogout={() => setIsAuthenticated(false)}
        // darkMode={darkMode}
        // setDarkMode={toggleDarkMode}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Module Content View */}
      <main className="flex-1 overflow-y-auto">
        {activeTab === 'dashboard' && <Dashboard darkMode={darkMode} />}
        {activeTab === 'enrollment' && <ProductEnrollment darkMode={darkMode} />}
        {activeTab === 'maintenance' && <Maintenance darkMode={darkMode} />}
        {activeTab === 'inquiry' && <ApplicationInquiry darkMode={darkMode} />}
        {activeTab === 'screening' && (
          selectedAppId ? (
            <ApplicationDetail
              darkMode={darkMode}
              applicationId={selectedAppId}
              onBack={() => setSelectedAppId(null)}
            />
          ) : (
            <ApplicationScreening
              onSelectApplication={(id) => setSelectedAppId(id)}
            />
          )
        )}
        {activeTab === 'audit' && <AuditLogs darkMode={darkMode} />}
      </main>
    </div>
  );
}