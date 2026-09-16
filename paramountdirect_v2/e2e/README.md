# E2E tests

Playwright coverage for the whole webservice - PD Life, OFW, CTPL, and GTP.

## Layout

```
e2e/
  support/
    auth.ts        login(page) - shared login helper
    fixtures.ts     custom `test`/`expect` with an already-authenticated page
    nav.ts          switchProduct(page, 'OFW'|'CTPL'|'GTP'|'Life'), openNav(page, label)
  life/             PD Life: dashboard, application inquiry, application screening,
                    follow-up signature, create-application
  ofw/              OFW: dashboard, applications (incl. the employment-verification gate)
  ctpl/             CTPL: dashboard, applications (straight-through payment)
  gtp/              GTP: dashboard, applications (straight-through payment)
```

Every spec imports `test`/`expect` from `../support/fixtures` (not
`@playwright/test` directly) so login happens once per test automatically.
One file per page/feature per product - not one giant file per product.

## Running

```bash
npm run test:e2e          # headless, all products
npm run test:e2e:ui       # Playwright's interactive UI mode
npx playwright test e2e/ofw   # just one product
npm run test:e2e:report   # open the last HTML report
```

The config (`playwright.config.ts`, repo root) starts `npm run dev` for you
if it isn't already running, against `http://localhost:5173`.

## Notes

- The app has no backend wired in yet (see `DEVELOPER_HANDOVER.md`), so
  these tests run against the frontend's in-memory mock data. Anything that
  depends on specific mock rows (e.g. "the 2nd seeded OFW row is Pending")
  is called out in a comment next to that assertion.
- Login credentials: `admin@paramount.com.ph` / `admin123` (see `support/auth.ts`).
- Only Chromium is installed/configured for now (`npx playwright install chromium`).
  Add more `projects` in `playwright.config.ts` if cross-browser coverage is needed later.
