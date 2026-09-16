import { type Page, expect } from '@playwright/test';

export const ADMIN_EMAIL = 'admin@paramount.com.ph';
export const ADMIN_PASSWORD = 'admin123';

// Logs in as the seeded admin account and waits for the dashboard to render.
// Shared by every product's tests instead of each spec repeating this.
export async function login(page: Page): Promise<void> {
  await page.goto('/');
  await page.getByPlaceholder(ADMIN_EMAIL).fill(ADMIN_EMAIL);
  await page.getByPlaceholder('••••••••').fill(ADMIN_PASSWORD);
  await page.getByRole('button', { name: 'Sign In' }).click();
  await expect(page.getByText('SALES PERFORMANCE')).toBeVisible();
}
