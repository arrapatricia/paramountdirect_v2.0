import { test as base } from '@playwright/test';
import { login } from './auth';

// Extends the base `test` with an already-authenticated `page` - every spec
// imports `test`/`expect` from here instead of '@playwright/test' directly,
// so the login step lives in exactly one place.
export const test = base.extend({
  page: async ({ page }, use) => {
    await login(page);
    await use(page);
  },
});

export { expect } from '@playwright/test';
