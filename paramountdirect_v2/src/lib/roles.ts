// Single source of truth for the system's roles, the products each role can
// touch, and the module-level access each role gets by default. Shared by
// the merged Users & Roles page (users tab picks a role from ROLE_DEFINITIONS;
// the role matrix tab renders getDefaultPermissions for it) so the two views
// can never drift out of sync with each other.

export type ProductScope = 'PD Life' | 'OFW' | 'CTPL' | 'GTP';

export type RoleGroup = 'System' | 'Direct Marketing' | 'Cashiering' | 'Non-Life Product Admin' | 'Non-Life Cross-Product' | 'Corporate Communications';

export interface RoleDefinition {
  name: string;
  group: RoleGroup;
  // Which product line(s) this role can access. Unlike the old per-product
  // role catalogs, a user's assigned products are now derived entirely from
  // their role rather than picked independently.
  products: ProductScope[];
  description: string;
}

export const ROLE_DEFINITIONS: RoleDefinition[] = [
  {
    name: 'System Admin',
    group: 'System',
    products: ['PD Life', 'OFW', 'CTPL', 'GTP'],
    description: 'Full access to every product line, plus the only role that can open Users & Role Management.',
  },
  {
    name: 'Main Developer',
    group: 'System',
    products: ['PD Life', 'OFW', 'CTPL', 'GTP'],
    description: 'Full access to every product line, identical to System Admin, including Users & Role Management.',
  },
  {
    name: 'SysDev Admin',
    group: 'System',
    products: ['PD Life', 'OFW', 'CTPL', 'GTP'],
    description: 'Full access to every product line, including Users & Role Management, for System Development Team leads.',
  },
  {
    name: 'Web Developer',
    group: 'System',
    products: ['PD Life', 'OFW', 'CTPL', 'GTP'],
    description: 'Full read/write access to every product line for building and testing features. No delete rights and no Users & Role Management access.',
  },
  {
    name: 'Corporate Communications',
    group: 'Corporate Communications',
    products: ['PD Life', 'OFW', 'CTPL', 'GTP'],
    description: 'Read-only view across every product line — no application creation, no send/action buttons.',
  },
  {
    name: 'DM Head',
    group: 'Direct Marketing',
    products: ['PD Life', 'OFW', 'CTPL', 'GTP'],
    description: 'Full oversight of every PD Life module (applications from Direct Marketing and the paramountdirect.com.ph website), plus full non-life (OFW, CTPL, GTP) issuance access.',
  },
  {
    name: 'DM Operations',
    group: 'Direct Marketing',
    products: ['PD Life'],
    description: 'Screens applications, sends policy docs and billing, and manages payment transactions for PD Life.',
  },
  {
    name: 'DM Operations Head',
    group: 'Direct Marketing',
    products: ['PD Life', 'OFW', 'CTPL', 'GTP'],
    description: 'Same PD Life permissions as DM Operations, plus full non-life (OFW, CTPL, GTP) issuance access — head of the Operations team.',
  },
  {
    name: 'DM POS',
    group: 'Direct Marketing',
    products: ['PD Life'],
    description: 'Point-of-sale/cashiering role — records PD Life payment transactions.',
  },
  {
    name: 'DM Marketing',
    group: 'Direct Marketing',
    products: ['PD Life'],
    description: 'Read-only view of submitted applications, plus CMS website content.',
  },
  {
    name: 'DM Marketing Head',
    group: 'Direct Marketing',
    products: ['PD Life', 'OFW', 'CTPL', 'GTP'],
    description: 'Same PD Life permissions as DM Marketing, plus read-only non-life (OFW, CTPL, GTP) ledger/inquiry access — head of the Marketing team.',
  },
  {
    name: 'DM Online Sales Head',
    group: 'Direct Marketing',
    products: ['PD Life', 'OFW', 'CTPL', 'GTP'],
    description: 'Same PD Life permissions as DM Operations (applications from the paramountdirect.com.ph website), plus full non-life (OFW, CTPL, GTP) issuance access — head of the Online Sales channel.',
  },
  {
    name: 'Contact Center',
    group: 'Direct Marketing',
    products: ['PD Life'],
    description: 'Read-only access to Application Inquiry, the Follow-up Calls statistics page, and Payment Transactions for PD Life.',
  },
  {
    name: 'DM Contact Center Manager',
    group: 'Direct Marketing',
    products: ['PD Life', 'OFW', 'CTPL', 'GTP'],
    description: 'Same PD Life permissions as Contact Center, plus read-only non-life (OFW, CTPL, GTP) ledger/inquiry access — Contact Center team manager.',
  },
  {
    name: 'DM Contact Center Supervisor',
    group: 'Direct Marketing',
    products: ['PD Life', 'OFW', 'CTPL', 'GTP'],
    description: 'Same PD Life permissions as Contact Center, plus read-only non-life (OFW, CTPL, GTP) ledger/inquiry access — Contact Center team supervisor.',
  },
  {
    name: 'Life Cashier',
    group: 'Cashiering',
    products: ['PD Life'],
    description: 'Read-only view of PD Life payment transactions and application inquiry — no create/edit rights.',
  },
  {
    name: 'Non-Life Cashier',
    group: 'Cashiering',
    products: ['OFW', 'CTPL', 'GTP'],
    description: 'Read-only view of non-life (OFW, CTPL, GTP) payment transactions and application inquiry — no create/edit rights.',
  },
  {
    name: 'Cashier Admin',
    group: 'Cashiering',
    products: ['PD Life', 'OFW', 'CTPL', 'GTP'],
    description: 'Full create/manage access to payment transactions across every product line, plus application inquiry — not a product/issuance admin.',
  },
  {
    name: 'CTPL Admin',
    group: 'Non-Life Product Admin',
    products: ['CTPL'],
    description: 'Full administrative access to the CTPL product line.',
  },
  {
    name: 'GTP Admin',
    group: 'Non-Life Product Admin',
    products: ['GTP'],
    description: 'Full administrative access to the GTP product line.',
  },
  {
    name: 'OFW Admin',
    group: 'Non-Life Product Admin',
    products: ['OFW'],
    description: 'Full administrative access to the OFW product line.',
  },
  {
    name: 'Non-Life Admin',
    group: 'Non-Life Cross-Product',
    products: ['OFW', 'CTPL', 'GTP'],
    description: 'Issuance and overall view across all non-life products (OFW, CTPL, GTP) for work spanning more than one product.',
  },
  {
    name: 'Non-Life Issuer',
    group: 'Non-Life Cross-Product',
    products: ['OFW', 'CTPL', 'GTP'],
    description: 'Create issuance and extract reports across all non-life products (OFW, CTPL, GTP) — no rate or configuration access.',
  },
];

