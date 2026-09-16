import { test, expect } from '../support/fixtures';
import { switchProduct } from '../support/nav';

test.describe('CTPL dashboard', () => {
  test('shows CTPL performance after switching product lines', async ({ page }) => {
    await switchProduct(page, 'CTPL');
    await expect(page.getByText('CTPL PERFORMANCE')).toBeVisible();
  });
});
