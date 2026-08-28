import React, { useState } from 'react';
import { Plus, Package, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface Props {
  darkMode: boolean;
}

interface ProductItem {
  code: string;
  name: string;
  category: string;
  subCategory: string;
}

export default function ProductEnrollment({ darkMode }: Props) {
  // Paramount Direct Product Master Catalog
  const initialProducts: ProductItem[] = [
    // LIFE - HEALTH
    { code: 'HCP', name: 'HealthCare Cash Plan', category: 'LIFE', subCategory: 'Health' },
    { code: 'HIP', name: 'Hospital Income Benefit Plan', category: 'LIFE', subCategory: 'Health' },
    { code: 'PCP', name: 'PrimeCare Cash Plan', category: 'LIFE', subCategory: 'Health' },
    { code: 'PHC', name: 'Premium HealthCare Plus Plan', category: 'LIFE', subCategory: 'Health' },
    
    // LIFE - LIFE & ACCIDENT
    { code: 'GLP', name: 'Guaranteed Life Plan', category: 'LIFE', subCategory: 'Life & Accident' },
    { code: 'GLA', name: 'Golden Life Advantage Plan', category: 'LIFE', subCategory: 'Life & Accident' },
    { code: 'GPR', name: 'Go Protect Plan', category: 'LIFE', subCategory: 'Life & Accident' },

    // LIFE - COMPREHENSIVE
    { code: 'MPR', name: 'MoneyPlus Protection Plan', category: 'LIFE', subCategory: 'Comprehensive' },
    { code: 'SSP', name: 'Sure Savings Plan', category: 'LIFE', subCategory: 'Comprehensive' },
    { code: 'PHP', name: 'PrimeHealth Cash Plan', category: 'LIFE', subCategory: 'Comprehensive' },
    { code: 'DRE', name: 'Dream College Plan', category: 'LIFE', subCategory: 'Comprehensive' },

    // OTHER PRODUCTS
    { code: 'ERP', name: 'Employee Referral Program', category: 'Other Products', subCategory: 'Program' },
  ];

  const [products, setProducts] = useState<ProductItem[]>(initialProducts);
  const [productName, setProductName] = useState('');
  const [productCode, setProductCode] = useState('');
  const [category, setCategory] = useState('LIFE');
  const [subCategory, setSubCategory] = useState('Health');

  const handleEnroll = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productName || !productCode) return;

    const newProd: ProductItem = {
      code: productCode.toUpperCase(),
      name: productName,
      category,
      subCategory,
    };

    setProducts([newProd, ...products]);
    setProductName('');
    setProductCode('');
  };

  return (
    <div className={`p-4 md:p-8 space-y-6 max-w-[1400px] mx-auto font-sans transition-colors duration-500 ${
      darkMode ? 'text-white' : 'text-gray-900'
    }`}>
      {/* Header */}
      <div className="border-b pb-4 border-gray-200 dark:border-white/10 flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-lg md:text-xl font-bold uppercase tracking-wider text-[#d0112b]">
            Product Enrollment
          </h1>
          <p className="text-xs text-gray-400 mt-1">Configure and manage Paramount Direct Business Products in iPeak</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Enrollment Form */}
        <div className={`p-6 rounded-3xl border backdrop-blur-xl ${
          darkMode ? 'bg-gray-900/40 border-white/10 shadow-lg' : 'bg-white border-gray-100 shadow-sm'
        }`}>
          <div className="flex items-center space-x-2 text-[#d0112b] mb-4">
            <Package className="h-5 w-5" />
            <h2 className="text-sm font-bold">Enroll New PD Product</h2>
          </div>

          <form className="space-y-4" onSubmit={handleEnroll}>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
                Product Code (Acronym)
              </label>
              <input
                type="text"
                required
                value={productCode}
                onChange={(e) => setProductCode(e.target.value)}
                placeholder="e.g. HCP, GLP, MPR"
                className={`w-full px-4 py-2.5 rounded-2xl text-xs border focus:outline-none focus:ring-2 focus:ring-[#d0112b] ${
                  darkMode ? 'bg-white/5 border-white/10 text-white' : 'bg-gray-50 border-gray-200'
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
                Product Name
              </label>
              <input
                type="text"
                required
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="e.g. HealthCare Cash Plan"
                className={`w-full px-4 py-2.5 rounded-2xl text-xs border focus:outline-none focus:ring-2 focus:ring-[#d0112b] ${
                  darkMode ? 'bg-white/5 border-white/10 text-white' : 'bg-gray-50 border-gray-200'
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
                Business Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className={`w-full px-4 py-2.5 rounded-2xl text-xs border focus:outline-none focus:ring-2 focus:ring-[#d0112b] ${
                  darkMode ? 'bg-slate-900 border-white/10 text-white' : 'bg-gray-50 border-gray-200'
                }`}
              >
                <option value="LIFE">LIFE</option>
                <option value="Other Products">Other Products</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
                Sub-Category
              </label>
              <select
                value={subCategory}
                onChange={(e) => setSubCategory(e.target.value)}
                className={`w-full px-4 py-2.5 rounded-2xl text-xs border focus:outline-none focus:ring-2 focus:ring-[#d0112b] ${
                  darkMode ? 'bg-slate-900 border-white/10 text-white' : 'bg-gray-50 border-gray-200'
                }`}
              >
                <option value="Health">HEALTH</option>
                <option value="Life & Accident">LIFE & ACCIDENT</option>
                <option value="Comprehensive">COMPREHENSIVE</option>
                <option value="Program">PROGRAM</option>
              </select>
            </div>

            <button
              type="submit"
              className="mt-2 flex items-center justify-center space-x-2 w-full py-3 px-4 rounded-2xl font-semibold text-xs text-white bg-[#d0112b] hover:bg-[#b00e24] shadow-lg shadow-[#d0112b]/30 cursor-pointer transition-all"
            >
              <Plus className="h-4 w-4" />
              <span>Enroll Product</span>
            </button>
          </form>
        </div>

        {/* Product Catalog Table */}
        <div className={`lg:col-span-2 p-6 rounded-3xl border backdrop-blur-xl ${
          darkMode ? 'bg-gray-900/40 border-white/10 shadow-lg' : 'bg-white border-gray-100 shadow-sm'
        }`}>
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-sm font-bold text-[#d0112b]">PD Business Product Catalog</h3>
              <p className="text-xs text-gray-400">Active Paramount Direct policy plans enrolled in system</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5" /> iPeak Synced
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-200 dark:border-white/10 text-gray-400">
                  <th className="py-3 px-2 font-semibold">Code</th>
                  <th className="py-3 px-2 font-semibold">Product Name</th>
                  <th className="py-3 px-2 font-semibold">Category</th>
                  <th className="py-3 px-2 font-semibold">Sub-Category</th>
                  <th className="py-3 px-2 font-semibold text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                {products.map((item) => (
                  <tr key={item.code} className="hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors">
                    <td className="py-3 px-2 font-mono font-bold text-[#d0112b]">{item.code}</td>
                    <td className="py-3 px-2 font-semibold">{item.name}</td>
                    <td className="py-3 px-2 text-gray-400 font-medium">{item.category}</td>
                    <td className="py-3 px-2">
                      <span className="px-2 py-0.5 rounded-md bg-red-500/10 text-[#d0112b] font-semibold text-[10px]">
                        {item.subCategory}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-center">
                      <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-500">
                        <CheckCircle2 className="h-3 w-3" />
                        <span>Active</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}