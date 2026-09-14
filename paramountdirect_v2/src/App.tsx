import React, { useState, useEffect } from 'react';
import { Menu, Sun, Moon } from 'lucide-react';
import Login from './components/login';
import Sidebar, { type ProductLine } from './components/sidebar';
import Dashboard from './components/dashboard';
import OfwDashboard from './components/ofw_dashboard';
import OfwApplicationList from './components/ofw_application_list';
import OfwCreateApplication from './components/ofw_create_application';
import type { OfwApplication } from './components/ofw_types';
import ApplicationInquiry from './components/application_inquiry';
import ApplicationScreening from './components/application_screening';
import ApplicationDetailHealth from './components/application_detail_health';
import ApplicationDetailLifeAccident from './components/application_detail_lifeaccident';
import ApplicationDetailComprehensive from './components/application_detail_comprehensive';
import PaymentTransactions from './components/payment_transactions';
import Maintenance from './components/maintenance';
import UserManagement from './components/user_management';
import RoleAccessMaintenance from './components/role_access_maintenance';
import logoImg from './assets/logo.png';

const CURRENT_USER = {
  name: 'Juan Dela Cruz',
  email: 'juan.delacruz@paramount.com.ph'
};

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
  const screeners = ['Juan Dela Cruz', 'Pedro Rodrigo', 'Oliver Rodrigo'];
  // Offset by the plan cycle count so screeners rotate across every plan type
  // instead of each plan permanently pinning to one screener (plans.length is
  // a multiple of screeners.length, so `i % screeners.length` alone would be
  // fully determined by `i % plans.length`).
  const screenerIndex = (i + Math.floor(i / plans.length)) % screeners.length;

  return {
    id: `3920${(i + 1).toString().padStart(2, '0')}`,
    payor: ['Christian Bukid', 'Eleonora Sunga', 'Karlo Bautista', 'Lorena Tanguan', 'Juan Dela Cruz'][i % 5],
    planCode: plan.code,
    planDesc: plan.desc,
    premium: plan.premium,
    source: ['Google', 'Email Newsletter', 'Pd Site', 'Facebook'][i % 4],
    dateReceived: `08/${day.toString().padStart(2, '0')}/2026 at 12:${i.toString().padStart(2, '0')} PM`,
    dateScreened: i % 2 === 0 ? '08/28/2026' : '-',
    screenedBy: screeners[screenerIndex],
    status: i < 25 ? 'Received' : (i < 35 ? 'For Verification' : 'Issued')
  };
});

const OFW_MOCK_APPLICANTS = [
  { firstName: 'Rosalinda', lastName: 'Gomez', occupation: 'Household/Domestic Worker', coverage: 'Land-based' as const, country: 'Saudi Arabia' },
  { firstName: 'Marlon', lastName: 'Reyes', occupation: 'Construction Worker', coverage: 'Land-based' as const, country: 'United Arab Emirates' },
  { firstName: 'Cristina', lastName: 'Villanueva', occupation: 'Service Worker', coverage: 'Land-based' as const, country: 'Qatar' },
  { firstName: 'Bayani', lastName: 'Ramos', occupation: 'Seafarers', coverage: 'Sea-based' as const, country: 'Hong Kong' },
  { firstName: 'Precious', lastName: 'Manalo', occupation: 'Medical Professional', coverage: 'Land-based' as const, country: 'Singapore' },
  { firstName: 'Domingo', lastName: 'Cruz', occupation: 'Maritime Professional', coverage: 'Sea-based' as const, country: 'Kuwait' },
  { firstName: 'Jocelyn', lastName: 'Ferrer', occupation: 'Household/Domestic Worker', coverage: 'Land-based' as const, country: 'Ukraine' },
  { firstName: 'Ramil', lastName: 'Torres', occupation: 'Factory Worker', coverage: 'Land-based' as const, country: 'Israel' },
];

