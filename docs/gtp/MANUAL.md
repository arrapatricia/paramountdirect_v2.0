# GTP — Staff Manual

A plain-language guide to using the GTP (Global Travel Protect Premium) module of the Paramount Direct admin dashboard. This covers the prototype as it exists today — several things described below as "mock" or "not yet real" are placeholders standing in for functionality that has not been built yet. Where something is mock, it is called out explicitly so you are not misled into thinking it's live.

For the other product lines (PD Life, OFW, CTPL) and shared pages, see the general staff manual once written at [`../general/MANUAL.md`](../general/MANUAL.md).

---

## 1. Getting to GTP

Log in, then select **GTP** from the product switcher. You'll land on the **GTP Dashboard**. The sidebar under GTP has: Dashboard, Applications, Payment Transactions (plus shared Maintenance/Users/Audit Logs entries depending on your role).

Your access depends on your assigned role:
- **GTP Admin** — full access to GTP only
- **Non-Life Admin** / **Non-Life Issuer** — access spanning OFW, CTPL, and GTP together (for staff who work across all three Non-Life products)
- **System Admin** — full access everywhere

If you don't see the GTP tab at all, your account's role doesn't include GTP — ask a System Admin to check your role assignment.

---

## 2. Creating a GTP Application

1. From GTP Applications, click **New Application**.
2. Fill in **Travel Details**:
   - Choose **Travel Type**: International or Domestic.
   - Pick one or more **Country Destination(s)**. Common destinations show as quick-pick buttons; anything else is in the dropdown below them. Click a destination again to remove it.
   - Enter **Departure Date** and **Return Date** — Days of Travel fills in automatically; you cannot type it directly.
   - Choose **Application Type**: Individual or Family.
   - Choose a **Plan**: Single Trip, Multi-Trip 90, or Multi-Trip 180.
3. Fill in **Traveler Information**: First Name, Surname, Birthdate, Email, Mobile Number.
   - **If the traveler is 66 or older, the form will not let you submit.** You'll see a message asking you to email `yourtravelinsurance@paramount.com.ph` with the traveler's details instead — this is a hard rule in the current system, there is no override button.
4. Optionally check **Cruise Coverage** and/or **Hazardous Non-Professional & Non-Competition Sports Coverage** under Extra Protection.
5. Watch the **Estimated Premium** at the top right — it updates live as you fill in the form. It stays at ₱0.00 until both travel dates are entered.
6. Click **Review Application**. You'll see a read-only summary of everything you entered — check it carefully, this is your last chance to catch mistakes before the application is created and gets a reference number.
7. Click **Confirm & Submit** to finish, or **Back to Edit** to go back and fix something.
8. On success, you'll see the generated **Reference No.**, Plan, and Premium. Click **Back to GTP Applications** to return to the list.

### How the premium is calculated (so you can sanity-check it)

You don't need to do this math yourself, but it helps to understand what's happening:

- **Destination category is picked for you.** If the trip is Domestic, it's priced as "Domestic." If it's International and includes the USA, Canada, or Hong Kong, it's priced at the higher "Including" rate — you'll see a note explaining this when it happens. Otherwise it's the lower "Excluding" rate.
- **Single Trip** premiums step up in bands based on how many days the trip is (up to 4 days, up to 8 days, up to 15, and so on up to 60 days; beyond 60 days it adds a per-10-day surcharge).
- **Multi-Trip 90/180** are flat annual prices — the number of days doesn't matter for these, only the destination category.
- **Cruise Coverage and Hazardous Sports Coverage** each add a percentage on top of the base premium, not a flat peso amount — so they cost more for a longer or higher-tier trip.
- **Schengen destinations** (most of Western/Central Europe) automatically get flagged for the required travel-insurance compliance coverage — you'll see a green notice confirming this happened. There's nothing extra for you to do; it's handled automatically.

If a premium looks wrong, check: did you pick the right destinations, dates, and plan? The system does not let you manually override the computed premium.

---

## 3. Reviewing GTP Applications

From the **GTP Applications** list, you can:
- Search by traveler name or reference number
- Filter by Travel Type (All/International/Domestic)
- Filter by status tab: All, Received, Cancelled, Duplicate
- Click the eye icon on any row to open its detail view

