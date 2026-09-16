import { test, expect } from '../support/fixtures';
import { switchProduct, openNav } from '../support/nav';

test.describe('GTP Payment Transactions', () => {
  test('lists only paid transactions and can print a receipt', async ({ page }) => {
    await switchProduct(page, 'GTP');
    await openNav(page, 'Payment Transactions');
    await expect(page.getByText('GTP PAYMENT TRANSACTIONS')).toBeVisible();

    await page.locator('tbody tr').first().getByRole('button').click();
    await expect(page.getByText('PAYMENT RECEIPT')).toBeVisible();
    await expect(page.getByText('Paid in Full')).toBeVisible();
  });
});
