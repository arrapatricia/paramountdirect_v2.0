# OFW Staff Manual

A plain-language, step-by-step guide for staff using the OFW section of the Paramount Direct
admin dashboard. For what the fields and buttons mean technically, see
[`HANDOVER.md`](./HANDOVER.md) and [`PRD.md`](./PRD.md).

---

## 1. Creating a New OFW Application

1. Go to **OFW Applications** (`/ofw/applications`) from the sidebar.
2. Click **New Application** (top right).
3. Fill in **Personal Information**: name, Philippine address (region/city/barangay pickers
   plus a free-text house no./street line), gender, civil status, birthdate, place of birth,
   mobile number, and email. Your age is shown automatically next to Birthdate once entered.
4. Fill in **Employment Information**:
   - Nature of Employment: Direct-hired or Balik-Manggagawa.
   - Type of Package: always shows "Land-based" — this is the only package Paramount Direct
     sells, so it's not something you choose.
   - Occupation, Passport Number, Estimated Salary (with currency), Foreign Employer, and
     Country of Employment.
   - Contract Start Date and Contract End Date. **No. of Months** and **Insurance Start
     Date** fill in automatically once both dates are set — you cannot type into these
     fields directly.
   - If the contract is shorter than **6 months**, you'll see a red warning under No. of
     Months and won't be able to submit until it's corrected.
   - If the Country of Employment is a flagged conflict zone (e.g. Ukraine, Israel, Yemen,
     Syria), an advisory box appears. You must tick "I understand and would like to proceed"
     before you can continue.
5. Fill in **Beneficiaries**: at least one full name is required; you may add up to three
   using **Add Beneficiary**. Relationship and birthdate are optional per beneficiary.
6. **Required Documents** (Passport, Working Visa, Employment Contract, Medical Certificate)
   can be uploaded now or left for later during screening — it's fine to leave these blank at
   this stage.
7. The **Estimated Premium** in the top-right corner updates live as you fill in the contract
   dates — this is `$2.90 × No. of Months`.
8. Click **Review Application** to see everything you've entered on one screen. Check it
   carefully — this is your last chance to catch a mistake before the record is created.
9. Click **Back to Edit** to fix anything, or **Confirm & Submit** to create the application.
   Nothing is saved to the system until you click Confirm & Submit.
10. You'll see a confirmation screen with the new application's Reference No., Coverage, and
    Premium. Click **Back to OFW Applications** to return to the list.

---

## 2. Verifying Employment

An application must have its employment contract verified before you can send the client
payment instructions.

1. Open the application from the list (click the eye/View icon on its row).
2. Find the **Employment Verification & Payment** section.
3. Under **Employment Contract Verification**, click **Yes** if the contract checks out, or
   **No** if it doesn't.
4. Once you click Yes, this turns into a green "Verified" badge with today's date — you
   cannot undo this from this screen.

---

## 3. Sending the Payment Instruction

This step only appears after employment has been verified **Yes**.

1. In the same **Employment Verification & Payment** section, you'll now see "Send payment
   instruction to client".
2. Click **Send Payment Instruction**.
3. This turns into a "Sent" confirmation showing the date and your name (the system records
   who sent it — this can't be reassigned to someone else later, even if another staff member
   edits the application afterward).
4. A toast notification confirms the instruction was "sent" to the client's email address.
   **Note:** this does not actually send a real email — there is no email delivery wired up
   yet. Treat this purely as an internal record of the step being done, and communicate with
   the client through your normal channel.

**Important:** once you send the payment instruction, the USD→PHP conversion amount shown to
the client is **locked**. Editing the premium after this point will no longer automatically
refresh the PHP amount the client was quoted.

---

## 4. Confirming Payment

Once the payment instruction has been sent, you'll see an amber "Awaiting client payment"
row with a **Simulate Payment Received** button.

1. When the client has actually paid (through whatever channel your team currently uses to
   collect payment — there is no payment gateway built into this system yet), click
   **Simulate Payment Received**.
2. This immediately:
   - Marks the application Paid.
   - Assigns the **COI Number** (the policy number).
   - Generates the real **Service Invoice** PDF automatically in the background.
   - Unlocks the Documents section.
3. A toast confirms "Payment confirmed — documents are now available."

There is no "undo" for this step from the UI — double-check with your team before confirming
if there's any doubt the payment actually went through.

---

## 5. Generating and Viewing the Service Invoice

The Service Invoice is generated **automatically** the moment payment is confirmed (step 4
above) — you do not need to trigger it separately.

1. Open the paid application (it now shows as a quick-preview overlay rather than a full
   page, since there's nothing left to edit).
2. Scroll to **Documents & Endorsements**.
3. Next to **Service Invoice**, click **View / Print** to open the real, generated PDF in a
   new browser tab. From there you can print it or save it as needed.
4. Click **Send to Client** to notify the client (same caveat as payment instructions above —
   this shows a confirmation toast but does not actually send a real email yet).
5. If you click View/Print and get a message saying the Service Invoice "hasn't been
   generated for this application yet," the automatic generation likely failed silently in
   the background (a rare template or storage issue). There is currently no "regenerate"
   button in the UI — escalate this to a developer with the application's Reference No. so
   it can be investigated and generated manually if needed.

---

## 6. Certificate of Insurance (COI) — Manual Handling Still Required

**The COI shown in this system is not a real, final document.** It's a preview/mock template
that approximates what the real COI looks like, using placeholder benefit figures that don't
change per application. This is because the office does not yet have a real, fillable COI
template loaded into the system — only flat sample PDFs exist, which can't be
auto-filled with each client's specific details.

**What this means for you:**
- Use the in-app COI preview (View / Print under Documents & Endorsements) only as a
  reference for what information should go on the real COI — do not send it to a client as
  their actual proof of insurance.
- For the actual Certificate of Insurance a client needs, continue using whatever manual
  process your team currently has (e.g. filling the real COI template by hand or through
  another existing tool) until a real fillable template is loaded into this system and this
  manual notes otherwise.
- The **Official Receipt (OR)** is in the same situation — treat it the same way.

If your team obtains a proper fillable COI template (with named form fields, like the
Service Invoice has), pass it along to your development team — this is the single most
useful thing that would let the system generate real COIs going forward.

---

## 7. Quick Reference — What Each Status Means

**Workflow Status** (shown in the status tabs at the top of the applications list):

| Status | Meaning |
|---|---|
| Received | Just submitted — this is where every new application starts. |
| Spoiled | Never got paid, and the record was marked expired. |
| Duplicate | Turns out there's already an existing application for this person. |
| Reversed | Was paid, then cancelled and refunded. |
| Cancelled | The client cancelled it themselves. |

**Policy Status** (shown as a colored badge on each row and in the application header) — this
is a separate, automatically-calculated indicator of where the *policy* stands, based on
whether it's paid and how long it's been sitting unpaid:

| Policy Status | What it means |
|---|---|
| Issued (green) | Paid, and active. |
| Cancelled (purple) | Was paid, then reversed/refunded. |
| Spoiled (red) | Still unpaid after more than 7 days — treat as expired and follow up with the client, or mark the workflow status Spoiled if it's truly dead. |
| Pending (amber) | Unpaid, but still within the 7-day window — no action needed yet beyond your normal follow-up. |
