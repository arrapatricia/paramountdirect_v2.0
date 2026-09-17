
import { Search, ClipboardCheck, Stamp, ArrowRight, LayoutGrid } from 'lucide-react';
import type { ScreeningItem } from '../App';
import { buildFollowUpRows, isUnsigned } from './followup_signature_data';

interface Props {
  data: ScreeningItem[];
  onNavigate: (tab: string) => void;
}

export default function PdLifeApplicationsHub({ data, onNavigate }: Props) {
  const total = data.length;
  const pendingScreening = data.filter((d) => d.status === 'Received' || d.status === 'For Verification' || d.status === 'For Evaluation').length;
  const issued = data.filter((d) => d.status === 'Issued').length;
  const unsigned = buildFollowUpRows(data).filter(isUnsigned).length;

  const cards = [
    {
      id: 'inquiry',
      icon: Search,
      title: 'Application Inquiry',
      description: 'General inquiry registry for all insurance applications and policy documents.',
      metricLabel: 'Total Applications',
      metricValue: total,
      accent: '#008cb4',
    },
    {
      id: 'screening',
      icon: ClipboardCheck,
      title: 'Application Screening',
      description: 'Screen, verify, and issue incoming applications for PD Life.',
      metricLabel: 'Pending Screening',
      metricValue: pendingScreening,
      accent: '#d0112b',
    },
    {
      id: 'life-followup-signature',
      icon: Stamp,
      title: 'Follow-up Signature',
      description: "Chase the client's signed application form on issued policies.",
      metricLabel: 'Unsigned',
      metricValue: unsigned,
      accent: '#7c3aed',
    },
  ];

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-[1400px] mx-auto font-sans text-slate-900 dark:text-slate-100">

      {/* Header */}
      <div className="flex items-center space-x-2.5 border-b pb-4 border-slate-200 dark:border-slate-800">
        <LayoutGrid className="h-6 w-6 text-[#d0112b]" />
        <div>
          <h1 className="text-lg md:text-xl font-bold uppercase tracking-wider text-[#d0112b] font-['Montserrat']">
            APPLICATIONS
          </h1>
          <p className="text-xs text-slate-500 font-semibold dark:text-slate-500">Overview of PD Life's application pipeline</p>
        </div>
      </div>

      {/* Overview strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm dark:bg-slate-900 dark:border-slate-800">
          <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wide dark:text-slate-500">Total</p>
          <p className="text-2xl font-black text-slate-900 dark:text-white">{total.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm dark:bg-slate-900 dark:border-slate-800">
          <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wide dark:text-slate-500">Pending Screening</p>
          <p className="text-2xl font-black text-[#d0112b]">{pendingScreening.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm dark:bg-slate-900 dark:border-slate-800">
          <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wide dark:text-slate-500">Issued</p>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{issued.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm dark:bg-slate-900 dark:border-slate-800">
          <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wide dark:text-slate-500">Unsigned</p>
          <p className="text-2xl font-black text-purple-600 dark:text-purple-400">{unsigned.toLocaleString()}</p>
        </div>
      </div>

      {/* Nav cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <button
              key={card.id}
              onClick={() => onNavigate(card.id)}
              className="text-left bg-white rounded-3xl border border-slate-200 p-6 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer group dark:bg-slate-900 dark:border-slate-800 flex flex-col"
            >
              <div
                className="w-11 h-11 rounded-2xl flex items-center justify-center mb-4"
                style={{ backgroundColor: `${card.accent}1a` }}
              >
                <Icon className="w-5 h-5" style={{ color: card.accent }} />
              </div>
              <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide mb-1.5 dark:text-white">{card.title}</h2>
              <p className="text-xs text-slate-500 font-medium leading-relaxed mb-5 flex-1 dark:text-slate-400">{card.description}</p>

              <div className="flex items-end justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                <div>
                  <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide dark:text-slate-500">{card.metricLabel}</p>
                  <p className="text-xl font-black" style={{ color: card.accent }}>{card.metricValue.toLocaleString()}</p>
                </div>
                <span
                  className="flex items-center space-x-1 text-[11px] font-bold group-hover:translate-x-0.5 transition-transform"
                  style={{ color: card.accent }}
                >
                  <span>Open</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
