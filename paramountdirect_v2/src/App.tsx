import React, { useState, useEffect } from 'react';
import { Menu, Sun, Moon } from 'lucide-react';
import Login from './components/login';
import Sidebar, { type ProductLine } from './components/sidebar';
import Dashboard from './components/dashboard';
import OfwDashboard from './components/ofw_dashboard';
import OfwApplicationList from './components/ofw_application_list';
import OfwCreateApplication from './components/ofw_create_application';
import { OFW_STATUSES, type OfwApplication } from './components/ofw_types';
import CtplDashboard from './components/ctpl_dashboard';
import CtplApplicationList from './components/ctpl_application_list';
import CtplCreateApplication from './components/ctpl_create_application';
import { CTPL_STATUSES, type CtplApplication } from './components/ctpl_types';
import GtpDashboard from './components/gtp_dashboard';
import GtpApplicationList from './components/gtp_application_list';
import GtpCreateApplication from './components/gtp_create_application';
import { GTP_STATUSES, type GtpApplication } from './components/gtp_types';
import LifeApplicationsOverview from './components/life_applications_overview';
import LifeFollowupCalls from './components/life_followup_calls';
import LifeSignedApplications from './components/life_signed_applications';
import LifeScreenedApplications from './components/life_screened_applications';
import LifeFollowupSignature from './components/life_followup_signature';
import LifeApplicationStatuses from './components/life_application_statuses';
import ApplicationInquiry from './components/application_inquiry';
import ApplicationScreening from './components/application_screening';
import PdLifeApplicationsHub from './components/pdlife_applications_hub';
import PdLifeCreateApplication from './components/pdlife_create_application';
import type { PdLifeApplication } from './components/pdlife_types';
import ApplicationDetailHealth from './components/application_detail_health';
import ApplicationDetailLifeAccident from './components/application_detail_lifeaccident';
import ApplicationDetailComprehensive from './components/application_detail_comprehensive';
import PaymentTransactions from './components/payment_transactions';
import Billing from './components/billing';
import OfwPaymentTransactions from './components/ofw_payment_transactions';
import CtplPaymentTransactions from './components/ctpl_payment_transactions';
import GtpPaymentTransactions from './components/gtp_payment_transactions';
import Maintenance from './components/maintenance';
import UserManagement, { INITIAL_USERS, type UserAccount } from './components/user_management';
import RoleAccessMaintenance from './components/role_access_maintenance';
// Premium Maintenance removed from nav per request - see the commented-out
// render branch below and sidebar.tsx's commented-out 'premiums' nav entry.
// import PremiumMaintenance from './components/premium_maintenance';
import { INITIAL_PREMIUM_RATES, type PremiumRate } from './components/premium_rates';
import logoImg from './assets/PD Logo_full color.png';
import logoImgWhite from './assets/PD Logo_white.png';

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

