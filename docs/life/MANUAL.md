# PD Life — Staff Manual

A step-by-step guide for PD Life staff using the admin dashboard prototype. For general navigation (logging in, switching product lines, dark mode), see [`../general/MANUAL.md`](../general/MANUAL.md).

Note: as described in [`ARCHITECTURE.md`](ARCHITECTURE.md), this prototype's PD Life screens currently run on sample data rather than the live database in most deployments of this build — the steps below describe how the workflow behaves either way, since the UI itself doesn't change.

## 1. Reviewing an inbound application

1. From the sidebar, open **Applications → Application Screening** (or click the **Application Screening** card on the Applications hub page).
2. New applications land in the **Received** tab by default — click the **Received** tab at the top of the table to see them, or use **All** to see everything regardless of status.
3. Use the search box (name or reference number), the **Source** and **Product** dropdowns, and the **From/To** date fields to narrow the list down. The gray strip above the table always shows live counts per status (Received, Issued, For Verification, For Evaluation, Paid, plus 0 for statuses this system doesn't currently use).
4. Click the eye icon in the **Action** column to open an application's details.

If instead you just need to **look up** an application without touching its workflow — e.g. to answer a client's question — use **Applications → Application Inquiry** instead. It shows the same records but opens them in a locked, view-only mode, and lets you filter by Payment Status (Paid/Unpaid) as well as Application Status.

## 2. Claiming and screening an application

1. Opening an unclaimed application (shown with a "-" under Screened By) from **Application Screening** automatically claims it for you — you'll see your name appear under Screened By in the list afterward.
2. If someone else already claimed it, you'll see an amber **"Access Restricted"** banner naming who has it, and the application won't open. Only that person can screen it until it's Issued.
3. Once you have an application open, its sections (Policy Owner, Contact Info, Payor, plan-specific details, beneficiaries, etc.) are editable. Click **Edit** on a section's header, make your changes, then click **Save** on that same section — each section saves independently.

## 3. Moving an application through statuses

1. At the top of the detail page, click the **Status** control (it shows the current status with a dropdown arrow).
2. Pick the next status from the menu: Received → For Verification → For Evaluation → Paid → Issued. You can select any status in the list, not just the next one in sequence — there's no enforced "one step at a time" rule in this prototype.
3. The status updates immediately, except when moving **to Issued** — see §4 below, which is a special case.

Note: once an application's status is set to **Issued**, its status control locks permanently (shown as a green "Issued" badge with a lock icon) — it cannot be moved to any other status afterward from any page.

## 4. Issue confirmation (Signed / Unsigned)

Selecting **Issued** from the status dropdown does not commit immediately — it opens a **Confirm Issuance** dialog first, asking:

> "Has the client's application form been signed?"

- Choose **Signed** if the client's physical application form is already in hand.
- Choose **Unsigned** if it isn't back yet.
- Click **Confirm Issue**. The status change and your Signed/Unsigned answer both take effect together — the Confirm button stays disabled until you've picked one.

What happens next depends on your answer:
- **Signed** → the application shows as resolved everywhere (Signed Applications statistics page, Follow-up Signature).
- **Unsigned** → the application enters the **Follow-up Signature** queue automatically, so it can be chased down (§5).

You can cancel out of this dialog without changing anything.

## 5. Using Follow-up Signature to track unreturned signed forms

**Applications → Follow-up Signature** is where you chase down clients who haven't returned their signed application form yet.

1. The left-hand list shows Issued policies, grouped by three tabs: **Unsigned** (no follow-up sent yet), **Followed Up** (at least one reminder sent, still no signature back), and **Signed** (resolved). Search by payor name or policy number at the top.
2. Click a policy in the list to open its detail panel on the right. You'll see the policy summary, key dates (Received, Issued, Shipped, Effectivity), and a visual timeline showing what's happened so far.
3. To log that you sent a reminder:
   - Click **"Log as sent today"** next to **Print Follow-Up** or **Email Follow-Up** in the timeline, or
   - Use the **Print Letter** / **Print Application Form** buttons at the bottom to generate a printable copy, or
   - Click **Send Follow-Up Email Now** (only shown while the policy is still fully Unsigned) to log an email follow-up in one click.
4. Once the client's signed form actually comes back, click **Mark as Signed** at the bottom of the detail panel. This resolves the policy here and also updates it on the Signed Applications statistics page — the two pages are always kept in sync.

A policy automatically drops out of this queue if it has lapsed for more than 3 years — there's no need to keep chasing a signature on a policy that old.

## 6. Billing and payment transactions (for cashiers)

**Billing** (sidebar → Billing) shows what's due for collection, split into three tabs:
- **Regular Billing** — mailed/courier notices.
- **E-Billing** — only certain plan codes are eligible (the system will tell you which, if you try to put an ineligible plan on an E-Billing run).
- **Credit Card Billing** — auto-charge.

To put an additional policy onto a billing run, use **Create Billing**: search the policy directory, select it, pick a due date and channel, and submit. Two rules are enforced automatically:
- A **Renewal** installment (year 2 onward on a policy) can only be billed through **Regular** — the system will reject an attempt to put it on E-Billing or Credit Card and tell you which policies triggered the block.
- **E-Billing** only accepts specific plan codes — an ineligible plan code will be rejected the same way.

The **Reminder Schedule** tab lets you toggle which day-offsets (e.g. 30 days before due, on due date, 10/20/30 days after) fire a reminder, separately for First Year vs Renewal policies.

**Payment Transactions** (sidebar → Payment Transactions, PD Life tab) is where you view a policy's installment payment ledger — search by policy number or payor, view/print individual entries. A **Non-Life** tab at the top switches to the combined OFW/CTPL/GTP payment view if you need to look up a payment on one of those products instead.

Who can record a new PD Life payment: **System Admin**, **Cashier Admin**, **DM POS**, and **DM Operations** roles. **Life Cashier** and **Contact Center** roles can view payment transactions but cannot create or edit them.
