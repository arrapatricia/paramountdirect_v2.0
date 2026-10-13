// Premium for a different payment mode than the one the application was saved
// with. HCP, HIP and GLA use their real rate cards; every other product has no
// rate table yet, so its premium is rescaled with the company's standard
// modal factors (the same ones the legacy system uses).
import { getHcpAvailableTiers, getHcpPremium, type HcpInsuredOption } from './pdlife_rates_hcp';
import { getHipPremium, type HipInsuredOption } from './pdlife_rates_hip';
import { getGlaPremium } from './pdlife_rates_gla';
import { getGlpPremium } from './pdlife_rates_glp';

export const PAYMENT_MODES = ['Monthly', 'Quarterly', 'Semi-Annual', 'Annual'] as const;
export type PaymentMode = (typeof PAYMENT_MODES)[number];

const MODAL_FACTOR: Record<PaymentMode, number> = { Monthly: 0.097, Quarterly: 0.29, 'Semi-Annual': 0.54, Annual: 1 };

const ageOf = (birthdate: unknown): number | null => {
  if (typeof birthdate !== 'string' || !birthdate) return null;
  const dob = new Date(birthdate);
  if (Number.isNaN(dob.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
  return age;
};

export function parsePremium(value: string): number {
  return Number(String(value).replace(/[^0-9.]/g, '')) || 0;
}

export function recomputePremium(args: {
  planCode: string;
  details: Record<string, unknown>;
  savedMode: PaymentMode;
  newMode: PaymentMode;
  savedPremium: number;
}): number {
  const { planCode, details, savedMode, newMode, savedPremium } = args;
  if (newMode === savedMode) return savedPremium;

  const category = (details?.category ?? {}) as { insuredOption?: string; units?: number; benefitTier?: number };
  const age = ageOf((details?.policyOwner as { birthdate?: unknown } | undefined)?.birthdate);

  try {
    if (planCode === 'HCP' && age !== null) {
      const option = (category.insuredOption ?? 'Individual') as HcpInsuredOption;
      const tiers = getHcpAvailableTiers(option, age);
      const tier = Math.min(category.benefitTier ?? 500, tiers[tiers.length - 1] ?? 500);
      return getHcpPremium(option, age, tier, newMode);
    }
    if (planCode === 'HIP' && age !== null) {
      return getHipPremium((category.insuredOption ?? 'Individual') as HipInsuredOption, age, category.benefitTier ?? 500, newMode);
    }
    if (planCode === 'GLA' && category.units) {
      return getGlaPremium(category.units, newMode);
    }
    if (planCode === 'GLP' && category.units) {
      return getGlpPremium(category.units, newMode);
    }
  } catch {
    // fall through to the modal-factor rescale
  }

  const annual = savedPremium / MODAL_FACTOR[savedMode];
  return Math.round(annual * MODAL_FACTOR[newMode] * 100) / 100;
}
