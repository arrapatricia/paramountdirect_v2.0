import React, { useState } from 'react';
import { 
  CreditCard, 
  Search, 
  Eye, 
  History, 
  Edit3, 
  X, 
  ShieldCheck,
  Receipt,
  Save,
  FileText,
  Send,
  Printer,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  ExternalLink,
  LayoutGrid,
  List,
  User,
  Calendar,
  Tag,
  CheckSquare,
  Square,
  FileSpreadsheet
} from 'lucide-react';

import serviceInvoicePdf from '../assets/ELECTRONIC_SERVICE INVOICE_DMLIFE_withFields_12232025.pdf';

export interface PaymentLedgerItem {
  yrInstal: string;
  dueDate: string;
  uploaded: number;
  amountPaid: number;
  underpay: number;
  orNumber: string;
  orDate: string;
  status: string;
}

export interface PaymentTransaction {
  policyNo: string;
  title: string;
  firstName: string;
  middleName: string;
  lastName: string;
  birthdate: string;
  gender: string;
  currentAge: number;
  issueAge: number;
  address: string;
  mobileNumber: string;
  telephoneNumber: string;
  emailAddress: string;

  policyStatus: 'Inforced' | 'Lapsed' | 'Terminated' | 'Matured' | 'Involuntary' | 'Voluntary' | 'Surrender';
  hcrStatus: string;
  hcrUnit: string;
  premium: number;
  hcrPremium: number;
  deposit: number;
  underpay: number;
  dueDate: string;
  payType: string;
  cashValue: number;
  lifeBenefits: number;
  accidentalBenefits: number;
  mode: string;
  issueDate: string;
  effectivityDate: string;
  policyDate: string;
  expiryDate: string;

  planCode: string;
  planDesc: string;
  orDate: string;
  orNumber: string;
  
  ledgerHistory: PaymentLedgerItem[];
}

const ITEMS_PER_PAGE = 25;

const generateFullYearLedger = (premiumAmt: number, orNo: string, overallStatus: string): PaymentLedgerItem[] => {
  const months = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
  return months.map((m, idx) => {
    const isFirst = idx === 0;
    let itemStatus = 'Inforced';
    let paidAmt = premiumAmt;
    let currentOr = isFirst ? orNo : `500000000${(198 + idx).toString()}`;
    let currentOrDate = `2026-${m}-06`;

    if (overallStatus === 'Lapsed' && idx >= 3) {
      itemStatus = 'Lapsed';
      paidAmt = 0;
      currentOr = '-';
      currentOrDate = '-';
    } else if (overallStatus === 'Matured') {
      itemStatus = idx === 11 ? 'Matured' : 'Inforced';
    }

    return {
      yrInstal: isFirst ? 'IP' : `01-${m}`,
      dueDate: `2026-${m}-28`,
      uploaded: premiumAmt,
      amountPaid: paidAmt,
      underpay: overallStatus === 'Lapsed' && idx >= 3 ? premiumAmt : 0,
      orNumber: currentOr,
      orDate: currentOrDate,
      status: itemStatus
    };
  });
};

const INITIAL_TRANSACTIONS: PaymentTransaction[] = Array.from({ length: 32 }).map((_, i) => {
  const names = [
    { first: 'JUAN', last: 'DELA CRUZ', policy: 'HIP-008001-0', plan: 'HIP', desc: 'Hospital Income Benefit Plan', prem: 500.00 },
    { first: 'PEDRO', last: 'SAN JUAN JR', policy: 'GLA-007727-0', plan: 'GLA', desc: 'Golden Life Advantage Plan', prem: 413.00 },
    { first: 'KARLO', last: 'BAUTISTA', policy: 'SSP-001244-0', plan: 'SSP', desc: 'Sure Savings Plan', prem: 892.00 },
    { first: 'LORENA', last: 'TANGUAN', policy: 'PHC-003310-2', plan: 'PHC', desc: 'Premium HealthCare Plus', prem: 1000.00 }
  ];
  const p = names[i % names.length];

  let statusType: PaymentTransaction['policyStatus'] = 'Inforced';
  let customPolicyNo = `${p.plan}-00${(8000 + i).toString()}-0`;

  if (i === 0) {
    customPolicyNo = 'HIP-008001-0';
    statusType = 'Inforced';
  } else if (i === 1 || i === 7 || i === 14) {
    statusType = 'Lapsed';
  } else if (i === 3 || i === 10) {
    statusType = 'Matured';
  }

  return {
    policyNo: customPolicyNo,
    title: 'Mr',
    firstName: p.first,
    middleName: 'C',
    lastName: p.last,
    birthdate: '1987-01-13',
    gender: 'Male',
    currentAge: 39,
    issueAge: 40,
    address: 'RUFINO ST, SAN LORENZO MAKATI CITY, 1229 METRO MANILA',
    mobileNumber: '09055656157',
    telephoneNumber: '',
    emailAddress: `${p.first.toLowerCase()}@paramount.com.ph`,

    policyStatus: statusType,
    hcrStatus: '0',
    hcrUnit: '0',
    premium: p.prem,
    hcrPremium: 0,
    deposit: 0,
    underpay: statusType === 'Lapsed' ? p.prem : 0,
    dueDate: statusType === 'Lapsed' ? '2026-04-28' : '2026-09-28',
    payType: 'INDIVIDUAL',
    cashValue: statusType === 'Matured' ? 50000.00 : 0,
    lifeBenefits: 75000.00,
    accidentalBenefits: 75000.00,
    mode: 'Monthly',
    issueDate: '2026-08-03',
    effectivityDate: '2026-08-06',
    policyDate: '2026-08-28',
    expiryDate: statusType === 'Matured' ? '2026-08-28' : '2086-08-28',

    planCode: p.plan,
    planDesc: p.desc,
    orDate: statusType === 'Lapsed' ? '04/06/2026' : '08/06/2026',
    orNumber: statusType === 'Lapsed' ? '-' : `5000000000${(198 + i).toString()}`,
    ledgerHistory: generateFullYearLedger(p.prem, `5000000000${(198 + i).toString()}`, statusType)
  };
});

