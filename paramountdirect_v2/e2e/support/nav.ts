import { type Page } from '@playwright/test';

export type ProductLine = 'Life' | 'OFW' | 'CTPL' | 'GTP';

// Sidebar product-line pill (top of the sidebar) - switches which product's
// nav items/dashboard are shown.
export async function switchProduct(page: Page, product: ProductLine): Promise<void> {
  await page.getByRole('button', { name: product, exact: true }).click();
}

// Clicks a sidebar nav item by its visible label (e.g. "Application
// Screening", "OFW Applications", "Payment Transactions").
export async function openNav(page: Page, label: string): Promise<void> {
  await page.getByRole('button', { name: label, exact: true }).click();
}
