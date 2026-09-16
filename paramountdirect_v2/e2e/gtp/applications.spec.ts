import { test, expect } from '../support/fixtures';
import { switchProduct, openNav } from '../support/nav';

test.describe('GTP Applications', () => {
  test.beforeEach(async ({ page }) => {
    await switchProduct(page, 'GTP');
    await openNav(page, 'GTP Applications');
    await expect(page.getByRole('heading', { name: 'GTP APPLICATIONS' })).toBeVisible();
  });

  test('filters the list by traveler name', async ({ page }) => {
    const firstRowName = await page.locator('tbody tr').first().locator('td').nth(1).innerText();
    await page.getByPlaceholder('Search by traveler name or reference no...').fill(firstRowName.split(' ')[0]);
    await expect(page.locator('tbody tr').first()).toContainText(firstRowName.split(' ')[0]);
  });

  test('straight-through payment unlocks documents with no verification gate', async ({ page }) => {
    await page.locator('tbody tr').first().getByRole('button').first().click();
    const payButton = page.getByRole('button', { name: 'Simulate Payment Received' });
    if (await payButton.isVisible()) {
      await payButton.click();
    }
    await expect(page.getByText('Official Receipt (OR)')).toBeVisible();
  });
});
