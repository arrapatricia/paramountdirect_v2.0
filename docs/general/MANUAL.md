# Staff Manual — Paramount Direct Admin Dashboard

This is a general, cross-product manual for staff using the Paramount Direct admin dashboard. For step-by-step instructions specific to one product line's application form, rate rules, or document types, see that product's own manual:

- `docs/life/MANUAL.md` — PD Life
- `docs/ofw/MANUAL.md` — OFW
- `docs/ctpl/MANUAL.md` — CTPL
- `docs/gtp/MANUAL.md` — GTP

## 1. Logging in

1. Go to the dashboard's login page.
2. Enter your email and password and sign in.
3. If your session can't reach the backend (offline/demo scenario), the app falls back to a local demo login — ask your administrator whether your environment is live or demo.
4. If you forget your password, use "Forgot Password" on the login screen (currently a placeholder flow — contact your System Admin to have your password reset via the Users & Role Management page).

Your assigned **role** determines which product lines and pages you can see after logging in — see §7.

## 2. The sidebar and product switcher

- The left sidebar is organized around **product-line pills**: PD Life, OFW, CTPL, GTP. Click a product to switch the whole app's context — the dashboard, applications list, and payments pages underneath the sidebar all change to that product's data.
- Below the product pills, the sidebar shows that product's own menu (Dashboard, Applications, Payment Transactions, and product-specific extras like PD Life's Billing or CTPL's Endorsements).
- **Maintenance**, **Audit Logs**, and **Users & Role Management** (if you have access) sit outside the product switcher — they're shared pages. Maintenance re-skins its color scheme to whichever product you last had selected, but its own content (Branch Directory, Marketing Dashboard, Premium Maintenance, CMS placeholder) isn't product-specific data.
- The sidebar can collapse to icons only, or open as a full slide-over drawer on a phone-sized screen.
- Every page in the app is reachable within three clicks from login — if something feels buried, that's worth flagging.

## 3. Navigating to each major area

| Area | How to get there |
|---|---|
| Dashboard | Select a product pill — its dashboard is the landing page |
| Applications (view/screen) | Product pill → "Applications" (PD Life) or "{Product} Applications" (OFW/CTPL/GTP) in the sidebar |
| Create a new application | Open the Applications page for that product, use the "Create Application" / "New Application" button |
| Payment Transactions | Product pill → "Payment Transactions"; PD Life also has a "Non-Life" tab inside this page to see all three non-life products' payments in one table |
| Billing (PD Life only) | PD Life → "Billing" |
| Life Statistics (PD Life only) | PD Life → the Statistics section (Monthly/Daily Applications, Follow-up Calls, Signed/Screened Applications, Application Statuses) |
| Maintenance (Branch Directory, Marketing Dashboard, Premium Maintenance) | Sidebar → "Maintenance" (shared, outside the product pills) |
| Users & Role Management | Sidebar → "Users & Roles" — **visible only to System Admin accounts** |
| Audit Logs | Sidebar → "Audit Logs" (shared) |

## 4. Common workflows (outline)

### 4.1 Create an application

1. Go to the relevant product's Applications page.
2. Click "Create Application" and fill in the required fields (applicant details, coverage/plan selection). Required fields are marked and validated as you go.
3. The premium is computed live from the current rate card as you fill in coverage details — it starts at 0.00 until enough information is entered to compute a real number.
4. You'll reach a **Review** step before final submission — this is a deliberate checkpoint: nothing is saved to the applications list until you confirm here. Check every field carefully; going back is easy, but you want to catch mistakes before "Confirm & Submit."
5. Click "Confirm & Submit." The application now appears in the product's Applications list with a generated ID and a default "Received" (or equivalent) status.

See the product's own manual for exact field lists and rate-card behavior.

### 4.2 Screen / verify an application (PD Life)

