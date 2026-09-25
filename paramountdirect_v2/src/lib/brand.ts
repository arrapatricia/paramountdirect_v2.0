import type { ProductLine } from '../components/sidebar';

// Shared pages (Maintenance and its sub-pages) re-skin to whichever product
// line is selected: PD Life keeps the Paramount Direct red, while OFW, CTPL
// and GTP use the navy / light-blue of ofwinsurance.ph and the Non-Life
// dashboards. Tailwind can only see literal class names, so each variant is
// spelled out in full here rather than built from a hex value.
export interface BrandTheme {
  // Headings, key figures, active icons
  text: string;
  // Secondary links / highlight numbers
  accentText: string;
  // Active sub-nav tab underline
  tabActive: string;
  // Active sidebar sub-item pill
  navActive: string;
  navActiveIcon: string;
  // Primary action button
  button: string;
  // Rounded icon chip next to page titles
  iconChip: string;
  // Primary / secondary progress-bar fills
  bar: string;
  accentBar: string;
  // Focus ring for inputs and selects
  focusRing: string;
  focusWithinBorder: string;
}

const LIFE_THEME: BrandTheme = {
  text: 'text-[#d0112b]',
  accentText: 'text-[#008cb4]',
  tabActive: 'text-[#d0112b] border-[#d0112b]',
  navActive: 'text-[#d0112b] bg-red-50 font-bold dark:bg-red-950/30',
  navActiveIcon: 'text-[#d0112b]',
  button: 'bg-[#d0112b] hover:bg-[#b00e24] text-white',
  iconChip: 'bg-red-50 text-[#d0112b] border-red-100 dark:bg-red-950/30 dark:border-red-900',
  bar: 'bg-[#d0112b]',
  accentBar: 'bg-[#008cb4]',
  focusRing: 'focus:ring-[#008cb4]',
  focusWithinBorder: 'focus-within:border-[#d0112b]',
};

const NONLIFE_THEME: BrandTheme = {
  text: 'text-[#002f6c] dark:text-[#49b1ea]',
  accentText: 'text-[#1f7fbf] dark:text-[#49b1ea]',
  tabActive: 'text-[#002f6c] border-[#002f6c] dark:text-[#49b1ea] dark:border-[#49b1ea]',
  navActive: 'text-[#002f6c] bg-[#002f6c]/[0.06] font-bold dark:text-[#49b1ea] dark:bg-[#49b1ea]/10',
  navActiveIcon: 'text-[#002f6c] dark:text-[#49b1ea]',
  button: 'bg-[#002f6c] hover:bg-[#00224f] text-white',
  iconChip: 'bg-[#002f6c]/[0.06] text-[#002f6c] border-[#002f6c]/15 dark:bg-[#49b1ea]/10 dark:text-[#49b1ea] dark:border-[#49b1ea]/30',
  bar: 'bg-[#002f6c] dark:bg-[#49b1ea]',
  accentBar: 'bg-[#49b1ea]',
  focusRing: 'focus:ring-[#49b1ea]',
  focusWithinBorder: 'focus-within:border-[#002f6c] dark:focus-within:border-[#49b1ea]',
};

export function brandTheme(product: ProductLine): BrandTheme {
  return product === 'PD Life' ? LIFE_THEME : NONLIFE_THEME;
}
