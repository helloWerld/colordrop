# Lulu Print API integration

This app uses Lulu for print cost quotes, cover dimensions, and print-job submission. Official references:

| Resource | URL |
|----------|-----|
| Print API overview | [developers.lulu.com](https://developers.lulu.com/) |
| REST API docs | [api.lulu.com/docs](https://api.lulu.com/docs/) |
| OpenAPI (machine-readable) | [openapi_public.yml](https://api.lulu.com/api-docs/openapi-specs/openapi_public.yml) |
| API knowledge base | [help.api.lulu.com](https://help.api.lulu.com/) |
| Consumer help (PDF prep, paper, margins) | [help.lulu.com](https://help.lulu.com/en/support/home) |
| Print API product list | [lulu.com/print-api/products](https://www.lulu.com/print-api/products) |
| Dev price calculator | [developers.lulu.com/price-calculator](https://developers.lulu.com/price-calculator) |

## Code map

- **SKUs (`pod_package_id`)** — [`src/lib/book-products.ts`](../src/lib/book-products.ts): trim sizes, saddle stitch vs perfect bind IDs, `getPodPackageId(trimSizeId, pageTier)`.
- **Pricing** — [`src/lib/pricing.ts`](../src/lib/pricing.ts): `print-job-cost-calculations` + `BOOK_MARKUP_PERCENT` / `SHIPPING_MARKUP_PERCENT` on Lulu components.
- **HTTP client** — [`src/lib/lulu.ts`](../src/lib/lulu.ts): token, cover dimensions, cost calculation, create print job.
- **Fulfillment** — [`src/lib/fulfillment.ts`](../src/lib/fulfillment.ts): derives `podPackageId` with `getTrimSizeIdFromCode` + `getPodPackageId` (same rule as pricing), validates page counts, then uploads PDFs and creates the print job.
- **Checkout geography** — [`src/lib/shipping-regions.ts`](../src/lib/shipping-regions.ts): curated `US` / `CA` only in the UI; `country_code` and `state_code` sent to Lulu must match their OpenAPI rules (subdivisions required for US and CA). Lulu does not publish a full shippable-country enum in the spec; broader delivery is limited in practice by carrier service (see KB: [countries exempt from delivery](https://help.api.lulu.com/en/support/solutions/articles/64000254641-are-there-any-countries-exempt-from-delivery-)). Add countries only after verifying `print-job-cost-calculations` (and print jobs in sandbox) for real addresses.

## SKU verification checklist

When changing bindings, trims, or paper options:

1. Confirm each `pod_package_id` in `BOOK_PRODUCTS` exists for the Print API product line you use (see print-api products / Lulu dashboard).
2. Run cost calculation for each `PAGE_TIERS` × `TRIM_SIZES` combination (or use the dev **Lulu** popover + `/api/dev/lulu-check` in development).
3. Submit a **sandbox** print job with interior + cover URLs and verify normalization succeeds.
4. Re-read Lulu’s rejection guide: [Why Has My Print Job Been Rejected?](https://help.api.lulu.com/en/support/solutions/articles/64000306380-why-has-my-print-job-been-rejected-) (wrong SKU, PDF size, shipping, URLs).

## Print job request shape

`createPrintJob` in `lulu.ts` follows the API’s `printable_normalization` pattern (interior + cover `source_url`, `pod_package_id` inside normalization). Cross-check the OpenAPI spec if Lulu announces schema changes.

## PDF URLs for print jobs

Interior and cover PDFs live in the private **`pdfs`** bucket. At fulfillment time, [`src/lib/lulu-print-job-retry.ts`](../src/lib/lulu-print-job-retry.ts) calls `createSignedUrl` with **`SIGNED_URL_TTL_SEC`** (currently **7 days**) so Lulu can download files even if normalization is queued. URLs are **regenerated before each** `createPrintJob` attempt so retries do not reuse an expired link. Lulu requires URLs to be accessible when they fetch ([invalid URL rejection](https://help.api.lulu.com/en/support/solutions/articles/64000306380-why-has-my-print-job-been-rejected-)); they do not document a minimum TTL, so this TTL is a conservative default.

## Fulfillment fee

Per-order fulfillment fees are included in the cost-calculation response; see [Per Order Fulfillment Fee](https://help.api.lulu.com/en/support/solutions/articles/64000265990-per-order-fulfillment-fee) (API KB).

## Customer defect policy (Lulu)

Misprints and manufacturing defects are handled with Lulu under **their** published processes. Internal summary and links: [`docs/lulu-defect-policy.md`](./lulu-defect-policy.md).

## Operations runbook

For support triage and policy handling of technical non-fulfillment vs manufacturing defects, see:
- [`docs/fulfillment-runbook.md`](./fulfillment-runbook.md)