export default function PaymentTransactions() {
  const [transactions, setTransactions] = useState<PaymentTransaction[]>(INITIAL_TRANSACTIONS);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedProduct, setSelectedProduct] = useState<string>('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  const [selectedMainPolicyNos, setSelectedMainPolicyNos] = useState<string[]>([]);
  const [selectedLedgerInstalCodes, setSelectedLedgerInstalCodes] = useState<string[]>([]);

  // Modals
  const [activeLedgerPolicy, setActiveLedgerPolicy] = useState<PaymentTransaction | null>(null);
  const [activeDetailPolicy, setActiveDetailPolicy] = useState<PaymentTransaction | null>(null);
  const [printHistoryPolicy, setPrintHistoryPolicy] = useState<PaymentTransaction | null>(null);
  
  const [selectedInvoiceItem, setSelectedInvoiceItem] = useState<{
    policy: PaymentTransaction;
    ledger: PaymentLedgerItem;
    batchCount?: number;
  } | null>(null);

  const [notification, setNotification] = useState<string | null>(null);
  const [isEditingPolicy, setIsEditingPolicy] = useState(false);
  const [formData, setFormData] = useState<Partial<PaymentTransaction>>({});

  const filteredData = transactions.filter((t) => {
    const payorFullName = `${t.firstName} ${t.lastName}`;
    const matchesSearch = 
      t.policyNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payorFullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.orNumber.includes(searchTerm);

    const matchesStatus = selectedStatus === 'All' || t.policyStatus === selectedStatus;
    const matchesProduct = selectedProduct === 'All' || t.planCode === selectedProduct;

    return matchesSearch && matchesStatus && matchesProduct;
  });

  const totalItems = filteredData.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  const paginatedData = filteredData.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handleSelectAllMain = () => {
    if (selectedMainPolicyNos.length === paginatedData.length) {
      setSelectedMainPolicyNos([]);
    } else {
      setSelectedMainPolicyNos(paginatedData.map(p => p.policyNo));
    }
  };

  const handleToggleMainPolicy = (policyNo: string) => {
    if (selectedMainPolicyNos.includes(policyNo)) {
      setSelectedMainPolicyNos(selectedMainPolicyNos.filter(p => p !== policyNo));
    } else {
      setSelectedMainPolicyNos([...selectedMainPolicyNos, policyNo]);
    }
  };

  const handleSelectAllLedger = () => {
    if (!activeLedgerPolicy) return;
    if (selectedLedgerInstalCodes.length === activeLedgerPolicy.ledgerHistory.length) {
      setSelectedLedgerInstalCodes([]);
    } else {
      setSelectedLedgerInstalCodes(activeLedgerPolicy.ledgerHistory.map(l => l.yrInstal));
    }
  };

  const handleToggleLedgerInstal = (yrInstal: string) => {
    if (selectedLedgerInstalCodes.includes(yrInstal)) {
      setSelectedLedgerInstalCodes(selectedLedgerInstalCodes.filter(i => i !== yrInstal));
    } else {
      setSelectedLedgerInstalCodes([...selectedLedgerInstalCodes, yrInstal]);
    }
  };

  const handleBatchPrintLedgerInvoices = () => {
    if (!activeLedgerPolicy || selectedLedgerInstalCodes.length === 0) return;
    const firstSelected = activeLedgerPolicy.ledgerHistory.find(l => selectedLedgerInstalCodes.includes(l.yrInstal));
    if (!firstSelected) return;

    setSelectedInvoiceItem({
      policy: activeLedgerPolicy,
      ledger: firstSelected,
      batchCount: selectedLedgerInstalCodes.length
    });
  };

  const handleBatchPrintMainPolicies = () => {
    if (selectedMainPolicyNos.length === 0) return;
    const firstSelected = transactions.find(t => selectedMainPolicyNos.includes(t.policyNo));
    if (!firstSelected) return;

    setSelectedInvoiceItem({
      policy: firstSelected,
      ledger: firstSelected.ledgerHistory[0],
      batchCount: selectedMainPolicyNos.length
    });
  };

  const handleOpenDetail = (item: PaymentTransaction) => {
    setActiveDetailPolicy(item);
    setFormData({ ...item });
    setIsEditingPolicy(false);
  };

  const handleSavePolicyInfo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeDetailPolicy) return;

    setTransactions(prev => prev.map(t => 
      t.policyNo === activeDetailPolicy.policyNo ? { ...t, ...formData } as PaymentTransaction : t
    ));

    setActiveDetailPolicy(prev => prev ? ({ ...prev, ...formData } as PaymentTransaction) : null);
    setIsEditingPolicy(false);
    triggerBanner(`Policy ${activeDetailPolicy.policyNo} details updated successfully.`);
  };

  const handleSendInvoiceEmail = (policy: PaymentTransaction, ledger: PaymentLedgerItem) => {
    triggerBanner(`Service Invoice (${ledger.yrInstal}) for Policy ${policy.policyNo} sent to ${policy.emailAddress}`);
  };

  const triggerBanner = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'Inforced':
        return 'bg-emerald-100/80 text-emerald-800 border-emerald-300 backdrop-blur-xs';
      case 'Lapsed':
        return 'bg-amber-100/80 text-amber-800 border-amber-300 backdrop-blur-xs';
      case 'Terminated':
      case 'Involuntary':
      case 'Voluntary':
      case 'Surrender':
        return 'bg-rose-100/80 text-rose-800 border-rose-300 backdrop-blur-xs';
      case 'Matured':
        return 'bg-blue-100/80 text-blue-800 border-blue-300 backdrop-blur-xs';
      default:
        return 'bg-slate-100/80 text-slate-700 border-slate-300 backdrop-blur-xs';
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-[1650px] mx-auto font-sans text-slate-900 relative">
      
      {/* Toast Alert Overlay */}
      {notification && (
        <div className="fixed top-6 right-6 z-[100] max-w-md p-4 rounded-2xl bg-emerald-600 text-white text-xs font-bold shadow-2xl backdrop-blur-md flex items-center justify-between space-x-3 border border-emerald-400 transition-all duration-300 transform translate-y-0 opacity-100">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-white" />
            <span>{notification}</span>
          </div>
          <button onClick={() => setNotification(null)} className="cursor-pointer p-1 rounded-lg hover:bg-black/10">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="flex items-center space-x-3">
          <CreditCard className="w-6 h-6 text-[#d0112b]" />
          <div>
            <h1 className="text-xl font-bold uppercase tracking-wider text-[#d0112b] font-['Montserrat']">
              PAYMENT TRANSACTIONS & LEDGER
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Real-time policy ledger synchronization with iPeak billing engine
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {selectedMainPolicyNos.length > 0 && (
            <button 
              onClick={handleBatchPrintMainPolicies}
              className="flex items-center space-x-2 bg-[#008cb4] hover:bg-[#007396] text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md"
            >
              <Printer className="w-4 h-4" />
              <span>Batch Print Policies ({selectedMainPolicyNos.length})</span>
            </button>
          )}

          <button className="flex items-center space-x-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer">
            <Receipt className="w-4 h-4 text-slate-500" />
            <span>Upload Batch Payment</span>
          </button>
        </div>
      </div>

      {/* Liquid Glass Filter Bar */}
      <div className="p-4 rounded-3xl border border-white/60 bg-white/70 backdrop-blur-md shadow-lg flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative flex-1 min-w-[240px]">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              placeholder="Search Policy No, Payor Name, or OR No..."
              className="w-full pl-9 pr-4 py-2 rounded-xl text-xs font-medium border border-slate-200 bg-white/80 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#008cb4]"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          </div>

          <div className="flex items-center space-x-1.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase">Policy Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => { setSelectedStatus(e.target.value); setCurrentPage(1); }}
              className="px-3 py-2 rounded-xl text-xs font-semibold border border-slate-200 bg-white/80 text-slate-800 outline-none focus:ring-2 focus:ring-[#008cb4] cursor-pointer"
            >
              <option value="All">All Lifecycle Statuses</option>
              <option value="Inforced">Inforced (Active)</option>
              <option value="Lapsed">Lapsed (&gt; 61 Days)</option>
              <option value="Matured">Matured</option>
              <option value="Terminated">Terminated</option>
              <option value="Surrender">Cash Surrender</option>
            </select>
          </div>

          <div className="flex items-center space-x-1.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase">Product:</span>
            <select
              value={selectedProduct}
              onChange={(e) => { setSelectedProduct(e.target.value); setCurrentPage(1); }}
              className="px-3 py-2 rounded-xl text-xs font-semibold border border-slate-200 bg-white/80 text-slate-800 outline-none focus:ring-2 focus:ring-[#008cb4] cursor-pointer"
            >
              <option value="All">All Products</option>
              <option value="GLA">GLA</option>
              <option value="HIP">HIP</option>
              <option value="SSP">SSP</option>
              <option value="PHC">PHC</option>
            </select>
          </div>
        </div>

        {/* View Switcher Toggle */}
        <div className="flex items-center space-x-1 bg-slate-200/60 p-1 rounded-2xl border border-slate-300/40">
          <button
            onClick={() => setViewMode('table')}
            className={`p-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer ${
              viewMode === 'table' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <List className="w-4 h-4" />
            <span className="hidden sm:inline">Table</span>
          </button>

          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer ${
              viewMode === 'grid' ? 'bg-white text-[#d0112b] shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            <span className="hidden sm:inline">Grid</span>
          </button>
        </div>
      </div>

      {/* Main Table View */}
      {viewMode === 'table' ? (
        <div className="bg-white/80 backdrop-blur-md border border-white/60 rounded-3xl p-6 shadow-xl overflow-x-auto transition-all duration-300">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-600 font-extrabold uppercase tracking-wider">
                <th className="py-3 px-2 w-8">
                  <button onClick={handleSelectAllMain} className="cursor-pointer">
                    {selectedMainPolicyNos.length === paginatedData.length && paginatedData.length > 0 ? (
                      <CheckSquare className="h-4 w-4 text-[#d0112b]" />
                    ) : (
                      <Square className="h-4 w-4 text-slate-400" />
                    )}
                  </button>
                </th>
                <th className="py-3 px-3">Policy Number</th>
                <th className="py-3 px-3">Payor Name</th>
                <th className="py-3 px-3">Plan / Product</th>
                <th className="py-3 px-3">Premium Amount</th>
                <th className="py-3 px-3">Service Invoice No. | Date</th>
                <th className="py-3 px-3">Due Date</th>
                <th className="py-3 px-3">Policy Status</th>
                <th className="py-3 px-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400 font-bold">
                    No payment transactions match the current filters.
                  </td>
                </tr>
              ) : (
                paginatedData.map((item) => (
                  <tr key={item.policyNo} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-2">
                      <button onClick={() => handleToggleMainPolicy(item.policyNo)} className="cursor-pointer">
                        {selectedMainPolicyNos.includes(item.policyNo) ? (
                          <CheckSquare className="h-4 w-4 text-[#d0112b]" />
                        ) : (
                          <Square className="h-4 w-4 text-slate-400" />
                        )}
                      </button>
                    </td>
                    <td className="py-4 px-3 font-bold text-slate-900">{item.policyNo}</td>
                    <td className="py-4 px-3 font-extrabold text-slate-800">{item.firstName} {item.lastName}</td>
                    <td className="py-4 px-3">
                      <span className="font-bold text-slate-900">{item.planCode}</span>
                      <span className="text-[10px] text-slate-500 block truncate">{item.planDesc}</span>
                    </td>
                    <td className="py-4 px-3 font-black text-[#d0112b]">₱{item.premium.toFixed(2)}</td>
                    <td className="py-4 px-3">
                      <span className="font-mono font-bold text-slate-800 block">{item.orNumber}</span>
                      <span className="text-[10px] text-slate-400 block">{item.orDate}</span>
                    </td>
                    <td className="py-4 px-3 font-semibold text-slate-700">{item.dueDate}</td>
                    <td className="py-4 px-3">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border ${getStatusBadgeStyle(item.policyStatus)}`}>
                        {item.policyStatus}
                      </span>
                    </td>
                    <td className="py-4 px-3 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => handleOpenDetail(item)}
                          className="p-2 rounded-xl bg-slate-100 hover:bg-[#d0112b] hover:text-white text-slate-700 transition-all cursor-pointer"
                          title="View / Update Policy Info"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => {
                            setActiveLedgerPolicy(item);
                            setSelectedLedgerInstalCodes([]);
                          }}
                          className="p-2 rounded-xl bg-slate-100 hover:bg-[#008cb4] hover:text-white text-slate-700 transition-all cursor-pointer"
                          title="Payment History Ledger"
                        >
                          <History className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => setPrintHistoryPolicy(item)}
                          className="p-2 rounded-xl bg-slate-100 hover:bg-emerald-600 hover:text-white text-slate-700 transition-all cursor-pointer"
                          title="Print Payment History Summary"
                        >
                          <FileSpreadsheet className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        /* GRID / CARD VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 transition-all duration-300">
          {paginatedData.length === 0 ? (
            <div className="col-span-full py-16 text-center text-slate-400 font-bold bg-white/80 rounded-3xl border border-white/60 shadow-md">
              No payment transactions match the current filters.
            </div>
          ) : (
            paginatedData.map((item) => (
              <div 
                key={item.policyNo}
                className="bg-white/80 backdrop-blur-md border border-white/60 rounded-3xl p-6 shadow-xl hover:shadow-2xl transition-all flex flex-col justify-between space-y-4 group"
              >
                <div className="flex justify-between items-start border-b border-slate-100 pb-3">
                  <div className="flex items-center space-x-2">
                    <button onClick={() => handleToggleMainPolicy(item.policyNo)} className="cursor-pointer">
                      {selectedMainPolicyNos.includes(item.policyNo) ? (
                        <CheckSquare className="h-4 w-4 text-[#d0112b]" />
                      ) : (
                        <Square className="h-4 w-4 text-slate-400" />
                      )}
                    </button>
                    <div>
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase block tracking-wider">
                        {item.planCode} — {item.planDesc}
                      </span>
                      <h3 className="text-base font-black text-slate-900 font-mono tracking-tight mt-0.5">
                        {item.policyNo}
                      </h3>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border ${getStatusBadgeStyle(item.policyStatus)}`}>
                    {item.policyStatus}
                  </span>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div className="flex items-center space-x-2 text-slate-700">
                    <User className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <span className="font-extrabold text-slate-900 truncate">{item.firstName} {item.lastName}</span>
                  </div>

                  <div className="flex items-center space-x-2 text-slate-700">
                    <Tag className="w-4 h-4 text-[#d0112b] flex-shrink-0" />
                    <span className="font-semibold text-slate-500">Premium:</span>
                    <span className="font-black text-[#d0112b] text-sm">₱{item.premium.toFixed(2)}</span>
                  </div>

                  <div className="flex items-center space-x-2 text-slate-700">
                    <Receipt className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <span className="font-semibold text-slate-500">Invoice OR:</span>
                    <span className="font-mono font-bold text-slate-800">{item.orNumber}</span>
                  </div>

                  <div className="flex items-center space-x-2 text-slate-700">
                    <Calendar className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <span className="font-semibold text-slate-500">Due Date:</span>
                    <span className="font-bold text-slate-800">{item.dueDate}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-1.5">
                  <button
                    onClick={() => handleOpenDetail(item)}
                    className="flex-1 py-2 px-2 rounded-xl bg-slate-100 hover:bg-[#d0112b] hover:text-white text-slate-700 font-bold text-[11px] transition-all cursor-pointer flex items-center justify-center space-x-1"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View</span>
                  </button>

                  <button
                    onClick={() => {
                      setActiveLedgerPolicy(item);
                      setSelectedLedgerInstalCodes([]);
                    }}
                    className="flex-1 py-2 px-2 rounded-xl bg-[#008cb4]/10 hover:bg-[#008cb4] text-[#008cb4] hover:text-white font-bold text-[11px] transition-all cursor-pointer flex items-center justify-center space-x-1"
                  >
                    <History className="w-3.5 h-3.5" />
                    <span>Ledger</span>
                  </button>

                  <button
                    onClick={() => setPrintHistoryPolicy(item)}
                    className="flex-1 py-2 px-2 rounded-xl bg-emerald-50 hover:bg-emerald-600 text-emerald-800 hover:text-white font-bold text-[11px] transition-all cursor-pointer flex items-center justify-center space-x-1"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>Print</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 0 && (
        <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-200/60 text-xs text-slate-500 font-semibold">
          <span>
            Showing <span className="font-bold text-slate-900">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> to <span className="font-bold text-slate-900">{Math.min(currentPage * ITEMS_PER_PAGE, totalItems)}</span> of <span className="font-bold text-slate-900">{totalItems}</span> records
          </span>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded-lg border border-slate-200 flex items-center space-x-1 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              <span>Prev</span>
            </button>
            <div className="text-xs font-bold text-slate-700 px-2">
              Page {currentPage} of {totalPages}
            </div>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 rounded-lg border border-slate-200 flex items-center space-x-1 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <span>Next</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Animated Policy Drawer */}
      {activeDetailPolicy && (
        <div className="fixed inset-0 z-[50] flex justify-end">
          <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm transition-opacity duration-300" onClick={() => setActiveDetailPolicy(null)} />
          <div className="relative w-full max-w-4xl bg-white/95 backdrop-blur-xl border-l border-white/40 h-full shadow-2xl z-10 flex flex-col justify-between font-sans transform transition-all duration-300 translate-x-0">
            
            <div className="p-6 border-b border-slate-200/80 flex items-center justify-between bg-white/50 backdrop-blur-md">
              <div className="flex items-center space-x-3">
                <ShieldCheck className="w-6 h-6 text-[#d0112b]" />
                <div>
                  <h2 className="text-base font-bold text-slate-900 uppercase">
                    Update Application ( {activeDetailPolicy.policyNo} )
                  </h2>
                  <p className="text-xs text-slate-500 font-medium">Policy and Insured Profile Records</p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setIsEditingPolicy(!isEditingPolicy)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer ${
                    isEditingPolicy 
                      ? 'bg-amber-100 text-amber-800 border border-amber-300' 
                      : 'bg-[#008cb4] hover:bg-[#007396] text-white shadow-sm'
                  }`}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>{isEditingPolicy ? 'Cancel Edit' : 'Edit'}</span>
                </button>

                <button onClick={() => setActiveDetailPolicy(null)} className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <form id="policy-edit-form" onSubmit={handleSavePolicyInfo} className="p-6 overflow-y-auto flex-1 text-xs space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                <div className="space-y-3">
                  <div className="border-b border-slate-200 pb-2 mb-3">
                    <h3 className="font-extrabold text-slate-800 uppercase tracking-wide text-xs">Personal Information</h3>
                  </div>

                  <div className="grid grid-cols-3 items-center gap-2">
                    <label className="font-semibold text-slate-600">Title</label>
                    <input type="text" disabled={true} value={formData.title || ''} className="col-span-2 p-2 rounded-xl border border-slate-200 bg-slate-100/80 text-slate-700 font-semibold cursor-not-allowed" />
                  </div>

                  <div className="grid grid-cols-3 items-center gap-2">
                    <label className="font-semibold text-slate-600">First name</label>
                    <input type="text" disabled={true} value={formData.firstName || ''} className="col-span-2 p-2 rounded-xl border border-slate-200 bg-slate-100/80 text-slate-700 font-semibold cursor-not-allowed" />
                  </div>

                  <div className="grid grid-cols-3 items-center gap-2">
                    <label className="font-semibold text-slate-600">Middle Name</label>
                    <input type="text" disabled={true} value={formData.middleName || ''} className="col-span-2 p-2 rounded-xl border border-slate-200 bg-slate-100/80 text-slate-700 font-semibold cursor-not-allowed" />
                  </div>

                  <div className="grid grid-cols-3 items-center gap-2">
                    <label className="font-semibold text-slate-600">Last Name</label>
                    <input type="text" disabled={true} value={formData.lastName || ''} className="col-span-2 p-2 rounded-xl border border-slate-200 bg-slate-100/80 text-slate-700 font-semibold cursor-not-allowed" />
                  </div>

                  <div className="grid grid-cols-3 items-center gap-2">
                    <label className="font-semibold text-slate-600">Birthdate</label>
                    <input type="date" disabled={true} value={formData.birthdate || ''} className="col-span-2 p-2 rounded-xl border border-slate-200 bg-slate-100/80 text-slate-700 font-semibold cursor-not-allowed" />
                  </div>

                  <div className="grid grid-cols-3 items-center gap-2">
                    <label className="font-semibold text-slate-600">Gender</label>
                    <select disabled={true} value={formData.gender || 'Male'} className="col-span-2 p-2 rounded-xl border border-slate-200 bg-slate-100/80 text-slate-700 font-semibold cursor-not-allowed">
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-3 items-center gap-2">
                    <label className="font-semibold text-slate-600">Current Age</label>
                    <input type="number" disabled={true} value={formData.currentAge || 0} className="col-span-2 p-2 rounded-xl border border-slate-200 bg-slate-100/80 text-slate-700 font-semibold cursor-not-allowed" />
                  </div>

                  <div className="grid grid-cols-3 items-center gap-2">
                    <label className="font-semibold text-slate-600">Issue Age</label>
                    <input type="number" disabled={true} value={formData.issueAge || 0} className="col-span-2 p-2 rounded-xl border border-slate-200 bg-slate-100/80 text-slate-700 font-semibold cursor-not-allowed" />
                  </div>

                  <div className="grid grid-cols-3 items-center gap-2">
                    <label className="font-semibold text-slate-600">Address</label>
                    <textarea rows={2} disabled={true} value={formData.address || ''} className="col-span-2 p-2 rounded-xl border border-slate-200 bg-slate-100/80 text-slate-700 font-semibold cursor-not-allowed" />
                  </div>

                  <div className="grid grid-cols-3 items-center gap-2">
                    <label className="font-semibold text-slate-600">Mobile Number</label>
                    <input type="text" disabled={true} value={formData.mobileNumber || ''} className="col-span-2 p-2 rounded-xl border border-slate-200 bg-slate-100/80 text-slate-700 font-semibold cursor-not-allowed" />
                  </div>

                  <div className="grid grid-cols-3 items-center gap-2">
                    <label className="font-semibold text-slate-600">Email Address</label>
                    <input type="email" disabled={true} value={formData.emailAddress || ''} className="col-span-2 p-2 rounded-xl border border-slate-200 bg-slate-100/80 text-slate-700 font-semibold cursor-not-allowed" />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="border-b border-slate-200 pb-2 mb-3">
                    <h3 className="font-extrabold text-slate-800 uppercase tracking-wide text-xs">Policy Information</h3>
                  </div>

                  <div className="grid grid-cols-3 items-center gap-2">
                    <label className="font-semibold text-slate-600">Policy Status</label>
                    <select 
                      disabled={!isEditingPolicy}
                      value={formData.policyStatus || 'Inforced'} 
                      onChange={(e) => setFormData({ ...formData, policyStatus: e.target.value as PaymentTransaction['policyStatus'] })}
                      className="col-span-2 p-2 rounded-xl border border-slate-200 bg-white disabled:bg-slate-100/80 font-semibold"
                    >
                      <option value="Inforced">Inforced</option>
                      <option value="Lapsed">Lapsed</option>
                      <option value="Terminated">Terminated</option>
                      <option value="Matured">Matured</option>
                      <option value="Involuntary">Involuntary</option>
                      <option value="Voluntary">Voluntary</option>
                      <option value="Surrender">Surrender</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-3 items-center gap-2">
                    <label className="font-semibold text-slate-600">HCR Status</label>
                    <input type="text" disabled={!isEditingPolicy} value={formData.hcrStatus || '0'} onChange={(e) => setFormData({ ...formData, hcrStatus: e.target.value })} className="col-span-2 p-2 rounded-xl border border-slate-200 bg-white disabled:bg-slate-100/80 font-semibold" />
                  </div>

                  <div className="grid grid-cols-3 items-center gap-2">
                    <label className="font-semibold text-slate-600">HCR Unit</label>
                    <input type="text" disabled={!isEditingPolicy} value={formData.hcrUnit || '0'} onChange={(e) => setFormData({ ...formData, hcrUnit: e.target.value })} className="col-span-2 p-2 rounded-xl border border-slate-200 bg-white disabled:bg-slate-100/80 font-semibold" />
                  </div>

                  <div className="grid grid-cols-3 items-center gap-2">
                    <label className="font-semibold text-slate-600">Premium</label>
                    <input type="number" step="0.01" disabled={!isEditingPolicy} value={formData.premium || 0} onChange={(e) => setFormData({ ...formData, premium: parseFloat(e.target.value) })} className="col-span-2 p-2 rounded-xl border border-slate-200 bg-white disabled:bg-slate-100/80 font-bold text-[#d0112b]" />
                  </div>

                  <div className="grid grid-cols-3 items-center gap-2">
                    <label className="font-semibold text-slate-600">Deposit</label>
                    <input type="number" step="0.01" disabled={!isEditingPolicy} value={formData.deposit || 0} onChange={(e) => setFormData({ ...formData, deposit: parseFloat(e.target.value) })} className="col-span-2 p-2 rounded-xl border border-slate-200 bg-white disabled:bg-slate-100/80 font-semibold" />
                  </div>

                  <div className="grid grid-cols-3 items-center gap-2">
                    <label className="font-semibold text-slate-600">Underpay</label>
                    <input type="number" step="0.01" disabled={!isEditingPolicy} value={formData.underpay || 0} onChange={(e) => setFormData({ ...formData, underpay: parseFloat(e.target.value) })} className="col-span-2 p-2 rounded-xl border border-slate-200 bg-white disabled:bg-slate-100/80 font-semibold" />
                  </div>

                  <div className="grid grid-cols-3 items-center gap-2">
                    <label className="font-semibold text-slate-600">Due Date</label>
                    <input type="date" disabled={!isEditingPolicy} value={formData.dueDate || ''} onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })} className="col-span-2 p-2 rounded-xl border border-slate-200 bg-white disabled:bg-slate-100/80 font-semibold" />
                  </div>

                  <div className="grid grid-cols-3 items-center gap-2">
                    <label className="font-semibold text-slate-600">Pay Type</label>
                    <input type="text" disabled={!isEditingPolicy} value={formData.payType || 'INDIVIDUAL'} onChange={(e) => setFormData({ ...formData, payType: e.target.value })} className="col-span-2 p-2 rounded-xl border border-slate-200 bg-white disabled:bg-slate-100/80 font-semibold" />
                  </div>

                  <div className="grid grid-cols-3 items-center gap-2">
                    <label className="font-semibold text-slate-600">Life Benefits</label>
                    <input type="number" step="0.01" disabled={!isEditingPolicy} value={formData.lifeBenefits || 0} onChange={(e) => setFormData({ ...formData, lifeBenefits: parseFloat(e.target.value) })} className="col-span-2 p-2 rounded-xl border border-slate-200 bg-white disabled:bg-slate-100/80 font-semibold" />
                  </div>

                  <div className="grid grid-cols-3 items-center gap-2">
                    <label className="font-semibold text-slate-600">Accidental Benefits</label>
                    <input type="number" step="0.01" disabled={!isEditingPolicy} value={formData.accidentalBenefits || 0} onChange={(e) => setFormData({ ...formData, accidentalBenefits: parseFloat(e.target.value) })} className="col-span-2 p-2 rounded-xl border border-slate-200 bg-white disabled:bg-slate-100/80 font-semibold" />
                  </div>

                  <div className="grid grid-cols-3 items-center gap-2">
                    <label className="font-semibold text-slate-600">Mode</label>
                    <select disabled={!isEditingPolicy} value={formData.mode || 'Monthly'} onChange={(e) => setFormData({ ...formData, mode: e.target.value })} className="col-span-2 p-2 rounded-xl border border-slate-200 bg-white disabled:bg-slate-100/80 font-semibold">
                      <option value="Monthly">Monthly</option>
                      <option value="Quarterly">Quarterly</option>
                      <option value="Semi-Annual">Semi-Annual</option>
                      <option value="Annual">Annual</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-3 items-center gap-2">
                    <label className="font-semibold text-slate-600">Issue Date</label>
                    <input type="date" disabled={!isEditingPolicy} value={formData.issueDate || ''} onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })} className="col-span-2 p-2 rounded-xl border border-slate-200 bg-white disabled:bg-slate-100/80 font-semibold" />
                  </div>

                  <div className="grid grid-cols-3 items-center gap-2">
                    <label className="font-semibold text-slate-600">Expiry Date</label>
                    <input type="date" disabled={!isEditingPolicy} value={formData.expiryDate || ''} onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })} className="col-span-2 p-2 rounded-xl border border-slate-200 bg-white disabled:bg-slate-100/80 font-semibold" />
                  </div>

                </div>

              </div>
            </form>

            <div className="p-6 border-t border-slate-200/80 bg-white/50 backdrop-blur-md flex items-center justify-end space-x-3">
              <button 
                type="button" 
                onClick={() => setActiveDetailPolicy(null)}
                className="px-5 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-200 text-xs transition-colors cursor-pointer"
              >
                Close
              </button>

              {isEditingPolicy && (
                <button 
                  form="policy-edit-form"
                  type="submit" 
                  className="px-5 py-2.5 rounded-xl bg-[#008cb4] hover:bg-[#007396] text-white font-bold text-xs transition-colors shadow-sm cursor-pointer flex items-center space-x-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Updates</span>
                </button>
              )}
            </div>

          </div>
        </div>
      )}

      {/* Animated Printable Payment History Summary Modal */}
      {printHistoryPolicy && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/70 backdrop-blur-md p-4 overflow-y-auto transition-opacity duration-300">
          <div className="bg-white rounded-3xl max-w-6xl w-full p-8 shadow-2xl border border-slate-200 space-y-6 font-sans my-6 text-slate-800 transform transition-all duration-300 scale-100">
            
            <div className="flex justify-between items-center border-b pb-4 border-slate-200">
              <div>
                <h2 className="text-base font-bold text-slate-900 uppercase">
                  Payment History Document — {printHistoryPolicy.policyNo}
                </h2>
                <p className="text-xs text-slate-500 font-semibold">{printHistoryPolicy.firstName} {printHistoryPolicy.lastName}</p>
              </div>

              <div className="flex items-center space-x-3">
                <button
                  onClick={() => window.print()}
                  className="px-5 py-2.5 rounded-xl bg-[#008cb4] hover:bg-[#007396] text-white text-xs font-bold cursor-pointer flex items-center space-x-2 shadow-md"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Payment History</span>
                </button>

                <button onClick={() => setPrintHistoryPolicy(null)} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div id="printable-payment-history" className="p-8 border-2 border-slate-300 bg-white space-y-6 font-sans text-xs">
              <div className="border-b border-slate-300 pb-3 flex justify-between items-start">
                <div>
                  <h1 className="text-base font-extrabold text-[#d0112b] font-['Montserrat'] uppercase">
                    PARAMOUNT LIFE & GENERAL INSURANCE CORPORATION
                  </h1>
                  <p className="text-[10px] text-slate-500 font-bold uppercase">OFFICIAL PAYMENT HISTORY LEDGER</p>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-slate-900">{printHistoryPolicy.policyNo}</span>
                  <span className="text-[10px] text-slate-400 block font-semibold">{printHistoryPolicy.policyStatus}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-x-8 gap-y-2 border-b border-slate-200 pb-4 text-[11px]">
                <div className="space-y-1">
                  <div className="flex justify-between"><span className="text-slate-500 font-bold">Policy Number:</span><span className="font-extrabold">{printHistoryPolicy.policyNo}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500 font-bold">Payor Name:</span><span className="font-extrabold">{printHistoryPolicy.firstName} {printHistoryPolicy.lastName}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500 font-bold">Plan / Description:</span><span className="font-bold">{printHistoryPolicy.planCode} ({printHistoryPolicy.planDesc})</span></div>
                  <div className="flex justify-between"><span className="text-slate-500 font-bold">Address:</span><span className="font-medium truncate max-w-[220px]">{printHistoryPolicy.address}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500 font-bold">Mobile Number:</span><span className="font-medium">{printHistoryPolicy.mobileNumber}</span></div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between"><span className="text-slate-500 font-bold">Regular Premium:</span><span className="font-extrabold text-[#d0112b]">₱{printHistoryPolicy.premium.toFixed(2)}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500 font-bold">Mode / Pay Type:</span><span className="font-bold">{printHistoryPolicy.mode} ({printHistoryPolicy.payType})</span></div>
                  <div className="flex justify-between"><span className="text-slate-500 font-bold">Issue Date:</span><span className="font-medium">{printHistoryPolicy.issueDate}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500 font-bold">Effectivity Date:</span><span className="font-medium">{printHistoryPolicy.effectivityDate}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500 font-bold">Due Date:</span><span className="font-medium">{printHistoryPolicy.dueDate}</span></div>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">Installment Ledger Breakdown</h3>
                <table className="w-full text-left text-xs border border-slate-300">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-300 font-extrabold uppercase text-[10px]">
                      <th className="p-2 border-r border-slate-300">YR INSTAL</th>
                      <th className="p-2 border-r border-slate-300">Due Date</th>
                      <th className="p-2 border-r border-slate-300">Mode</th>
                      <th className="p-2 border-r border-slate-300 text-right">Premium</th>
                      <th className="p-2 border-r border-slate-300 text-right">Deposit</th>
                      <th className="p-2 border-r border-slate-300 text-right">Underpay</th>
                      <th className="p-2 border-r border-slate-300">Code/PayForm</th>
                      <th className="p-2 border-r border-slate-300">OR Date/Number</th>
                      <th className="p-2 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-medium">
                    {printHistoryPolicy.ledgerHistory.map((leg, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="p-2 border-r border-slate-300 font-mono font-bold text-[#d0112b]">{leg.yrInstal}</td>
                        <td className="p-2 border-r border-slate-300">{leg.dueDate}</td>
                        <td className="p-2 border-r border-slate-300">{printHistoryPolicy.mode}</td>
                        <td className="p-2 border-r border-slate-300 text-right font-extrabold">₱{leg.uploaded.toFixed(2)}</td>
                        <td className="p-2 border-r border-slate-300 text-right text-slate-400">₱0.00</td>
                        <td className="p-2 border-r border-slate-300 text-right text-slate-400">₱{leg.underpay.toFixed(2)}</td>
                        <td className="p-2 border-r border-slate-300 font-mono text-[10px]">ONLINE</td>
                        <td className="p-2 border-r border-slate-300 font-mono text-[10px]">
                          {leg.orDate} / {leg.orNumber}
                        </td>
                        <td className="p-2 text-center font-bold text-emerald-700">{leg.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setPrintHistoryPolicy(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-xs font-bold text-slate-700 cursor-pointer"
              >
                Close Window
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Animated Payment Ledger History Modal */}
      {activeLedgerPolicy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-4 transition-opacity duration-300">
          <div className="bg-white/85 backdrop-blur-xl rounded-3xl max-w-5xl w-full p-6 shadow-2xl border border-white/60 space-y-6 font-sans transform transition-all duration-300 scale-100">
            <div className="flex justify-between items-center border-b border-slate-200/80 pb-4">
              <div className="flex items-center space-x-2">
                <History className="w-5 h-5 text-[#008cb4]" />
                <div>
                  <h2 className="text-base font-bold text-slate-900 uppercase">
                    Payment Ledger History — {activeLedgerPolicy.policyNo}
                  </h2>
                  <p className="text-xs text-slate-500 font-semibold">
                    {activeLedgerPolicy.firstName} {activeLedgerPolicy.lastName}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                {selectedLedgerInstalCodes.length > 0 && (
                  <button
                    onClick={handleBatchPrintLedgerInvoices}
                    className="flex items-center space-x-2 bg-[#008cb4] hover:bg-[#007396] text-white px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer shadow-md"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Batch Print Invoices ({selectedLedgerInstalCodes.length})</span>
                  </button>
                )}

                <button 
                  onClick={() => setActiveLedgerPolicy(null)}
                  className="p-1.5 rounded-xl hover:bg-slate-200 text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="overflow-x-auto max-h-[55vh]">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-extrabold uppercase">
                    <th className="py-2.5 px-2 w-8">
                      <button onClick={handleSelectAllLedger} className="cursor-pointer">
                        {selectedLedgerInstalCodes.length === activeLedgerPolicy.ledgerHistory.length && activeLedgerPolicy.ledgerHistory.length > 0 ? (
                          <CheckSquare className="h-4 w-4 text-[#d0112b]" />
                        ) : (
                          <Square className="h-4 w-4 text-slate-400" />
                        )}
                      </button>
                    </th>
                    <th className="py-2.5 px-3">YR INSTAL</th>
                    <th className="py-2.5 px-3">Due Date</th>
                    <th className="py-2.5 px-3">Uploaded</th>
                    <th className="py-2.5 px-3">Amount Paid</th>
                    <th className="py-2.5 px-3">Underpay</th>
                    <th className="py-2.5 px-3">OR Number</th>
                    <th className="py-2.5 px-3">OR Date</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-center">Service Invoice</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {activeLedgerPolicy.ledgerHistory.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-2">
                        <button onClick={() => handleToggleLedgerInstal(item.yrInstal)} className="cursor-pointer">
                          {selectedLedgerInstalCodes.includes(item.yrInstal) ? (
                            <CheckSquare className="h-4 w-4 text-[#d0112b]" />
                          ) : (
                            <Square className="h-4 w-4 text-slate-400" />
                          )}
                        </button>
                      </td>
                      <td className="py-3 px-3 font-black text-[#d0112b] font-mono">{item.yrInstal}</td>
                      <td className="py-3 px-3 font-medium">{item.dueDate}</td>
                      <td className="py-3 px-3 font-semibold text-slate-700">₱{item.uploaded.toFixed(2)}</td>
                      <td className="py-3 px-3 font-extrabold text-emerald-700">₱{item.amountPaid.toFixed(2)}</td>
                      <td className="py-3 px-3 text-slate-400">₱{item.underpay.toFixed(2)}</td>
                      <td className="py-3 px-3 font-mono font-bold">{item.orNumber}</td>
                      <td className="py-3 px-3 text-slate-500">{item.orDate}</td>
                      <td className="py-3 px-3">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${getStatusBadgeStyle(item.status)}`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center space-x-1.5">
                          <button
                            onClick={() => setSelectedInvoiceItem({ policy: activeLedgerPolicy, ledger: item })}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-[#008cb4] hover:text-white text-slate-600 transition-colors cursor-pointer"
                            title="Print Preview Official PDF Service Invoice"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleSendInvoiceEmail(activeLedgerPolicy, item)}
                            className="p-1.5 rounded-lg bg-blue-50 hover:bg-[#008cb4] text-[#008cb4] hover:text-white transition-colors cursor-pointer"
                            title={`Send Service Invoice (${item.yrInstal}) to ${activeLedgerPolicy.emailAddress}`}
                          >
                            <Send className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setActiveLedgerPolicy(null)}
                className="px-5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-xs font-bold text-slate-700 cursor-pointer"
              >
                Close Ledger
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Official PDF Document Viewer Modal */}
      {selectedInvoiceItem && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/70 backdrop-blur-md p-4 overflow-y-auto transition-opacity duration-300">
          <div className="relative z-[70] bg-white rounded-3xl max-w-5xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 font-sans my-4 transform transition-all duration-300 scale-100">
            
            <div className="flex justify-between items-center border-b pb-4 border-slate-200">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-[#d0112b]" />
                <div>
                  <h2 className="text-base font-bold text-slate-900 uppercase">
                    Official Service Invoice — {selectedInvoiceItem.ledger.yrInstal} ({selectedInvoiceItem.policy.policyNo})
                    {selectedInvoiceItem.batchCount && ` [Batch Print: ${selectedInvoiceItem.batchCount} selected]`}
                  </h2>
                  <p className="text-xs text-slate-500 font-semibold">BIR Formatted Document Preview</p>
                </div>
              </div>
              <button onClick={() => setSelectedInvoiceItem(null)} className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="w-full h-[68vh] rounded-2xl border-2 border-slate-300 bg-slate-100 overflow-hidden shadow-inner">
              <iframe
                src={`${serviceInvoicePdf}#toolbar=0&navpanes=0`}
                title="ELECTRONIC_SERVICE_INVOICE"
                className="w-full h-full"
              />
            </div>

            <div className="flex justify-between items-center pt-2">
              <button
                onClick={() => handleSendInvoiceEmail(selectedInvoiceItem.policy, selectedInvoiceItem.ledger)}
                className="px-4 py-2 rounded-xl bg-blue-50 text-[#008cb4] hover:bg-[#008cb4] hover:text-white font-bold text-xs transition-colors cursor-pointer flex items-center space-x-1.5"
              >
                <Send className="w-4 h-4" />
                <span>Send to Client ({selectedInvoiceItem.policy.emailAddress})</span>
              </button>

              <div className="flex items-center space-x-2">
                <a
                  href={serviceInvoicePdf}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer flex items-center space-x-1.5"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Open PDF in New Tab</span>
                </a>

                <button
                  onClick={() => window.open(serviceInvoicePdf, '_blank')?.print()}
                  className="px-5 py-2 rounded-xl bg-[#008cb4] hover:bg-[#007396] text-white text-xs font-bold cursor-pointer flex items-center space-x-1.5 shadow-sm"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Document</span>
                </button>

                <button
                  onClick={() => setSelectedInvoiceItem(null)}
                  className="px-5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-xs font-bold text-slate-700 cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}