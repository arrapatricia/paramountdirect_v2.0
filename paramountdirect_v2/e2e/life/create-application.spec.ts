import { test, expect } from '../support/fixtures';
import { openNav } from '../support/nav';

// The form's <label>/<select> pairs aren't associated via htmlFor/id, so
// getByLabel() can't find them - this locates the <select> immediately
// following a given label's text instead.
const selectAfterLabel = (page: import('@playwright/test').Page, label: string) =>
  page.locator(`label:text-is("${label}") + select`);

test.describe('PD Life - Create Application', () => {
  test.beforeEach(async ({ page }) => {
    await openNav(page, 'Application Inquiry');
    await page.getByRole('button', { name: 'New Application' }).click();
  });

  test('HCP premium needs a birthdate before it can price, then reacts to Payment Option', async ({ page }) => {
    await page.getByText('Health', { exact: true }).click();
    await selectAfterLabel(page, 'Plan').selectOption({ label: 'HealthCARE Cash Plan (HCP)' });

    await expect(page.getByText('Enter birthdate below to calculate')).toBeVisible();

    await page.locator('input[type="date"]').fill('1990-05-15');
    await expect(page.getByText('₱302.15')).toBeVisible(); // Individual, Monthly, age 35-39

    await selectAfterLabel(page, 'Payment Option').selectOption('Annual');
    await expect(page.getByText('₱3114.95', { exact: false })).toBeVisible();
  });

  test('GLA premium is driven by Units x Payment Option, no birthdate required', async ({ page }) => {
    await page.getByText('Life & Accident', { exact: true }).click();
    await selectAfterLabel(page, 'Plan').selectOption({ label: 'Golden Life Advantage (GLA)' });

    await expect(page.getByText('₱223.95')).toBeVisible(); // 1 unit, Monthly

    await selectAfterLabel(page, 'Units').selectOption('5');
    await selectAfterLabel(page, 'Payment Option').selectOption('Annual');
    await expect(page.getByText('₱12083.95', { exact: false })).toBeVisible();
  });
});
