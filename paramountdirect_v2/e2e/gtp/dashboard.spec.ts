import { test, expect } from '../support/fixtures';
import { switchProduct } from '../support/nav';

test.describe('GTP dashboard', () => {
  test('shows GTP performance after switching product lines', async ({ page }) => {
    await switchProduct(page, 'GTP');
    await expect(page.getByText('GTP PERFORMANCE')).toBeVisible();
  });
});
