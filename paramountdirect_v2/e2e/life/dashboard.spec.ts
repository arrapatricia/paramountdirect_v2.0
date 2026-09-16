import { test, expect } from '../support/fixtures';

test.describe('PD Life dashboard', () => {
  test('shows the sales performance summary on login', async ({ page }) => {
    await expect(page.getByText('SALES PERFORMANCE')).toBeVisible();
    await expect(page.getByText('TOTAL PREMIUM SALES (YTD)')).toBeVisible();
    await expect(page.getByText('ANNUAL SALES TARGET')).toBeVisible();
    await expect(page.getByText('POLICIES ISSUED (YTD)')).toBeVisible();
  });

  test('opens the Applications hub with its overview stats and nav cards', async ({ page }) => {
    await page.getByRole('button', { name: 'Applications', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'APPLICATIONS' })).toBeVisible();
    await expect(page.getByText('Application Inquiry')).toBeVisible();
    await expect(page.getByText('Application Screening')).toBeVisible();
    await expect(page.getByText('Follow-up Signature')).toBeVisible();
  });
});
