// Coverage (face amount) tables per product, transcribed from the "PD Prod
// coverage" Google Sheet (tabs HOSPI, GPR, GLA, PHP, SSP) and, for GLP, from
// Paramount's "GLP PREMIUMS RATES AND BENEFITS" sheets. Those are the source
// of truth - when they change, update the numbers here. The MPR tab is empty,
// so MPR has no table yet.

export interface BenefitLine {
  code: string;
  amount: number;
}

const HOSPI_PLANS = [500, 1000, 1500, 2000, 2500, 3000, 3500, 4000];
const HOSPI_DCB = [500, 1000, 1500, 2000, 2500, 3000, 3500, 4000];
const HOSPI_DDCB = [1000, 1000, 1500, 2000, 2500, 3000, 3500, 4000];
const HOSPI_20X = [10000, 20000, 30000, 40000, 50000, 60000, 70000, 80000];

interface PlanTable {
  plans: number[];
  benefits: Record<string, number[]>;
}

const HEALTH: Record<string, PlanTable> = {
  HCP: { plans: HOSPI_PLANS, benefits: { DCB: HOSPI_DCB, ICU: HOSPI_DCB, DDCB: HOSPI_DDCB, CONVA: HOSPI_20X, 'MAX SURG': HOSPI_20X } },
  HIP: { plans: HOSPI_PLANS, benefits: { DCB: HOSPI_DCB, DDCB: HOSPI_DDCB, CONVA: HOSPI_20X } },
  PCP: { plans: HOSPI_PLANS, benefits: { DCB: HOSPI_DCB, ICU: HOSPI_DCB, 'MAX SURG': [0, 0, 0, 0, 0, 0, 0, 0] } },
  PHC: { plans: HOSPI_PLANS, benefits: { DCB: HOSPI_DCB, ICU: HOSPI_DCB, CONVA: HOSPI_20X, 'MAX SURG': HOSPI_20X } },
};

const PHP: PlanTable = {
  plans: [50, 100, 150, 200, 250, 300, 350, 400],
  benefits: {
    LIFE: [50000, 100000, 150000, 200000, 250000, 300000, 350000, 400000],
    ADB: [50000, 100000, 150000, 200000, 250000, 300000, 350000, 400000],
    CRITICAL: [50000, 100000, 150000, 200000, 250000, 300000, 350000, 400000],
    'MEDICAL A': [2500, 5000, 7500, 10000, 12500, 15000, 17500, 20000],
  },
};

// Keyed by years to pay.
const GPR: Record<number, PlanTable> = {
  10: { plans: [100, 200, 300, 400, 500, 600], benefits: { LF: [100000, 200000, 300000, 400000, 500000, 600000] } },
  20: { plans: [100, 200, 300, 400, 500, 600, 700, 800], benefits: { LF: [100000, 200000, 300000, 400000, 500000, 600000, 700000, 800000] } },
};

const SSP: Record<number, PlanTable> = {
  5: {
    plans: [100, 150, 200, 250],
    benefits: { LIFE: [100000, 150000, 200000, 250000], HIB: [500, 1000, 2000, 3000], ADB: [100000, 150000, 200000, 250000] },
  },
  10: {
    plans: [100, 200, 300, 400, 500],
    benefits: { LIFE: [100000, 200000, 300000, 400000, 500000], HIB: [500, 1000, 2000, 3000, 4000], ADB: [100000, 200000, 300000, 400000, 500000] },
  },
};

