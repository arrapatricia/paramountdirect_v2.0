import { test, expect } from '../support/fixtures';
import { switchProduct, openNav } from '../support/nav';

test.describe('CTPL Applications', () => {
  test.beforeEach(async ({ page }) => {
    await switchProduct(page, 'CTPL');
    await openNav(page, 'CTPL Applications');
    await expect(page.getByRole('heading', { name: 'CTPL APPLICATIONS' })).toBeVisible();
  });

  test('filters the list by owner name', async ({ page }) => {
    await page.getByPlaceholder('Search by owner name, plate no., or reference no...').fill('Ricardo Santos');
    await expect(page.locator('tbody tr').first()).toContainText('Ricardo Santos');
  });

  test('straight-through payment unlocks documents with no verification gate', async ({ page }) => {
    await page.locator('tbody tr').first().getByRole('button').first().click();
    await page.getByRole('button', { name: 'Simulate Payment Received' }).click();
    await expect(page.getByText('Certificate of Cover (COC)')).toBeVisible();
    await expect(page.getByText('Send to Client').first()).toBeVisible();
  });
});
