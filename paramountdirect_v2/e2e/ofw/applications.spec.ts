import { test, expect } from '../support/fixtures';
import { switchProduct, openNav } from '../support/nav';

test.describe('OFW Applications', () => {
  test.beforeEach(async ({ page }) => {
    await switchProduct(page, 'OFW');
    await openNav(page, 'OFW Applications');
    await expect(page.getByRole('heading', { name: 'OFW APPLICATIONS' })).toBeVisible();
  });

  test('filters the list by applicant name', async ({ page }) => {
    await page.getByPlaceholder('Search by applicant name or reference no...').fill('Rosalinda');
    await expect(page.locator('tbody tr').first()).toContainText('Rosalinda');
  });

  test('the employment verification -> payment instruction -> documents gate unlocks in order', async ({ page }) => {
    // The 2nd seeded row is deterministically "Pending" verification /
    // unpaid, so this walks the full OFW-specific gate (unlike CTPL/GTP,
    // which are straight-through payment with no verification step).
    await page.locator('tbody tr').nth(1).getByRole('button').first().click();

    await expect(page.getByText('Documents will be available once employment is verified', { exact: false })).toBeVisible();

    await page.getByRole('button', { name: 'Yes', exact: true }).click();
    await page.getByRole('button', { name: 'Send Payment Instruction' }).click();
    await page.getByRole('button', { name: 'Simulate Payment Received' }).click();

    await expect(page.getByText('Send to Client').first()).toBeVisible();
  });
});