export function getRoleDefinition(role: string): RoleDefinition | undefined {
  return ROLE_DEFINITIONS.find((r) => r.name === role);
}

export function productsForRole(role: string): ProductScope[] {
  return getRoleDefinition(role)?.products ?? [];
}

export const ROLE_GROUP_ORDER: RoleGroup[] = ['System', 'Direct Marketing', 'Cashiering', 'Non-Life Product Admin', 'Non-Life Cross-Product', 'Corporate Communications'];

export interface ModulePermission {
  moduleName: string;
  canRead: boolean;
  canWrite: boolean;
  canDelete: boolean;
}

export const PRODUCT_MODULE_MAP: Record<ProductScope, string[]> = {
  'PD Life': [
    'Application Screening',
    'Application Inquiry',
    'Follow-up Calls',
    'Sending of Policy Docs',
    'Sending of Billing',
    'Payment Transactions & Ledger',
    'Call Out',
    'Maintenance & Rate Tables',
    'CMS Content',
    'Audit Logs',
  ],
  'OFW': ['OFW Contracts & Screening', 'OEC Payment Ledger', 'POEA Rate Configuration', 'Agency Audit Logs'],
  'CTPL': ['LTO Motor Registration', 'CTPL Certificate Ledger', 'Tariff & Premium Calculator', 'Agent Logs'],
  'GTP': ['Group Corporate Accounts', 'Billing Schedule & Master Roll', 'Endorsements & Rates', 'Audit Logs'],
};

// These modules describe workflows Direct Marketing has committed to, but
// the underlying pages haven't been built yet (Billing send-outs, the
// Contact Center's Call Out queue). Roles can still be pre-configured for
// them so access is ready to go the day the page ships.
export const MODULES_NOT_YET_BUILT = new Set(['Sending of Billing', 'Call Out']);

export const MODULE_DESCRIPTIONS: Partial<Record<string, string>> = {
  'Application Screening': 'Review, verify and update the status of incoming online applications.',
  'Application Inquiry': 'Read-only lookup of application details and status history.',
  'Follow-up Calls': 'Statistics page tracking outbound follow-up call activity on submitted applications.',
  'Sending of Policy Docs': 'Dispatch issued policy documents to policyholders.',
  'Sending of Billing': 'Send billing notices and statements to policyholders.',
  'Call Out': 'Contact Center outbound call queue for application follow-up.',
};

type PermissionTemplate = Partial<Record<string, { canRead?: boolean; canWrite?: boolean; canDelete?: boolean }>>;

