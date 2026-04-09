# Lulu: defect and replacement (internal reference)

**Last reviewed:** 2026-04-08

ColorDrop fulfills print orders through Lulu’s Print API. For **manufacturing defects** on a delivered book, support follows [`docs/fulfillment-runbook.md`](./fulfillment-runbook.md) Playbook B. This page links **Lulu’s published** guidance so scripts and Terms stay grounded in their docs.

## Official sources

| Topic | URL |
|--------|-----|
| Reporting defects — photos, order info, support flow | [Providing digital defect images](https://help.lulu.com/en/support/solutions/articles/64000255314-providing-digital-defect-images) |
| Print options — **Standard Color** limitations vs replacements | [Printing: The Basics](https://help.lulu.com/en/support/solutions/articles/64000255474-printing-the-basics) |
| Umbrella terms (customer relationship with Lulu where applicable) | [Lulu Terms & Conditions](https://www.lulu.com/terms-and-conditions) |

## Operational summary (not legal advice)

- Lulu expects **clear digital photos** of the problem and **order identification** when investigating defects; follow their defect-images article when requesting evidence from customers.
- Lulu states that **Standard Color** used for **heavy color / image-rich** books may show quality issues (fading, streaking, etc.) and that **replacements are not provided** for those issues when Standard Color was chosen. **ColorDrop’s current `pod_package_id`s are black & white standard (`BWSTD` in [`src/lib/book-products.ts`](../src/lib/book-products.ts)).** Do not use the Standard Color caveat as the default excuse for B&W coloring-book defects; re-read Lulu’s pages if we ever switch interior color options.

## Customer-facing alignment

- **Terms:** [`src/app/(marketing)/terms/page.tsx`](../src/app/(marketing)/terms/page.tsx) — refunds vs technical failure vs Lulu defect path.
- **FAQ:** [`src/app/(marketing)/faq/page.tsx`](../src/app/(marketing)/faq/page.tsx) — short refund/defect answer.

Remedies for manufacturing issues are **subject to Lulu’s published policies** and are handled case by case through support.
