import { test, expect } from '../support/fixtures';
import { openNav } from '../support/nav';

test.describe('PD Life - Application Screening', () => {
  test.beforeEach(async ({ page }) => {
    await openNav(page, 'Application Screening');
    await expect(page.getByRole('heading', { name: 'APPLICATION SCREENING' })).toBeVisible();
  });

  test('shows the status counts strip and the status tabs', async ({ page }) => {
    await expect(page.getByText('Active', { exact: false }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /^Received \d+$/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /^Issued \d+$/ })).toBeVisible();
  });

  test('filters the queue by search term', async ({ page }) => {
    const searchBox = page.getByPlaceholder('Name / Reference No.');
    await searchBox.fill('Christian Bukid');
    await expect(page.locator('tbody tr').first()).toContainText('Christian Bukid');
  });

  test('opens an application detail view', async ({ page }) => {
    // "Issued" rows are always viewable regardless of which screener they
    // were assigned to, so this row is guaranteed not to be locked.
    await page.getByRole('button', { name: /^Issued \d+$/ }).click();
    await page.locator('tbody tr').first().getByTitle('View Application Details').click();
    await expect(page.getByText(/^Application \d+$/)).toBeVisible();
    // Issued applications have a locked status badge, not a dropdown -
    // just confirm the detail page rendered its section cards.
    await expect(page.getByText('General Details')).toBeVisible();
  });
});