// Role -> product -> module template. Keyed by product as well as role
// because a cross-product role (Non-Life Admin/Issuer) needs a different
// template per product, and because module names aren't unique across
// products (e.g. "Audit Logs" appears under both PD Life and GTP).
const ROLE_PERMISSION_TEMPLATES: Partial<Record<string, Partial<Record<ProductScope, PermissionTemplate>>>> = {
  'DM Operations': {
    'PD Life': {
      'Application Screening': { canRead: true, canWrite: true },
      'Application Inquiry': { canRead: true },
      'Sending of Policy Docs': { canRead: true, canWrite: true },
      'Sending of Billing': { canRead: true, canWrite: true },
      'Payment Transactions & Ledger': { canRead: true, canWrite: true },
      'Audit Logs': { canRead: true },
    },
  },
  'DM POS': {
    'PD Life': {
      'Application Inquiry': { canRead: true },
      'Payment Transactions & Ledger': { canRead: true, canWrite: true },
    },
  },
  'DM Marketing': {
    'PD Life': {
      'Application Inquiry': { canRead: true },
      'CMS Content': { canRead: true, canWrite: true },
    },
  },
  'Contact Center': {
    'PD Life': {
      'Application Inquiry': { canRead: true },
      'Follow-up Calls': { canRead: true },
      'Payment Transactions & Ledger': { canRead: true },
    },
  },
  'Life Cashier': {
    'PD Life': {
      'Application Inquiry': { canRead: true },
      'Payment Transactions & Ledger': { canRead: true },
    },
  },
  'Non-Life Cashier': {
    'OFW': {
      'OEC Payment Ledger': { canRead: true },
    },
    'CTPL': {
      'CTPL Certificate Ledger': { canRead: true },
    },
    'GTP': {
      'Billing Schedule & Master Roll': { canRead: true },
    },
  },
  'Cashier Admin': {
    'PD Life': {
      'Application Inquiry': { canRead: true },
      'Payment Transactions & Ledger': { canRead: true, canWrite: true },
    },
    'OFW': {
      'OEC Payment Ledger': { canRead: true, canWrite: true },
    },
    'CTPL': {
      'CTPL Certificate Ledger': { canRead: true, canWrite: true },
    },
    'GTP': {
      'Billing Schedule & Master Roll': { canRead: true, canWrite: true },
    },
  },
  'CTPL Admin': {
    'CTPL': {
      'LTO Motor Registration': { canRead: true, canWrite: true, canDelete: true },
      'CTPL Certificate Ledger': { canRead: true, canWrite: true, canDelete: true },
      'Tariff & Premium Calculator': { canRead: true, canWrite: true, canDelete: true },
      'Agent Logs': { canRead: true },
    },
  },
  'GTP Admin': {
    'GTP': {
      'Group Corporate Accounts': { canRead: true, canWrite: true, canDelete: true },
      'Billing Schedule & Master Roll': { canRead: true, canWrite: true, canDelete: true },
      'Endorsements & Rates': { canRead: true, canWrite: true, canDelete: true },
      'Audit Logs': { canRead: true },
    },
  },
  'OFW Admin': {
    'OFW': {
      'OFW Contracts & Screening': { canRead: true, canWrite: true, canDelete: true },
      'OEC Payment Ledger': { canRead: true, canWrite: true, canDelete: true },
      'POEA Rate Configuration': { canRead: true, canWrite: true, canDelete: true },
      'Agency Audit Logs': { canRead: true },
    },
  },
  'Non-Life Admin': {
    'OFW': {
      'OFW Contracts & Screening': { canRead: true, canWrite: true, canDelete: true },
      'OEC Payment Ledger': { canRead: true, canWrite: true, canDelete: true },
      'POEA Rate Configuration': { canRead: true, canWrite: true, canDelete: true },
      'Agency Audit Logs': { canRead: true },
    },
    'CTPL': {
      'LTO Motor Registration': { canRead: true, canWrite: true, canDelete: true },
      'CTPL Certificate Ledger': { canRead: true, canWrite: true, canDelete: true },
      'Tariff & Premium Calculator': { canRead: true, canWrite: true, canDelete: true },
      'Agent Logs': { canRead: true },
    },
    'GTP': {
      'Group Corporate Accounts': { canRead: true, canWrite: true, canDelete: true },
      'Billing Schedule & Master Roll': { canRead: true, canWrite: true, canDelete: true },
      'Endorsements & Rates': { canRead: true, canWrite: true, canDelete: true },
      'Audit Logs': { canRead: true },
    },
  },
  'Non-Life Issuer': {
    'OFW': {
      'OFW Contracts & Screening': { canRead: true, canWrite: true },
      'OEC Payment Ledger': { canRead: true },
      'POEA Rate Configuration': { canRead: true },
      'Agency Audit Logs': { canRead: true },
    },
    'CTPL': {
      'LTO Motor Registration': { canRead: true, canWrite: true },
      'CTPL Certificate Ledger': { canRead: true, canWrite: true },
      'Tariff & Premium Calculator': { canRead: true },
      'Agent Logs': { canRead: true },
    },
    'GTP': {
      'Group Corporate Accounts': { canRead: true, canWrite: true },
      'Billing Schedule & Master Roll': { canRead: true },
      'Endorsements & Rates': { canRead: true },
      'Audit Logs': { canRead: true },
    },
  },
};

