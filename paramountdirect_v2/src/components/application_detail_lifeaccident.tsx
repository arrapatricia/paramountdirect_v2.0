import React, { useState } from 'react';
import { ClipboardList, UserCircle2, MapPin, Users, ShieldQuestion, FileWarning, Wallet, Briefcase } from 'lucide-react';
import {
  NotificationBanner, DetailHeader, StatusControl, Section, Field, FieldGrid, AddRowButton,
  editInputClass, editSelectClass, type NotificationState,
} from './application_detail_ui';
import { PD_LIFE_REFERRAL_SOURCES } from './pdlife_types';

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

export default function ApplicationDetailLifeAccident({
  applicationId,
  planCode,
  initialStatus,
  onUpdateStatus,
  onBack,
  readOnly = false
}: Props) {
  // Map Plan Code to Life & Accident Product Name
  const productNames: Record<string, string> = {
    'GLP': 'Guaranteed Life Plan',
    'GLA': 'Golden Life Advantage Plan',
    'GPR': 'Go Protect Plan'
  };
  const productName = productNames[planCode] || 'Life & Accident Plan';

  // Status Tracking
  const [status, setStatus] = useState(initialStatus);
  const [savedStatus, setSavedStatus] = useState(initialStatus);
  const [isStatusMenuOpen, setIsStatusMenuOpen] = useState(false);
  const statusOptions = ['For Verification', 'For Evaluation', 'Paid', 'Issued'];

  // Notification Prompt State
  const [notification, setNotification] = useState<NotificationState>(null);

  // Edit Mode Tracking
  const [editingSection, setEditingSection] = useState<string | null>(null);

  // Date and Age Tracking
  const [birthdate, setBirthdate] = useState('1987-01-20');

  const [hasOtherLifeInsurance, setHasOtherLifeInsurance] = useState(false);
  const [intendsToReplace, setIntendsToReplace] = useState(false);
  const [isPayorSameAsInsured, setIsPayorSameAsInsured] = useState(true);
  const [mailToDifferentAddress, setMailToDifferentAddress] = useState(false);

  // Philippine Geo Tracking
  const [region, setRegion] = useState('CAR');
  const [city, setCity] = useState('Bangued');
  const [barangay, setBarangay] = useState('Agtangao');

  const phRegions = ['NCR', 'CAR', 'Region III'];
  const phCities = ['Bangued', 'Makati City', 'Manila City'];
  const phBarangays = ['Agtangao', 'Barangay 101', 'Barangay 102'];

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

    const simulateError = false; // Set to true to simulate issuance error

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
    <div className="p-4 md:p-6 space-y-4 max-w-[1200px] mx-auto font-sans text-slate-800 dark:text-slate-200">

      <NotificationBanner notification={notification} onDismiss={() => setNotification(null)} />

      <DetailHeader
        applicationId={applicationId}
        productName={productName}
        planCode={planCode}
        premium="Premium: ₱413.00"
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

      {/* Main Form Content */}
      <div className="space-y-4 pb-10">

        {/* 1. General Details */}
        <Section icon={ClipboardList} title="General Details" isEditing={editingSection === 'general'} onToggleEdit={() => toggleEdit('general')} hideEditButton={readOnly}>
          <FieldGrid>
            <Field
              label="Campaign Source" editing={editingSection === 'general'} view="Facebook"
              edit={<select className={editSelectClass}>{PD_LIFE_REFERRAL_SOURCES.map(s => <option key={s}>{s}</option>)}</select>}
            />
            <Field
              label="Plan" editing={editingSection === 'general'} view="1 Unit"
              edit={<select className={editSelectClass}><option>1 Unit</option><option>2 Units</option></select>}
            />
            <Field
              label="Payment Option" editing={editingSection === 'general'} view="Monthly"
              edit={<select className={editSelectClass}><option>Monthly</option></select>}
            />
          </FieldGrid>
        </Section>

        {/* 2. Personal Information */}
        <Section icon={UserCircle2} title="Personal Information" isEditing={editingSection === 'personal'} onToggleEdit={() => toggleEdit('personal')} hideEditButton={readOnly}>
          <Field
            label="Name" editing={editingSection === 'personal'} view="Rea Test"
            edit={
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input type="text" defaultValue="Rea" placeholder="First Name" className={editInputClass} />
                <input type="text" defaultValue="" placeholder="Middle Name (Optional)" className={editInputClass} />
                <input type="text" defaultValue="Test" placeholder="Last Name" className={editInputClass} />
              </div>
            }
          />

          <FieldGrid>
            <Field
              label="Title" editing={editingSection === 'personal'} view="Mr"
              edit={<select className={`${editSelectClass} max-w-[120px]`}><option>Mr</option><option>Ms</option></select>}
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
              label="Place Of Birth" editing={editingSection === 'personal'} view={null}
              edit={<input type="text" className={editInputClass} />}
            />

            <Field
              label="Nationality" editing={editingSection === 'personal'} view="Filipino"
              edit={<select className={`${editSelectClass} max-w-[192px]`}><option>Filipino</option></select>}
            />
          </FieldGrid>
        </Section>

        {/* 2b. Employment Information */}
        <Section icon={Briefcase} title="Employment Information" isEditing={editingSection === 'employment'} onToggleEdit={() => toggleEdit('employment')} hideEditButton={readOnly}>
          <FieldGrid>
            <Field label="Occupation" editing={editingSection === 'employment'} view={null} edit={<input type="text" className={editInputClass} />} />
            <Field label="Office address" editing={editingSection === 'employment'} view={null} edit={<input type="text" className={editInputClass} />} />
            <Field label="Zipcode" editing={editingSection === 'employment'} view={null} edit={<input type="text" className={`w-48 ${editInputClass}`} />} />
            <Field
              label="Office Tel. No." editing={editingSection === 'employment'} view={null}
              edit={
                <div className="flex items-center space-x-2">
                  <input type="text" placeholder="Area Code" className={`w-20 ${editInputClass}`} />
                  <input type="text" placeholder="Phone number" className={`w-32 ${editInputClass}`} />
                </div>
              }
            />
          </FieldGrid>
        </Section>

        {/* 3. Contact Information */}
        <Section icon={MapPin} title="Contact Information" isEditing={editingSection === 'contact'} onToggleEdit={() => toggleEdit('contact')} hideEditButton={readOnly}>
          <Field
            label="Address" editing={editingSection === 'contact'} align="start"
            view={`BTL7 Tolko St., ${barangay}, ${city}, ${region} 2800`}
            edit={
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <input type="text" defaultValue="BTL7" placeholder="Unit / House No." className={editInputClass} />
                  <input type="text" defaultValue="Tolko St." placeholder="Street" className={editInputClass} />
                  <input type="text" placeholder="Building Name (Optional)" className={editInputClass} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <select value={barangay} onChange={(e) => setBarangay(e.target.value)} className={editSelectClass}>{phBarangays.map(b => <option key={b} value={b}>{b}</option>)}</select>
                  <select value={city} onChange={(e) => setCity(e.target.value)} className={editSelectClass}>{phCities.map(c => <option key={c} value={c}>{c}</option>)}</select>
                  <select value={region} onChange={(e) => setRegion(e.target.value)} className={editSelectClass}>{phRegions.map(r => <option key={r} value={r}>{r}</option>)}</select>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <input type="text" defaultValue="2800" placeholder="Zip Code" className={editInputClass} />
                </div>
              </div>
            }
          />

          <FieldGrid>
            <Field label="Mobile Number" editing={editingSection === 'contact'} view="09367284148" edit={<input type="text" defaultValue="09367284148" className={`w-48 ${editInputClass}`} />} />
            <Field label="Telephone Number" editing={editingSection === 'contact'} view={null} edit={<input type="text" className={`w-48 ${editInputClass}`} />} />
            <Field label="Email Address" editing={editingSection === 'contact'} view="rea.toribio@paramount.com.ph" edit={<input type="text" defaultValue="rea.toribio@paramount.com.ph" className={`w-72 ${editInputClass}`} />} />
          </FieldGrid>

          <label className="flex items-center space-x-2 text-slate-700 font-semibold dark:text-slate-300">
            <input
              type="checkbox"
              checked={mailToDifferentAddress}
              onChange={(e) => setMailToDifferentAddress(e.target.checked)}
              disabled={editingSection !== 'contact'}
              className="w-3.5 h-3.5 accent-[#008cb4] rounded"
            />
            <span>Mail to a different address?</span>
          </label>
          {mailToDifferentAddress && (
            <Field
              label="Mailing Address" editing={editingSection === 'contact'} align="start" view={null}
              edit={
                <div className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <input type="text" placeholder="Unit / House No." className={editInputClass} />
                    <input type="text" placeholder="Street" className={editInputClass} />
                    <input type="text" placeholder="Building Name (Optional)" className={editInputClass} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <select className={editSelectClass}>{phBarangays.map(b => <option key={b} value={b}>{b}</option>)}</select>
                    <select className={editSelectClass}>{phCities.map(c => <option key={c} value={c}>{c}</option>)}</select>
                    <select className={editSelectClass}>{phRegions.map(r => <option key={r} value={r}>{r}</option>)}</select>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <input type="text" placeholder="Zip Code" className={editInputClass} />
                  </div>
                </div>
              }
            />
          )}
        </Section>

        {/* 4. Beneficiaries */}
        <Section icon={Users} title="Beneficiaries" isEditing={editingSection === 'beneficiaries'} onToggleEdit={() => toggleEdit('beneficiaries')} hideEditButton={readOnly}>
          <div className="flex items-center text-slate-400 font-extrabold uppercase text-[10px] tracking-wide dark:text-slate-500">
            <div className="flex-1 px-1">Full Name</div><div className="w-48 px-1">Relationship to you</div><div className="w-48 px-1">Birthdate</div><div className="w-32 px-1">Revocable?</div>
          </div>
          <div className="flex items-center">
            <div className="flex-1 px-1">
              {editingSection === 'beneficiaries'
                ? <input type="text" defaultValue="REANA GOMEZ" className={editInputClass} />
                : <span className="text-xs font-bold text-slate-900 dark:text-white">REANA GOMEZ</span>}
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
              {editingSection === 'beneficiaries'
                ? <select className={editSelectClass}><option>Revocable</option></select>
                : <span className="text-xs font-bold text-slate-900 dark:text-white">Revocable</span>}
            </div>
          </div>
          <div className="pt-2"><AddRowButton label="Add Beneficiary" disabled={editingSection !== 'beneficiaries'} /></div>
        </Section>

        {/* 5. Non-forfeiture Options */}
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

        {/* 6. Declaration on Existing Policies */}
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
          <div className="flex items-center space-x-4">
            <label className="font-semibold text-slate-700 dark:text-slate-300">Is the policy applied for intended to change or replace any existing inforce policies?</label>
            {editingSection === 'declaration' ? (
              <select
                value={intendsToReplace ? 'Yes' : 'No'}
                onChange={(e) => setIntendsToReplace(e.target.value === 'Yes')}
                className={`${editSelectClass} max-w-[100px]`}
              >
                <option>No</option><option>Yes</option>
              </select>
            ) : (
              <span className="text-xs font-bold text-slate-900 dark:text-white">{intendsToReplace ? 'Yes' : 'No'}</span>
            )}
          </div>
        </Section>

        {/* 7. Payor Information */}
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
                label="Name" editing={editingSection === 'payor'} view="Rea Test"
                edit={
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <input type="text" defaultValue="Rea" placeholder="First Name" className={editInputClass} />
                    <input type="text" defaultValue="" placeholder="Middle Name (Optional)" className={editInputClass} />
                    <input type="text" defaultValue="Test" placeholder="Last Name" className={editInputClass} />
                  </div>
                }
              />
              <FieldGrid>
                <Field label="Contact Number" editing={editingSection === 'payor'} view="09367284148" edit={<input type="text" defaultValue="09367284148" className={`w-48 ${editInputClass}`} />} />
                <Field label="Email Address" editing={editingSection === 'payor'} view="rea.toribio@paramount.com.ph" edit={<input type="text" defaultValue="rea.toribio@paramount.com.ph" className={`w-72 ${editInputClass}`} />} />
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
              </FieldGrid>
            </>
          )}
        </Section>

      </div>
    </div>
  );
}
