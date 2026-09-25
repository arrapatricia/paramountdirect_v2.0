# CTPL Staff Manual

Step-by-step guide for staff using the CTPL section of the Paramount Direct admin dashboard. For the underlying mechanics, see [`ARCHITECTURE.md`](ARCHITECTURE.md); for page-by-page reference, see [`SITEMAP.md`](SITEMAP.md).

## 1. Getting to CTPL

From the sidebar, select **CTPL** as the active product line (top product-line pills, alongside PD Life/OFW/GTP). The sidebar then shows: Dashboard, CTPL Applications, Endorsements, Payment Transactions. CTPL Applications is where you land by default.

## 2. Creating a CTPL application (including vehicle info)

1. From **CTPL Applications**, click **New Application** (top-right).
2. **Choose Your Policy:** pick the Term (1 or 3 Years), Policy Type (Private Car / Commercial Vehicle / Motorcycle), and LTO MV Type (the options change depending on which Policy Type you picked). If the vehicle is a for-public-use motorcycle (e.g. habal-habal), check "For Public Use" — this affects which policy-number series it gets later, not the price. Watch the Base Premium readout update as you choose.
3. **Personal Information:** Client Type, email, mobile number, then the registered owner's full name and address (Region → City/Municipality → Barangay, each narrows the next). If the applicant is a different person than the registered owner, answer "No" to the same-as-owner question and fill in the applicant's name separately.
4. **Vehicle Details:**
   - Plate Number, MV File Number, Serial/Chassis Number — these are on the vehicle's Certificate of Registration (CR). Follow the format hints shown under each field; incorrect values will delay the application.
   - **Vehicle Description:** pick Year Model and Vehicle Maker from the dropdowns (these are drawn from a maintained list matching ctpl.ph's own picker — if the exact maker spelling you expect isn't there, check for a near-duplicate entry, e.g. both "MERCEDES-BENZ" and "MERCEDEZ BENZ" exist as separate options because the source list has both). Type in Series, Color, Body Type, Motor Number, Authorized Capacity, and Unladen Weight — these are free-text.
   - Check **Requires COV** if the client is availing the Certificate of Validation add-on — this adds a flat ₱60.00 verification fee on top of the base premium.
5. The header shows your running Estimated Premium (or "Total Amount Due" once COV is checked) the whole time. Click **Review Application** once everything required is filled in — it stays disabled until it is.
6. **Review step:** double-check every section (Policy, Personal Information, Vehicle Details). Nothing has been saved yet — you can still go **Back to Edit**. Once it's correct, click **Confirm & Submit**.
7. You'll see a confirmation screen with the assigned Reference No., Policy/MV Type, and Premium. This is the point at which the application record actually gets created and an ID is assigned — not before.

## 3. How payment works

CTPL is different from OFW: **there is no separate payment-verification step in this system.** The business assumption is that the client already paid on ctpl.ph before the application ever reaches this admin dashboard, so:

- **Applications you create through the New Application wizard above are marked Paid automatically**, the moment you hit Confirm & Submit. A Policy Number and Certificate of Cover / Service Invoice / Policy Schedule / Policy Jacket are generated immediately, in the background — you don't need to do anything further to "unlock" them.
- If you ever open an application and see it marked **Unpaid** (this can happen for older/legacy records, or applications entered without payment already confirmed), its detail page will show an amber "Awaiting client payment" notice with a **Simulate Payment Received** button. Clicking it marks the application Paid and triggers document generation the same way the create wizard does. Note: as the label says, this is a simulation for this prototype system — it is not a real payment-gateway confirmation.
- Once Paid, the application's documents (see §4) become available, and its Policy Status shows **Issued** (unless it was later Reversed/Cancelled).

If a client never completes payment, the application eventually shows as **Spoiled** in its Policy Status once more than 7 days have passed since it was received — this happens automatically based on the Date Received, you don't need to manually mark it.

## 4. Viewing, printing, and sending the generated documents