// These DM "Head"/"Manager"/"Supervisor" roles carry the same PD Life
// template as their base role, plus a non-life tier borrowed from an
// existing cross-product role - aliased rather than duplicated so the two
// catalogs can't drift.
const DM_TEMPLATE_ALIASES: Partial<Record<string, { life: string; nonlife: string }>> = {
  'DM Operations Head': { life: 'DM Operations', nonlife: 'Non-Life Issuer' },
  'DM Online Sales Head': { life: 'DM Operations', nonlife: 'Non-Life Issuer' },
  'DM Marketing Head': { life: 'DM Marketing', nonlife: 'Non-Life Cashier' },
  'DM Contact Center Manager': { life: 'Contact Center', nonlife: 'Non-Life Cashier' },
  'DM Contact Center Supervisor': { life: 'Contact Center', nonlife: 'Non-Life Cashier' },
};

// System Admin, Main Developer and SysDev Admin have no template above -
// they always get full read/write/delete across every module of every
// product they're given, computed directly rather than spelled out
// module-by-module. Web Developer gets the same breadth but without delete,
// and Corporate Communications gets read-only across every module.
export function getDefaultPermissions(role: string, product: ProductScope): ModulePermission[] {
  const modules = PRODUCT_MODULE_MAP[product];

  if (role === 'System Admin' || role === 'Main Developer' || role === 'SysDev Admin') {
    return modules.map((m) => ({ moduleName: m, canRead: true, canWrite: true, canDelete: true }));
  }

  if (role === 'Web Developer') {
    return modules.map((m) => ({ moduleName: m, canRead: true, canWrite: true, canDelete: false }));
  }

  if (role === 'Corporate Communications') {
    return modules.map((m) => ({ moduleName: m, canRead: true, canWrite: false, canDelete: false }));
  }

  // DM Head gets full PD Life oversight (like System Admin, but scoped to
  // Direct Marketing), plus the Non-Life Issuer tier on OFW/CTPL/GTP.
  if (role === 'DM Head') {
    if (product === 'PD Life') {
      return modules.map((m) => ({ moduleName: m, canRead: true, canWrite: true, canDelete: true }));
    }
    const template = ROLE_PERMISSION_TEMPLATES['Non-Life Issuer']?.[product];
    return modules.map((m) => ({
      moduleName: m,
      canRead: !!template?.[m]?.canRead,
      canWrite: !!template?.[m]?.canWrite,
      canDelete: !!template?.[m]?.canDelete,
    }));
  }

  const alias = DM_TEMPLATE_ALIASES[role];
  const template = alias
    ? ROLE_PERMISSION_TEMPLATES[product === 'PD Life' ? alias.life : alias.nonlife]?.[product]
    : ROLE_PERMISSION_TEMPLATES[role]?.[product];

  if (!template) {
    return modules.map((m) => ({ moduleName: m, canRead: false, canWrite: false, canDelete: false }));
  }

  return modules.map((m) => ({
    moduleName: m,
    canRead: !!template[m]?.canRead,
    canWrite: !!template[m]?.canWrite,
    canDelete: !!template[m]?.canDelete,
  }));
}

// Which roles can open Users & Role Management - System Admin, and the
// System Development Team (Main Developer, SysDev Admin, Web Developer).
// Every other role, including all Direct Marketing end-user roles, is locked out.
export function canManageUsers(role: string | null | undefined): boolean {
  return role === 'System Admin' || role === 'Main Developer' || role === 'SysDev Admin' || role === 'Web Developer';
}

// Which roles can record a new payment transaction for a given product -
// used to gate the Create button on each product's Payment Transactions
// page. Every role with write access to that product's ledger/issuance
// module qualifies (see ROLE_PERMISSION_TEMPLATES and DM_TEMPLATE_ALIASES above).
export function canCreatePayments(role: string | null | undefined, product: ProductScope): boolean {
  if (!role) return false;
  if (role === 'System Admin' || role === 'Main Developer' || role === 'SysDev Admin' || role === 'Web Developer' || role === 'Cashier Admin') return true;
  const dmIssuerHeads = role === 'DM Head' || role === 'DM Operations Head' || role === 'DM Online Sales Head';
  if (product === 'PD Life') return role === 'DM POS' || role === 'DM Operations' || dmIssuerHeads;
  return role === `${product} Admin` || role === 'Non-Life Admin' || role === 'Non-Life Issuer' || dmIssuerHeads;
}