const GLA_UNITS = [1, 2, 3, 5, 8, 10, 15, 20];
// Face amount by insurance age (rows) and units (columns), "REPRICED" table.
const GLA_BY_AGE: Record<number, number[]> = {
  40: [75000, 150000, 225000, 375000, 600000, 750000, 1125000, 1500000],
  41: [72600, 145200, 217800, 363000, 580800, 726000, 1089000, 1452000],
  42: [70200, 140400, 210600, 351000, 561600, 702000, 1053000, 1404000],
  43: [67900, 135800, 203700, 339500, 543200, 679000, 1018500, 1358000],
  44: [65700, 131400, 197100, 328500, 525600, 657000, 985500, 1314000],
  45: [63600, 127200, 190800, 318000, 508800, 636000, 954000, 1272000],
  46: [61500, 123000, 184500, 307500, 492000, 615000, 922500, 1230000],
  47: [59500, 119000, 178500, 297500, 476000, 595000, 892500, 1190000],
  48: [57600, 115200, 172800, 288000, 460800, 576000, 864000, 1152000],
  49: [55700, 111400, 167100, 278500, 445600, 557000, 835500, 1114000],
  50: [53900, 107800, 161700, 269500, 431200, 539000, 808500, 1078000],
  51: [52100, 104200, 156300, 260500, 416800, 521000, 781500, 1042000],
  52: [50500, 101000, 151500, 252500, 404000, 505000, 757500, 1010000],
  53: [48800, 97600, 146400, 244000, 390400, 488000, 732000, 976000],
  54: [47200, 94400, 141600, 236000, 377600, 472000, 708000, 944000],
  55: [45700, 91400, 137100, 228500, 365600, 457000, 685500, 914000],
  56: [44200, 88400, 132600, 221000, 353600, 442000, 663000, 884000],
  57: [42700, 85400, 128100, 213500, 341600, 427000, 640500, 854000],
  58: [41300, 82600, 123900, 206500, 330400, 413000, 619500, 826000],
  59: [39900, 79800, 119700, 199500, 319200, 399000, 598500, 798000],
  60: [38600, 77200, 115800, 193000, 308800, 386000, 579000, 772000],
  61: [37300, 74600, 111900, 186500, 298400, 373000, 559500, 746000],
  62: [36000, 72000, 108000, 180000, 288000, 360000, 540000, 720000],
  63: [34800, 69600, 104400, 174000, 278400, 348000, 522000, 696000],
  64: [33600, 67200, 100800, 168000, 268800, 336000, 504000, 672000],
  65: [32400, 64800, 97200, 162000, 259200, 324000, 486000, 648000],
  66: [31200, 62400, 93600, 156000, 249600, 312000, 468000, 624000],
  67: [30100, 60200, 90300, 150500, 240800, 301000, 451500, 602000],
  68: [28900, 57800, 86700, 144500, 231200, 289000, 433500, 578000],
  69: [27800, 55600, 83400, 139000, 222400, 278000, 417000, 556000],
  70: [26700, 53400, 80100, 133500, 213600, 267000, 400500, 534000],
  71: [25600, 51200, 76800, 128000, 204800, 256000, 384000, 512000],
  72: [24400, 48800, 73200, 122000, 195200, 244000, 366000, 488000],
  73: [23400, 46800, 70200, 117000, 187200, 234000, 351000, 468000],
  74: [22300, 44600, 66900, 111500, 178400, 223000, 334500, 446000],
  75: [21300, 42600, 63900, 106500, 170400, 213000, 319500, 426000],
};

// GLP face amount per unit by insurance age. The GLP sheets list face amount as
// exactly units x this figure at every age (checked against the 20-unit row for
// all ages 40-75).
const GLP_PER_UNIT_BY_AGE: Record<number, number> = {
  40: 100000, 41: 95110, 42: 90220, 43: 85330, 44: 80440, 45: 75560, 46: 70670, 47: 65780, 48: 60890,
  49: 56000, 50: 51120, 51: 48520, 52: 45920, 53: 43320, 54: 41000, 55: 38680, 56: 36620, 57: 34560,
  58: 32500, 59: 30700, 60: 28900, 61: 27300, 62: 25700, 63: 24100, 64: 22700, 65: 21300, 66: 20060,
  67: 18810, 68: 17560, 69: 16310, 70: 15060, 71: 13860, 72: 12730, 73: 11600, 74: 10600, 75: 9600,
};

function linesFromTable(table: PlanTable | undefined, plan: number): BenefitLine[] | null {
  const idx = table ? table.plans.indexOf(plan) : -1;
  if (!table || idx < 0) return null;
  return Object.entries(table.benefits)
    .map(([code, amounts]) => ({ code, amount: amounts[idx] }))
    .filter((l) => l.amount > 0);
}

export interface CoverageSelector {
  planCode: string;
  plan?: number;
  yearsToPay?: number;
  units?: number;
  insuranceAge?: number;
}

// Returns the benefit lines for the selected plan, or null when the product
// has no table or the selection is not in it (callers treat that as missing
// data rather than sending a made-up amount).
export function getBenefitLines(sel: CoverageSelector): BenefitLine[] | null {
  switch (sel.planCode) {
    case 'HCP':
    case 'HIP':
    case 'PCP':
    case 'PHC':
      return sel.plan ? linesFromTable(HEALTH[sel.planCode], sel.plan) : null;
    case 'PHP':
      return sel.plan ? linesFromTable(PHP, sel.plan) : null;
    case 'GPR':
      return sel.plan && sel.yearsToPay ? linesFromTable(GPR[sel.yearsToPay], sel.plan) : null;
    case 'SSP':
      return sel.plan && sel.yearsToPay ? linesFromTable(SSP[sel.yearsToPay], sel.plan) : null;
    case 'GLA': {
      const col = sel.units ? GLA_UNITS.indexOf(sel.units) : -1;
      if (col < 0 || sel.insuranceAge === undefined) return null;
      const age = Math.min(75, Math.max(40, sel.insuranceAge));
      return [{ code: 'LIFE', amount: GLA_BY_AGE[age][col] }];
    }
    case 'GLP': {
      if (!sel.units || sel.units < 1 || sel.units > 20 || sel.insuranceAge === undefined) return null;
      const age = Math.min(75, Math.max(40, sel.insuranceAge));
      return [{ code: 'LIFE', amount: GLP_PER_UNIT_BY_AGE[age] * sel.units }];
    }
    default:
      return null;
  }
}