### Application detail view

Shows Traveler Information, Travel Details (with a compliance badge if it's a Schengen trip), and a **Payment & Documents** section.

**Payment status:** GTP applications from the website normally arrive already marked **Paid** — GTP is a "pay first, then it shows up here" product, unlike OFW which has a separate verification step before payment. If you ever see an application marked **Unpaid** with a **Simulate Payment Received** button — that button is a **testing/demo tool only**, not a real payment confirmation. In the real system, payment status should be set by an actual payment gateway, which does not exist yet in this prototype. Do not treat clicking that button as equivalent to confirming a real client payment.

---

## 4. Documents — What's Real and What's Mock (Important)

This is the part most likely to confuse someone new to the system, so read carefully.

The GTP application detail view has a "Documents" section listing four items: **Policy Schedule, Policy Jacket, Official Receipt (OR), Service Invoice.** Once an application is marked Paid, each one gets a **View/Print** and **Send to Client** button.

**None of these buttons currently produce or send a real document from the GTP screen.** Clicking View/Print opens an in-app popup styled to look like a printed form, built from just a handful of fields on the application (traveler name, destinations, dates, plan, premium) — it is not pulling from an actual Policy Schedule, Policy Jacket, OR, or Service Invoice template. Clicking Send to Client only shows a confirmation toast message ("emailed to...") — **it does not actually send an email.**

This is different from CTPL, where the equivalent buttons now open genuine PDF documents that were filled in with the application's real data and can actually be sent. GTP has not reached that point yet, for one specific reason: **Paramount has not yet supplied real templates for GTP's Policy Schedule, Policy Jacket, and OR.** (Interestingly, the backend already quietly generates a real Service Invoice PDF behind the scenes the moment a GTP application is marked paid — but the screen you're looking at hasn't been updated to show it yet, so as a staff member you currently cannot see or retrieve that real file through this system. If you need a real GTP Service Invoice today, you'd need to ask a developer to pull it directly, not use the View/Print button.)

**Bottom line for staff:** treat everything under GTP's Documents section as a preview/placeholder only, not a document you can actually hand to a client yet. Do not rely on "Send to Client" having sent anything.

---

## 5. GTP Payment Transactions

Reachable from the sidebar under GTP, or from the main **Pay Tran** page's consolidated Non-Life view (which shows OFW/CTPL/GTP payments together in one filterable table).

Shows one row per paid GTP application — Policy Number, Reference No., Payor Name, Plan, Premium, Date Received — with a printable receipt. This is a one-time-payment list (no installment schedule; GTP, like CTPL and OFW, is paid in full at once, unlike PD Life's installment plans).

Whether you can manually create a payment row here depends on your role — Cashier Admin, Non-Life Admin, and Non-Life Issuer can; Non-Life Cashier is view-only.

---

## 6. GTP Dashboard

A read-only performance overview: total premium collected year-to-date, progress against the annual target, new-application and policy-issuance counts (with year-over-year comparison), a Travel Type breakdown (International vs. Domestic), a monthly premium chart comparing this year to last year, an Individual-vs-Family breakdown with Cruise/Hazardous Sports attach counts, and a Top Destinations list. All numbers here reflect real application data in the system (or the seeded sample data if the backend isn't connected) — this page is not mock.

---

## 7. Quick reference — what's real vs. mock in GTP today

| Area | Status |
|---|---|
| Application creation, list, search/filter | Real — saved to the real database once connected |
| Premium calculation | Real — matches Paramount's own published GTP rate card |
| Schengen compliance flagging | Real logic, informational only (no separate charge) |
| Payment status (`isPaid`) | Real field, but no real payment gateway sets it — website submissions arrive pre-marked paid; the "Simulate Payment Received" button is a manual test tool |
| Policy Schedule / Policy Jacket / OR documents | Mock — no real template exists yet |
| Service Invoice document (staff-facing) | Mock on screen, though a real version is generated in the background and not yet exposed to staff |
| Website ingest (auto-adding applications from yourtravelinsurance.ph) | Built on this side, but the travel-insurance website itself does not call it yet — applications still need to be entered manually via Create Application for now |
| GTP Dashboard stats | Real |
| iPeak/core-system integration | None exists for GTP |
