import React, { useState } from 'react';
import { ArrowLeft, Edit3, Plus, CheckCircle2, Lock, Save } from 'lucide-react';

interface Props {
  darkMode: boolean;
  applicationId: string;
  onBack: () => void;
}

export default function ApplicationDetail({ darkMode, applicationId, onBack }: Props) {
  const [status, setStatus] = useState<'Received' | 'For Verification' | 'For Evaluation' | 'Paid' | 'Issued'>('Received');
  const [isPayorSameAsInsured, setIsPayorSameAsInsured] = useState(true);
  const [protectHousehold, setProtectHousehold] = useState(false);

  const isIssued = status === 'Issued';

  return (
    <div className={`p-4 md:p-8 space-y-6 max-w-[1400px] mx-auto font-sans ${
      darkMode ? 'text-white' : 'text-gray-900'
    }`}>
      {/* Top Header & Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4 border-gray-200 dark:border-white/10">
        <div className="flex items-center space-x-3">
          <button 
            onClick={onBack}
            className="p-2 rounded-xl border border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/10 cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <h1 className="text-lg md:text-xl font-bold uppercase tracking-wider text-[#d0112b] font-['Montserrat']">
            APPLICATION ID: {applicationId || '367377'}
          </h1>
        </div>

        {/* Premium Floating Card */}
        <div className={`p-4 rounded-2xl border text-right backdrop-blur-xl ${
          darkMode ? 'bg-slate-900/60 border-white/10' : 'bg-white border-gray-200 shadow-sm'
        }`}>
          <span className="text-xl font-extrabold text-[#d0112b]">174.95 Php</span>
          <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">MONTHLY PREMIUM</p>
          <p className="text-xs font-semibold text-gray-500 mt-0.5">HIP - Plan 500 - Family</p>
        </div>
      </div>

      {/* Workflow Status Bar (Update Status Here) */}
      <div className={`p-4 rounded-3xl border flex flex-wrap items-center justify-between gap-4 ${
        darkMode ? 'bg-gray-900/40 border-white/10' : 'bg-white border-gray-100 shadow-sm'
      }`}>
        <div>
          <span className="text-xs font-bold uppercase text-gray-400">Current Application Status</span>
          <p className="text-sm font-bold text-[#d0112b] mt-0.5">{status}</p>
        </div>

        <div className="flex items-center space-x-2">
          {isIssued ? (
            <span className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-emerald-500/20 text-emerald-500 font-bold text-xs border border-emerald-500/30">
              <Lock className="h-4 w-4" />
              <span>Issued & Transmitted to iPeak (Locked)</span>
            </span>
          ) : (
            <div className="flex items-center space-x-2">
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className={`px-4 py-2 rounded-xl text-xs font-bold border outline-none ${
                  darkMode ? 'bg-slate-900 border-white/10 text-white' : 'bg-gray-50 border-gray-200'
                }`}
              >
                <option value="Received">Received</option>
                <option value="For Verification">For Verification</option>
                <option value="For Evaluation">For Evaluation</option>
                <option value="Paid">Paid</option>
                <option value="Issued">Issued</option>
              </select>

              <button 
                onClick={() => alert(`Status updated to ${status}`)}
                className="flex items-center space-x-1 px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#d0112b] hover:bg-[#b00e24] cursor-pointer shadow-md"
              >
                <Save className="h-3.5 w-3.5" />
                <span>Save Status</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Section 1: Campaign & Plan Info */}
      <div className={`p-6 rounded-3xl border ${darkMode ? 'bg-gray-900/40 border-white/10' : 'bg-white border-gray-100 shadow-sm'}`}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">Campaign Source</label>
            <select className={`w-full px-4 py-2.5 rounded-2xl text-xs border ${darkMode ? 'bg-slate-900 border-white/10' : 'bg-gray-50 border-gray-200'}`}>
              <option>Telemarketing</option>
              <option>Pd Site</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">Plan</label>
            <select className={`w-full px-4 py-2.5 rounded-2xl text-xs border ${darkMode ? 'bg-slate-900 border-white/10' : 'bg-gray-50 border-gray-200'}`}>
              <option>Plan 500 - Family</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">Payment Option</label>
            <select className={`w-full px-4 py-2.5 rounded-2xl text-xs border ${darkMode ? 'bg-slate-900 border-white/10' : 'bg-gray-50 border-gray-200'}`}>
              <option>Monthly</option>
              <option>Annual</option>
            </select>
          </div>
        </div>
        <button className="mt-4 px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#008cb4] flex items-center space-x-1">
          <Edit3 className="h-3.5 w-3.5" />
          <span>Edit</span>
        </button>
      </div>

      {/* Section 2: Personal Information */}
      <div className={`p-6 rounded-3xl border space-y-4 ${darkMode ? 'bg-gray-900/40 border-white/10' : 'bg-white border-gray-100 shadow-sm'}`}>
        <h2 className="text-sm font-bold border-b pb-2 border-gray-200 dark:border-white/10">Personal Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">Title</label>
            <input type="text" defaultValue="Mr" className={`w-full px-4 py-2.5 rounded-2xl text-xs border ${darkMode ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'}`} />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">First Name</label>
            <input type="text" defaultValue="Paramount" className={`w-full px-4 py-2.5 rounded-2xl text-xs border ${darkMode ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'}`} />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">Middle Name</label>
            <input type="text" defaultValue="Life & General Insurance" className={`w-full px-4 py-2.5 rounded-2xl text-xs border ${darkMode ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'}`} />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">Last Name</label>
            <input type="text" defaultValue="Corp" className={`w-full px-4 py-2.5 rounded-2xl text-xs border ${darkMode ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'}`} />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">Birthdate</label>
            <input type="text" defaultValue="02/01/2007" className={`w-full px-4 py-2.5 rounded-2xl text-xs border ${darkMode ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'}`} />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">Place Of Birth</label>
            <input type="text" placeholder="Optional" className={`w-full px-4 py-2.5 rounded-2xl text-xs border ${darkMode ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'}`} />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">Nationality</label>
            <input type="text" defaultValue="Filipino" className={`w-full px-4 py-2.5 rounded-2xl text-xs border ${darkMode ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'}`} />
          </div>
        </div>
      </div>

      {/* Section 3: Persons to be Insured */}
      <div className={`p-6 rounded-3xl border space-y-4 ${darkMode ? 'bg-gray-900/40 border-white/10' : 'bg-white border-gray-100 shadow-sm'}`}>
        <h2 className="text-sm font-bold border-b pb-2 border-gray-200 dark:border-white/10">Persons to be Insured</h2>
        <div className="space-y-2 text-xs">
          <div className="grid grid-cols-3 font-semibold text-gray-400 pb-1">
            <span>Role</span>
            <span>Full Name</span>
            <span>Birthdate</span>
          </div>
          <div className="grid grid-cols-3 py-2 border-b border-gray-100 dark:border-white/5">
            <span className="font-bold">Child</span>
            <span>PARAMOUNT LIFE & GENERAL INSURANCE CORP</span>
            <span>05/05/2026</span>
          </div>
        </div>
        <button className="flex items-center space-x-1 px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#008cb4]">
          <Plus className="h-3.5 w-3.5" />
          <span>ADD CHILD</span>
        </button>
      </div>

      {/* Section 4: Additional Benefit */}
      <div className={`p-6 rounded-3xl border space-y-3 ${darkMode ? 'bg-gray-900/40 border-white/10' : 'bg-white border-gray-100 shadow-sm'}`}>
        <h2 className="text-sm font-bold border-b pb-2 border-gray-200 dark:border-white/10">Additional Benefit</h2>
        <p className="text-xs text-gray-400 leading-relaxed">
          LIFELINE RESCUE'S EMERGENCY QUICK RESPONSE PROGRAM (EQRP)<br />
          Lifeline Rescue is the acknowledged leader in emergency ambulance service...
        </p>
        <label className="flex items-center space-x-2 text-xs font-semibold cursor-pointer">
          <input 
            type="checkbox" 
            checked={protectHousehold} 
            onChange={(e) => setProtectHousehold(e.target.checked)} 
            className="rounded border-gray-300 text-[#d0112b]"
          />
          <span>Protect my whole household for 1 year (Php 700.00) - For clients within Metro Manila Only</span>
        </label>
      </div>

      {/* Bottom Actions */}
      <div className="flex justify-end space-x-3 pt-4">
        <button onClick={onBack} className="px-6 py-2.5 rounded-2xl text-xs font-bold border border-gray-300 dark:border-white/20">
          Cancel
        </button>
        <button onClick={onBack} className="px-6 py-2.5 rounded-2xl text-xs font-bold text-white bg-[#008cb4] hover:bg-[#007395] shadow-lg">
          Save and Continue
        </button>
      </div>
    </div>
  );
}