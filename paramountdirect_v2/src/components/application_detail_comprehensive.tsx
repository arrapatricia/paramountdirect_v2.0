import React, { useState } from 'react';
import { ClipboardList, UserCircle2, Briefcase, Users, ShieldQuestion, FileWarning, ListChecks, Wallet } from 'lucide-react';
import {
  NotificationBanner, DetailHeader, StatusControl, Section, Field, AddRowButton,
  editInputClass, editSelectClass, type NotificationState,
} from './application_detail_ui';

interface Props {
  applicationId: string;
  planCode: string;
  initialStatus: string;
  onUpdateStatus: (status: string) => void;
  onBack: () => void;
  // Application Inquiry is a lookup view - opened from there, this page is
  // fully read-only (no status changes, no section editing).
  readOnly?: boolean;
}

export default function ApplicationDetailComprehensive({
  applicationId,
  planCode,
  initialStatus,
  onUpdateStatus,
  onBack,
  readOnly = false
}: Props) {
  // Map Plan Code to Product Name
  const productNames: Record<string, string> = {
    'MPR': 'MoneyPlus Protection Plan',
    'SSP': 'Sure Savings Plan',
    'PHP': 'PrimeHealth Cash Plan',
    'DRE': 'Dream College Plan'
  };
  const productName = productNames[planCode] || 'Comprehensive Plan';

  // Status Tracking
  const [status, setStatus] = useState(initialStatus);
  const [savedStatus, setSavedStatus] = useState(initialStatus);
  const [isStatusMenuOpen, setIsStatusMenuOpen] = useState(false);
  const statusOptions = ['For Verification', 'For Evaluation', 'Paid', 'Issued'];

  // Notification Prompt State
  const [notification, setNotification] = useState<NotificationState>(null);

  // Edit Mode Tracking
  const [editingSection, setEditingSection] = useState<string | null>(null);

  // Date Tracking
  const [birthdate, setBirthdate] = useState('1994-01-08');

  const [hasOtherLifeInsurance, setHasOtherLifeInsurance] = useState(false);
  const [isPayorSameAsInsured, setIsPayorSameAsInsured] = useState(true);

  // Calculate Age dynamically
  const calculateAge = (dobString: string) => {
    if (!dobString) return '--';
    const dob = new Date(dobString);
    const today = new Date('2026-08-29');
    let age = today.getFullYear() - dob.getFullYear();
    if (today.getMonth() < dob.getMonth() || (today.getMonth() === dob.getMonth() && today.getDate() < dob.getDate())) {
      age--;
    }
    return age;
  };

  const toggleEdit = (section: string) => {
    if (readOnly) return;
    setEditingSection(editingSection === section ? null : section);
  };

  // Immediate Status Update & Notification Trigger Handler
  const handleSelectStatus = (newStatus: string) => {
    setStatus(newStatus);
    setIsStatusMenuOpen(false);

    const simulateError = false; // Toggle to true to test issuance error prompt

    if (newStatus === 'Issued') {
      if (simulateError) {
        setNotification({
          type: 'error',
          message: 'There is an error upon issuance of application.'
        });
        return;
      }

      setSavedStatus('Issued');
      onUpdateStatus('Issued');
      setNotification({
        type: 'success',
        message: 'The application has been successfully issued and transmitted to iPeak'
      });
    } else {
      setSavedStatus(newStatus);
      onUpdateStatus(newStatus);
      setNotification({
        type: 'info',
        message: `The application is updated to ${newStatus}`
      });
    }

    // Auto-dismiss banner after 5 seconds
    setTimeout(() => {
      setNotification(null);
    }, 5000);
  };

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-[1200px] mx-auto font-sans text-slate-800 dark:text-slate-200">

      <NotificationBanner notification={notification} onDismiss={() => setNotification(null)} />

      <DetailHeader
        applicationId={applicationId}
        productName={productName}
        planCode={planCode}
        premium="Premium: ₱892.00"
        onBack={onBack}
        statusControl={
          <StatusControl
            status={status}
            savedStatus={savedStatus}
            isMenuOpen={isStatusMenuOpen}
            setIsMenuOpen={setIsStatusMenuOpen}
            statusOptions={statusOptions}
            onSelect={handleSelectStatus}
            locked={readOnly}
          />
        }
      />

      <div className="space-y-6 pb-20">

        {/* General Details */}
        <Section icon={ClipboardList} title="General Details" isEditing={editingSection === 'general'} onToggleEdit={() => toggleEdit('general')} hideEditButton={readOnly}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
            <Field
              label="Campaign Source" editing={editingSection === 'general'} view="Facebook"
              edit={<select className={editSelectClass}><option>Facebook</option></select>}
            />
            <div className="hidden md:block" />

            <Field
              label="Plan" editing={editingSection === 'general'} view="Plan 100 - 10 years to pay"
              edit={<select className={editSelectClass}><option>Plan 100 - 10 years to pay</option><option>Plan 200 - 10 years to pay</option></select>}
            />
            <div className="hidden md:block" />

            <Field
              label="Payment Option" editing={editingSection === 'general'} view="Monthly"
              edit={<select className={editSelectClass}><option>Monthly</option></select>}
            />
          </div>
        </Section>

        {/* Personal Information */}
        <Section icon={UserCircle2} title="Personal Information" isEditing={editingSection === 'personal'} onToggleEdit={() => toggleEdit('personal')} hideEditButton={readOnly}>
          <Field
            label="Title" editing={editingSection === 'personal'} view="Ms"
            edit={<select className={`${editSelectClass} max-w-[120px]`}><option>Ms</option><option>Mr</option></select>}
          />

          <Field
            label="Name" editing={editingSection === 'personal'} view="Rea Test To"
            edit={
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input type="text" defaultValue="Rea" placeholder="First Name" className={editInputClass} />
                <input type="text" defaultValue="" placeholder="Middle Name (Optional)" className={editInputClass} />
                <input type="text" defaultValue="Test To" placeholder="Last Name" className={editInputClass} />
              </div>
            }
          />

          <Field
            label="Birthdate" editing={editingSection === 'personal'}
            view={<span>{birthdate} <span className="ml-2 px-2 py-0.5 bg-red-50 border border-red-100 text-[#d0112b] font-black rounded-lg dark:bg-red-950/30 dark:border-red-900/40">{calculateAge(birthdate)} yrs</span></span>}
            edit={
              <div className="flex items-center space-x-4">
                <input type="date" value={birthdate} onChange={(e) => setBirthdate(e.target.value)} className={`w-48 ${editInputClass}`} />
                <div className="flex items-center space-x-2">
                  <span className="text-slate-500 font-semibold dark:text-slate-400">Age:</span>
                  <span className="px-3 py-1.5 bg-red-50 border border-red-100 text-[#d0112b] font-black rounded-lg dark:bg-red-950/30 dark:border-red-900/40">{calculateAge(birthdate)} yrs</span>
                </div>
              </div>
            }
          />

          <Field
            label="Place Of Birth" editing={editingSection === 'personal'} align="start" view={null}
            edit={<input type="text" className={editInputClass} />}
          />

          <Field
            label="Nationality" editing={editingSection === 'personal'} view="Filipino"
            edit={<select className={`${editSelectClass} max-w-[192px]`}><option>Filipino</option></select>}
          />

          {/* SSP Specific Fields */}
          <Field
            label="Weight (kg)" editing={editingSection === 'personal'} view={null}
            edit={
              <div className="w-48 relative">
                <input type="number" className={editInputClass} />
                <span className="absolute right-3 top-2 text-slate-400 font-medium dark:text-slate-500">kg</span>
              </div>
            }
          />
          <Field
            label="Height (cm)" editing={editingSection === 'personal'} view={null}
            edit={
              <div className="w-48 relative">
                <input type="number" className={editInputClass} />
                <span className="absolute right-3 top-2 text-slate-400 font-medium dark:text-slate-500">cm</span>
              </div>
            }
          />
        </Section>

        {/* Employment Information */}
        <Section icon={Briefcase} title="Employment Information" isEditing={editingSection === 'employment'} onToggleEdit={() => toggleEdit('employment')} hideEditButton={readOnly}>
          <Field label="Occupation" editing={editingSection === 'employment'} view="Adult Literacy, Remedial Education, and GED Teachers" edit={<input type="text" defaultValue="Adult Literacy, Remedial Education, and GED Teachers" className={editInputClass} />} />
          <Field label="Specific duties" editing={editingSection === 'employment'} view="Teacher" edit={<input type="text" defaultValue="Teacher" className={editInputClass} />} />
          <Field label="Office address" editing={editingSection === 'employment'} view="Sta. Ana Manila" edit={<input type="text" defaultValue="Sta. Ana Manila" className={editInputClass} />} />
          <Field label="Zipcode" editing={editingSection === 'employment'} view="1009" edit={<input type="text" defaultValue="1009" className={`w-48 ${editInputClass}`} />} />
          <Field
            label="Office Tel. No." editing={editingSection === 'employment'} view="000 0000000"
            edit={
              <div className="flex items-center space-x-2">
                <input type="text" defaultValue="000" placeholder="Area Code" className={`w-20 ${editInputClass}`} />
                <input type="text" defaultValue="0000000" placeholder="Phone number" className={`w-32 ${editInputClass}`} />
              </div>
            }
          />
          <Field label="Source of Funds" editing={editingSection === 'employment'} view="Salary" edit={<input type="text" defaultValue="Salary" className={editInputClass} />} />
          <Field label="TIN" editing={editingSection === 'employment'} view="125447555844799929" edit={<input type="text" defaultValue="125447555844799929" className={`w-48 ${editInputClass}`} />} />
          <Field label="GSIS / SSS" editing={editingSection === 'employment'} view="484948982" edit={<input type="text" defaultValue="484948982" className={`w-48 ${editInputClass}`} />} />
        </Section>

        {/* Beneficiaries */}
        <Section icon={Users} title="Beneficiaries" isEditing={editingSection === 'beneficiaries'} onToggleEdit={() => toggleEdit('beneficiaries')} hideEditButton={readOnly}>
          <div className="flex items-center text-slate-400 font-extrabold uppercase text-[10px] tracking-wide dark:text-slate-500">
            <div className="flex-1 px-1">Full Name</div><div className="w-48 px-1">Relationship to you</div><div className="w-48 px-1">Birthdate</div><div className="w-32 px-1">Revocable?</div>
          </div>
          <div className="flex items-center">
            <div className="flex-1 px-1">
              {editingSection === 'beneficiaries'
                ? <input type="text" defaultValue="TEST TORIBIO" className={editInputClass} />
                : <span className="text-xs font-bold text-slate-900 dark:text-white">TEST TORIBIO</span>}
            </div>
            <div className="w-48 px-1">
              {editingSection === 'beneficiaries' ? (
                <select className={editSelectClass}>
                  <option>Aunt</option><option>Child</option><option>Common Law Partner</option>
                  <option>Cousin</option><option>Granddaughter</option><option>Grandparent</option>
                  <option>Grandson</option><option>In-Law</option><option>Nephew</option>
                  <option>Niece</option><option>Parent</option><option>Sibling</option>
                  <option>Spouse</option><option>Uncle</option>
                </select>
              ) : <span className="text-xs font-bold text-slate-900 dark:text-white">Aunt</span>}
            </div>
            <div className="w-48 px-1">
              {editingSection === 'beneficiaries'
                ? <input type="date" className={editInputClass} />
                : <span className="text-slate-300 dark:text-slate-700">&mdash;</span>}
            </div>
            <div className="w-32 px-1">
              {editingSection === 'beneficiaries' ? (
                <select className={editSelectClass}><option>Revocable</option><option>Irrevocable</option></select>
              ) : <span className="text-xs font-bold text-slate-900 dark:text-white">Revocable</span>}
            </div>
          </div>
          <div className="pt-2"><AddRowButton label="Add Beneficiary" disabled={editingSection !== 'beneficiaries'} /></div>
        </Section>

        {/* Non-forfeiture Options */}
        <Section icon={ShieldQuestion} title="Non-forfeiture Options" isEditing={editingSection === 'forfeiture'} onToggleEdit={() => toggleEdit('forfeiture')} hideEditButton={readOnly}>
          <p className="text-slate-600 font-medium dark:text-slate-300">If premium is unpaid on expiry of grace period, apply cash value, if any, to effect:</p>
          {editingSection === 'forfeiture' ? (
            <select className={`${editSelectClass} max-w-xs`}>
              <option>Paid-up Insurance</option>
              <option>Automatic Payment of Premium</option>
              <option>Cash Surrender</option>
            </select>
          ) : (
            <span className="text-xs font-bold text-slate-900 dark:text-white">Paid-up Insurance</span>
          )}
        </Section>

        {/* Declaration on Existing Policies */}
        <Section icon={FileWarning} title="Declaration on Existing Policy(ies)" isEditing={editingSection === 'declaration'} onToggleEdit={() => toggleEdit('declaration')} hideEditButton={readOnly}>
          <div className="flex items-center space-x-4">
            <label className="font-semibold text-slate-700 dark:text-slate-300">Do you have other life insurance policies inforce with other insurance companies?</label>
            {editingSection === 'declaration' ? (
              <select
                value={hasOtherLifeInsurance ? 'Yes' : 'No'}
                onChange={(e) => setHasOtherLifeInsurance(e.target.value === 'Yes')}
                className={`${editSelectClass} max-w-[100px]`}
              >
                <option>No</option><option>Yes</option>
              </select>
            ) : (
              <span className="text-xs font-bold text-slate-900 dark:text-white">{hasOtherLifeInsurance ? 'Yes' : 'No'}</span>
            )}
          </div>
          {hasOtherLifeInsurance && (
            <Field
              label="If yes, please provide details" editing={editingSection === 'declaration'} align="start" view={null}
              edit={<textarea rows={2} className={editInputClass} />}
            />
          )}
        </Section>

        {/* Benefits Table */}
        <Section icon={ListChecks} title="Benefits Included" isEditing={false} onToggleEdit={() => {}} hideEditButton>
          <div className="border border-slate-200 rounded-xl overflow-hidden text-xs max-w-2xl dark:border-slate-800">
            <div className="flex border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/60"><div className="flex-1 p-3 font-semibold text-slate-700 dark:text-slate-300">Life Benefit</div><div className="w-40 p-3 text-right font-bold">100,000.00</div></div>
            <div className="flex border-b border-slate-200 dark:border-slate-800"><div className="flex-1 p-3 font-semibold text-slate-700 dark:text-slate-300">Hospital Income Benefit</div><div className="w-40 p-3 text-right font-bold">500.00</div></div>
            <div className="flex border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/60"><div className="flex-1 p-3 font-semibold text-slate-700 dark:text-slate-300">Accidental Death Benefit</div><div className="w-40 p-3 text-right font-bold">100,000.00</div></div>
            <div className="flex"><div className="flex-1 p-3 font-semibold text-slate-700 dark:text-slate-300">Waiver of Premium</div><div className="w-40 p-3 text-right font-bold">Yes</div></div>
          </div>
        </Section>

        {/* Payor Information */}
        <Section icon={Wallet} title="Payor Information" isEditing={editingSection === 'payor'} onToggleEdit={() => toggleEdit('payor')} hideEditButton={readOnly}>
          <label className="flex items-center space-x-2 text-slate-700 font-semibold dark:text-slate-300">
            <input
              type="checkbox"
              checked={isPayorSameAsInsured}
              onChange={(e) => setIsPayorSameAsInsured(e.target.checked)}
              disabled={editingSection !== 'payor'}
              className="w-3.5 h-3.5 accent-[#008cb4] rounded"
            />
            <span>Is Payor the same with the Insured?</span>
          </label>
          {!isPayorSameAsInsured && (
            <>
              <Field
                label="Name" editing={editingSection === 'payor'} view={null}
                edit={
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <input type="text" placeholder="First Name" className={editInputClass} />
                    <input type="text" placeholder="Middle Name (Optional)" className={editInputClass} />
                    <input type="text" placeholder="Last Name" className={editInputClass} />
                  </div>
                }
              />
              <Field label="Contact Number" editing={editingSection === 'payor'} view={null} edit={<input type="text" className={`w-48 ${editInputClass}`} />} />
              <Field label="Email Address" editing={editingSection === 'payor'} view={null} edit={<input type="text" className={`w-72 ${editInputClass}`} />} />
              <Field
                label="Relationship" editing={editingSection === 'payor'} view={null}
                edit={
                  <select className={`${editSelectClass} max-w-xs`}>
                    <option>Aunt</option><option>Child</option><option>Common Law Partner</option>
                    <option>Cousin</option><option>Employer</option><option>Granddaughter</option>
                    <option>Grandparent</option><option>Grandson</option><option>In-Law</option>
                    <option>Nephew</option><option>Niece</option><option>Other</option>
                    <option>Parent</option><option>Sibling</option><option>Spouse</option><option>Uncle</option>
                  </select>
                }
              />
            </>
          )}
        </Section>

      </div>
    </div>
  );
}
