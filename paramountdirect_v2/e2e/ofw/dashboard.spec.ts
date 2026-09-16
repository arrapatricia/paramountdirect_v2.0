import { test, expect } from '../support/fixtures';
import { switchProduct } from '../support/nav';

test.describe('OFW dashboard', () => {
  test('shows OFW insurance performance after switching product lines', async ({ page }) => {
    await switchProduct(page, 'OFW');
    await expect(page.getByText('OFW INSURANCE PERFORMANCE')).toBeVisible();
  });
});