const initialOfwMockData: OfwApplication[] = Array.from({ length: 24 }).map((_, i) => {
  const applicant = OFW_MOCK_APPLICANTS[i % OFW_MOCK_APPLICANTS.length];
  const statuses = ['Received', 'For Verification', 'For Evaluation', 'Paid', 'Issued'] as const;
  const status = statuses[i % statuses.length];
  const isConflictZone = ['Ukraine', 'Israel', 'Yemen', 'Syria'].includes(applicant.country);
  const day = 27 - (i % 5);

  return {
    id: `OFW1${(1000 + i).toString()}`,
    lastName: applicant.lastName,
    firstName: applicant.firstName,
    middleName: 'Santos',
    gender: (i % 2 === 0 ? 'Male' : 'Female') as 'Male' | 'Female',
    civilStatus: 'Single' as const,
    birthdate: '1990-05-15',
    placeOfBirth: 'Manila',
    phAddress: '123 Rizal Street',
    phCity: 'Manila City',
    phone: '09171234567',
    email: `${applicant.firstName.toLowerCase()}.${applicant.lastName.toLowerCase()}@example.com`,
    referralSource: ['Facebook', 'Google', 'Paramount Website', 'POEA/POLO', 'Referral'][i % 5],
    natureOfEmployment: (i % 3 === 0 ? 'Balik-Manggagawa' : 'Direct-hired') as 'Direct-hired' | 'Balik-Manggagawa',
    coverageType: applicant.coverage,
    occupation: applicant.occupation,
    passportNumber: `P${1000000 + i}`,
    salaryAmount: 500 + i * 25,
    salaryCurrency: 'USD' as const,
    employerName: `${applicant.country} Manpower Services`,
    employerCountry: applicant.country,
    contractStart: '2026-01-01',
    contractEnd: '2028-01-01',
    insuranceStart: '2026-01-01',
    isConflictZone,
    documents: {
      passport: i % 4 !== 0 ? 'Uploaded' as const : 'Missing' as const,
      visa: i % 5 !== 0 ? 'Uploaded' as const : 'Missing' as const,
      employmentContract: 'Uploaded' as const,
      medicalCertificate: i % 3 !== 0 ? 'Uploaded' as const : 'Missing' as const,
    },
    premium: applicant.coverage === 'Sea-based' ? '$58.00' : '$42.00',
    dateReceived: `09/${day.toString().padStart(2, '0')}/2026`,
    status,
    screenedBy: ['Juan Dela Cruz', 'Pedro Rodrigo', 'Oliver Rodrigo'][i % 3],
  };
});

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeProduct, setActiveProduct] = useState<ProductLine>('PD Life');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [activeSubTab, setActiveSubTab] = useState('users');
  const [selectedApp, setSelectedApp] = useState<{ id: string; planCode: string } | null>(null);
  const [darkMode, setDarkMode] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [screeningData, setScreeningData] = useState<ScreeningItem[]>(initialMockData);
  const [ofwApplications, setOfwApplications] = useState<OfwApplication[]>(initialOfwMockData);
  const [isCreatingOfwApp, setIsCreatingOfwApp] = useState(false);

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
      
      {/* Mobile Top Header */}
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

      {/* Main Sidebar */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={(tab) => {
          setActiveTab(tab);
          setSelectedApp(null); // Resets detail view on menu navigation
          setIsCreatingOfwApp(false);
        }}
        activeSubTab={activeSubTab} 
        setActiveSubTab={setActiveSubTab} 
        onLogout={() => setIsAuthenticated(false)}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        currentUserName={CURRENT_USER.name}
        currentUserEmail={CURRENT_USER.email}
        activeProduct={activeProduct}
        setActiveProduct={setActiveProduct}
      />

      {/* Primary Main Content View */}
      <main className="flex-1 overflow-y-auto">
        {activeTab === 'dashboard' && <Dashboard />}

        {/* OFW Dashboard */}
        {activeTab === 'ofw-dashboard' && <OfwDashboard />}

        {/* OFW Applications */}
        {activeTab === 'ofw-applications' && (
          isCreatingOfwApp ? (
            <OfwCreateApplication
              currentUser={CURRENT_USER.name}
              onBack={() => setIsCreatingOfwApp(false)}
              onCreate={(app) => setOfwApplications(prev => [app, ...prev])}
            />
          ) : (
            <OfwApplicationList
              data={ofwApplications}
              onCreateNew={() => setIsCreatingOfwApp(true)}
            />
          )
        )}

        {/* Application Inquiry */}
        {activeTab === 'inquiry' && (
          selectedApp ? renderApplicationDetail() : (
            <ApplicationInquiry 
              data={screeningData} 
              onSelectApplication={(id, planCode) => setSelectedApp({ id, planCode })} 
            />
          )
        )}

        {/* Payment Transactions & Ledger */}
        {activeTab === 'payments' && <PaymentTransactions />}

        {/* Maintenance Sub-module Views */}
        {activeTab === 'maintenance' && (
          activeSubTab === 'users' ? (
            <UserManagement />
          ) : activeSubTab === 'roles' ? (
            <RoleAccessMaintenance />
          ) : (
            <Maintenance 
              activeSubTab={activeSubTab} 
              setActiveSubTab={setActiveSubTab} 
            />
          )
        )}

        {/* Application Screening */}
        {activeTab === 'screening' && (
          selectedApp ? renderApplicationDetail() : (
            <ApplicationScreening
              data={screeningData}
              onSelectApplication={(id, planCode) => setSelectedApp({ id, planCode })}
              currentUser={CURRENT_USER.name}
            />
          )
        )}
      </main>
    </div>
  );
}