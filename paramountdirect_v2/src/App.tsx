import React, { useState, useEffect } from 'react';
import { Menu, Sun, Moon } from 'lucide-react';
import Login from './components/login';
import Sidebar from './components/sidebar';
import Dashboard from './components/dashboard';
import ApplicationInquiry from './components/application_inquiry';
import ApplicationScreening from './components/application_screening';
import ApplicationDetailHealth from './components/application_detail_health';
import ApplicationDetailLifeAccident from './components/application_detail_lifeaccident';
import ApplicationDetailComprehensive from './components/application_detail_comprehensive';
import ProductEnrollment from './components/product_enrollment';
import Maintenance from './components/maintenance';
import AuditLogs from './components/audit_logs';
import logoImg from './assets/logo.png';

export interface ScreeningItem {
  id: string;
  payor: string;
  planCode: string;
  planDesc: string;
  premium: string;
  source: string;
  dateReceived: string;
  dateScreened: string;
  screenedBy: string;
  status: string;
}

const initialMockData: ScreeningItem[] = Array.from({ length: 45 }).map((_, i) => {
  const plans = [
    { code: 'HIP', desc: 'Plan 500 - Family', premium: '₱500.00' },
    { code: 'GLA', desc: '1 Unit', premium: '₱413.00' },
    { code: 'SSP', desc: 'Plan 100 - 10 years to pay', premium: '₱892.00' },
    { code: 'PHC', desc: 'Plan 1000 - Individual', premium: '₱1,000.00' },
    { code: 'GPR', desc: 'Plan 200', premium: '₱350.00' },
    { code: 'MPR', desc: 'Plan 300', premium: '₱600.00' }
  ];
  const plan = plans[i % plans.length];
  const day = 27 - (i % 5);
  
  return {
    id: `3920${(i + 1).toString().padStart(2, '0')}`,
    payor: ['Christian Bukid', 'Eleonora Sunga', 'Karlo Bautista', 'Lorena Tanguan', 'Juan Dela Cruz'][i % 5],
    planCode: plan.code,
    planDesc: plan.desc,
    premium: plan.premium,
    source: ['Google', 'Email Newsletter', 'Pd Site', 'Facebook'][i % 4],
    dateReceived: `08/${day.toString().padStart(2, '0')}/2026 at 12:${i.toString().padStart(2, '0')} PM`,
    dateScreened: i % 2 === 0 ? '08/28/2026' : '-',
    screenedBy: ['Juan Dela Cruz', 'Pedro Rodrigo', 'Oliver Rodrigo'][i % 3],
    status: i < 25 ? 'Received' : (i < 35 ? 'For Verification' : 'Issued')
  };
});

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [activeSubTab, setActiveSubTab] = useState('branch');
  const [selectedApp, setSelectedApp] = useState<{ id: string; planCode: string } | null>(null);
  const [darkMode, setDarkMode] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [screeningData, setScreeningData] = useState<ScreeningItem[]>(initialMockData);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode((prev) => !prev);

  if (!isAuthenticated) {
    return <Login onLoginSuccess={() => setIsAuthenticated(true)} darkMode={darkMode} setDarkMode={toggleDarkMode} />;
  }

  const handleUpdateStatus = (newStatus: string) => {
    if (!selectedApp) return;
    setScreeningData(prev => prev.map(app => 
      app.id === selectedApp.id ? { ...app, status: newStatus } : app
    ));
  };

  const renderApplicationDetail = () => {
    if (!selectedApp) return null;

    const healthPlans = ['HCP', 'HIP', 'PCP', 'PHC'];
    const lifeAccidentPlans = ['GLP', 'GLA', 'GPR'];
    const comprehensivePlans = ['MPR', 'SSP', 'PHP', 'DRE'];

    const currentApp = screeningData.find(a => a.id === selectedApp.id);
    const initialStatus = currentApp ? currentApp.status : 'Received';

    const props = {
      applicationId: selectedApp.id,
      planCode: selectedApp.planCode,
      initialStatus,
      onUpdateStatus: handleUpdateStatus,
      onBack: () => setSelectedApp(null)
    };

    if (healthPlans.includes(selectedApp.planCode)) return <ApplicationDetailHealth {...props} />;
    if (lifeAccidentPlans.includes(selectedApp.planCode)) return <ApplicationDetailLifeAccident {...props} />;
    if (comprehensivePlans.includes(selectedApp.planCode)) return <ApplicationDetailComprehensive {...props} />;
    
    return <ApplicationDetailHealth {...props} />;
  };

  return (
    <div className={`flex flex-col lg:flex-row h-screen overflow-hidden font-sans transition-colors duration-200 ${darkMode ? 'bg-slate-950' : 'bg-gray-50'}`}>
      <div className={`lg:hidden flex items-center justify-between px-4 py-3 border-b z-30 ${darkMode ? 'bg-slate-900 border-white/10' : 'bg-white border-gray-200'}`}>
        <div className="flex items-center space-x-3">
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 rounded-xl border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 cursor-pointer">
            <Menu className="h-5 w-5" />
          </button>
          <img src={logoImg} alt="Paramount Direct" className="h-8 w-auto" />
        </div>
        <button onClick={toggleDarkMode} className="p-2 rounded-xl border border-gray-200 dark:border-white/10 text-gray-600 dark:text-yellow-400 cursor-pointer">
          {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
      </div>

      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={(tab) => { 
          setActiveTab(tab); 
          setSelectedApp(null); // Resets detail view on menu click
        }} 
        activeSubTab={activeSubTab} 
        setActiveSubTab={setActiveSubTab} 
        onLogout={() => setIsAuthenticated(false)} 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
      />

      <main className="flex-1 overflow-y-auto">
        {activeTab === 'dashboard' && <Dashboard />}
        
        {/* Restored Application Inquiry Route */}
        {activeTab === 'inquiry' && (
          selectedApp ? renderApplicationDetail() : (
            <ApplicationInquiry 
              data={screeningData} 
              onSelectApplication={(id, planCode) => setSelectedApp({ id, planCode })} 
            />
          )
        )}

        {activeTab === 'maintenance' && (
          <Maintenance 
            activeSubTab={activeSubTab} 
            setActiveSubTab={setActiveSubTab} 
          />
        )}

        {activeTab === 'screening' && (
          selectedApp ? renderApplicationDetail() : (
            <ApplicationScreening 
              data={screeningData} 
              onSelectApplication={(id, planCode) => setSelectedApp({ id, planCode })} 
            />
          )
        )}

        {activeTab === 'audit' && <AuditLogs />}
      </main>
    </div>
  );
}