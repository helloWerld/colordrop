# Fulfillment Runbook

Support playbook for paid orders that fail or are reported as defective.

Policy baseline:
- No discretionary refunds for custom printed books (buyer's remorse, change of mind).
- Technical non-fulfillment after payment -> retry Lulu submission, then automatic Stripe refund if terminal.
- Manufacturing defects/misprints -> handled case by case via support.

## Required case data

Collect these before taking action:
- `order_id` and short order number shown to customer
- `book_id`
- Stripe `payment_intent` / charge reference
- Lulu print job id (if created)
- Current order status and last error message
- Customer photos/evidence (defect path only)

## Fast triage decision tree

1. Did we fail before or during Lulu print-job submission because of system/API errors?
   - Yes -> follow Technical Failure playbook.
2. Was the book produced/delivered but has printing or binding defects?
   - Yes -> follow Lulu Defect playbook.
3. Is this a shipping transit issue (lost/damaged in transit)?
   - Route to carrier/Lulu escalation and support lead review; do not treat as technical auto-refund by default.
4. Unsure classification?
   - Escalate to engineering + support lead with full case data.

## Classification guide

### Technical failure (auto-refund path)

Use this path when ColorDrop cannot complete fulfillment after payment because of technical/operational issues such as:
- Lulu print submission errors after retry budget is exhausted
- Permanent API/auth/config failures that block print submission
- Missing or invalid print assets that prevent successful submission and cannot be resolved in time

Do not use this path for:
- Misprinted pages, binding quality, trim/cut defects on a printed book
- Customer preference issues ("I changed my mind", "I dislike style")

### Lulu defect (replacement path)

Use this path when product quality/manufacturing is wrong:
- Misprinted or missing pages
- Binding failure
- Trim/cut/manufacturing defect inconsistent with approved order

Do not use this path for:
- Normal print variance without functional defect
- Buyer's remorse or preference changes
- Purely technical pre-print failures (use auto-refund path)

## Playbook A: Technical failure -> retry then refund

1. Confirm order is paid and identify latest failure context.
2. Verify Lulu submission retries were attempted by system.
3. If retry budget remains, re-trigger via engineering-approved workflow only.
4. If terminal failure confirmed:
   - Ensure Stripe refund is created (or queued for manual reconciliation if API unavailable).
   - Set order to terminal state (`refunded` on successful payment return; `error` if refund not yet completed).
   - Ensure support/customer notification is sent.
   - Ensure ops alert is sent to `hello@colordrop.ai` (or `OPS_ALERT_EMAIL`).
5. Customer response template:
   - "We were unable to print your order due to a technical fulfillment issue. Your payment has been refunded to the original method."

Expected states:
- Success: order `refunded`, optional `stripe_refund_id` present, book set back to `ordering`.
- Manual follow-up required: order `error` with clear refund reconciliation note.

## Playbook B: Lulu manufacturing defect -> case-by-case support handling

1. Confirm order identity and defect category.
2. Collect evidence:
   - Photos of defect (cover + affected pages/binding)
   - Shipping label/tracking details
   - Short customer description
3. Open/submit Lulu defect or reprint claim per Lulu’s current process. Use [`docs/lulu-defect-policy.md`](./lulu-defect-policy.md) for official links and evidence expectations; when collecting proof, follow Lulu’s [Providing digital defect images](https://help.lulu.com/en/support/solutions/articles/64000255314-providing-digital-defect-images) guidance (clear photos, order details, description).
4. Update customer:
   - We’re reviewing the issue and will follow up with next steps.
   - If a replacement is appropriate, we’ll arrange it without requiring a new paid order.
5. Log final outcome and tracking once replacement is issued.

Customer response template:
- "Thanks for reporting this print defect. We are arranging a replacement under our print partner's defect policy and will share updates by email."

## Escalation and SLA

- First support response target: within 72 hours.
- Escalate to engineering immediately when:
  - failure classification is unclear,
  - refund automation does not complete,
  - repeated technical failures appear systemic.
- Escalate to support lead when:
  - defect evidence is ambiguous,
  - customer requests policy exception.

## System behavior reference

Technical terminal failure handling is implemented in:
- `src/lib/fulfillment-failure.ts` (`handleTerminalFulfillmentFailure`)
- `src/lib/lulu-print-job-retry.ts` (retry/backoff flow and PDF URL refresh)
- `src/lib/stripe-book-order-webhook.ts` (refund helper/idempotency handling)
- `src/lib/email.ts` (customer failure email + ops alerts)

For Lulu API/SKU specifics and integration details, see:
- `docs/lulu-integration.md`

## Resend production setup (human-managed)

Complete these steps in the Resend dashboard and your DNS/hosting providers before launch.

1. Prepare account
   - Confirm production-ready Resend account ownership and billing state.
   - Confirm who owns credentials and backup access.
2. Create API keys
   - Create a production API key in Resend.
   - Set host production env var: `RESEND_API_KEY=<production_key>`.
   - Optional: create separate preview/dev key to avoid accidental real sends.
3. Verify sending domain
   - In Resend, add your sending domain (`colordrop.ai` or `mail.colordrop.ai`).
   - Add provided DNS records at your DNS provider:
     - SPF TXT
     - DKIM CNAME/TXT records from Resend
     - DMARC TXT (recommended starter policy: `v=DMARC1; p=none; rua=mailto:hello@colordrop.ai`)
   - Wait for domain state to show `Verified` in Resend.
4. Set sender/ops env values
   - `RESEND_FROM_EMAIL="ColorDrop <orders@colordrop.ai>"` (must be allowed on verified domain)
   - `OPS_ALERT_EMAIL=hello@colordrop.ai` (or monitored ops inbox)
   - `LULU_CONTACT_EMAIL=orders@colordrop.ai` (or preferred support/ops contact)

### Env matrix

- Production
  - `RESEND_API_KEY` = production key
  - `RESEND_FROM_EMAIL` = verified sender identity
  - `OPS_ALERT_EMAIL` = monitored internal inbox
  - `LULU_CONTACT_EMAIL` = explicit print-job contact email
- Preview/dev
  - `RESEND_API_KEY` = non-production key (optional but recommended)
  - `RESEND_FROM_EMAIL` = non-production sender identity on verified domain/subdomain
  - `OPS_ALERT_EMAIL` = test inbox
  - `LULU_CONTACT_EMAIL` = test-safe contact (or same as from)

### Evidence required before checking TODOs

- Resend domain screenshot or status text showing `Verified`.
- Hosting environment screenshot/text showing production `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `OPS_ALERT_EMAIL`, and `LULU_CONTACT_EMAIL` set.

## Staging transactional email verification

Run this before production launch and after major checkout/fulfillment email changes.

1. Order confirmation email
   - Complete a staging checkout.
   - Confirm `sendOrderConfirmation` path triggers from Stripe webhook processing.
   - Verify recipient, sender identity, subject, and order details.
2. Shipping email
   - Move a staging Lulu order into shipped status (real webhook or controlled simulation).
   - Confirm `sendShippingNotification` sends tracking URL/ID as expected.
3. Technical fulfillment-failure email (refund path)
   - Trigger a terminal fulfillment failure scenario in staging.
   - Confirm customer receives failure/refund message from `sendFulfillmentFailureCustomerEmail`.
4. Ops alert path
   - Simulate reconciliation/terminal-failure alert condition.
   - Confirm `sendOpsAlert` arrives at `OPS_ALERT_EMAIL`.
5. Deliverability spot check
   - Check inbox placement (primary/spam) for each email type.
   - Confirm sender/reply expectations match support policy.
