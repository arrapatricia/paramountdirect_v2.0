// Shared Philippine region/city/barangay data for address dropdowns across
// OFW, CTPL, and PD Life create-application forms. All 17 official regions
// are covered, each with its major cities/municipalities - not every single
// city or municipality in the country, but enough that a real applicant's
// city is almost always on the list. Real per-city barangay data isn't
// practical to hand-maintain at this scale, so every city shares the same
// generic placeholder list, plus an explicit "N/A" for addresses that don't
// have a barangay on file (rural delivery addresses, foreign-facing forms,
// etc.).

export interface PhRegion {
  name: string;
  cities: string[];
}

export const PH_REGIONS: PhRegion[] = [
  {
    name: 'NCR - National Capital Region',
    cities: [
      'Caloocan City', 'Las Pinas City', 'Makati City', 'Malabon City', 'Mandaluyong City',
      'Manila City', 'Marikina City', 'Muntinlupa City', 'Navotas City', 'Paranaque City',
      'Pasay City', 'Pasig City', 'Pateros', 'Quezon City', 'San Juan City', 'Taguig City', 'Valenzuela City',
    ],
  },
  {
    name: 'CAR - Cordillera Administrative Region',
    cities: ['Baguio City', 'Tabuk City', 'La Trinidad', 'Bangued', 'Lagawe', 'Bontoc'],
  },
  {
    name: 'Region I - Ilocos Region',
    cities: ['Laoag City', 'Vigan City', 'San Fernando City (La Union)', 'Dagupan City', 'Alaminos City', 'Candon City', 'Batac City'],
  },
  {
    name: 'Region II - Cagayan Valley',
    cities: ['Tuguegarao City', 'Ilagan City', 'Santiago City', 'Cauayan City', 'Bayombong'],
  },
  {
    name: 'Region III - Central Luzon',
    cities: [
      'Angeles City', 'San Fernando City (Pampanga)', 'Olongapo City', 'Malolos City', 'Meycauayan City',
      'San Jose Del Monte City', 'Tarlac City', 'Cabanatuan City', 'San Fernando City (Pampanga)', 'Balanga City',
    ],
  },
  {
    name: 'Region IV-A - CALABARZON',
    cities: [
      'Antipolo City', 'Bacoor City', 'Dasmarinas City', 'Imus City', 'Cavite City', 'Calamba City',
      'San Pablo City', 'Santa Rosa City', 'Batangas City', 'Lipa City', 'Lucena City', 'Lucban',
    ],
  },
  {
    name: 'MIMAROPA',
    cities: ['Calapan City', 'Puerto Princesa City', 'Odiongan', 'Boac', 'San Jose (Occidental Mindoro)'],
  },
  {
    name: 'Region V - Bicol Region',
    cities: ['Legazpi City', 'Naga City', 'Iriga City', 'Sorsogon City', 'Masbate City', 'Daet'],
  },
  {
    name: 'Region VI - Western Visayas',
    cities: ['Iloilo City', 'Bacolod City', 'Roxas City', 'Kalibo', 'San Jose de Buenavista', 'Silay City'],
  },
  {
    name: 'Region VII - Central Visayas',
    cities: ['Cebu City', 'Mandaue City', 'Lapu-Lapu City', 'Tagbilaran City', 'Dumaguete City', 'Toledo City'],
  },
  {
    name: 'Region VIII - Eastern Visayas',
    cities: ['Tacloban City', 'Ormoc City', 'Catbalogan City', 'Borongan City', 'Maasin City'],
  },
  {
    name: 'Region IX - Zamboanga Peninsula',
    cities: ['Zamboanga City', 'Pagadian City', 'Dipolog City', 'Dapitan City', 'Isabela City'],
  },
  {
    name: 'Region X - Northern Mindanao',
    cities: ['Cagayan de Oro City', 'Iligan City', 'Malaybalay City', 'Valencia City', 'Ozamiz City', 'Gingoog City'],
  },
  {
    name: 'Region XI - Davao Region',
    cities: ['Davao City', 'Tagum City', 'Panabo City', 'Digos City', 'Mati City', 'Island Garden City of Samal'],
  },
  {
    name: 'Region XII - SOCCSKSARGEN',
    cities: ['General Santos City', 'Koronadal City', 'Kidapawan City', 'Tacurong City', 'Cotabato City'],
  },
  {
    name: 'Region XIII - Caraga',
    cities: ['Butuan City', 'Surigao City', 'Bislig City', 'Tandag City', 'Bayugan City'],
  },
  {
    name: 'BARMM - Bangsamoro Autonomous Region in Muslim Mindanao',
    cities: ['Marawi City', 'Lamitan City', 'Jolo', 'Bongao'],
  },
];

export const PH_REGION_NAMES = PH_REGIONS.map((r) => r.name);

export function citiesForRegion(regionName: string): string[] {
  return PH_REGIONS.find((r) => r.name === regionName)?.cities ?? [];
}

// N/A first so it's the obvious fallback, not buried at the end of a long list.
export const GENERIC_BARANGAYS = ['N/A', 'Barangay 1', 'Barangay 2', 'Barangay 3'];