1. Open PD Life → Application Screening (not Application Inquiry — that page is read-only).
2. Open an application. If nobody has claimed it yet, opening it from Screening claims it for you (locks it to you until it reaches Issued) — if someone else already claimed it, you'll see an "Access Restricted" notice.
3. Move the status forward through the workflow (Received → For Verification → For Evaluation → Paid → Issued) as your review progresses, editing sections inline as needed.
4. Moving an application to **Issued** requires an extra confirmation step (a small dialog asking whether the client's signed form has come back yet — Signed/Unsigned). You must answer this before the status change commits.
5. Use **Application Inquiry** instead of Screening when you just need to look something up without touching it — it opens the same detail view in read-only mode.

For OFW/CTPL/GTP, the equivalent step is opening the application from its own Applications list and progressing it through that product's simpler status set (see each product's manual).

### 4.3 Mark an application paid

- For OFW: the flow goes through an Employment Contract Verification step, then "Send Payment Instruction," then a payment confirmation action once the client has paid.
- For CTPL: payment is typically already confirmed by the time the application reaches the dashboard (website submissions arrive already paid); staff-created CTPL applications are marked paid directly.
- For GTP: mark paid directly, similar to CTPL.
- For PD Life: payment is tracked via the installment ledger on the Payment Transactions page rather than a single "mark paid" toggle.

Marking an application's payment status also determines whether its policy documents (below) become available.

### 4.4 Generate / view policy documents

- **CTPL:** once an application is marked paid, its Certificate of Cover and Service Invoice are generated automatically as real PDFs. Use "View/Print" or "Send to Client" on the applications list to open the generated document.
- **OFW:** the Service Invoice works the same way (real generated PDF); the Certificate of Insurance is still shown via an older mock template pending a real fillable template from the business side.
- **GTP:** documents are still shown via the older mock template — no real generated PDF yet.
- **PD Life:** no Service Invoice generation exists yet for this product line.

### 4.5 Manage users and roles (System Admin only)

1. Go to Users & Role Management.
2. The **Users** tab lists staff accounts; you can add a new user and assign them a role from the fixed 11-role catalog (which product(s) they can access is automatically derived from the role you pick — you don't assign products separately).
3. The **Role Access Matrix** tab shows, per role, exactly which modules they can read/write/delete — this is the same data driving what a logged-in user actually sees, so use it to verify a role's access before assigning it to someone.

### 4.6 View audit logs

1. Go to Audit Logs (shared, outside the product switcher).
2. Every create/update/delete anyone makes anywhere in the system appears here with who did it, what module, what action, and when.
3. Use the search box and module filter to narrow results, and the export button to download a CSV for offline review.

## 5. Branch Directory and Marketing Dashboard

- **Branch Directory** (under Maintenance) lists all branches; for OFW/CTPL/GTP it defaults to a "Branch Locator" view (pick a region, expand to see branches in it) mirroring the public ofwinsurance.ph branch page; PD Life defaults to a grid-card view instead. You can switch views regardless of product.
- **Marketing Dashboard** (under Maintenance) shows web-traffic and drop-off style stats for the selected product's public-facing site. As of this writing these numbers are zeroed placeholders, not live analytics — don't treat them as real traffic data yet.

## 6. Dark mode

Use the toggle in the app's header/sidebar to switch between light and dark mode. This is a manual toggle, not tied to your OS's light/dark setting, and your choice is remembered across sessions.

## 7. Roles and what they can see

Your access is entirely determined by the role your System Admin assigned you. In short:

- **System Admin** sees and can edit everything, including Users & Role Management.
- **DM/Cashiering roles** (DM Operations, DM POS, DM Marketing, Contact Center, Life Cashier, Non-Life Cashier, Cashier Admin) are scoped to specific modules within PD Life and/or the non-life products, often read-only.
- **Product Admin roles** (OFW Admin, CTPL Admin, GTP Admin) have full control within their single product.
- **Cross-product Non-Life roles** (Non-Life Admin, Non-Life Issuer) span OFW, CTPL, and GTP together, for staff who work across all three.

If a page or button you expect to see is missing, it's most likely a role/permission gap, not a bug — check with your System Admin. See `docs/general/PRD.md` §4 for the full role table.
