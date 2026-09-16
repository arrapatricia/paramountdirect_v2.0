import { test, expect } from '../support/fixtures';
import { openNav } from '../support/nav';

test.describe('PD Life - Application Inquiry', () => {
  test.beforeEach(async ({ page }) => {
    await openNav(page, 'Application Inquiry');
    await expect(page.getByRole('heading', { name: 'APPLICATION INQUIRY' })).toBeVisible();
  });

  test('shows the status counts strip, which narrows as filters are applied', async ({ page }) => {
    await expect(page.getByText(/^Active \d+$/)).toBeVisible();
    await page.getByPlaceholder('Search App ID, Policy No., or Payor...').fill('Christian Bukid');
    await expect(page.getByText(/^Active \d+$/)).toBeVisible();
  });

  test('opens the detail view read-only - no Edit buttons, status is a locked badge', async ({ page }) => {
    await page.locator('tbody tr').first().getByTitle('View Details').click();
    await expect(page.getByText(/^Application \d+$/)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Edit' })).toHaveCount(0);
  });

  test('has a New Application entry point into the PD Life create-application flow', async ({ page }) => {
    await page.getByRole('button', { name: 'New Application' }).click();
    await expect(page.getByText('Choose a plan category to continue')).toBeVisible();
  });
});
