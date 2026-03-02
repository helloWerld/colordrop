# ColorDrop — Product Requirements Document

**Version:** 1.0
**Date:** February 28, 2026
**Status:** Draft

**Company:** ColorDrop  
**Domain:** colordrop.ai  
**Tagline:** Color Your Photos.

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Target Audience](#2-target-audience)
3. [User Stories & Flows](#3-user-stories--flows)
4. [Feature Requirements (MVP)](#4-feature-requirements-mvp)
5. [Technical Architecture](#5-technical-architecture)
6. [Data Models](#6-data-models)
7. [API Integrations](#7-api-integrations)
8. [Page-by-Page UI/UX Specification](#8-page-by-page-uiux-specification)
9. [Pricing & Business Model](#9-pricing--business-model)
10. [Security & Privacy](#10-security--privacy)
11. [No-Refund Policy & Legal](#11-no-refund-policy--legal)
12. [MVP Milestones & Phases](#12-mvp-milestones--phases)
13. [Open Questions & Future Enhancements](#13-open-questions--future-enhancements)

---

## 1. Executive Summary

### Vision

ColorDrop turns your favorite photos into custom, printed coloring books. Parents upload photos of their kids, pets, vacations, or anything they love. Our AI converts each photo into a clean, kid-friendly coloring page outline. Parents arrange their pages, pick a cover, and we print and ship a real, physical coloring book straight to their door.

### Problem

Parents want personalized, creative activities for their children. Generic store-bought coloring books lack the emotional connection of familiar faces, places, and memories. Creating custom coloring pages manually requires artistic skill and significant time.

### Solution

A web application that:

- Accepts any user-uploaded photo
- Uses AI to convert it into a black-and-white coloring page (outlines only, no fills)
- Uses **Conversion Credits**: one credit = one image conversion. New users get **5 free credits**; after that, users **buy credits** in three packages (different per-credit cost; see Pricing).
- **Tracks both the total number of credits and how much the user paid** for them: credits are stored by package type (single / 50-pack / 100-pack), each with a known per-credit price ($0.25, $0.20, $0.15), so at book checkout we apply the correct value based on which credits were used for that book's conversions.
- Supports **one-off conversions**: use a credit to convert an image, then **print or download** the coloring page. The image is saved and can later be **printed, downloaded, or added to a coloring book** — but **no credit can be applied** toward a book price for one-off conversions.
- When credits are used **during coloring book creation**, those credits **can be applied toward the price of the coloring book** at checkout only (reduces the book total).
- Saves **every conversion to the user's library**; users can add pages by **uploading new images** (uses credit; applicable to book price if in book flow) or **selecting from saved conversions** (no credit used).
- Provides a **dedicated "Create a Book" flow** and separate one-off "Convert an Image" flow.
- Prints and ships the physical book on demand via Lulu's Print API
- Handles payment securely through Stripe (book payments and credit package purchases)

### One-Liner

**Upload photos. AI makes the outlines. We print your coloring book.**

---

## 2. Target Audience

### Primary: Parents of Young Children (Ages 3-10)

- **Demographics:** Parents aged 25-45, comfortable with online shopping, smartphone-savvy
- **Motivation:** Create meaningful, personalized gifts and activities for their kids
- **Behavior:** Willing to pay a premium for customization; value simplicity and speed over complex tools
- **Pain Point:** Want creative screen-free activities featuring things their children actually care about

### Secondary Audiences

| Segment | Use Case |
|---|---|
| Grandparents | Gift a coloring book of family photos to grandchildren |
| Teachers | Create classroom-themed coloring books from field trip photos |
| Pet owners | Turn pet photos into fun coloring pages |
| Event planners | Party favors with personalized coloring books (birthday party photos, etc.) |

### Key Persona: "Sarah"

Sarah is a 34-year-old mom of two (ages 4 and 7). She took hundreds of photos on a family trip to the zoo. She wants to turn those photos into an activity her kids will love. She has 15 minutes during naptime to get it done. She does not want to learn complicated software.

---

## 3. User Stories & Flows

### User Stories

| ID | Story | Priority |
|---|---|---|
| US-1 | As a visitor, I can see what the app does and view sample coloring books so I understand the value before signing up. | P0 |
| US-2 | As a visitor, I can create an account or sign in with Google/email so I can start making a book. | P0 |
| US-3 | As a user, I can upload one or more photos from my device so they can be converted into coloring pages. | P0 |
| US-4 | As a user, I can see a preview of each AI-generated coloring page so I can decide if it looks good. | P0 |
| US-5 | As a user, I can remove a page I don't like and upload a replacement. | P0 |
| US-6 | As a user, I can reorder pages in my book by dragging them. | P0 |
| US-7 | As a user, I can upload a color image for the front cover of my book. | P0 |
| US-8 | As a user, I can see a live price estimate that updates as I add or remove pages. | P0 |
| US-9 | As a user, I can review a digital preview of my complete book before ordering. | P0 |
| US-10 | As a user, I can enter my shipping address and pay with a credit card to order my book. | P0 |
| US-11 | As a user, I can view my order history and track shipping status. | P1 |
| US-12 | As a user, I can save an in-progress book and come back to finish it later. | P1 |
| US-13 | As a user, I can re-order a previously completed book. | P2 |
| US-14 | As a new user, I get 5 free image conversions to test the platform. | P0 |
| US-15 | After my free credits run out, I can buy conversion credits in packages (single, 50-pack, 100-pack) at different per-credit prices. | P0 |
| US-16 | As a user, I can convert images one-off (without a book), view the result, and print or download the coloring page; the image is saved and can later be added to a book (but no credit is applied toward the book price). | P0 |
| US-17 | As a user, my conversions are saved to my library so I can reuse them when building a book. | P0 |
| US-18 | When creating a book, I can add pages by uploading new images (uses 1 credit; value applied at checkout) or by selecting from my saved conversions (no credit used). | P0 |
| US-19 | When I checkout a coloring book, credits I used for conversions during that book's creation are applied toward the book price (reduces the total). One-off conversions cannot be applied toward a book. | P0 |
| US-20 | As a user, I can see my conversion credits (by package type) and how many free credits I have left. | P0 |
| US-21 | As a user, I can choose a stylization (No stylization, Fairy tale, Cartoon, Storybook, or Sketch) before converting an image, so the coloring page matches the look I want. | P0 |

### Core User Flow

```
Landing Page
    │
    ▼
Sign Up / Sign In (Clerk)
    │
    ▼
Dashboard
    │  ├── View past orders
    │  ├── Conversion credits (by type) & free credits remaining
    │  ├── "Convert an Image" (one-off) ──►  Convert Page
    │  │                                       │
    │  │                                       ▼
    │  │                               Upload 1 image → AI convert (1 credit: free or purchased)
    │  │                                       │
    │  │                                       ▼
    │  │                               Result saved to library (context: one_off)
    │  │                               Print / Download / "Add to Book" (no credit applied if added to book later)
    │  │
    │  ├── "My Saved Pages" ──►  Library of saved conversions (use in book, download, delete)
    │  │
    │  ├── "Buy Credits" ──►  Stripe checkout for credit packages (1, 50, or 100 credits)
    │  │
    │  └── "Create New Book" ──►  Book Editor (dedicated page)
    │                                  │
    │                                  ▼
    │                          Add pages: Upload new images OR select from saved
    │                          (new uploads: 1 credit, saved to library with context: book → value applied at checkout;
    │                           saved: add instantly, no credit used)
    │                                  │
    │                                  ▼
    │                          AI Conversion (only for newly uploaded)
    │                          (processing indicator per image)
    │                                  │
    │                                  ▼
    │                          Review Pages (grid, reorder, remove, replace)
    │                                  │
    │                                  ▼
    │                          Upload Cover Image
    │                                  │
    │                                  ▼
    │                          Book Preview
    │                                  │
    │                                  ▼
    │                          Checkout
    │                          (credits used for this book's conversions applied to price; price breakdown, shipping, Stripe payment)
    │                                  │
    │                                  ▼
    │                          Order Confirmation
    │
    ▼
Dashboard (order visible in history)
```

---

## 4. Feature Requirements (MVP)

### 4.1 Authentication

| Requirement | Details |
|---|---|
| Sign up | Email/password and Google OAuth |
| Sign in | Email/password and Google OAuth |
| Session management | Persistent sessions via Clerk; automatic token refresh |
| Account deletion | Users can delete their account and all associated data |

### 4.2 Image Upload

| Requirement | Details |
|---|---|
| Supported formats | JPEG, PNG, WebP |
| Max file size | 20 MB per image |
| Min resolution | 800 x 800 px (to ensure quality outlines) |
| Max pages per book | 50 pages (Lulu production constraint) |
| Min pages per book | 2 pages (Lulu API requirement — interior file needs at least 2 pages) |
| Bulk upload | Select multiple files at once; drag-and-drop support |
| Upload feedback | Per-file progress bar, success/error states |
| Storage | Supabase Storage; original files retained until order is fulfilled, then deleted after 90 days |

### 4.3 Free Tier & Conversion Credits

| Requirement | Details |
|---|---|
| One credit = one conversion | Each image conversion consumes exactly 1 conversion credit (or 1 free credit) |
| New user free credits | Every new user receives **5 free conversion credits** at sign-up (stored in user profile) |
| After free tier | Once the 5 free credits are used, user must **purchase credits** in one of three packages (see Pricing) |
| Credit packages (tracked by cost) | **Single:** 1 credit at $0.25/credit. **50-pack:** 50 credits at $0.20/credit ($10). **100-pack:** 100 credits at $0.15/credit ($15). |
| Track total credits and price paid | Account stores **total number of credits** in three pools: `credits_single`, `credits_pack_50`, `credits_pack_100`. Each pool has a **known price the user paid** per credit ($0.25, $0.20, $0.15). At book checkout we apply credit toward the book based on **which credits were used** for that book's conversions and their corresponding value. |
| Deduction order (free first) | Use free credits first; only deduct purchased credits when free count is 0. **Free credits do not apply toward book price** when used for a book conversion (only purchased credits do, at 25¢/20¢/15¢). |
| Deduction order (purchased, for book) | When a **purchased** credit is used during book creation, deduct from **most expensive pool first** (single → pack_50 → pack_100) and record the per-credit value (25¢, 20¢, or 15¢) for checkout. This **maximizes the amount applied toward the coloring book** for the user. |
| Deduction order (purchased, one-off) | When a credit is used for **one-off** conversion, deduct from **cheapest pool first** (pack_100 → pack_50 → single) so the user **preserves their higher-value credits** for future book checkouts. No value is recorded for book application. |
| Display | Dashboard and conversion flows show "X free credits left" and credit counts by package (or total) with "Buy Credits" link |
| Insufficient credits | If no free credits and no purchased credits, block conversion and prompt user to buy credits |

### 4.4 Credit Application to Book Price

| Requirement | Details |
|---|---|
| Credits used during book creation | When the user converts an image **while building a book** using a **purchased** credit, we deduct from the most expensive pool first (25¢, 20¢, or 15¢) and that **value is recorded** (e.g. on the page as `credit_value_cents`) **and applied toward the book price at checkout only**. Free credits used in a book do not reduce the book total. |
| One-off conversions | When the user converts an image in the **one-off** flow, the image is saved to the library. If they later add that saved image to a coloring book, **no credit can be applied** toward the book price (they already "spent" the credit for one-off use) |
| Checkout | At book checkout, sum the **recorded credit values** (25¢, 20¢, or 15¢ per conversion, depending on which credit pool was used) for all conversions done in that book and **subtract from the book total**; user pays the reduced amount via Stripe. Because we use most expensive credits first during book creation, the user gets the **highest possible credit** toward their book. |
| Book payment | Book is always paid via Stripe Checkout; credits only reduce the book price, they are not a separate payment method |

### 4.5 Saved Conversions (Library)

| Requirement | Details |
|---|---|
| Persistence | Every completed conversion (one-off or during book creation) is saved to the user's library |
| Conversion context | Each saved conversion has **conversion_context**: `one_off` or `book`. **one_off** = converted in one-off flow → adding to a book later does **not** apply any credit to book price. **book** = converted during book creation → credit was already applied at that book's checkout. |
| Stored data | User ID, original image path, outline image path, created_at, conversion_context, stylization |
| Use in book | When building a book, user can "Add from my saved pages"; no credit is used. If the saved conversion was one_off, no credit is applied to the book price. If it was from a previous book, same — no double-apply. |
| One-off flow | After a one-off conversion, result is saved with context `one_off`; user can download/print or later add to a book (image is usable, but no credit applied) |
| Book flow | Conversions done inside "Create Book" are saved with context `book` and can be reused in future books (as images only; no additional credit applied) |
| Management | User can view "My Saved Pages," delete items, download outline image |

### 4.6 One-Off Conversions & Direct Print

| Requirement | Details |
|---|---|
| Entry point | Dedicated page or dashboard CTA: "Convert an Image" (single-image flow) |
| Flow | Upload one image → run conversion (1 free credit or 1 purchased credit) → show result. Saved with **conversion_context: one_off**. |
| Output | User can download the outline image (PNG) or use browser print to print the coloring page directly |
| Save | Conversion is always saved to the user's library; can later be printed, downloaded, or added to a coloring book — but **no credit can be applied** toward a book when adding it |
| No book required | User can use the platform only for one-off conversions and never create a book |

### 4.7 AI Image Conversion (Technical)

| Requirement | Details |
|---|---|
| Model provider | Replicate API (primary) |
| Primary model | ControlNet Lineart pipeline (`pnyompen/sd-lineart-controlnet`) for photo-to-outline |
| Fallback model | OpenAI GPT-4o image edit API with prompt: *"Convert this photo to a clean black-and-white coloring book page with bold outlines, no shading, no color, suitable for children"* |
| Output format | PNG, 300 DPI, black outlines on white background |
| Output dimensions | Matched to book trim size (8.5 x 8.5 in = 2550 x 2550 px at 300 DPI) |
| Processing time | Target < 30 seconds per image; UI shows animated progress |
| Retry logic | Automatic retry up to 3 times on failure; surface error to user if all retries fail |
| Quality check | Basic automated validation — ensure output is predominantly B&W, reject if model returns unexpected color output |
| Credits | Before starting conversion: check free credits then purchased credits (by type). Deduct after successful conversion: free first; then for **book** deduct from **most expensive pool first** (single → pack_50 → pack_100) and record that credit's value for checkout; for **one-off** deduct from **cheapest pool first** (pack_100 → pack_50 → single), no value recorded. |
| Stylization | User chooses a **stylization option** (or **No stylization**) before starting the conversion. Same list available in one-off convert flow and in Book Editor when uploading new images. Selected style is passed to the AI model as the prompt; see [§4.7.1 Stylization options](#471-stylization-options). |

#### 4.7.1 Stylization options

User must select one option before each conversion. Stylization affects the Replicate (and fallback) prompt only; cost and credit usage are unchanged.

| Option | Description | Replicate / fallback prompt direction |
|---|---|---|
| **No stylization** | Default: clean, neutral coloring-page outline | "Clean black-and-white coloring book page, bold outlines only, no shading, no color, white background, suitable for children." |
| **Fairy tale** | Whimsical, storybook fantasy feel | "Fairy tale storybook style, black-and-white coloring page, whimsical outlines, no shading, suitable for children." |
| **Cartoon** | Bold, simple cartoon look | "Cartoon style black-and-white coloring book outline, simple bold lines, no shading, white background, suitable for children." |
| **Storybook** | Classic illustrated storybook style | "Classic storybook illustration style, black-and-white coloring page, clear outlines, no shading, suitable for children." |
| **Sketch** | Hand-drawn pencil-sketch feel | "Hand-drawn sketch style, black-and-white coloring book page, pencil-like outlines, no shading, suitable for children." |

- **Default:** No stylization.
- **Persistence:** The chosen option is stored with the conversion (see `saved_conversions.stylization`) so the user can see which style was used in My Saved Pages.

### 4.8 Book Editor (Create a Book — Dedicated Page)

| Requirement | Details |
|---|---|
| Separate page | "Create a Book" is a dedicated flow (e.g., `/dashboard/books/new` or `/dashboard/books/[bookId]`); distinct from one-off "Convert an Image" |
| Adding pages | Two ways: **(1) Upload new images** — triggers conversion (1 free or purchased credit; when in book flow deduct **most expensive credit first** so maximum value is applied at checkout; value recorded for checkout); result saved to library with context `book`. **(2) Choose from saved** — pick from user's saved conversions, add to book with one click; no credit used and no credit applied (even if the saved image was originally a one-off conversion). |
| Page grid | Thumbnail grid of all pages in the book (converted or from saved) |
| Reorder | Drag-and-drop reordering |
| Remove | Click to remove a page (with confirmation); does not delete from saved library |
| Replace | Remove + upload new image or pick a different saved conversion for that slot |
| Cover upload | Separate upload area for a full-color cover image |
| Cover specs | Full-color, must meet Lulu cover dimension requirements (calculated dynamically based on page count and trim size) |
| Auto-save | Book state saved to database automatically as user makes changes |
| Price display | Running total visible at all times; **credits used for conversions in this book are applied toward the book price** at checkout (shows e.g. "Credit value: -$X.XX" and reduced total) |

### 4.9 Book Preview

| Requirement | Details |
|---|---|
| Preview type | Page-by-page horizontal scroll or flip-through view |
| Content shown | Cover (front), all interior pages in order, back cover |
| Zoom | Tap/click a page to see full-resolution detail |
| Edit access | "Edit" button returns user to the Book Editor |

### 4.10 Checkout & Payment

| Requirement | Details |
|---|---|
| Payment provider | Stripe Checkout (hosted page) |
| Payment methods | Credit/debit cards (Visa, Mastercard, Amex); Apple Pay; Google Pay |
| Shipping address | Collected in-app before redirecting to Stripe |
| Shipping options | Standard (MAIL), Priority (PRIORITY_MAIL), Expedited (EXPEDITED) — fixed prices per tier |
| Price breakdown | Itemized: **Subtotal** (pages × $0.99 + $4.99 platform fee), **Shipping** (by tier), **Credits applied** (value of purchased credits used for this book's conversions, shown as negative); **Total**. Tax via Stripe when enabled. One-off conversions do not apply. |
| Stripe mode | One-time payment via Checkout Session |
| Success flow | Stripe redirects to `/order/confirmation?session_id={CHECKOUT_SESSION_ID}`; confirmation page looks up order by session and shows success |
| Cancel flow | Stripe redirects back to Book Preview with book state intact |
| Webhook | Stripe `checkout.session.completed` webhook triggers order processing |

### 4.11 Order Fulfillment

| Requirement | Details |
|---|---|
| PDF generation | Server-side assembly of all coloring pages into a single interior PDF; separate cover PDF |
| PDF specs | Interior: B&W, 300 DPI, matching trim size. Cover: full-color, dimensions from Lulu cover dimension API |
| File upload | Upload generated PDFs to a publicly accessible URL (Supabase Storage signed URL, 1-hour expiry) |
| Lulu Print-Job | Create print job via Lulu API with `pod_package_id`, interior URL, cover URL, shipping address, shipping level |
| Status tracking | Poll Lulu API or receive webhooks for status updates (CREATED → UNPAID → PRODUCTION_READY → IN_PRODUCTION → SHIPPED) |
| Lulu payment | Lulu charges our account for printing + shipping; we've already collected payment from the customer via Stripe |
| Tracking info | Display carrier name and tracking URL to user once status is SHIPPED |

### 4.12 Dashboard

| Requirement | Details |
|---|---|
| Credits & free | Display "X free credits left" and purchased credit counts (by package or total); "Buy Credits" CTA |
| Buy Credits | CTA or link to "Buy Credits" — choose package (1, 50, or 100 credits), Stripe Checkout |
| In-progress books | List of books the user is still editing, with "Continue Editing" action |
| Completed orders | List of orders with status badge (Processing, Printing, Shipped, Delivered) |
| Order detail | Expand to see page thumbnails, tracking info, order date, total paid |
| Create New Book | Prominent "Create New Book" CTA (dedicated book-creation page) |
| Convert an Image | CTA for one-off conversion (single image → save to library, print/download) |
| My Saved Pages | Link to library of saved conversions (use in book, download, delete) |

---

## 5. Technical Architecture

### 5.1 Stack Overview

| Layer | Technology |
|---|---|
| Framework | Next.js 14+ (App Router) with TypeScript |
| Styling | Tailwind CSS + shadcn/ui component library |
| Authentication | Clerk (managed auth) |
| Database | Supabase (PostgreSQL) |
| File Storage | Supabase Storage |
| AI Processing | Replicate API (primary), OpenAI API (fallback) |
| PDF Generation | `pdf-lib` (lightweight, no headless browser needed) |
| Payments | Stripe (Checkout Sessions + Webhooks) |
| Print & Ship | Lulu Print API |
| Hosting | Vercel |
| Email | Resend (transactional emails: order confirmation, shipping notification) |
| Background Jobs | Vercel Functions (for AI processing, PDF generation, Lulu API calls) |
| Monitoring | Vercel Analytics + Sentry for error tracking |

### 5.2 Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                      Client (Browser)                   │
│                   Next.js App Router                    │
│              Tailwind CSS + shadcn/ui                   │
└───────────────────────┬─────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│                   Vercel Edge / Serverless               │
│                                                         │
│  ┌──────────┐  ┌──────────────┐  ┌───────────────────┐  │
│  │  Auth     │  │  API Routes  │  │  Webhooks         │  │
│  │  (Clerk)  │  │  /api/*      │  │  /api/webhooks/*  │  │
│  └──────────┘  └──────┬───────┘  └─────────┬─────────┘  │
│                       │                    │             │
└───────────────────────┼────────────────────┼─────────────┘
                        │                    │
          ┌─────────────┼────────────────────┼──────────┐
          │             │                    │          │
          ▼             ▼                    ▼          ▼
   ┌────────────┐ ┌──────────┐  ┌─────────────┐ ┌──────────┐
   │  Supabase  │ │ Replicate│  │   Stripe    │ │  Lulu    │
   │  Database  │ │ API      │  │   API       │ │  Print   │
   │  + Storage │ │ (AI)     │  │  (Payments) │ │  API     │
   └────────────┘ └──────────┘  └─────────────┘ └──────────┘
```

### 5.3 Key Technical Flows

#### Image Upload & Conversion Flow

1. User selects image(s) in the browser (one-off convert page or book editor) and chooses a **stylization option** (No stylization, Fairy tale, Cartoon, Storybook, or Sketch) before converting.
2. Client validates file type, size, and minimum resolution.
3. Client uploads image to Supabase Storage via signed upload URL.
4. Client calls `POST /api/pages/convert` (or equivalent) with the storage path and the selected **stylization** (e.g. `stylization: "none" | "fairy_tale" | "cartoon" | "storybook" | "sketch"`).
5. **Server checks conversion eligibility:** if `free_conversions_remaining` > 0, decrement it; else if user has purchased credits, deduct 1 from purchased credit pool (most expensive first for book flow to maximize checkout value; cheapest first for one-off to preserve expensive credits), record value for book only; else return 402 and prompt user to buy credits.
6. API route maps stylization to the appropriate prompt and sends image + prompt to Replicate API for line-art conversion.
7. API polls Replicate for completion (or uses webhook callback).
8. Converted outline image is downloaded and stored in Supabase Storage.
9. **Save to library:** insert into `saved_conversions` (user_id, original_image_path, outline_image_path, conversion_context: `book` or `one_off`, stylization: selected option).
10. If in book editor: create/update `pages` with credit_value_cents if applicable; add to book credits_applied_value_cents. If one-off: client shows result with download/print / "Add to Book" (no credit applied if added to book later).
11. Client receives update and displays the preview.

#### Checkout & Fulfillment Flow

1. User clicks "Order My Book" — client calls `POST /api/checkout`
2. API route calculates final price (Lulu cost + margin + shipping)
3. API creates a Stripe Checkout Session with line items and metadata
4. User is redirected to Stripe's hosted checkout page
5. On successful payment, Stripe fires `checkout.session.completed` webhook
6. Webhook handler: 
   a. Marks order as PAID in database
   b. Triggers PDF generation (interior + cover)
   c. Uploads PDFs to Supabase Storage with signed URLs
   d. Calls Lulu Print API to create a Print-Job
   e. Stores Lulu print job ID in database
7. Background job polls Lulu for status updates (or listens via Lulu webhook)
8. When status becomes SHIPPED, email user with tracking info

---

## 6. Data Models

### 6.1 Entity Relationship Overview

```
User (Clerk-managed)
  │
  ├── 1:1 ── UserProfile
  │            ├── free_conversions_remaining (INT)
  │            ├── credits_single (INT) — count; user paid $0.25/credit
  │            ├── credits_pack_50 (INT) — count; user paid $0.20/credit
  │            └── credits_pack_100 (INT) — count; user paid $0.15/credit
  │            (total credits + price paid per pool → applied at book checkout by which credits were used)
  │
  ├── 1:N ── SavedConversion (library of all conversions)
  │            ├── original_image_path, outline_image_path
  │            ├── conversion_context (one_off | book)
  │            └── stylization (none | fairy_tale | cartoon | storybook | sketch)
  │
  ├── 1:N ── CreditTransaction (optional: purchase and use history)
  │
  ├── 1:N ── Book
  │            │
  │            ├── 1:N ── Page
  │            │           ├── original_image_path, outline_image_path
  │            │           └── saved_conversion_id (optional; if page came from library)
  │            │
  │            ├── 1:1 ── Cover
  │            │           └── cover_image_url
  │            │
  │            └── 1:1 ── Order
  │                        ├── stripe_session_id, lulu_print_job_id, shipping_address
  │                        └── credits_applied_value_cents (sum of credit values used for this book)
```

### 6.2 Table Definitions

#### `user_profiles`

| Column | Type | Description |
|---|---|---|
| `id` | UUID (PK) | Primary key |
| `user_id` | TEXT (unique) | Clerk user ID |
| `free_conversions_remaining` | INT | Number of free credits left (default 5 for new users) |
| `credits_single` | INT | **Count** of credits from single-credit purchase; user paid **$0.25/credit** (value applied at book checkout when this pool is used), default 0 |
| `credits_pack_50` | INT | **Count** of credits from 50-pack; user paid **$0.20/credit**, default 0 |
| `credits_pack_100` | INT | **Count** of credits from 100-pack; user paid **$0.15/credit**, default 0 |
| `created_at` | TIMESTAMPTZ | Row creation time |
| `updated_at` | TIMESTAMPTZ | Last modification time |

#### `saved_conversions`

| Column | Type | Description |
|---|---|---|
| `id` | UUID (PK) | Primary key |
| `user_id` | TEXT | Clerk user ID |
| `original_image_path` | TEXT | Supabase Storage path to uploaded photo |
| `outline_image_path` | TEXT | Supabase Storage path to generated coloring page |
| `conversion_context` | ENUM | `one_off` (no credit applied if added to book later) or `book` (credit was applied at that book's checkout) |
| `stylization` | TEXT | Stylization option used: `none`, `fairy_tale`, `cartoon`, `storybook`, or `sketch` (see §4.7.1) |
| `created_at` | TIMESTAMPTZ | When the conversion was completed |

Every conversion (one-off or during book creation) creates a row here so the user can reuse it when building a book.

#### `credit_transactions` (optional, for transparency)

| Column | Type | Description |
|---|---|---|
| `id` | UUID (PK) | Primary key |
| `user_id` | TEXT | Clerk user ID |
| `type` | ENUM | `purchase`, `use_book`, `use_one_off` |
| `package_type` | TEXT (nullable) | For purchase: `single`, `pack_50`, `pack_100` |
| `quantity` | INT | Credits added (purchase) or 1 (use) |
| `value_cents` | INT (nullable) | For use_book: per-credit value (15, 20, or 25) applied to book |
| `reference_id` | TEXT | Stripe session ID (purchase) or saved_conversion_id / book_id (use) |
| `created_at` | TIMESTAMPTZ | Row creation time |

#### `books`

| Column | Type | Description |
|---|---|---|
| `id` | UUID (PK) | Primary key |
| `user_id` | TEXT | Clerk user ID |
| `title` | TEXT | Optional book title (default: "My Coloring Book") |
| `status` | ENUM | `draft`, `previewing`, `ordering`, `paid`, `producing`, `shipped`, `delivered` |
| `trim_size` | TEXT | Lulu trim size code, default `0850X0850` (8.5" x 8.5" square) |
| `pod_package_id` | TEXT | Full Lulu product SKU |
| `page_count` | INT | Cached count of pages |
| `credits_applied_value_cents` | INT | Sum of credit values (15, 20, or 25¢ each) for conversions done in this book; applied at checkout |
| `created_at` | TIMESTAMPTZ | Row creation time |
| `updated_at` | TIMESTAMPTZ | Last modification time |

#### `pages`

| Column | Type | Description |
|---|---|---|
| `id` | UUID (PK) | Primary key |
| `book_id` | UUID (FK) | References `books.id` |
| `position` | INT | Page order (1-indexed) |
| `saved_conversion_id` | UUID (FK, nullable) | If set, this page was added from the user's library; outline/original come from that record |
| `original_image_path` | TEXT | Supabase Storage path to uploaded photo (or copied from saved_conversion if from library) |
| `outline_image_path` | TEXT | Supabase Storage path to generated coloring page (or from saved_conversion) |
| `conversion_status` | ENUM | `pending`, `processing`, `completed`, `failed` (e.g. `completed` when from saved) |
| `replicate_prediction_id` | TEXT (nullable) | Replicate job ID for tracking (null when page came from saved conversion) |
| `credit_value_cents` | INT (nullable) | If page was converted in this book with a purchased credit: 25, 20, or 15 (value applied at checkout; we use most expensive credits first so user gets max discount); null if from saved or free credit |
| `created_at` | TIMESTAMPTZ | Row creation time |

#### `covers`

| Column | Type | Description |
|---|---|---|
| `id` | UUID (PK) | Primary key |
| `book_id` | UUID (FK) | References `books.id` (unique) |
| `image_path` | TEXT | Supabase Storage path to cover image |
| `cover_pdf_path` | TEXT | Path to generated cover PDF (once assembled) |
| `created_at` | TIMESTAMPTZ | Row creation time |

#### `orders`

| Column | Type | Description |
|---|---|---|
| `id` | UUID (PK) | Primary key |
| `book_id` | UUID (FK) | References `books.id` (unique) |
| `user_id` | TEXT | Clerk user ID |
| `stripe_checkout_session_id` | TEXT | Stripe session ID |
| `stripe_payment_intent_id` | TEXT | Stripe payment intent ID |
| `amount_total` | INT | Total charged in cents |
| `currency` | TEXT | Currency code (e.g., `usd`) |
| `shipping_name` | TEXT | Recipient name |
| `shipping_address_line1` | TEXT | Street address |
| `shipping_address_line2` | TEXT | Apt/suite (optional) |
| `shipping_city` | TEXT | City |
| `shipping_state` | TEXT | State/province |
| `shipping_postal_code` | TEXT | Postal/ZIP code |
| `shipping_country` | TEXT | ISO country code |
| `shipping_phone` | TEXT | Phone (required by Lulu) |
| `shipping_level` | ENUM | `MAIL`, `PRIORITY_MAIL`, `GROUND`, `EXPEDITED`, `EXPRESS` |
| `lulu_print_job_id` | INT | Lulu's print job identifier |
| `lulu_status` | TEXT | Current Lulu status (CREATED, UNPAID, IN_PRODUCTION, SHIPPED, etc.) |
| `lulu_tracking_id` | TEXT | Carrier tracking ID |
| `lulu_tracking_url` | TEXT | Carrier tracking URL |
| `credits_applied_value_cents` | INT | Total credit value applied to this order (reduces amount_total) |
| `interior_pdf_path` | TEXT | Supabase Storage path to interior PDF |
| `cover_pdf_path` | TEXT | Supabase Storage path to cover PDF |
| `status` | ENUM | `pending`, `paid`, `processing`, `submitted_to_print`, `in_production`, `shipped`, `delivered`, `error` |
| `error_message` | TEXT | Error details if something failed |
| `created_at` | TIMESTAMPTZ | Row creation time |
| `updated_at` | TIMESTAMPTZ | Last status update |

---

## 7. API Integrations

### 7.1 Clerk (Authentication)

| Item | Details |
|---|---|
| Purpose | User sign-up, sign-in, session management |
| Integration | `@clerk/nextjs` SDK |
| Auth methods | Email/password, Google OAuth |
| Middleware | Clerk middleware protects all `/dashboard/*`, `/api/*` routes |
| User sync | Clerk webhook on `user.created` to initialize user record in Supabase (if needed) |
| Environment vars | `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY` |

### 7.2 Supabase (Database & Storage)

| Item | Details |
|---|---|
| Purpose | PostgreSQL database, file storage for images and PDFs |
| Integration | `@supabase/supabase-js` client library |
| Auth model | Service role key used server-side; RLS policies based on Clerk user ID |
| Storage buckets | `originals` (uploaded photos), `outlines` (converted pages), `covers` (cover images), `pdfs` (generated PDFs) |
| Signed URLs | Used for Lulu API file access (1-hour expiry) |
| Environment vars | `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` |

### 7.3 Replicate (AI Image Conversion)

| Item | Details |
|---|---|
| Purpose | Convert uploaded photos to coloring book outlines |
| Primary model | `pnyompen/sd-lineart-controlnet` — ControlNet lineart with Stable Diffusion img2img |
| Cost per run | ~$0.003 (approx. 322 runs per $1) |
| Runtime | ~14 seconds per image |
| Integration | `replicate` npm package |
| Input | Image URL (Supabase signed URL), **prompt** (derived from user-selected stylization; see §4.7.1) |
| Output | URL to generated image (downloaded and stored in Supabase) |
| Stylization | Prompt per style: map `none` / `fairy_tale` / `cartoon` / `storybook` / `sketch` to the corresponding prompt strings in §4.7.1; same cost per run regardless of style |
| Fallback | OpenAI `images.edit` endpoint with GPT-4o if Replicate fails (fallback prompt also varies by stylization) |
| Rate limiting | Queue concurrent requests; max 5 parallel conversions per user |
| Environment vars | `REPLICATE_API_TOKEN` |

### 7.4 OpenAI (Fallback AI Conversion)

| Item | Details |
|---|---|
| Purpose | Fallback image conversion if Replicate is unavailable or returns poor results |
| Endpoint | `POST /v1/images/edits` |
| Model | GPT-4o image generation |
| Prompt | Varies by user-selected stylization; use the same prompt direction as in §4.7.1 (e.g. default: "Convert this photo into a clean black-and-white coloring book page. Use bold, simple outlines only. No shading, no gray tones, no color. White background. Suitable for young children to color in."). For other styles, adapt the §4.7.1 prompt for the edit API. |
| Output | PNG image |
| Environment vars | `OPENAI_API_KEY` |

### 7.5 Stripe (Payments)

| Item | Details |
|---|---|
| Purpose | (1) One-time payments for coloring book orders; (2) Conversion credit package purchases |
| Integration | `stripe` npm package + `@stripe/stripe-js` for client |
| Book checkout flow | Create Checkout Session with line items (book price minus credits_applied_value_cents) → redirect → webhook triggers fulfillment |
| Buy credits flow | Three products: 1 credit ($0.25), 50 credits ($10), 100 credits ($15). Create Checkout Session with selected product; metadata `type: credit_purchase`, `userId`, `package_type` (single | pack_50 | pack_100). On success webhook, add corresponding credits to user_profiles (credits_single, credits_pack_50, credits_pack_100). |
| Checkout Session metadata | Book: `bookId`, `userId`, `pageCount`. Credit purchase: `type: credit_purchase`, `userId`, `package_type` |
| Webhook events | `checkout.session.completed` — if book order, run fulfillment; if credit_purchase, add credits to user profile by package type |
| Webhook signature verification | Verify using `STRIPE_WEBHOOK_SECRET` |
| Environment vars | `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET` |

### 7.6 Lulu Print API (Print & Ship)

| Item | Details |
|---|---|
| Purpose | Print and ship physical coloring books |
| Base URL | Production: `https://api.lulu.com`, Sandbox: `https://api.sandbox.lulu.com` |
| Auth | OAuth 2.0 client credentials → JWT bearer token |
| Token endpoint | `https://api.lulu.com/auth/realms/glasstree/protocol/openid-connect/token` |

#### Key Endpoints Used

| Endpoint | Method | Purpose |
|---|---|---|
| `/auth/realms/glasstree/protocol/openid-connect/token` | POST | Obtain access token |
| `/print-job-cost-calculations/` | POST | Calculate printing + shipping cost for price display |
| `/print-job-cover-dimensions/` | POST | Get required cover dimensions based on page count and trim |
| `/print-jobs/` | POST | Create a new print job (the core order) |
| `/print-jobs/{id}/` | GET | Check print job status |
| `/print-jobs/{id}/status/` | GET | Get detailed status with tracking info |
| `/webhooks/` | POST | Register webhook for `PRINT_JOB_STATUS_CHANGED` |

#### Product Configuration

| Property | Value |
|---|---|
| Trim size | 8.5" x 8.5" square (`0850X0850`) |
| Interior | Black & White, Standard quality (`BWSTD`) |
| Binding | Paperback, perfect binding (`PB`) |
| Paper | 60# Uncoated White, 444 PPI (`060UW444`) |
| Cover finish | Matte (`M`), no linen (`X`), no foil (`X`) |
| **pod_package_id** | **`0850X0850BWSTDPB060UW444MXX`** |

#### Print-Job Payload Example

```json
{
  "line_items": [
    {
      "title": "My Coloring Book",
      "cover": {
        "source_url": "https://your-supabase.storage/covers/abc123.pdf"
      },
      "interior": {
        "source_url": "https://your-supabase.storage/pdfs/interior-abc123.pdf"
      },
      "pod_package_id": "0850X0850BWSTDPB060UW444MXX",
      "quantity": 1
    }
  ],
  "shipping_address": {
    "name": "Sarah Johnson",
    "street1": "123 Main St",
    "city": "Austin",
    "state_code": "TX",
    "country_code": "US",
    "postcode": "78701",
    "phone_number": "5125551234"
  },
  "shipping_level": "MAIL",
  "contact_email": "orders@colordrop.ai"
}
```

| Environment vars | `LULU_CLIENT_KEY`, `LULU_CLIENT_SECRET`, `LULU_API_BASE_URL` |
|---|---|

### 7.7 Resend (Transactional Email)

| Item | Details |
|---|---|
| Purpose | Send order confirmation and shipping notification emails |
| Triggers | Order placed (payment confirmed), Order shipped (tracking available) |
| Templates | Simple, branded HTML emails matching the app's playful style |
| Environment vars | `RESEND_API_KEY` |

---

## 8. Page-by-Page UI/UX Specification

### Design System

| Element | Specification |
|---|---|
| **Overall feel** | Light, warm, playful — like a friendly children's bookstore |
| **Primary color** | Soft coral / salmon (`#FF6B6B`) |
| **Secondary color** | Sky blue (`#4ECDC4`) |
| **Accent color** | Sunny yellow (`#FFE66D`) |
| **Background** | Warm off-white (`#FFF9F0`) |
| **Text color** | Soft charcoal (`#2D3436`) |
| **Font — headings** | Rounded sans-serif (e.g., Nunito or Quicksand from Google Fonts) |
| **Font — body** | Clean sans-serif (e.g., Inter or the same rounded font) |
| **Border radius** | Generous — 12-16px on cards, 8px on buttons |
| **Shadows** | Soft, warm-toned box shadows for depth |
| **Illustrations** | Small hand-drawn style SVG illustrations (crayons, stars, pencils) as decorative accents |
| **Animations** | Subtle — gentle fade-ins, soft hover scales, confetti on order confirmation |
| **Buttons** | Rounded pill shape, large touch targets (min 48px height), playful hover states |
| **Empty states** | Friendly illustrations with encouraging copy ("Let's make something awesome!") |

### 8.1 Landing Page (`/`)

**Purpose:** Explain the product, build trust, drive sign-ups.

**Layout:**

- **Hero section:** Large headline ("Turn Your Photos Into Coloring Books"), subheadline, hero image showing a photo → coloring page transformation, prominent CTA button ("Get Started — It's Easy!")
- **How It Works:** 3-step visual (Upload → AI Magic → Book Arrives) with playful icons
- **Sample gallery:** 3-4 before/after examples (photo vs. coloring page)
- **Pricing teaser:** "Starting at $X.XX" with link to learn more
- **Social proof:** Testimonials or "Loved by X families" (placeholder for launch)
- **Footer:** Links, FAQ, legal pages

### 8.2 Sign Up / Sign In

**Purpose:** Account creation and login.

**Implementation:** Clerk's pre-built `<SignIn />` and `<SignUp />` components, styled to match the app's color scheme using Clerk's appearance prop.

- Centered card layout on the warm off-white background
- Google OAuth button prominently displayed
- Friendly welcome copy ("Welcome back!" / "Let's make your first book!")

### 8.3 Dashboard (`/dashboard`)

**Purpose:** Central hub for the user after sign-in.

**Layout:**

- **Welcome header:** "Hi, {firstName}!" with a small waving hand illustration
- **Account summary (compact):** "X free credits left" and credit counts by package (or total) with "Buy Credits" link
- **Create New Book CTA:** Large, colorful card — dedicated page for building a book (upload new images or pick from saved)
- **Convert an Image CTA:** Secondary card — "Convert one photo" for one-off conversion, save to library, print/download
- **My Saved Pages link:** Quick link to library of saved conversions (use in book, download, delete)
- **In-Progress Books:** Horizontal scroll of book cards (thumbnail, title, page count, "Continue" button)
- **Past Orders:** List/cards showing order date, thumbnail, page count, status badge, tracking link (if shipped)
- **Empty state (new user):** Friendly illustration, "You have 5 free conversions to try! Convert a photo or start a book." with CTAs

### 8.4 Convert an Image — One-Off (`/dashboard/convert`)

**Purpose:** Convert a single image, save to library, print or download.

**Layout:**

- **Stylization (before conversion):** Dropdown or radio list: **No stylization** (default), **Fairy tale**, **Cartoon**, **Storybook**, **Sketch**. User must choose one before converting; selection is sent with the conversion request.
- **Upload area:** Single-image drop zone or file picker
- **Cost notice:** "This conversion uses 1 free credit" or "This conversion uses 1 credit" (show free and purchased credit counts)
- **Convert button:** Starts conversion; show processing state
- **Result:** Preview of outline image; actions: "Download," "Print," "Add to Book" (navigates to book editor; image is saved but **no credit will be applied** if added to a book)
- **Saved:** Result is automatically saved to "My Saved Pages" with context one_off

### 8.5 Buy Credits (`/dashboard/buy-credits`)

**Purpose:** Purchase conversion credits in one of three packages.

**Layout:**

- **Current credits:** Display free credits left and purchased credits by package (single / 50-pack / 100-pack) or total
- **Three packages:** (1) 1 credit — $0.25. (2) 50 credits — $10 ($0.20/credit). (3) 100 credits — $15 ($0.15/credit)
- **Pay with Stripe:** User selects a package; CTA creates Stripe Checkout Session for that product; on success webhook, credits are added to the corresponding pool(s)

### 8.6 My Saved Pages (`/dashboard/conversions` or `/dashboard/saved-pages`)

**Purpose:** View, use, and manage saved conversions.

**Layout:**

- **Grid of saved conversions:** Thumbnail of outline image, date added
- **Actions per item:** "Add to Book" (opens book editor or adds to current book), "Download," "Delete"
- **Empty state:** "No saved pages yet. Convert an image or add pages to a book to see them here."

### 8.7 Book Editor (`/dashboard/books/[bookId]`)

**Purpose:** Build a book by uploading new images or adding from saved conversions.

**Layout — multi-section single page:**

**Section 1: Add Pages (two options)**
- **Stylization (for new uploads):** Dropdown or radio list: **No stylization** (default), **Fairy tale**, **Cartoon**, **Storybook**, **Sketch**. Applies to all images uploaded in this session (or until the user changes it). User chooses before uploading; selection is sent with each conversion request.
- **Upload new:** Large dashed-border drop zone ("Drag photos here or click to browse"); multiple files; each triggers conversion (1 free or purchased credit; value applied at checkout) using the selected stylization; result saved to library with context `book` and added to book
- **From saved:** "Add from My Saved Pages" button or inline grid of saved conversion thumbnails; click to add to book (no credit used; no credit applied — including if the saved image was originally a one-off conversion)
- Upload progress and conversion status per new image

**Section 2: Pages Grid**
- Responsive grid of all pages in the book (from upload or saved)
- Each card: thumbnail, page number, "Remove," drag handle; status (ready / processing / failed)
- Drag-and-drop reordering
- Placeholder "+" to add more (upload or saved)

**Section 3: Cover**
- Separate upload area for cover image; preview; helper text

**Section 4: Sticky Bottom Bar**
- Page count; running price estimate (book total minus credit value for conversions done in this book)
- "Preview My Book" (enabled when >= 2 pages and cover uploaded)

### 8.8 Book Preview (`/dashboard/books/[bookId]/preview`)

**Purpose:** Let the user see the final book before ordering.

**Layout:**

- Centered book mockup with page-flip navigation (left/right arrows)
- Shows cover first, then each coloring page in order
- Page counter ("Page 3 of 12")
- "Edit Book" button to go back and make changes
- "Order My Book" prominent CTA at the bottom
- Price displayed next to order button

### 8.9 Checkout (`/dashboard/books/[bookId]/checkout`)

**Purpose:** Collect shipping info, display final price, redirect to payment.

**Layout:**

- **Shipping Address Form:**
  - Full name, Street address, Apt/Suite (optional), City, State, Postal code, Country (dropdown), Phone number
  - Friendly validation messages
- **Shipping Method Selector:**
  - Radio buttons: Standard (free/low cost, 7-14 days), Priority (5-7 days), Express (2-3 days)
  - Each option shows estimated delivery date and price
- **Order Summary Card:**
  - Book thumbnail (cover image)
  - Page count
  - Line items: **Subtotal** (pages + platform fee), **Shipping** (by tier), **Credits applied** (value of purchased credits used for this book's conversions, e.g. -$X.XX); **Total**. Tax via Stripe when enabled.
  - **Total (bold)**
  - Small note: "Coloring books are printed on demand. All sales are final."
- **"Pay with Stripe" Button:**
  - Redirects to Stripe Checkout
  - Disabled until address form is valid

### 8.10 Order Confirmation (`/order/confirmation?session_id=...`)

**Purpose:** Confirm successful order, set expectations.

**Layout:**

- Confetti animation on page load
- Large checkmark icon with "Your book is on its way!"
- Order number
- Estimated delivery window
- Book thumbnail
- Summary of what was ordered
- "We'll email you tracking info when your book ships."
- "Back to Dashboard" button
- "Make Another Book" secondary CTA

### 8.11 Order Detail (`/dashboard/orders/[orderId]`)

**Purpose:** View details and track a specific order.

**Layout:**

- Status timeline (visual stepper): Paid → Processing → Printing → Shipped → Delivered
- Current status highlighted
- Tracking number + link (when available)
- Order details: date, pages, price paid, shipping address
- Thumbnails of all pages in the book

---

## 9. Pricing & Business Model

### 9.1 Cost Structure

| Cost Component | Source | Estimated Amount |
|---|---|---|
| Lulu printing (base) | Lulu API | ~$2.50 for a 20-page book |
| Lulu printing (per page) | Lulu API | ~$0.02-0.04 per page |
| Lulu shipping (Standard) | Lulu API | ~$3.99 (domestic US) |
| AI conversion per page | Replicate | ~$0.003 per image |
| Stripe fees | Stripe | 2.9% + $0.30 per transaction |
| Supabase / hosting | Supabase + Vercel | Negligible at low volume |

### 9.2 Customer Pricing Model: Cost-Plus

Pricing is transparent and simple. Customer-facing amounts are fixed (no real-time Lulu price lookup at checkout):

| Line Item | Formula | Example (20-page book) |
|---|---|---|
| Pages | $0.99 per page | $19.80 |
| Platform fee | Flat $4.99 | $4.99 |
| Subtotal | Pages + platform fee | $24.79 |
| Shipping | Fixed by tier (see below) | $3.99 (Standard) |
| Credits applied | Value of credits used for this book's conversions (25¢, 20¢, or 15¢ per credit) — **subtracted** from total | e.g. -$5.00 |
| **Total** | Subtotal + Shipping − Credits applied (min $0) | e.g. $23.78 |

**Shipping tiers (fixed):**

| Tier | Label | Price | Typical delivery |
|---|---|---|---|
| MAIL | Standard | $3.99 | 7–14 business days |
| PRIORITY_MAIL | Priority | $5.99 | 5–7 business days |
| EXPEDITED | Expedited | $9.99 | 2–3 business days |

Tax is collected by Stripe Checkout when enabled; the above totals are pre-tax.

**Margin breakdown on a 20-page book (no credits applied):**
- Revenue: $24.79 (pages + platform) + $3.99 (shipping) = $28.78
- Lulu printing cost: ~$3.10
- AI cost: ~$0.06
- Stripe fees: ~$1.14
- **Gross margin: ~$20.49 (~82%)**

### 9.3 Conversion Credits & Packages

| Package | Price | Per-credit cost | Value applied at book checkout (when used for a book conversion) |
|---|---|---|---|
| 1 credit | $0.25 | $0.25/credit | 25¢ |
| 50 credits | $10 | $0.20/credit | 20¢ |
| 100 credits | $15 | $0.15/credit | 15¢ |

The system tracks **both the total number of credits** (in three pools: `credits_single`, `credits_pack_50`, `credits_pack_100`) **and the value applied at checkout** per credit from that pool (25¢, 20¢, or 15¢). **Free credits** are used first but **do not reduce the book price** when used for book conversions; only **purchased** credits apply value at checkout.

**Deduction order:**

- **Book conversions:** Use free credits first (no $ value applied), then **most expensive purchased pool first** (single → pack_50 → pack_100) so **25¢, 20¢, or 15¢** is recorded per conversion and **maximizes the user's discount** at checkout.
- **One-off conversions:** Use free first, then **cheapest purchased pool first** (pack_100 → pack_50 → single) so the user **preserves high-value credits** for future book checkouts. No value is recorded; if the image is later added to a book, no credit is applied toward that book's price.

| Scenario | Customer cost / application |
|---|---|
| New user | 5 free conversion credits (one-time grant). Free credits do not apply toward book price when used in a book. |
| After free tier | User buys credits in one of the three packages above. |
| Credits used **during coloring book creation** (purchased only) | 1 credit per conversion; we deduct **most expensive first** (single → pack_50 → pack_100) and record **25¢, 20¢, or 15¢** per credit toward this book's total at checkout. |
| Credits used for **one-off conversion** | 1 credit per conversion; we deduct **cheapest first** (pack_100 → pack_50 → single). Image is saved; **no value applied** if that image is later added to a book. |
| Adding a saved conversion to a book | No credit used; no credit applied (whether the saved image was originally one-off or from a previous book). |

Book purchases are always via Stripe Checkout; credits only reduce the book price (they are not a separate payment method).

### 9.4 Book Price Calculation (Implemented)

The book price shown to users is calculated as follows:

1. **Subtotal** = (page count × $0.99) + $4.99 platform fee.
2. **Shipping** = fixed amount by selected tier (Standard $3.99, Priority $5.99, Expedited $9.99).
3. **Credits applied** = sum of the per-credit values (25¢, 20¢, or 15¢) for each conversion that was done **in this book** using a **purchased** credit (recorded on each page as `credit_value_cents`; free credits used in the book do not contribute).
4. **Total** = Subtotal + Shipping − Credits applied (minimum $0).

The checkout UI displays: Subtotal, Shipping, Credits applied (as a negative line when > 0), and Total. Tax is handled by Stripe Checkout when enabled.

*Optional future enhancement:* Call the Lulu Print API cost calculator to drive shipping or subtotal from real Lulu costs for margin protection; current implementation uses fixed customer-facing amounts.

---

## 10. Security & Privacy

### 10.1 Authentication & Authorization

| Measure | Implementation |
|---|---|
| Auth provider | Clerk (SOC 2 compliant, handles password hashing, brute-force protection) |
| Session tokens | JWT with short expiry, automatic refresh |
| Route protection | Clerk middleware on all authenticated routes |
| API protection | Clerk `auth()` helper validates user on every API route |
| Data isolation | All database queries scoped to authenticated user's `userId` |
| RLS | Supabase Row Level Security policies ensure users can only access their own data |

### 10.2 Data Protection

| Measure | Implementation |
|---|---|
| Transport | HTTPS everywhere (Vercel enforces TLS) |
| Image storage | Supabase Storage with private buckets; access only via signed URLs |
| PII storage | Shipping addresses stored encrypted at rest (Supabase handles this) |
| Image retention | Original uploads deleted 90 days after order fulfillment or book deletion |
| Account deletion | Full data purge — images, books, orders metadata (retain only financial records as required by law) |

### 10.3 API Security

| Measure | Implementation |
|---|---|
| Stripe webhooks | Signature verification using `stripe.webhooks.constructEvent` |
| Lulu webhooks | HMAC-SHA256 verification using API secret |
| Rate limiting | Implemented on upload and conversion endpoints (e.g., 10 uploads/min, 20 conversions/hour per user) |
| Input validation | Zod schemas on all API route inputs |
| File validation | MIME type and magic byte verification on all uploads; reject non-image files |
| CSRF | Built-in Next.js CSRF protection |
| Credit integrity | When deducting for a conversion: single atomic DB update (free_conversions_remaining or one of credits_single/pack_50/pack_100); reject if no credits; idempotency for Stripe credit-purchase webhook to avoid double-crediting |

### 10.4 Third-Party API Keys

All API keys and secrets stored as environment variables on Vercel. Never exposed to the client. Server-side API routes handle all sensitive operations.

---

## 11. No-Refund Policy & Legal

### 11.1 Refund Policy

Because coloring books are custom, print-on-demand products, **all sales are final**. No refunds or cancellations once payment is processed.

**Exceptions:**
- Printing defect (misprinted pages, binding issues) — replacement book shipped at no cost, handled via Lulu support
- Book never arrives (lost in transit) — replacement shipped or refund issued, handled case-by-case

### 11.2 Policy Communication

The no-refund policy must be communicated clearly at multiple touchpoints:

| Touchpoint | Implementation |
|---|---|
| Checkout page | Visible disclaimer above the payment button: "Coloring books are printed on demand and customized just for you. All sales are final." |
| Order confirmation email | Includes refund policy language |
| FAQ page | Dedicated question: "Can I get a refund?" with clear answer |
| Terms of Service | Full legal refund policy language |
| Stripe Checkout | Custom text in Checkout Session metadata |

### 11.3 Required Legal Pages

| Page | Content |
|---|---|
| Terms of Service | User agreements, refund policy, acceptable use, IP disclaimer (user warrants they own rights to uploaded images) |
| Privacy Policy | Data collection, storage, sharing (with Lulu for shipping, Stripe for payment, Replicate for AI processing), retention, deletion |
| Cookie Policy | Clerk session cookies, Vercel analytics (if applicable) |

### 11.4 Content & IP Considerations

- Users must warrant they have the right to use uploaded images
- App should include a checkbox at upload or checkout: "I confirm I have the right to use these images"
- No automated content moderation in MVP, but Terms of Service prohibit inappropriate content
- Consider adding basic NSFW detection in a future phase

---

## 12. MVP Milestones & Phases

### Phase 1: Foundation (Weeks 1-2)

| Task | Details |
|---|---|
| Project setup | Next.js project, Tailwind, shadcn/ui, TypeScript config |
| Authentication | Clerk integration, sign-up/sign-in pages, middleware |
| Database | Supabase project, schema migration: user_profiles (free_conversions_remaining, credits_single, credits_pack_50, credits_pack_100), saved_conversions, credit_transactions (optional), RLS policies |
| Storage | Supabase Storage buckets, upload utilities |
| User profile init | On first sign-in, create user_profile with free_conversions_remaining = 5, credits_single/pack_50/pack_100 = 0 |
| Landing page | Hero, how-it-works, footer — styled per design system |
| Dashboard shell | Layout, navigation, credits and free credits display, empty states |

**Deliverable:** Users can sign up, sign in, see dashboard with balance and free conversion count.

### Phase 2: Conversions, Balance & Saved Library (Weeks 3-4)

| Task | Details |
|---|---|
| Image upload | Multi-file upload to Supabase Storage with validation |
| AI conversion | Replicate API integration, conversion pipeline, retry logic |
| Free tier & credits | Before conversion: check free then purchased credits by type; deduct free first, then for book from most expensive pool first (maximize checkout value), for one-off from cheapest pool first (preserve expensive credits); record value for book; atomic updates |
| Saved conversions | Every completed conversion inserts into saved_conversions; user_id, original/outline paths |
| One-off convert page | Single-image upload → convert → save to library → download/print / "Add to Book" |
| Buy credits | Stripe Checkout for one of three products (1 / 50 / 100 credits); webhook adds to user_profiles.credits_single or credits_pack_50 or credits_pack_100 |
| My Saved Pages | List/grid of saved_conversions; download, delete, "Add to Book" |
| Balance & free count UI | Display on dashboard and convert page |

**Deliverable:** Users can use free conversions, add funds, convert one-off, and manage saved pages.

### Phase 3: Book Creation (Week 5-6)

| Task | Details |
|---|---|
| Book editor (dedicated page) | Add pages by upload (triggers conversion, uses free/balance, saves to library) or by selecting from saved conversions |
| Page grid | Thumbnail grid, drag-and-drop reorder, remove, replace (upload or saved) |
| pages.saved_conversion_id | When adding from library, link page to saved_conversion; no new conversion |
| Cover upload | Separate cover upload flow |
| Auto-save | Book state persisted on every change |
| Price calculation | Live book price (Lulu + markup); conversions for this book included — no separate conversion charge |

**Deliverable:** Users can build a book from new uploads or saved conversions; conversions in book are free at checkout.

### Phase 4: Preview & Checkout (Weeks 7-8)

| Task | Details |
|---|---|
| Book preview | Page-by-page preview component |
| Shipping form | Address form with validation |
| Stripe integration | Checkout Session creation, redirect flow, webhook handler |
| Order creation | Database order record on successful payment |

**Deliverable:** Users can preview their book and pay for it.

### Phase 5: Fulfillment & Polish (Weeks 9-11)

| Task | Details |
|---|---|
| PDF generation | Interior PDF assembly (all outline pages at 300 DPI), cover PDF with correct Lulu dimensions |
| Lulu integration | Print-Job creation, status polling/webhooks, tracking |
| Email notifications | Order confirmation, shipping notification via Resend |
| Order tracking | Status display on dashboard and order detail page |
| Error handling | Graceful handling of AI failures, PDF errors, Lulu rejections |
| Legal pages | Terms of Service, Privacy Policy, FAQ |

**Deliverable:** End-to-end flow — upload to physical book delivery.

### Phase 6: Launch Prep (Week 12-13)

| Task | Details |
|---|---|
| Testing | End-to-end testing with Lulu sandbox, Stripe test mode |
| Performance | Image optimization, loading states, error boundaries |
| Analytics | Vercel Analytics, basic conversion funnel tracking |
| Monitoring | Sentry error tracking, uptime monitoring |
| SEO | Meta tags, OpenGraph images, structured data |
| Launch | Switch to production Lulu & Stripe keys, deploy, announce |

**Deliverable:** Production-ready app.

---

## 13. Open Questions & Future Enhancements

### Open Questions

| Question | Impact | Decision Needed By |
|---|---|---|
| Should we offer landscape format (9" x 7") in addition to square? | Adds complexity to PDF generation and cover dimensions | Phase 2 |
| Do we need NSFW/content moderation on uploaded images? | Legal/brand risk vs. cost of moderation API | Phase 4 |
| Should Lulu print cost be fetched in real-time or cached? | Real-time is accurate but adds latency; caching may show stale prices | Phase 2 |
| International shipping — which countries to support at launch? | Lulu ships globally but costs vary significantly | Phase 3 |
| Should we pre-generate a back cover or let Lulu use a blank? | Design decision; blank is simpler for MVP | Phase 2 |
| Offer custom credit amounts or only the three fixed packages? | UX; current plan: 1, 50, 100 credits only | Phase 2 |
| Refund policy for unused credits? | Terms should state whether balance is refundable | Phase 4 |

### Future Enhancements (Post-MVP)

| Enhancement | Description | Priority |
|---|---|---|
| **Page captions** | Let users add a title or caption to each coloring page | High |
| **Multiple book sizes** | Offer landscape (9x7), letter (8.5x11) in addition to square | High |
| **Difficulty levels** | AI generates "easy" (fewer details) vs. "detailed" outlines | Medium |
| **Text-to-coloring-page** | Type a description ("a dragon flying over a castle") and AI generates a coloring page from text | Medium |
| **Dedication page** | Add a personal dedication page ("For Emma, with love from Grandma") | Medium |
| **Gift flow** | Ship to a different address with a gift message | Medium |
| **Bulk/classroom orders** | Discount pricing for 5+ copies of the same book | Medium |
| **Subscription** | Monthly coloring book subscription (user uploads X photos/month) | Low |
| **Mobile app** | Native iOS/Android app for easier photo selection from camera roll | Low |
| **Social sharing** | Share a preview of your book on social media | Low |
| **Template pages** | Pre-made coloring pages (borders, patterns) users can mix in with their photos | Low |
| **Collaborative books** | Multiple users contribute pages to a shared book | Low |

---

## Appendix A: Environment Variables

```
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Replicate
REPLICATE_API_TOKEN=r8_...

# OpenAI (fallback)
OPENAI_API_KEY=sk-...

# Stripe
STRIPE_SECRET_KEY=sk_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Lulu
LULU_CLIENT_KEY=your-client-key
LULU_CLIENT_SECRET=your-client-secret
LULU_API_BASE_URL=https://api.lulu.com

# Resend
RESEND_API_KEY=re_...

# App
NEXT_PUBLIC_APP_URL=https://colordrop.ai
```

## Appendix B: Lulu Pod Package ID Breakdown

```
0850X0850  BW  STD  PB  060UW444  M  X  X
─────────  ──  ───  ──  ────────  ─  ─  ─
    │       │   │    │      │     │  │  │
    │       │   │    │      │     │  │  └─ No foil
    │       │   │    │      │     │  └─── No linen
    │       │   │    │      │     └────── Matte cover
    │       │   │    │      └──────────── 60# Uncoated White, 444 PPI
    │       │   │    └─────────────────── Perfect binding (paperback)
    │       │   └──────────────────────── Standard print quality
    │       └──────────────────────────── Black & White interior
    └──────────────────────────────────── 8.5" x 8.5" trim size
```

## Appendix C: Key File/Folder Structure (Planned)

```
coloringbook/
├── src/
│   ├── app/
│   │   ├── (marketing)/
│   │   │   ├── page.tsx                  # Landing page
│   │   │   ├── pricing/page.tsx
│   │   │   ├── faq/page.tsx
│   │   │   ├── terms/page.tsx
│   │   │   └── privacy/page.tsx
│   │   ├── (auth)/
│   │   │   ├── sign-in/[[...sign-in]]/page.tsx
│   │   │   └── sign-up/[[...sign-up]]/page.tsx
│   │   ├── dashboard/
│   │   │   ├── page.tsx                  # Dashboard home (credits, free credits, CTAs)
│   │   │   ├── convert/page.tsx          # One-off convert an image
│   │   │   ├── saved-pages/page.tsx      # My Saved Pages (library)
│   │   │   ├── buy-credits/page.tsx       # Buy credit packages
│   │   │   ├── books/
│   │   │   │   └── [bookId]/
│   │   │   │       ├── page.tsx          # Book editor (upload or add from saved)
│   │   │   │       ├── preview/page.tsx  # Book preview
│   │   │   │       └── checkout/page.tsx # Checkout
│   │   │   └── orders/
│   │   │       └── [orderId]/page.tsx    # Order detail
│   │   ├── order/
│   │   │   └── confirmation/
│   │   │       └── [orderId]/page.tsx    # Order confirmation
│   │   ├── api/
│   │   │   ├── books/route.ts
│   │   │   ├── pages/
│   │   │   │   ├── convert/route.ts      # AI conversion (free/credit deduction, save to library, context)
│   │   │   │   └── reorder/route.ts
│   │   │   ├── conversions/route.ts      # List/create saved_conversions
│   │   │   ├── credits/route.ts          # Get credit counts; optional: buy-credits Checkout creation
│   │   │   ├── checkout/route.ts         # Create Stripe session (book or credit purchase)
│   │   │   ├── webhooks/
│   │   │   │   ├── stripe/route.ts       # Stripe webhook (book fulfillment + credit purchase)
│   │   │   │   └── lulu/route.ts         # Lulu webhook
│   │   │   └── lulu/
│   │   │       └── cost/route.ts         # Price calculation
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/                           # shadcn/ui components
│   │   ├── book-editor/
│   │   ├── book-preview/
│   │   ├── checkout/
│   │   ├── dashboard/
│   │   └── marketing/
│   ├── lib/
│   │   ├── supabase.ts                   # Supabase client
│   │   ├── stripe.ts                     # Stripe helpers
│   │   ├── lulu.ts                       # Lulu API client
│   │   ├── replicate.ts                  # Replicate client
│   │   ├── pdf.ts                        # PDF generation
│   │   ├── pricing.ts                    # Price calculation logic
│   │   └── validators.ts                 # Zod schemas
│   └── types/
│       └── index.ts                      # Shared TypeScript types
├── public/
│   └── illustrations/                    # Decorative SVGs
├── supabase/
│   └── migrations/                       # SQL migrations
├── .env.local
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```