// Fresh-environment reset: no seed applications, only the two retained
// accounts (see INITIAL_USERS in user_management.tsx). Set the length back
// above 0 to bring the demo dataset back.
const initialMockData: ScreeningItem[] = Array.from({ length: 0 }).map((_, i) => {
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

// Paramount Direct only sells the land-based OFW package - every mock
// applicant is Land-based, regardless of occupation.
const OFW_MOCK_APPLICANTS = [
  { firstName: 'Rosalinda', lastName: 'Gomez', occupation: 'Household/Domestic Worker', coverage: 'Land-based' as const, country: 'Saudi Arabia' },
  { firstName: 'Marlon', lastName: 'Reyes', occupation: 'Construction Worker', coverage: 'Land-based' as const, country: 'United Arab Emirates' },
  { firstName: 'Cristina', lastName: 'Villanueva', occupation: 'Service Worker', coverage: 'Land-based' as const, country: 'Qatar' },
  { firstName: 'Bayani', lastName: 'Ramos', occupation: 'Seafarers', coverage: 'Land-based' as const, country: 'Hong Kong' },
  { firstName: 'Precious', lastName: 'Manalo', occupation: 'Medical Professional', coverage: 'Land-based' as const, country: 'Singapore' },
  { firstName: 'Domingo', lastName: 'Cruz', occupation: 'Maritime Professional', coverage: 'Land-based' as const, country: 'Kuwait' },
  { firstName: 'Jocelyn', lastName: 'Ferrer', occupation: 'Household/Domestic Worker', coverage: 'Land-based' as const, country: 'Ukraine' },
  { firstName: 'Ramil', lastName: 'Torres', occupation: 'Factory Worker', coverage: 'Land-based' as const, country: 'Israel' },
];

const initialOfwMockData: OfwApplication[] = Array.from({ length: 0 }).map((_, i) => {
  const applicant = OFW_MOCK_APPLICANTS[i % OFW_MOCK_APPLICANTS.length];
  // Weighted so most applications sit in 'Received' (the common case), with
  // the terminal outcomes appearing occasionally.
  const statusCycle: typeof OFW_STATUSES[number][] = [
    'Received', 'Received', 'Received', 'Cancelled', 'Received', 'Duplicate', 'Received', 'Reversed',
  ];
  const status = statusCycle[i % statusCycle.length];
  const isConflictZone = ['Ukraine', 'Israel', 'Yemen', 'Syria'].includes(applicant.country);
  const day = 27 - (i % 5);

  return {
    id: `800${(10000 + i).toString()}`,
    lastName: applicant.lastName,
    firstName: applicant.firstName,
    middleName: 'Santos',
    gender: (i % 2 === 0 ? 'Male' : 'Female') as 'Male' | 'Female',
    civilStatus: 'Single' as const,
    birthdate: '1990-05-15',
    placeOfBirth: 'Manila',
    phAddress: '123 Rizal Street',
    phRegion: 'NCR - National Capital Region',
    phCity: 'Manila City',
    phBarangay: 'N/A',
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
    beneficiaries: [{ fullName: `${applicant.lastName} Beneficiary`, relationship: 'Spouse', birthdate: '1992-03-10' }],
    isConflictZone,
    documents: {
      passport: i % 4 !== 0 ? 'Uploaded' as const : 'Missing' as const,
      visa: i % 5 !== 0 ? 'Uploaded' as const : 'Missing' as const,
      employmentContract: 'Uploaded' as const,
      medicalCertificate: i % 3 !== 0 ? 'Uploaded' as const : 'Missing' as const,
    },
    premium: '$42.00',
    dateReceived: `09/${day.toString().padStart(2, '0')}/2026`,
    status,
    screenedBy: ['Juan Dela Cruz', 'Pedro Rodrigo', 'Oliver Rodrigo'][i % 3],
    // A few rows carry the full verify -> instruction -> paid flow through to
    // completion so the Documents section has something to demo unlocked.
    employmentVerified: (i % 4 === 0 ? 'Yes' : i % 7 === 0 ? 'No' : 'Pending') as 'Pending' | 'Yes' | 'No',
    paymentInstructionSent: i % 4 === 0,
    isPaid: i % 8 === 0,
  };
});

const CTPL_MOCK_OWNERS = [
  { firstName: 'Ricardo', surname: 'Santos', policyType: 'Private Car' as const, mvType: 'Car', premium: 606 },
  { firstName: 'Ligaya', surname: 'Fernandez', policyType: 'Private Car' as const, mvType: 'Sports Utility Vehicle', premium: 730 },
  { firstName: 'Bayani', surname: 'Cruz', policyType: 'Motorcycle' as const, mvType: 'Motorcycle', premium: 260 },
  { firstName: 'Corazon', surname: 'Aquino', policyType: 'Commercial Vehicle' as const, mvType: 'Utility Vehicle', premium: 850 },
  { firstName: 'Emmanuel', surname: 'Bautista', policyType: 'Private Car' as const, mvType: 'Car', premium: 606 },
  { firstName: 'Divina', surname: 'Ramos', policyType: 'Commercial Vehicle' as const, mvType: 'Truck', premium: 1200 },
];

const initialCtplMockData: CtplApplication[] = Array.from({ length: 0 }).map((_, i) => {
  const owner = CTPL_MOCK_OWNERS[i % CTPL_MOCK_OWNERS.length];
  const statusCycle: typeof CTPL_STATUSES[number][] = [
    'Completed', 'Completed', 'Completed', 'Cancelled', 'Completed', 'Spoiled', 'Completed', 'Duplicate', 'Completed', 'Reversed',
  ];
  const status = statusCycle[i % statusCycle.length];
  const day = 27 - (i % 5);

  return {
    id: `MCOC${(1000000 + i).toString()}`,
    policyType: owner.policyType,
    mvType: owner.mvType,
    renewalType: (i % 4 === 0 ? 'Renewal' : 'New (1 Year)') as 'New (1 Year)' | 'Renewal',
    clientType: 'Individual' as const,
    ownerFirstName: owner.firstName,
    ownerMiddleName: 'M',
    ownerSurname: owner.surname,
    ownerAddress: '123 Rizal Street',
    ownerRegion: 'NCR - National Capital Region',
    ownerCity: 'Manila City',
    ownerBarangay: 'N/A',
    sameAsOwner: true,
    applicantFirstName: owner.firstName,
    applicantSurname: owner.surname,
    email: `${owner.firstName.toLowerCase()}.${owner.surname.toLowerCase()}@example.com`,
    mobileNumber: '09171234567',
    plateNumber: `ABC${1000 + i}`.slice(0, 7),
    mvFileNumber: `1301-0000${(1000000 + i).toString().slice(-7)}`,
    chassisNumber: `JT4BR38J2R${(100000 + i).toString().padStart(6, '0')}`,
    requiresCOV: i % 5 === 0,
    premium: `₱${owner.premium.toFixed(2)}`,
    dateReceived: `09/${day.toString().padStart(2, '0')}/2026`,
    status,
    screenedBy: ['Juan Dela Cruz', 'Pedro Rodrigo', 'Oliver Rodrigo'][i % 3],
    // Straight-through website payment - some mock rows are left unpaid so
    // the Documents section has both locked and unlocked rows to demo.
    isPaid: i % 3 !== 0,
  };
});

const GTP_MOCK_TRAVELERS = [
  { firstName: 'Camille', surname: 'Reyes', destinations: ['Japan'], type: 'Individual' as const, plan: 'Single Trip' as const },
  { firstName: 'Miguel', surname: 'Torres', destinations: ['United States'], type: 'Family' as const, plan: 'Multi-Trip 90' as const },
  { firstName: 'Angelica', surname: 'Santos', destinations: ['Hong Kong'], type: 'Individual' as const, plan: 'Single Trip' as const },
  { firstName: 'Paolo', surname: 'Villanueva', destinations: ['South Korea'], type: 'Individual' as const, plan: 'Multi-Trip 180' as const },
  { firstName: 'Bianca', surname: 'Gomez', destinations: ['France', 'Italy'], type: 'Family' as const, plan: 'Single Trip' as const },
  { firstName: 'Diego', surname: 'Ramos', destinations: ['Thailand'], type: 'Individual' as const, plan: 'Single Trip' as const },
];

const initialGtpMockData: GtpApplication[] = Array.from({ length: 0 }).map((_, i) => {
  const traveler = GTP_MOCK_TRAVELERS[i % GTP_MOCK_TRAVELERS.length];
  const statusCycle: typeof GTP_STATUSES[number][] = ['Received', 'Received', 'Received', 'Cancelled', 'Received', 'Duplicate'];
  const status = statusCycle[i % statusCycle.length];
  const isSchengenDestination = traveler.destinations.some((d) => ['France', 'Italy'].includes(d));
  const day = 27 - (i % 5);
  const days = 7 + (i % 3) * 3;

  return {
    id: `GTPH-${(100000 + i).toString()}`,
    travelType: 'International' as const,
    destinations: traveler.destinations,
    departureDate: '10/01/2026',
    returnDate: `10/${(1 + days).toString().padStart(2, '0')}/2026`,
    daysOfTravel: days,
    applicationType: traveler.type,
    travelerFirstName: traveler.firstName,
    travelerSurname: traveler.surname,
    birthdate: '1992-06-15',
    email: `${traveler.firstName.toLowerCase()}.${traveler.surname.toLowerCase()}@example.com`,
    mobileNumber: '09171234567',
    planVariant: traveler.plan,
    cruiseCoverage: i % 6 === 0,
    hazardousSportsCoverage: i % 7 === 0,
    isSchengenDestination,
    premium: `₱${(days * 55).toFixed(2)}`,
    dateReceived: `09/${day.toString().padStart(2, '0')}/2026`,
    status,
    screenedBy: ['Juan Dela Cruz', 'Pedro Rodrigo', 'Oliver Rodrigo'][i % 3],
    // Straight-through website payment - some mock rows are left unpaid so
    // the Documents section has both locked and unlocked rows to demo.
    isPaid: i % 3 !== 0,
  };
});

// Auth is otherwise pure in-memory React state, which a page refresh always
// wipes - persisting a flag here is what makes "Remember me" (localStorage,
// survives closing the browser) vs. a plain login (sessionStorage, survives
// a refresh but not closing the tab) actually do something.
const AUTH_STORAGE_KEY = 'pd_authenticated';
// Persisted the same way as AUTH_STORAGE_KEY - the logged-in user's role
// drives role-gated UI (e.g. the Cashier-only Create button on Non-Life
// Payment Transactions), so it needs to survive a refresh the same way the
// auth flag does.
const ROLE_STORAGE_KEY = 'pd_current_user_role';

function readStoredAuth(): boolean {
  try {
    return localStorage.getItem(AUTH_STORAGE_KEY) === '1' || sessionStorage.getItem(AUTH_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

function readStoredRole(): string | null {
  try {
    return localStorage.getItem(ROLE_STORAGE_KEY) || sessionStorage.getItem(ROLE_STORAGE_KEY);
  } catch {
    return null;
  }
}

// Which product/tab/sub-tab is showing - kept in sessionStorage (not
// localStorage) so a reload lands back on the same page instead of resetting
// to the dashboard, but a fresh browser session still starts there.
const NAV_STORAGE_KEY = 'pd_active_nav';

interface StoredNav {
  product: ProductLine;
  tab: string;
  subTab: string;
}

function readStoredNav(): StoredNav | null {
  try {
    const raw = sessionStorage.getItem(NAV_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredNav) : null;
  } catch {
    return null;
  }
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(readStoredAuth);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(readStoredRole);
  const storedNav = readStoredNav();
  const [activeProduct, setActiveProduct] = useState<ProductLine>(storedNav?.product ?? 'PD Life');
  const [activeTab, setActiveTab] = useState(storedNav?.tab ?? 'dashboard');
  const [activeSubTab, setActiveSubTab] = useState(storedNav?.subTab ?? 'users');
  const [selectedApp, setSelectedApp] = useState<{ id: string; planCode: string } | null>(null);
  const [darkMode, setDarkMode] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [screeningData, setScreeningData] = useState<ScreeningItem[]>(initialMockData);
  // Shared between Follow-up Signature and Signed Applications - both pages
  // show/act on the same "has the client's signed form been received back"
  // state for a given issued policy, so marking it signed from either page
  // needs to be visible on the other.
  const [signedFollowUpIds, setSignedFollowUpIds] = useState<string[]>([]);
  const handleMarkSigned = (id: string) => {
    setSignedFollowUpIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  };
  const [ofwApplications, setOfwApplications] = useState<OfwApplication[]>(initialOfwMockData);
  const [isCreatingOfwApp, setIsCreatingOfwApp] = useState(false);
  const [ctplApplications, setCtplApplications] = useState<CtplApplication[]>(initialCtplMockData);
  const [isCreatingCtplApp, setIsCreatingCtplApp] = useState(false);
  const [gtpApplications, setGtpApplications] = useState<GtpApplication[]>(initialGtpMockData);
  const [isCreatingGtpApp, setIsCreatingGtpApp] = useState(false);
  const [isCreatingPdLifeApp, setIsCreatingPdLifeApp] = useState(false);
  const [premiumRates, setPremiumRates] = useState<PremiumRate[]>(INITIAL_PREMIUM_RATES);
  // Lifted out of UserManagement so Login can validate against real
  // provisioned accounts, not just the hardcoded admin/noaccess demo logins.
  const [users, setUsers] = useState<UserAccount[]>(INITIAL_USERS);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  useEffect(() => {
    try {
      sessionStorage.setItem(NAV_STORAGE_KEY, JSON.stringify({ product: activeProduct, tab: activeTab, subTab: activeSubTab }));
    } catch {
      // ignore - worst case a reload just falls back to the dashboard
    }
  }, [activeProduct, activeTab, activeSubTab]);

  const toggleDarkMode = () => setDarkMode((prev) => !prev);

  const handleLoginSuccess = (rememberMe: boolean, role: string) => {
    try {
      (rememberMe ? localStorage : sessionStorage).setItem(AUTH_STORAGE_KEY, '1');
      (rememberMe ? localStorage : sessionStorage).setItem(ROLE_STORAGE_KEY, role);
    } catch {
      // Private-browsing/storage-disabled contexts can throw - login still
      // works for the current in-memory session, it just won't survive a refresh.
    }
    setCurrentUserRole(role);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      sessionStorage.removeItem(AUTH_STORAGE_KEY);
      localStorage.removeItem(ROLE_STORAGE_KEY);
      sessionStorage.removeItem(ROLE_STORAGE_KEY);
      sessionStorage.removeItem(NAV_STORAGE_KEY);
    } catch {
      // See handleLoginSuccess.
    }
    setCurrentUserRole(null);
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return <Login onLoginSuccess={handleLoginSuccess} darkMode={darkMode} setDarkMode={toggleDarkMode} users={users} />;
  }

  const handleUpdateStatus = (newStatus: string) => {
    if (!selectedApp) return;
    setScreeningData(prev => prev.map(app => 
      app.id === selectedApp.id ? { ...app, status: newStatus } : app
    ));
  };

  const renderApplicationDetail = (readOnly: boolean = false) => {
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
      onBack: () => setSelectedApp(null),
      readOnly
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
          <img src={darkMode ? logoImgWhite : logoImg} alt="Paramount Direct" className="h-8 w-auto" />
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
          setIsCreatingCtplApp(false);
          setIsCreatingGtpApp(false);
          setIsCreatingPdLifeApp(false);
        }}
        activeSubTab={activeSubTab} 
        setActiveSubTab={setActiveSubTab} 
        onLogout={handleLogout}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        currentUserName={CURRENT_USER.name}
        currentUserEmail={CURRENT_USER.email}
        activeProduct={activeProduct}
        setActiveProduct={setActiveProduct}
        darkMode={darkMode}
        onToggleDarkMode={toggleDarkMode}
      />

      {/* Primary Main Content View */}
      <main className="flex-1 overflow-y-auto">
        {activeTab === 'dashboard' && <Dashboard />}

        {/* Life Statistics */}
        {activeTab === 'life-monthly' && <LifeApplicationsOverview period="Monthly" />}
        {activeTab === 'life-daily' && <LifeApplicationsOverview period="Daily" />}
        {activeTab === 'life-followup-calls' && <LifeFollowupCalls />}
        {activeTab === 'life-signed' && <LifeSignedApplications data={screeningData} signedIds={signedFollowUpIds} onMarkSigned={handleMarkSigned} />}
        {activeTab === 'life-screened' && <LifeScreenedApplications data={screeningData} />}
        {activeTab === 'life-followup-signature' && <LifeFollowupSignature data={screeningData} signedIds={signedFollowUpIds} onMarkSigned={handleMarkSigned} />}
        {activeTab === 'life-application-statuses' && <LifeApplicationStatuses />}

        {/* OFW Dashboard */}
        {activeTab === 'ofw-dashboard' && <OfwDashboard />}

        {/* OFW Applications */}
        {activeTab === 'ofw-applications' && (
          isCreatingOfwApp ? (
            <OfwCreateApplication
              currentUser={CURRENT_USER.name}
              onBack={() => setIsCreatingOfwApp(false)}
              onCreate={(app) => setOfwApplications(prev => [app, ...prev])}
              rates={premiumRates}
            />
          ) : (
            <OfwApplicationList
              data={ofwApplications}
              onCreateNew={() => setIsCreatingOfwApp(true)}
              onUpdate={(id, patch) => setOfwApplications(prev => prev.map(app => app.id === id ? { ...app, ...patch } : app))}
            />
          )
        )}

        {/* OFW Payment Transactions */}
        {activeTab === 'ofw-payments' && <OfwPaymentTransactions data={ofwApplications} />}

        {/* CTPL Dashboard */}
        {activeTab === 'ctpl-dashboard' && <CtplDashboard />}

        {/* CTPL Applications */}
        {activeTab === 'ctpl-applications' && (
          isCreatingCtplApp ? (
            <CtplCreateApplication
              currentUser={CURRENT_USER.name}
              onBack={() => setIsCreatingCtplApp(false)}
              onCreate={(app) => setCtplApplications(prev => [app, ...prev])}
              rates={premiumRates}
            />
          ) : (
            <CtplApplicationList
              data={ctplApplications}
              onCreateNew={() => setIsCreatingCtplApp(true)}
              onUpdate={(id, patch) => setCtplApplications(prev => prev.map(app => app.id === id ? { ...app, ...patch } : app))}
            />
          )
        )}

        {/* CTPL Payment Transactions */}
        {activeTab === 'ctpl-payments' && <CtplPaymentTransactions data={ctplApplications} />}

        {/* GTP Dashboard */}
        {activeTab === 'gtp-dashboard' && <GtpDashboard />}

        {/* GTP Applications */}
        {activeTab === 'gtp-applications' && (
          isCreatingGtpApp ? (
            <GtpCreateApplication
              currentUser={CURRENT_USER.name}
              onBack={() => setIsCreatingGtpApp(false)}
              onCreate={(app) => setGtpApplications(prev => [app, ...prev])}
              rates={premiumRates}
            />
          ) : (
            <GtpApplicationList
              data={gtpApplications}
              onCreateNew={() => setIsCreatingGtpApp(true)}
              onUpdate={(id, patch) => setGtpApplications(prev => prev.map(app => app.id === id ? { ...app, ...patch } : app))}
            />
          )
        )}

        {/* GTP Payment Transactions */}
        {activeTab === 'gtp-payments' && <GtpPaymentTransactions data={gtpApplications} />}

        {/* Applications hub */}
        {activeTab === 'applications' && (
          <PdLifeApplicationsHub data={screeningData} onNavigate={setActiveTab} />
        )}

        {/* Application Inquiry */}
        {activeTab === 'inquiry' && (
          selectedApp ? renderApplicationDetail(true) : isCreatingPdLifeApp ? (
            <PdLifeCreateApplication
              currentUser={CURRENT_USER.name}
              onBack={() => setIsCreatingPdLifeApp(false)}
              onCreate={(app: PdLifeApplication) => setScreeningData(prev => [app, ...prev])}
              rates={premiumRates}
            />
          ) : (
            <ApplicationInquiry
              data={screeningData}
              onSelectApplication={(id, planCode) => setSelectedApp({ id, planCode })}
              onCreateNew={() => setIsCreatingPdLifeApp(true)}
            />
          )
        )}

        {/* Payment Transactions & Ledger */}
        {activeTab === 'payments' && (
          <PaymentTransactions
            ctplApplications={ctplApplications}
            ofwApplications={ofwApplications}
            gtpApplications={gtpApplications}
            currentUserRole={currentUserRole}
          />
        )}
        {activeTab === 'billing' && <Billing />}

        {/* Maintenance Sub-module Views */}
        {activeTab === 'maintenance' && (
          activeSubTab === 'users' ? (
            <UserManagement users={users} setUsers={setUsers} />
          ) : activeSubTab === 'roles' ? (
            <RoleAccessMaintenance />
          // Premium Maintenance removed from nav per request - see
          // sidebar.tsx's commented-out 'premiums' entry. Left here
          // commented rather than deleted in case it's needed again.
          // ) : activeSubTab === 'premiums' ? (
          //   <PremiumMaintenance rates={premiumRates} onSave={setPremiumRates} />
          ) : (
            <Maintenance 
              activeSubTab={activeSubTab} 
              setActiveSubTab={setActiveSubTab} 
            />
          )
        )}

        {/* Application Screening */}
        {activeTab === 'screening' && (
          selectedApp ? renderApplicationDetail() : isCreatingPdLifeApp ? (
            <PdLifeCreateApplication
              currentUser={CURRENT_USER.name}
              onBack={() => setIsCreatingPdLifeApp(false)}
              onCreate={(app: PdLifeApplication) => setScreeningData(prev => [app, ...prev])}
              rates={premiumRates}
            />
          ) : (
            <ApplicationScreening
              data={screeningData}
              onSelectApplication={(id, planCode) => setSelectedApp({ id, planCode })}
              currentUser={CURRENT_USER.name}
              onCreateNew={() => setIsCreatingPdLifeApp(true)}
            />
          )
        )}
      </main>
    </div>
  );
}