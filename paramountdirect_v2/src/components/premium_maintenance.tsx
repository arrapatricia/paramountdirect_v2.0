import React, { useState } from 'react';
import { Wallet, CheckCircle2, X, RotateCcw } from 'lucide-react';
import type { PremiumRate, PremiumProduct } from './premium_rates';

interface Props {
  rates: PremiumRate[];
  onSave: (rates: PremiumRate[]) => void;
}

const PRODUCTS: PremiumProduct[] = ['PD Life', 'OFW', 'CTPL', 'GTP'];

const UNIT_LABEL: Record<PremiumRate['unit'], string> = {
  'flat': 'Flat premium',
  'per day': 'Per day',
  'add-on': 'Add-on fee',
};

export default function PremiumMaintenance({ rates, onSave }: Props) {
  const [selectedProduct, setSelectedProduct] = useState<PremiumProduct>('PD Life');
  const [draft, setDraft] = useState<PremiumRate[]>(rates);
  const [notification, setNotification] = useState<string | null>(null);

  const visibleRates = draft.filter((r) => r.product === selectedProduct);
  const isDirty = JSON.stringify(draft) !== JSON.stringify(rates);

  const handleAmountChange = (id: string, value: string) => {
    const amount = Number(value);
    setDraft((prev) => prev.map((r) => (r.id === id ? { ...r, amount: Number.isFinite(amount) ? amount : r.amount } : r)));
  };

  const handleReset = () => setDraft(rates);

  const handleSave = () => {
    onSave(draft);
    setNotification(`Premium rates saved for ${selectedProduct}.`);
    setTimeout(() => setNotification(null), 2500);
  };

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-[1400px] mx-auto font-sans text-slate-900 dark:text-slate-100">
      {notification && (
        <div className="fixed top-6 right-6 z-[100] p-4 rounded-2xl bg-emerald-600 text-white text-xs font-bold shadow-2xl flex items-center justify-between space-x-3">
          <CheckCircle2 className="w-5 h-5 text-white" />
          <span>{notification}</span>
          <button onClick={() => setNotification(null)} className="cursor-pointer p-1"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex items-center space-x-3">
          <Wallet className="w-6 h-6 text-[#d0112b]" />
          <div>
            <h1 className="text-lg md:text-xl font-bold uppercase tracking-wider text-[#d0112b] font-['Montserrat']">Premium Maintenance</h1>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">Rate tables used to compute premiums on each product's Create Application form</p>
          </div>
        </div>
      </div>

      {/* Product Tabs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {PRODUCTS.map((prod) => (
          <button
            key={prod}
            onClick={() => setSelectedProduct(prod)}
            className={`p-4 rounded-2xl border text-xs font-extrabold transition-all cursor-pointer flex items-center justify-center shadow-sm ${
              selectedProduct === prod
                ? 'bg-[#d0112b] text-white border-[#d0112b] shadow-md'
                : 'bg-white/80 hover:bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-900/80 dark:hover:bg-slate-800 dark:text-slate-200 dark:border-slate-800'
            }`}
          >
            {prod}
          </button>
        ))}
      </div>

      {/* Rate Table */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm dark:bg-slate-900 dark:border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-slate-800 dark:text-white">{selectedProduct} Rates</h2>
          <span className="text-[10px] font-bold text-slate-400 uppercase">{visibleRates.length} rate{visibleRates.length === 1 ? '' : 's'}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-800 font-extrabold uppercase tracking-wider dark:border-slate-800 dark:text-slate-100">
                <th className="py-3 pr-4">Rate Applies To</th>
                <th className="py-3 pr-4">Type</th>
                <th className="py-3 pr-4 text-right">Amount</th>
                <th className="py-3">Currency</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {visibleRates.map((rate) => (
                <tr key={rate.id}>
                  <td className="py-3 pr-4 font-bold text-slate-900 dark:text-slate-100">{rate.label}</td>
                  <td className="py-3 pr-4 font-semibold text-slate-500 dark:text-slate-400">{UNIT_LABEL[rate.unit]}</td>
                  <td className="py-3 pr-4">
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={rate.amount}
                      onChange={(e) => handleAmountChange(rate.id, e.target.value)}
                      className="w-28 ml-auto block text-right px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#d0112b] dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </td>
                  <td className="py-3 font-semibold text-slate-500 dark:text-slate-400">{rate.currency}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex flex-wrap justify-end gap-3">
        <button
          onClick={handleReset}
          disabled={!isDirty}
          className="flex items-center space-x-2 px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Changes</span>
        </button>
        <button
          onClick={handleSave}
          disabled={!isDirty}
          className="px-6 py-2.5 rounded-xl bg-[#d0112b] hover:bg-[#a80d22] text-white text-xs font-bold cursor-pointer shadow-md disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          Save Changes
        </button>
      </div>
    </div>
  );
}
