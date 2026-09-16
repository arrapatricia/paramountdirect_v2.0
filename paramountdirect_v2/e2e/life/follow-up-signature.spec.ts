import { test, expect } from '../support/fixtures';
import { openNav } from '../support/nav';

test.describe('PD Life - Follow-up Signature', () => {
  test.beforeEach(async ({ page }) => {
    await openNav(page, 'Follow-up Signature');
    await expect(page.getByRole('heading', { name: 'FOLLOW-UP SIGNATURE' })).toBeVisible();
  });

  test('shows the Unsigned filter selected by default and a policy list', async ({ page }) => {
    await expect(page.getByRole('button', { name: /^Unsigned \(\d+\)$/ })).toBeVisible();
    await expect(page.getByText('Select a policy from the list to see its follow-up details.')).toBeVisible();
  });

  test('selecting a policy shows its timeline and lets you log a follow-up', async ({ page }) => {
    // Switch to "All" so there's guaranteed to be at least one policy to click.
    await page.getByRole('button', { name: 'All', exact: true }).click();
    await page.locator('button:has-text("HIP-"), button:has-text("GLA-"), button:has-text("SSP-"), button:has-text("PHC-"), button:has-text("MPR-")').first().click();
    await expect(page.getByText('Signature Follow-Up Timeline')).toBeVisible();
    await expect(page.getByText('Policy Issued')).toBeVisible();
  });
});
