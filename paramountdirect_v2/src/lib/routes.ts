import type { ProductLine } from '../components/sidebar';

// Maps each sidebar tab id to the real browser URL it should show - lets
// pages like Application Inquiry be reached directly at
// /application-inquiry (deep link, refresh, bookmark) instead of only via
// in-app nav state. 'maintenance' and 'audit' are shared across product
// lines so they don't carry a product prefix.
export const TAB_PATHS: Record<string, string> = {
  dashboard: '/',
  applications: '/applications',
  inquiry: '/application-inquiry',
  screening: '/application-screening',
  'life-followup-signature': '/followup-signature',
  payments: '/payment-transactions',
  billing: '/billing',
  'life-monthly': '/statistics/monthly-applications',
  'life-daily': '/statistics/daily-applications',
  'life-followup-calls': '/statistics/followup-calls',
  'life-signed': '/statistics/signed-applications',
  'life-screened': '/statistics/screened-applications',
  'life-application-statuses': '/statistics/application-statuses',

  'ofw-dashboard': '/ofw',
  'ofw-applications': '/ofw/applications',
  'ofw-payments': '/ofw/payment-transactions',

  'ctpl-dashboard': '/ctpl',
  'ctpl-applications': '/ctpl/applications',
  'ctpl-endorsements': '/ctpl/endorsements',
  'ctpl-payments': '/ctpl/payment-transactions',

  'gtp-dashboard': '/gtp',
  'gtp-applications': '/gtp/applications',
  'gtp-payments': '/gtp/payment-transactions',

  maintenance: '/maintenance',
  audit: '/audit',
  'users-roles': '/users-roles',
};

const PATH_TO_TAB: Record<string, string> = Object.fromEntries(
  Object.entries(TAB_PATHS).map(([tab, path]) => [path, tab])
);

const PRODUCT_BY_TAB_PREFIX: { prefix: string; product: ProductLine }[] = [
  { prefix: 'ofw-', product: 'OFW' },
  { prefix: 'ctpl-', product: 'CTPL' },
  { prefix: 'gtp-', product: 'GTP' },
];

function productForTab(tab: string): ProductLine {
  return PRODUCT_BY_TAB_PREFIX.find((p) => tab.startsWith(p.prefix))?.product ?? 'PD Life';
}

export interface ParsedRoute {
  product: ProductLine;
  tab: string;
  subTab?: string;
  // Only set for 'ctpl-applications' / 'ofw-applications' - the application
  // being viewed, e.g. /ctpl/applications/cm123... (see App.tsx's
  // viewingCtplId / viewingOfwId).
  recordId?: string;
}

// Tabs whose URL can carry a record id as an extra path segment - see
// buildPath/parsePath below.
const TABS_WITH_RECORD_ID = ['ctpl-applications', 'ofw-applications'] as const;

// Builds the URL for a given nav state. Only 'maintenance' has a
// browser-visible sub-page per subTab; the tabs above can carry a record id
// instead; every other tab ignores both.
export function buildPath(tab: string, subTab?: string, recordId?: string): string {
  const base = TAB_PATHS[tab];
  if (base === undefined) return '/';
  if (tab === 'maintenance' && subTab) return `${base}/${subTab}`;
  if (recordId && (TABS_WITH_RECORD_ID as readonly string[]).includes(tab)) return `${base}/${recordId}`;
  return base;
}

// Inverse of buildPath - resolves a browser pathname back into nav state,
// e.g. for direct links, bookmarks, and back/forward navigation. Returns
// null for a path this app doesn't recognize.
export function parsePath(pathname: string): ParsedRoute | null {
  const normalized = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;

  if (normalized.startsWith('/maintenance/')) {
    const subTab = normalized.slice('/maintenance/'.length);
    return { product: 'PD Life', tab: 'maintenance', subTab };
  }

  for (const tab of TABS_WITH_RECORD_ID) {
    const base = TAB_PATHS[tab];
    if (normalized.startsWith(`${base}/`)) {
      const recordId = normalized.slice(`${base}/`.length);
      return { product: productForTab(tab), tab, recordId };
    }
  }

  const tab = PATH_TO_TAB[normalized];
  if (!tab) return null;
  return { product: productForTab(tab), tab };
}