1. Open the application from the **CTPL Applications** list (click the eye icon under Action). Paid applications open as a read-only quick-preview; unpaid ones open as an editable detail page.
2. Scroll to **Documents & Endorsements** (paid view) or the Documents section (unpaid view — locked with a notice until payment is confirmed).
3. For each of the four documents — Policy Schedule, Policy Jacket, Certificate of Cover (COC), Service Invoice — you'll see **View/Print** and **Send to Client** buttons.
4. **View/Print** opens the actual generated PDF in a new browser tab (this is a real file, already filled with this application's data and stored — not a preview or mockup). From there, use your browser's own print function if you need a hard copy.
5. **Send to Client** currently shows a confirmation toast that the document was "emailed" — no real email is sent yet in this prototype; treat it as a placeholder for now, and use another channel to actually get the document to the client if needed.
6. If a document hasn't been generated yet for some reason (e.g. it was created before this feature existed, or generation failed silently in the background), View/Print will tell you it "hasn't been generated for this application yet" instead of opening a blank/broken file. If you see this on an application that should definitely be paid and issued, flag it — there's currently no self-service "regenerate" button, so it needs a developer to investigate the application's row directly.

## 5. Consent, Remarks, and Uploaded Documents sections

These three sections appear on every CTPL application's detail view (paid or unpaid), below Documents:

- **Consent:** shows the Data Privacy Act (DPA) consent items (Processing, Retention, Marketing & Promotions, Services, Sharing of Data) — currently these always display as "Yes" for every application (this section is not yet wired to a real captured-consent record). Click **Print DPA** to open a printable consent form pre-filled with the application's reference number and the data subject's name.
- **Remarks:** a running log you can add free-text notes to — useful for recording authentication/issuance notes or anything else worth keeping against the application. Click **Add Remark**, fill in the remark text (required), optionally who it's for (Recipients) and who's logging it (Sender, defaults to "System Admin" if left blank), and Save. Note: remarks you add here are only kept for your current browser session — reloading the page or navigating away and back will clear them, since this isn't wired to a backend endpoint yet.
- **Uploaded Documents** (labeled "COV Document" on this page): lets you attach an ad-hoc file to the application — useful for something like a scanned COV proof that isn't one of the four standard generated documents. Click **Upload Document**, pick a file. You can then View/Print, Send, or Delete it from the list. Same caveat as Remarks: these uploads are not actually persisted to the server — they only exist in your browser for the current session, so don't rely on this for anything that needs to survive a page reload or be seen by another staff member.

## 6. Handling post-issuance changes (Endorsements)

Once a policy is issued, don't edit the base application directly for things like a name correction, address change, term extension, or cancellation — use an **Endorsement** instead, so there's a proper record of what changed, when, and why.

**From a specific policy:** open the paid application's quick-preview, scroll to Documents & Endorsements, and use the embedded Endorsements panel — it shows the endorsement history for this one policy and has a **New Endorsement** button.

**Across all CTPL policies:** use the **Endorsements** page in the sidebar (`/ctpl/endorsements`) — a work queue with tabs for Awaiting Action / Pending / Reviewed / Approved / Denied / All, searchable by insured name.

When requesting an endorsement, you'll choose one of three kinds:
- **Non-Financial** — corrections that don't affect premium (name, address, vehicle details). These apply and get numbered immediately once you submit — no separate approval step.
- **Term Extension** — pushes the policy's expiry date out, at an additional premium computed from the policy's own daily rate. Goes into the review/approval queue.
- **Cancellation** — the system determines whether it's a Flat (full refund, if cancelled on or before the coverage start date) or Pro Rata (partial refund for the unexpired portion) cancellation based on the date you give. Also goes into the review/approval queue, and issues a Credit Memo once approved.

Financial endorsements (Term Extension, Cancellation) require someone with CTPL Admin, Non-Life Admin, or System Admin access to review and approve or deny them from the Endorsements queue page before the policy itself is actually changed. A denied request leaves the policy untouched. Non-Financial endorsements don't need this approval step — they take effect as soon as submitted.
