# Data Retention Policy

**Last updated:** April 2026

## Overview

ColorDrop retains customer data according to the categories below. The policy balances user privacy, operational needs, and legal/tax record-keeping obligations.

## Retention schedule

| Data category | Retention period | Mechanism |
|---|---|---|
| **Original uploaded images** | **180 days** after order fulfillment (shipped/delivered), or immediately upon book deletion | Automated cron (`GET /api/cron/cleanup-originals`) removes files from the `originals` storage bucket. |
| **Order and transaction records** | **Indefinite** (retained for tax and accounting compliance) | No automated deletion. Financial records (Stripe IDs, amounts, shipping addresses, order metadata) are kept as long as the business operates. |
| **Account and profile data** | While the account is active | Deleted or anonymized upon account deletion request (via settings or support). |
| **Saved conversions** | While the account is active | Deleted upon account deletion. Not subject to the 180-day cron. |
| **Generated outlines and PDFs** | While the associated book exists | Removed when the user deletes the book or their account. Order PDFs (`pdfs` bucket) are retained with the order record. |

## Cron schedule

The cleanup cron should run **daily**. Configure in your hosting platform (e.g. Vercel Cron):

```
GET /api/cron/cleanup-originals
Authorization: Bearer <CRON_SECRET>
```

The `CRON_SECRET` env var must be set in production. The route rejects unauthenticated requests.

## Account deletion

When a user requests account deletion (`DELETE /api/account/delete`):

- `saved_conversions` rows and storage files are deleted.
- Books without orders are deleted.
- Books with orders and order rows are anonymized (`user_id` cleared).
- `credit_transactions` are deleted.
- `user_profiles` row is deleted.
- Clerk user is deleted.

Order and financial records are retained in anonymized form per legal obligations.

## Privacy page alignment

The public [Privacy Policy](/privacy) section 4 (Retention) reflects this schedule. Update both documents together when the policy changes.

## Open questions

- Tax retention minimums vary by jurisdiction (typically 3-7 years in the US/Canada). Indefinite retention of order records satisfies all common thresholds. Revisit if a maximum retention cap is required.
- If volume grows, consider a secondary cron for cleaning up orphaned storage objects (outlines, covers) not linked to any book.
