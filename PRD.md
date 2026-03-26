# ColorDrop — Product Requirements Document

**Version:** 1.1
**Date:** March 3, 2026
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
- Uses **Conversion Credits**: one credit = one image conversion. New users get **3 free credits**; after that, users **buy credits** in three packages (different per-credit cost; see Pricing).
- **Conversion credits cannot be applied toward book purchases.** Credits are for image conversions only. Book checkout is a separate payment (printing/binding + shipping).
- Supports **one-off conversions**: use a credit to convert an image, then **print or download** the coloring page. The image is saved and can later be **printed, downloaded, or added to a coloring book**.
- Saves **every conversion to the user's library**; all converted images can be **printed or downloaded at any time** at no extra charge. When creating a book, users add pages by **uploading new images** (uses 1 credit per image) or **selecting from saved conversions** (no credit used).
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

| Segment        | Use Case                                                                    |
| -------------- | --------------------------------------------------------------------------- |
| Grandparents   | Gift a coloring book of family photos to grandchildren                      |
| Teachers       | Create classroom-themed coloring books from field trip photos               |
| Pet owners     | Turn pet photos into fun coloring pages                                     |
| Event planners | Party favors with personalized coloring books (birthday party photos, etc.) |

### Key Persona: "Sarah"

Sarah is a 34-year-old mom of two (ages 4 and 7). She took hundreds of photos on a family trip to the zoo. She wants to turn those photos into an activity her kids will love. She has 15 minutes during naptime to get it done. She does not want to learn complicated software.

---

## 3. User Stories & Flows

### User Stories

| ID    | Story                                                                                                                                                                                                      | Priority |
| ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| US-1  | As a visitor, I can see what the app does and view sample coloring books so I understand the value before signing up.                                                                                      | P0       |
| US-2  | As a visitor, I can create an account or sign in with Google/email so I can start making a book.                                                                                                           | P0       |
| US-3  | As a user, I can upload one or more photos from my device so they can be converted into coloring pages.                                                                                                    | P0       |
| US-4  | As a user, I can see a preview of each AI-generated coloring page so I can decide if it looks good.                                                                                                        | P0       |
| US-5  | As a user, I can remove a page I don't like and upload a replacement.                                                                                                                                      | P0       |
| US-6  | As a user, I can reorder pages in my book by dragging them.                                                                                                                                                | P0       |
| US-7  | As a user, I can upload a color image for the front cover of my book.                                                                                                                                      | P0       |
| US-8  | As a user, I can see a live price estimate that updates as I add or remove pages.                                                                                                                          | P0       |
| US-9  | As a user, I can review a digital preview of my complete book before ordering.                                                                                                                             | P0       |
| US-10 | As a user, I can enter my shipping address and pay with a credit card to order my book.                                                                                                                    | P0       |
| US-11 | As a user, I can view my order history and track shipping status.                                                                                                                                          | P1       |
| US-12 | As a user, I can save a collring book and come back to finish it later.                                                                                                                                    | P1       |
| US-13 | As a user, I can re-order a previously completed book.                                                                                                                                                     | P2       |
| US-14 | As a new user, I get 3 free image conversions to test the platform.                                                                                                                                        | P0       |
| US-15 | After my free credits run out, I can buy conversion credits: 1–49 at $0.99 each (quantity selector), or 50-pack or 100-pack at lower per-credit prices.                                                    | P0       |
| US-16 | As a user, I can convert images one-off (without a book), view the result, and print or download the coloring page; the image is saved and can later be added to a book.                                   | P0       |
| US-17 | As a user, my conversions are saved to my library so I can reuse them when building a book and print or download them at any time.                                                                         | P0       |
| US-18 | When creating a book, I can add pages by uploading new images (uses 1 credit per image) or by selecting from my saved conversions (no credit used). Conversion credits do not apply toward the book price. | P0       |
| US-19 | When I checkout a coloring book, I pay for the book (printing & binding) and shipping as separate line items in one payment.                                                                               | P0       |
| US-20 | As a user, I can see my conversion credits (by package type) and how many free credits I have left.                                                                                                        | P0       |
| US-21 | As a user, I must add a name to a book when creating it so that it can be saved and identified.                                                                                                            | P0       |
| US-22 | As a user, I can save converted images into collections (e.g. John's Wedding, Sam's birthday) for later use and sorting; each image belongs to at most one collection.                                     | P0       |

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
    │  ├── "Buy Credits" ──►  Stripe checkout for credits (1–49 quantity, 50-pack, or 100-pack)
    │  │
    │  └── "Create New Book" ──►  Book Editor (dedicated page)
    │                                  │
    │                                  ▼
    │                          Add pages: Upload new images OR select from saved
    │                          (new uploads: 1 credit per image, saved to library; saved: add instantly, no credit used)
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
    │                          (Book printing & binding + Shipping as separate line items; Stripe payment)
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

| Requirement        | Details                                                |
| ------------------ | ------------------------------------------------------ |
| Sign up            | Email/password and Google OAuth                        |
| Sign in            | Email/password and Google OAuth                        |
| Session management | Persistent sessions via Clerk; automatic token refresh |
| Account deletion   | Users can delete their account and all associated data |

### 4.2 Image Upload

| Requirement           | Details                                                                                                                                                                                   |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Supported formats     | JPEG, PNG, WebP                                                                                                                                                                           |
| Max file size         | 20 MB per image                                                                                                                                                                           |
| Min resolution        | 800 x 800 px (to ensure quality outlines); see recommended dimensions per book size below                                                                                                 |
| Page count (books)    | User selects a **page tier** when creating a book: **12, 24, 32, 48, 64, or 128 pages**. Each "page" = one image (one coloring page). Book must have exactly that many pages to checkout. |
| Double-sided printing | Books are printed **double-sided** (e.g. 24 pages = 24 images = 12 physical sheets). This must be clearly communicated in the UI (book creation, editor, checkout, pricing).              |
| Image size guidance   | Per book size, show recommended min dimensions (e.g. Pocket 1275×2063 px, Medium 2100×3000 px, Large 2550×3300 px at 300 PPI). Warn that wrong size or aspect can cause misprints.        |
| Bulk upload           | Select multiple files at once; drag-and-drop support                                                                                                                                      |
| Upload feedback       | Per-file progress bar, success/error states                                                                                                                                               |
| Storage               | Supabase Storage; original files retained until order is fulfilled, then deleted after 90 days                                                                                            |

### 4.3 Free Tier & Conversion Credits

| Requirement                    | Details                                                                                                                                                                                |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| One credit = one conversion    | Each image conversion consumes exactly 1 conversion credit (or 1 free credit)                                                                                                          |
| New user free credits          | Every new user receives **3 free conversion credits** at sign-up (stored in user profile)                                                                                              |
| After free tier                | Once the 3 free credits are used, user must **purchase credits** in one of three packages (see Pricing)                                                                                |
| Credit packages                | **Single:** 1–49 credits at $0.99/credit (quantity selector at purchase). **50-pack:** $24.99 ($0.50/credit). **100-pack:** $39.99 ($0.40/credit).                                     |
| No credit application to books | **Credits are one-time use for page conversions only.** They cannot be applied to the price of a printed book. Book checkout is a separate payment (book printing/binding + shipping). |
| Deduction order                | Use free credits first; when exhausted, deduct from purchased pools (e.g. cheapest first: pack_100 → pack_50 → single) to preserve flexibility.                                        |
| Display                        | Dashboard and conversion flows show "X free credits left" and credit counts by package (or total) with "Buy Credits" link                                                              |
| Insufficient credits           | If no free credits and no purchased credits, block conversion and prompt user to buy credits                                                                                           |

### 4.4 Saved Conversions (Library)

| Requirement        | Details                                                                                                                                                                 |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Persistence        | Every completed conversion (one-off or during book creation) is saved to the user's library                                                                             |
| Printable anytime  | All converted images are saved to the user's account and can be **downloaded or printed at any time** from My Saved Pages at no extra charge                            |
| Conversion context | Each saved conversion has **conversion_context**: `one_off` or `book` (for display/history; credits never apply to book price)                                          |
| Stored data        | User ID, original image path, outline image path, created_at, conversion_context, optional collection_id                                                                |
| Use in book        | When building a book, user can "Add from my saved pages"; no credit is used. Uploading new images to a book uses 1 credit per image.                                    |
| Collections        | Users can create **named collections** (e.g. "John's Wedding", "Sam's birthday") and assign each saved image to **at most one collection** for organization and sorting |
| Management         | User can view "My Saved Pages," delete items, download outline image, assign to a collection, filter by collection                                                      |

### 4.5 One-Off Conversions & Direct Print

| Requirement      | Details                                                                                                                                                                         |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Entry point      | Dedicated page or dashboard CTA: "Convert an Image" (single-image flow)                                                                                                         |
| Flow             | Upload one image → run conversion (1 free credit or 1 purchased credit) → show result. Saved with **conversion_context: one_off**.                                              |
| Output           | User can download the outline image (PNG) or use browser print to print the coloring page directly                                                                              |
| Save             | Conversion is always saved to the user's library; can later be printed, downloaded, or added to a coloring book — but **no credit can be applied** toward a book when adding it |
| No book required | User can use the platform only for one-off conversions and never create a book                                                                                                  |

### 4.6 AI Image Conversion (Technical)

| Requirement       | Details                                                                                                                                                                                            |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Model provider    | Gemini API (Nano Banana) primary; Replicate API fallback                                                                                                                                           |
| Primary model     | Gemini 2.5 Flash Image (`gemini-2.5-flash-image`) for photo-to-outline via image editing (image + prompt → image)                                                                                  |
| Fallback model    | Replicate (ControlNet lineart pipeline `pnyompen/sd-lineart-controlnet`) when Gemini is unavailable or errors. OpenAI GPT-4o image edit is reserved for future use as an optional second fallback. |
| Prompt            | Single default style: clean black-and-white coloring book outline (no user-selectable stylization).                                                                                                |
| Output format     | PNG, 300 DPI, black outlines on white background                                                                                                                                                   |
| Output dimensions | Matched to book trim size: Pocket 1275×2063 px, Medium 2100×3000 px, Large 2550×3300 px (300 DPI). User sees recommended dimensions for their chosen book size.                                    |
| Processing time   | Target < 30 seconds per image; UI shows animated progress                                                                                                                                          |
| Retry logic       | Automatic retry up to 3 times on failure; surface error to user if all retries fail                                                                                                                |
| Quality check     | Basic automated validation — ensure output is predominantly B&W, reject if model returns unexpected color output                                                                                   |
| Credits           | Before starting conversion: check free then purchased credits. Deduct 1 after successful conversion (free first, then purchased). Credits are never applied toward book price.                     |

### 4.7 Book Editor (Create a Book — Dedicated Page)

| Requirement              | Details                                                                                                                                                                                                                                                                                                                                               |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Separate page            | "Create a Book" is a dedicated flow (e.g., `/dashboard/books/new` or `/dashboard/books/[bookId]`); distinct from one-off "Convert an Image"                                                                                                                                                                                                           |
| Book size (trim)         | User selects **one of three sizes** at book creation: **Pocket** (4.25" × 6.875"), **Medium** (7" × 10"), **Large** (8.5" × 11"). Each size has a Lulu trim code and `pod_package_id`; paper is 60# white, matte cover.                                                                                                                               |
| Page tier                | User selects **number of pages** at book creation: **12, 24, 32, 48, 64, or 128**. Each page = one image (one coloring page). The book must contain exactly that many pages to proceed to preview/checkout. UI must make clear: "X pages = X images" and "Books are printed double-sided."                                                            |
| Book name required       | User must provide a **name for the book** when creating it (and before proceeding to Preview) so the book can be saved and identified.                                                                                                                                                                                                                |
| Adding pages             | Two ways: **(1) Upload new images** — triggers conversion (1 credit per image); result saved to library with context `book`. **(2) Choose from saved** — pick from user's saved conversions, add to book with one click; no credit used. User cannot add more pages than the selected tier. Conversion credits are not applied toward the book price. |
| Page grid                | Thumbnail grid of all pages in the book (converted or from saved)                                                                                                                                                                                                                                                                                     |
| Reorder                  | Drag-and-drop reordering                                                                                                                                                                                                                                                                                                                              |
| Remove                   | Click to remove a page (with confirmation); does not delete from saved library                                                                                                                                                                                                                                                                        |
| Replace                  | Remove + upload new image or pick a different saved conversion for that slot                                                                                                                                                                                                                                                                          |
| Crop & rotate (optional) | Per-page editing: user can set **crop region** (normalized rect) and **rotation** (0°, 90°, 180°, 270°) for each page. Stored on `pages`; applied when generating the interior PDF.                                                                                                                                                                   |
| Cover upload             | Separate upload area for a full-color cover image                                                                                                                                                                                                                                                                                                     |
| Cover specs              | Full-color, must meet Lulu cover dimension requirements (calculated dynamically based on page count and trim size via Lulu API)                                                                                                                                                                                                                       |
| Image size warning       | Prominent notice: recommended min image dimensions for the chosen book size; warn that wrong size or aspect can cause misprints.                                                                                                                                                                                                                      |
| Auto-save                | Book state saved to database automatically as user makes changes                                                                                                                                                                                                                                                                                      |
| Price display            | Running total visible: book price (by trim size + page tier) + shipping; no credit discount                                                                                                                                                                                                                                                           |

### 4.8 Book Preview

| Requirement   | Details                                                |
| ------------- | ------------------------------------------------------ |
| Preview type  | Page-by-page horizontal scroll or flip-through view    |
| Content shown | Cover (front), all interior pages in order, back cover |
| Zoom          | Tap/click a page to see full-resolution detail         |
| Edit access   | "Edit" button returns user to the Book Editor          |

### 4.9 Checkout & Payment

| Requirement      | Details                                                                                                                                                                                                                                                                                                                                                                                                            |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Payment provider | Stripe Checkout (hosted page)                                                                                                                                                                                                                                                                                                                                                                                      |
| Payment methods  | Credit/debit cards (Visa, Mastercard, Amex); Apple Pay; Google Pay                                                                                                                                                                                                                                                                                                                                                 |
| Shipping address | Collected in-app before redirecting to Stripe                                                                                                                                                                                                                                                                                                                                                                      |
| Shipping options | Standard (MAIL), Priority (PRIORITY_MAIL), Expedited (EXPEDITED) — fixed prices per tier                                                                                                                                                                                                                                                                                                                           |
| Price breakdown  | One payment with **separate line items**: **Book (printing & binding)** = fixed price by **book size** (Pocket / Medium / Large) and **page tier** (12, 24, 32, 48, 64, 128); **Shipping** (by tier). **Total** = Book + Shipping. Checkout must show size, page count (e.g. "24 pages (24 images)"), and state that books are printed double-sided. Conversion credits do not apply. Tax via Stripe when enabled. |
| Stripe mode      | One-time payment via Checkout Session                                                                                                                                                                                                                                                                                                                                                                              |
| Success flow     | Stripe redirects to `/order/confirmation?session_id={CHECKOUT_SESSION_ID}`; confirmation page looks up order by session and shows success                                                                                                                                                                                                                                                                          |
| Cancel flow      | Stripe redirects back to Book Preview with book state intact                                                                                                                                                                                                                                                                                                                                                       |
| Webhook          | Stripe `checkout.session.completed` webhook triggers order processing                                                                                                                                                                                                                                                                                                                                              |

### 4.10 Order Fulfillment

| Requirement     | Details                                                                                                                                                                                                                                                     |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| PDF generation  | Server-side assembly of all coloring pages into a single interior PDF; separate cover PDF                                                                                                                                                                   |
| PDF specs       | Interior: B&W, 300 DPI, **matching trim size** (Pocket / Medium / Large). One PDF page per book page; apply per-page crop and rotation if set. Cover: full-color, dimensions from Lulu cover-dimensions API for the book's `pod_package_id` and page count. |
| File upload     | Upload generated PDFs to a publicly accessible URL (Supabase Storage signed URL, 1-hour expiry)                                                                                                                                                             |
| Lulu Print-Job  | Create print job via Lulu API with the **book's** `pod_package_id` (from trim size + product config), interior URL, cover URL, shipping address, shipping level                                                                                             |
| Status tracking | Poll Lulu API or receive webhooks for status updates (CREATED → UNPAID → PRODUCTION_READY → IN_PRODUCTION → SHIPPED)                                                                                                                                        |
| Lulu payment    | Lulu charges our account for printing + shipping; we've already collected payment from the customer via Stripe                                                                                                                                              |
| Tracking info   | Display carrier name and tracking URL to user once status is SHIPPED                                                                                                                                                                                        |

### 4.11 Dashboard

| Requirement      | Details                                                                                                                                    |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Credits & free   | Display "X free credits left" and purchased credit counts (by package or total); "Buy Credits" CTA                                         |
| Buy Credits      | CTA or link to "Buy Credits" — quantity selector for 1–49 credits at $0.99 each, or 50-pack ($24.99) or 100-pack ($39.99), Stripe Checkout |
| Saved books      | List of books the user is still editing, with "Continue Editing" action                                                                    |
| Completed orders | List of orders with status badge (Processing, Printing, Shipped, Delivered)                                                                |
| Order detail     | Expand to see page thumbnails, tracking info, order date, total paid                                                                       |
| Create New Book  | Prominent "Create New Book" CTA (dedicated book-creation page)                                                                             |
| Convert an Image | CTA for one-off conversion (single image → save to library, print/download)                                                                |
| My Saved Pages   | Link to library of saved conversions (use in book, download, delete)                                                                       |

---

## 5. Technical Architecture

### 5.1 Stack Overview

| Layer           | Technology                                                               |
| --------------- | ------------------------------------------------------------------------ |
| Framework       | Next.js 14+ (App Router) with TypeScript                                 |
| Styling         | Tailwind CSS + shadcn/ui component library                               |
| Authentication  | Clerk (managed auth)                                                     |
| Database        | Supabase (PostgreSQL)                                                    |
| File Storage    | Supabase Storage                                                         |
| AI Processing   | Gemini API (Nano Banana) primary, Replicate API fallback                 |
| PDF Generation  | `pdf-lib` (lightweight, no headless browser needed)                      |
| Payments        | Stripe (Checkout Sessions + Webhooks)                                    |
| Print & Ship    | Lulu Print API                                                           |
| Hosting         | Vercel                                                                   |
| Email           | Resend (transactional emails: order confirmation, shipping notification) |
| Background Jobs | Vercel Functions (for AI processing, PDF generation, Lulu API calls)     |
| Monitoring      | Vercel Analytics + Sentry for error tracking                             |

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
   ┌────────────┐ ┌──────────────────┐  ┌─────────────┐ ┌──────────┐
   │  Supabase  │ │ Gemini / Replicate│  │   Stripe    │ │  Lulu    │
   │  Database  │ │ (AI conversion)   │  │   API       │ │  Print   │
   │  + Storage │ │                  │  │  (Payments) │ │  API     │
   └────────────┘ └──────────────────┘  └─────────────┘ └──────────┘
```

### 5.3 Key Technical Flows

#### Image Upload & Conversion Flow

1. User selects image(s) in the browser (one-off convert page or book editor).
2. Client validates file type, size, and minimum resolution.
3. Client uploads image to Supabase Storage via signed upload URL.
4. Client calls `POST /api/pages/convert` with the storage path and conversion_context (and book_id if in book flow).
5. **Server checks conversion eligibility:** if `free_conversions_remaining` > 0, decrement it; else if user has purchased credits, deduct 1 (e.g. from cheapest pool first); else return 402 and prompt user to buy credits. Credits are never applied toward book price.
6. API route sends image + single default prompt to conversion orchestrator: Gemini (Nano Banana) first; on failure or if unconfigured, Replicate is used for line-art conversion.
7. Converted outline image is downloaded (or received as inline data from Gemini) and stored in Supabase Storage.
8. **Save to library:** insert into `saved_conversions` (user_id, original_image_path, outline_image_path, conversion_context: `book` or `one_off`).
9. If in book editor: create/update `pages`; add to book. If one-off: client shows result with download/print / "Add to Book".
10. Client receives update and displays the preview.

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
  │            └── paid_credits (INT) — total paid conversion credits, regardless of purchase pack
  │            (credits for conversions only; not applied toward book purchases)
  │
  ├── 1:N ── Collection (optional: named collections for organizing saved images)
  │            └── name
  │
  ├── 1:N ── SavedConversion (library of all conversions)
  │            ├── original_image_path, outline_image_path
  │            ├── conversion_context (one_off | book)
  │            └── collection_id (optional; at most one collection per image)
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
  │                        └── amount_total (book + shipping; no credit discount)
```

### 6.2 Table Definitions

#### `user_profiles`

| Column                       | Type          | Description                                                         |
| ---------------------------- | ------------- | ------------------------------------------------------------------- |
| `id`                         | UUID (PK)     | Primary key                                                         |
| `user_id`                    | TEXT (unique) | Clerk user ID                                                       |
| `free_conversions_remaining` | INT           | Number of free credits left (default 3 for new users)               |
| `paid_credits`               | INT           | Total count of paid conversion credits, regardless of purchase pack |
| `created_at`                 | TIMESTAMPTZ   | Row creation time                                                   |
| `updated_at`                 | TIMESTAMPTZ   | Last modification time                                              |

#### `saved_conversions`

| Column                | Type                | Description                                                                |
| --------------------- | ------------------- | -------------------------------------------------------------------------- |
| `id`                  | UUID (PK)           | Primary key                                                                |
| `user_id`             | TEXT                | Clerk user ID                                                              |
| `original_image_path` | TEXT                | Supabase Storage path to uploaded photo                                    |
| `outline_image_path`  | TEXT                | Supabase Storage path to generated coloring page                           |
| `conversion_context`  | ENUM                | `one_off` or `book` (for display; credits never apply to book price)       |
| `collection_id`       | UUID (FK, nullable) | If set, this conversion belongs to that collection (at most one per image) |
| `created_at`          | TIMESTAMPTZ         | When the conversion was completed                                          |

Every conversion (one-off or during book creation) creates a row here so the user can reuse it when building a book. Optional `collection_id` links to a user-created collection for organization.

#### `collections`

| Column       | Type        | Description                                                 |
| ------------ | ----------- | ----------------------------------------------------------- |
| `id`         | UUID (PK)   | Primary key                                                 |
| `user_id`    | TEXT        | Clerk user ID                                               |
| `name`       | TEXT        | User-defined name (e.g. "John's Wedding", "Sam's birthday") |
| `created_at` | TIMESTAMPTZ | Row creation time                                           |

Each saved conversion can belong to at most one collection (`saved_conversions.collection_id`).

#### `credit_transactions` (optional, for transparency)

| Column         | Type            | Description                                                         |
| -------------- | --------------- | ------------------------------------------------------------------- |
| `id`           | UUID (PK)       | Primary key                                                         |
| `user_id`      | TEXT            | Clerk user ID                                                       |
| `type`         | ENUM            | `purchase`, `use_book`, `use_one_off`                               |
| `package_type` | TEXT (nullable) | For purchase: `single`, `pack_50`, `pack_100`                       |
| `quantity`     | INT             | Credits added (purchase) or 1 (use)                                 |
| `value_cents`  | INT (nullable)  | Legacy; unused (credits do not apply to book price)                 |
| `reference_id` | TEXT            | Stripe session ID (purchase) or saved_conversion_id / book_id (use) |
| `created_at`   | TIMESTAMPTZ     | Row creation time                                                   |

#### `books`

| Column                        | Type        | Description                                                                                              |
| ----------------------------- | ----------- | -------------------------------------------------------------------------------------------------------- |
| `id`                          | UUID (PK)   | Primary key                                                                                              |
| `user_id`                     | TEXT        | Clerk user ID                                                                                            |
| `title`                       | TEXT        | **Required** book name (user must provide when creating so book can be saved)                            |
| `status`                      | ENUM        | `draft`, `previewing`, `ordering`, `paid`, `producing`, `shipped`, `delivered`                           |
| `trim_size`                   | TEXT        | Lulu trim size code: `0425X0687` (Pocket), `0700X1000` (Medium), or `0850X1100` (Large)                  |
| `pod_package_id`              | TEXT        | Full Lulu product SKU for the chosen trim (B&W, perfect bind, 60# white, matte)                          |
| `page_tier`                   | INT         | Selected page count: one of 12, 24, 32, 48, 64, 128. Book must have exactly this many pages to checkout. |
| `page_count`                  | INT         | Cached count of pages (must equal `page_tier` at checkout)                                               |
| `credits_applied_value_cents` | INT         | Deprecated/legacy; store 0 (conversion credits do not apply to book price)                               |
| `created_at`                  | TIMESTAMPTZ | Row creation time                                                                                        |
| `updated_at`                  | TIMESTAMPTZ | Last modification time                                                                                   |

#### `pages`

| Column                    | Type                | Description                                                                                 |
| ------------------------- | ------------------- | ------------------------------------------------------------------------------------------- |
| `id`                      | UUID (PK)           | Primary key                                                                                 |
| `book_id`                 | UUID (FK)           | References `books.id`                                                                       |
| `position`                | INT                 | Page order (1-indexed)                                                                      |
| `saved_conversion_id`     | UUID (FK, nullable) | If set, this page was added from the user's library; outline/original come from that record |
| `original_image_path`     | TEXT                | Supabase Storage path to uploaded photo (or copied from saved_conversion if from library)   |
| `outline_image_path`      | TEXT                | Supabase Storage path to generated coloring page (or from saved_conversion)                 |
| `conversion_status`       | ENUM                | `pending`, `processing`, `completed`, `failed` (e.g. `completed` when from saved)           |
| `replicate_prediction_id` | TEXT (nullable)     | Replicate job ID for tracking (null when page came from saved conversion)                   |
| `credit_value_cents`      | INT (nullable)      | Legacy; null or 0 (conversion credits do not apply to book price)                           |
| `crop_rect`               | JSONB (nullable)    | Normalized crop region (x, y, width, height in 0–1); null = no crop                         |
| `rotation_degrees`        | INT (nullable)      | 0, 90, 180, or 270; null = 0. Applied when generating interior PDF.                         |
| `created_at`              | TIMESTAMPTZ         | Row creation time                                                                           |

#### `covers`

| Column           | Type        | Description                                  |
| ---------------- | ----------- | -------------------------------------------- |
| `id`             | UUID (PK)   | Primary key                                  |
| `book_id`        | UUID (FK)   | References `books.id` (unique)               |
| `image_path`     | TEXT        | Supabase Storage path to cover image         |
| `cover_pdf_path` | TEXT        | Path to generated cover PDF (once assembled) |
| `created_at`     | TIMESTAMPTZ | Row creation time                            |

#### `orders`

| Column                        | Type        | Description                                                                                             |
| ----------------------------- | ----------- | ------------------------------------------------------------------------------------------------------- |
| `id`                          | UUID (PK)   | Primary key                                                                                             |
| `book_id`                     | UUID (FK)   | References `books.id` (unique)                                                                          |
| `user_id`                     | TEXT        | Clerk user ID                                                                                           |
| `stripe_checkout_session_id`  | TEXT        | Stripe session ID                                                                                       |
| `stripe_payment_intent_id`    | TEXT        | Stripe payment intent ID                                                                                |
| `amount_total`                | INT         | Total charged in cents                                                                                  |
| `currency`                    | TEXT        | Currency code (e.g., `usd`)                                                                             |
| `shipping_name`               | TEXT        | Recipient name                                                                                          |
| `shipping_address_line1`      | TEXT        | Street address                                                                                          |
| `shipping_address_line2`      | TEXT        | Apt/suite (optional)                                                                                    |
| `shipping_city`               | TEXT        | City                                                                                                    |
| `shipping_state`              | TEXT        | State/province                                                                                          |
| `shipping_postal_code`        | TEXT        | Postal/ZIP code                                                                                         |
| `shipping_country`            | TEXT        | ISO country code                                                                                        |
| `shipping_phone`              | TEXT        | Phone (required by Lulu)                                                                                |
| `shipping_level`              | ENUM        | `MAIL`, `PRIORITY_MAIL`, `GROUND`, `EXPEDITED`, `EXPRESS`                                               |
| `lulu_print_job_id`           | INT         | Lulu's print job identifier                                                                             |
| `lulu_status`                 | TEXT        | Current Lulu status (CREATED, UNPAID, IN_PRODUCTION, SHIPPED, etc.)                                     |
| `lulu_tracking_id`            | TEXT        | Carrier tracking ID                                                                                     |
| `lulu_tracking_url`           | TEXT        | Carrier tracking URL                                                                                    |
| `credits_applied_value_cents` | INT         | Legacy; 0 (conversion credits do not apply to book price)                                               |
| `interior_pdf_path`           | TEXT        | Supabase Storage path to interior PDF                                                                   |
| `cover_pdf_path`              | TEXT        | Supabase Storage path to cover PDF                                                                      |
| `status`                      | ENUM        | `pending`, `paid`, `processing`, `submitted_to_print`, `in_production`, `shipped`, `delivered`, `error` |
| `error_message`               | TEXT        | Error details if something failed                                                                       |
| `created_at`                  | TIMESTAMPTZ | Row creation time                                                                                       |
| `updated_at`                  | TIMESTAMPTZ | Last status update                                                                                      |

---

## 7. API Integrations

### 7.1 Clerk (Authentication)

| Item             | Details                                                                           |
| ---------------- | --------------------------------------------------------------------------------- |
| Purpose          | User sign-up, sign-in, session management                                         |
| Integration      | `@clerk/nextjs` SDK                                                               |
| Auth methods     | Email/password, Google OAuth                                                      |
| Middleware       | Clerk middleware protects all `/dashboard/*`, `/api/*` routes                     |
| User sync        | Clerk webhook on `user.created` to initialize user record in Supabase (if needed) |
| Environment vars | `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`                           |

### 7.2 Supabase (Database & Storage)

| Item             | Details                                                                                                       |
| ---------------- | ------------------------------------------------------------------------------------------------------------- |
| Purpose          | PostgreSQL database, file storage for images and PDFs                                                         |
| Integration      | `@supabase/supabase-js` client library                                                                        |
| Auth model       | Service role key used server-side; RLS policies based on Clerk user ID                                        |
| Storage buckets  | `originals` (uploaded photos), `outlines` (converted pages), `covers` (cover images), `pdfs` (generated PDFs) |
| Signed URLs      | Used for Lulu API file access (1-hour expiry)                                                                 |
| Environment vars | `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`                                                       |

### 7.3 Gemini (Nano Banana) — Primary AI Conversion

| Item             | Details                                                                             |
| ---------------- | ----------------------------------------------------------------------------------- |
| Purpose          | Primary image conversion (photo → coloring book outline)                            |
| Model            | `gemini-2.5-flash-image` (Nano Banana)                                              |
| Integration      | `@google/genai` SDK, server-side only                                               |
| Input            | Image URL (fetched and sent as base64), fixed prompt for coloring-book outline      |
| Output           | PNG (as base64 in response; returned as data URL to route, then stored in Supabase) |
| Environment vars | `GEMINI_API_KEY`                                                                    |

### 7.4 Replicate — Fallback AI Conversion

| Item             | Details                                                                             |
| ---------------- | ----------------------------------------------------------------------------------- |
| Purpose          | Fallback when Gemini is not configured or fails                                     |
| Primary model    | `pnyompen/sd-lineart-controlnet` — ControlNet lineart with Stable Diffusion img2img |
| Cost per run     | ~$0.003 (approx. 322 runs per $1)                                                   |
| Runtime          | ~14 seconds per image                                                               |
| Integration      | `replicate` npm package                                                             |
| Input            | Image URL (Supabase signed URL), single default prompt for coloring-book outline    |
| Output           | URL to generated image (downloaded and stored in Supabase)                          |
| Rate limiting    | Queue concurrent requests; max 5 parallel conversions per user                      |
| Environment vars | `REPLICATE_API_TOKEN`                                                               |

### 7.5 OpenAI (Optional Second Fallback)

| Item             | Details                                                                        |
| ---------------- | ------------------------------------------------------------------------------ |
| Purpose          | Reserved for future use as optional fallback if both Gemini and Replicate fail |
| Endpoint         | `POST /v1/images/edits`                                                        |
| Model            | GPT-4o image generation                                                        |
| Environment vars | `OPENAI_API_KEY`                                                               |

### 7.6 Stripe (Payments)

| Item                           | Details                                                                                                                                                                                                                                                                                                        |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Purpose                        | (1) One-time payments for coloring book orders; (2) Conversion credit package purchases                                                                                                                                                                                                                        |
| Integration                    | `stripe` npm package + `@stripe/stripe-js` for client                                                                                                                                                                                                                                                          |
| Book checkout flow             | Create Checkout Session with line items (book printing/binding + shipping; no credit discount) → redirect → webhook triggers fulfillment                                                                                                                                                                       |
| Buy credits flow               | Single: variable quantity 1–49 at $0.99 each. 50-pack: $24.99. 100-pack: $39.99. Create Checkout Session; metadata `type: credit_purchase`, `userId`, `package_type`, and for single: `credit_quantity`. On success webhook, add credits to `user_profiles.paid_credits` based on total quantity purchased. |
| Checkout Session metadata      | Book: `bookId`, `userId`, `pageCount`. Credit purchase: `type: credit_purchase`, `userId`, `package_type`, and for single: `credit_quantity`                                                                                                                                                                   |
| Webhook events                 | `checkout.session.completed` — if book order, run fulfillment; if credit_purchase, add credits to user profile by package type                                                                                                                                                                                 |
| Webhook signature verification | Verify using `STRIPE_WEBHOOK_SECRET`                                                                                                                                                                                                                                                                           |
| Environment vars               | `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`                                                                                                                                                                                                                             |

### 7.7 Lulu Print API (Print & Ship)

| Item             | Details                                                                                                                                                          |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Purpose          | Print and ship physical coloring books                                                                                                                           |
| Base URL         | Production: `https://api.lulu.com`, Sandbox: `https://api.sandbox.lulu.com`                                                                                      |
| Auth             | OAuth 2.0 client credentials → JWT bearer token                                                                                                                  |
| Token endpoint   | `https://api.lulu.com/auth/realms/glasstree/protocol/openid-connect/token`                                                                                       |
| Cost estimate    | Use the **Print-Job Cost Calculations** endpoint to obtain approximate book cost (print + shipping + fulfillment) for a given page count and shipping level.     |
| Checkout options | For coloring books: trim size 8.5×8.5, perfect binding, 60# white interior, cover finish Matte or Glossy (map to appropriate pod_package_id when offering both). |

#### Key Endpoints Used

| Endpoint                                               | Method | Purpose                                                    |
| ------------------------------------------------------ | ------ | ---------------------------------------------------------- |
| `/auth/realms/glasstree/protocol/openid-connect/token` | POST   | Obtain access token                                        |
| `/print-job-cost-calculations/`                        | POST   | Calculate printing + shipping cost for price display       |
| `/print-job-cover-dimensions/`                         | POST   | Get required cover dimensions based on page count and trim |
| `/print-jobs/`                                         | POST   | Create a new print job (the core order)                    |
| `/print-jobs/{id}/`                                    | GET    | Check print job status                                     |
| `/print-jobs/{id}/status/`                             | GET    | Get detailed status with tracking info                     |
| `/webhooks/`                                           | POST   | Register webhook for `PRINT_JOB_STATUS_CHANGED`            |

#### Product Configuration

| Property           | Value                                                                                                                                                |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Trim sizes         | **Pocket** 4.25"×6.875" (`0425X0687`), **Medium** 7"×10" (`0700X1000`), **Large** 8.5"×11" (`0850X1100`)                                             |
| Interior           | Black & White, Standard quality (`BWSTD`)                                                                                                            |
| Binding            | Paperback, perfect binding (`PB`)                                                                                                                    |
| Paper              | 60# Uncoated White, 444 PPI (`060UW444`)                                                                                                             |
| Cover finish       | Matte (`M`), no linen (`X`), no foil (`X`)                                                                                                           |
| **pod_package_id** | One per trim, e.g. `0425X0687BWSTDPB060UW444MXX`, `0700X1000BWSTDPB060UW444MXX`, `0850X1100BWSTDPB060UW444MXX` (verify via Lulu Product Spec Sheet). |

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
| ---------------- | ------------------------------------------------------------ |

### 7.8 Resend (Transactional Email)

| Item             | Details                                                              |
| ---------------- | -------------------------------------------------------------------- |
| Purpose          | Send order confirmation and shipping notification emails             |
| Triggers         | Order placed (payment confirmed), Order shipped (tracking available) |
| Templates        | Simple, branded HTML emails matching the app's playful style         |
| Environment vars | `RESEND_API_KEY`                                                     |

---

## 8. Page-by-Page UI/UX Specification

### Design System

| Element             | Specification                                                                               |
| ------------------- | ------------------------------------------------------------------------------------------- |
| **Overall feel**    | Light, warm, playful — like a friendly children's bookstore                                 |
| **Primary color**   | Electric blue (`#23A4EF`) — from logo main drop                                             |
| **Secondary color** | Aqua / cyan (`#2ED0E0`) — from logo drop                                                    |
| **Accent color**    | Sunny yellow from splash (`#FFDE00`)                                                        |
| **Background**      | Warm off-white (`#FFF9F0`)                                                                  |
| **Text color**      | Soft charcoal (`#2D3436`)                                                                   |
| **Logo & brand**    | Logo: `colordrop.png` (blue drop + colorful splash on black); use in header and as favicon. |
| **Font — headings** | Rounded sans-serif (e.g., Nunito or Quicksand from Google Fonts)                            |
| **Font — body**     | Clean sans-serif (e.g., Inter or the same rounded font)                                     |
| **Border radius**   | Generous — 12-16px on cards, 8px on buttons                                                 |
| **Shadows**         | Soft, warm-toned box shadows for depth                                                      |
| **Illustrations**   | Small hand-drawn style SVG illustrations (crayons, stars, pencils) as decorative accents    |
| **Animations**      | Subtle — gentle fade-ins, soft hover scales, confetti on order confirmation                 |
| **Buttons**         | Rounded pill shape, large touch targets (min 48px height), playful hover states             |
| **Empty states**    | Friendly illustrations with encouraging copy ("Let's make something awesome!")              |

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
- **Saved Books:** Horizontal scroll of book cards (thumbnail, title, page count, "Continue" button)
- **Past Orders:** List/cards showing order date, thumbnail, page count, status badge, tracking link (if shipped)
- **Empty state (new user):** Friendly illustration, "You have 3 free conversions to try! Convert a photo or start a book." with CTAs

### 8.4 Convert an Image — One-Off (`/dashboard/convert`)

**Purpose:** Convert a single image, save to library, print or download.

**Layout:**

- **Upload area:** Single-image drop zone or file picker
- **Cost notice:** "This conversion uses 1 free credit" or "This conversion uses 1 credit" (show free and purchased credit counts)
- **Convert button:** Starts conversion; show processing state
- **Result:** Preview of outline image; actions: "Download," "Print," "Add to Book" (navigates to book editor; image is saved; book price is separate from credits)
- **Saved:** Result is automatically saved to "My Saved Pages" with context one_off

### 8.5 Buy Credits (`/dashboard/buy-credits`)

**Purpose:** Purchase conversion credits with a quantity selector (1–49) or fixed packs.

**Layout:**

- **Current credits:** Display free credits left and purchased credits by package (single / 50-pack / 100-pack) or total
- **Single credits (1–49):** Quantity selector (1–49), $0.99 per credit; total updates as quantity changes
- **Packs:** 50 credits — $24.99 ($0.50/credit). 100 credits — $39.99 ($0.40/credit)
- **Pay with Stripe:** User selects quantity or pack; CTA creates Stripe Checkout Session; on success webhook, credits are added to the corresponding pool(s)

### 8.6 My Saved Pages (`/dashboard/conversions` or `/dashboard/saved-pages`)

**Purpose:** View, use, and manage saved conversions; organize into collections.

**Layout:**

- **Collections:** User can create named collections (e.g. "John's Wedding", "Sam's birthday") and assign each saved image to at most one collection. Filter or view by collection.
- **Grid of saved conversions:** Thumbnail of outline image, date added, collection (if any)
- **Actions per item:** "Add to Book", "Download," "Delete," "Move to collection" (dropdown or selector)
- **Empty state:** "No saved pages yet. Convert an image or add pages to a book to see them here."

### 8.7 Book Editor (`/dashboard/books/[bookId]`)

**Purpose:** Build a book by uploading new images or adding from saved conversions.

**Layout — multi-section single page:**

**Section 1: Add Pages (two options)**

- **Upload new:** Large dashed-border drop zone ("Drag photos here or click to browse"); multiple files; each triggers conversion (1 credit per image); result saved to library with context `book` and added to book
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
  - Line items: **Book (printing & binding)** (pages + platform fee), **Shipping** (by tier), **Total**. Tax via Stripe when enabled.
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

| Cost Component           | Source                                  | Estimated Amount             |
| ------------------------ | --------------------------------------- | ---------------------------- |
| Lulu printing (base)     | Lulu API                                | ~$2.50 for a 20-page book    |
| Lulu printing (per page) | Lulu API                                | ~$0.02-0.04 per page         |
| Lulu shipping (Standard) | Lulu API                                | ~$3.99 (domestic US)         |
| AI conversion per page   | Gemini (primary) / Replicate (fallback) | ~$0.04 / ~$0.003 per image   |
| Stripe fees              | Stripe                                  | 2.9% + $0.30 per transaction |
| Supabase / hosting       | Supabase + Vercel                       | Negligible at low volume     |

### 9.2 Customer Pricing Model: Cost-Plus

Pricing is transparent and simple. Customer-facing **book** price is determined by **book size** (Pocket / Medium / Large) and **page tier** (12, 24, 32, 48, 64, 128 pages). Each "page" = one image; books are printed double-sided.

| Line Item                 | Formula                                                                                               | Example                                                                            |
| ------------------------- | ----------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Book (printing & binding) | Fixed price per (trim size × page tier); e.g. Pocket 24p, Medium 32p, Large 48p each have a set price | Set per size/tier matrix                                                           |
| Shipping                  | Fixed by tier (see below)                                                                             | $3.99 (Standard)                                                                   |
| **Total**                 | Book + Shipping                                                                                       | Shown clearly at checkout; pricing page shows book options by size and page count. |

**Shipping tiers (fixed):**

| Tier          | Label     | Price | Typical delivery   |
| ------------- | --------- | ----- | ------------------ |
| MAIL          | Standard  | $3.99 | 7–14 business days |
| PRIORITY_MAIL | Priority  | $5.99 | 5–7 business days  |
| EXPEDITED     | Expedited | $9.99 | 2–3 business days  |

Tax is collected by Stripe Checkout when enabled; the above totals are pre-tax.

**Margin:** Varies by (trim size × page tier). The app calls the Lulu Print API cost calculator, caches costs per (trim × page tier × shipping), and applies configurable markups: `BOOK_MARKUP_PERCENT` on Lulu line item + fulfillment and `SHIPPING_MARKUP_PERCENT` on Lulu shipping (each defaults to 50 = 50% markup on that component). Change env and restart to adjust. Optional `LULU_COST_CALC_*` env vars set the representative US address used for cost calculations. Revenue = book price + shipping; subtract Lulu cost, Stripe fees, and AI cost for gross margin.

### 9.3 Conversion Credits & Packages

| Package                          | Price      | Per-credit cost |
| -------------------------------- | ---------- | --------------- |
| 1–49 credits (quantity selector) | $0.99 each | $0.99/credit    |
| 50 credits                       | $24.99     | $0.50/credit    |
| 100 credits                      | $39.99     | $0.40/credit    |

Credits are one-time use for image conversions only. **They cannot be applied toward book purchases.** Deduction order: use free credits first; when exhausted, deduct from purchased pools (e.g. cheapest first).

| Scenario                            | Customer cost / application                                                                                                                                           |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| New user                            | 3 free conversion credits (one-time grant).                                                                                                                           |
| After free tier                     | User buys 1–49 credits at $0.99 each (quantity selector), or 50-pack ($24.99), or 100-pack ($39.99).                                                                  |
| Credits                             | 1 credit per conversion (free or purchased). **Conversion credits cannot be applied toward book purchases.** Book checkout is separate (printing/binding + shipping). |
| Adding a saved conversion to a book | No credit used.                                                                                                                                                       |

Book purchases are always via Stripe Checkout (book + shipping as line items; no credit discount).

### 9.4 Book Price Calculation (Implemented)

The book price shown to users is calculated as follows:

1. **Book (printing & binding)** = fixed price from a **price matrix** by (trim size × page tier). Page tiers: 12, 24, 32, 48, 64, 128. Trim sizes: Pocket (4.25"×6.875"), Medium (7"×10"), Large (8.5"×11").
2. **Shipping** = fixed amount by selected tier (Standard $3.99, Priority $5.99, Expedited $9.99).
3. **Total** = Book + Shipping. Conversion credits do not apply.

The checkout UI displays: Book (size + page count, e.g. "24 pages (24 images)"), Shipping, and Total. UI must clarify that each page = one image and that books are printed double-sided. Tax is handled by Stripe Checkout when enabled. The **marketing pricing page** shows a clear table of book prices by size and page count (12–128 pages).

_Optional:_ Call the Lulu Print API cost calculator to populate the price matrix and document profit margins per option.

---

## 10. Security & Privacy

### 10.1 Authentication & Authorization

| Measure          | Implementation                                                                   |
| ---------------- | -------------------------------------------------------------------------------- |
| Auth provider    | Clerk (SOC 2 compliant, handles password hashing, brute-force protection)        |
| Session tokens   | JWT with short expiry, automatic refresh                                         |
| Route protection | Clerk middleware on all authenticated routes                                     |
| API protection   | Clerk `auth()` helper validates user on every API route                          |
| Data isolation   | All database queries scoped to authenticated user's `userId`                     |
| RLS              | Supabase Row Level Security policies ensure users can only access their own data |

### 10.2 Data Protection

| Measure          | Implementation                                                                                      |
| ---------------- | --------------------------------------------------------------------------------------------------- |
| Transport        | HTTPS everywhere (Vercel enforces TLS)                                                              |
| Image storage    | Supabase Storage with private buckets; access only via signed URLs                                  |
| PII storage      | Shipping addresses stored encrypted at rest (Supabase handles this)                                 |
| Image retention  | Original uploads deleted 90 days after order fulfillment or book deletion                           |
| Account deletion | Full data purge — images, books, orders metadata (retain only financial records as required by law) |

### 10.3 API Security

| Measure          | Implementation                                                                                                                                                                                                                  |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Stripe webhooks  | Signature verification using `stripe.webhooks.constructEvent`                                                                                                                                                                   |
| Lulu webhooks    | HMAC-SHA256 verification using API secret                                                                                                                                                                                       |
| Rate limiting    | Implemented on upload and conversion endpoints (e.g., 10 uploads/min, 20 conversions/hour per user)                                                                                                                             |
| Input validation | Zod schemas on all API route inputs                                                                                                                                                                                             |
| File validation  | MIME type and magic byte verification on all uploads; reject non-image files                                                                                                                                                    |
| CSRF             | Built-in Next.js CSRF protection                                                                                                                                                                                                |
| Credit integrity | When deducting for a conversion: single atomic DB update (free_conversions_remaining or paid_credits); reject if no credits; idempotency for Stripe credit-purchase webhook to avoid double-crediting |

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

| Touchpoint               | Implementation                                                                                                                        |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| Checkout page            | Visible disclaimer above the payment button: "Coloring books are printed on demand and customized just for you. All sales are final." |
| Order confirmation email | Includes refund policy language                                                                                                       |
| FAQ page                 | Dedicated question: "Can I get a refund?" with clear answer                                                                           |
| Terms of Service         | Full legal refund policy language                                                                                                     |
| Stripe Checkout          | Custom text in Checkout Session metadata                                                                                              |

### 11.3 Required Legal Pages

| Page             | Content                                                                                                                          |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Terms of Service | User agreements, refund policy, acceptable use, IP disclaimer (user warrants they own rights to uploaded images)                 |
| Privacy Policy   | Data collection, storage, sharing (with Lulu for shipping, Stripe for payment, Replicate for AI processing), retention, deletion |
| Cookie Policy    | Clerk session cookies, Vercel analytics (if applicable)                                                                          |

### 11.4 Content & IP Considerations

- Users must warrant they have the right to use uploaded images
- App should include a checkbox at upload or checkout: "I confirm I have the right to use these images"
- No automated content moderation in MVP, but Terms of Service prohibit inappropriate content
- Consider adding basic NSFW detection in a future phase

---

## 12. MVP Milestones & Phases

### Phase 1: Foundation (Weeks 1-2)

| Task              | Details                                                                                                                                                                                            |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Project setup     | Next.js project, Tailwind, shadcn/ui, TypeScript config                                                                                                                                            |
| Authentication    | Clerk integration, sign-up/sign-in pages, middleware                                                                                                                                               |
| Database          | Supabase project, schema migration: user_profiles (free_conversions_remaining, paid_credits), saved_conversions, credit_transactions (optional), RLS policies                                      |
| Storage           | Supabase Storage buckets, upload utilities                                                                                                                                                         |
| User profile init | On first sign-in, create user_profile with free_conversions_remaining = 3, paid_credits = 0                                                                                                       |
| Landing page      | Hero, how-it-works, footer — styled per design system                                                                                                                                              |
| Dashboard shell   | Layout, navigation, credits and free credits display, empty states                                                                                                                                 |

**Deliverable:** Users can sign up, sign in, see dashboard with balance and free conversion count.

### Phase 2: Conversions, Balance & Saved Library (Weeks 3-4)

| Task                    | Details                                                                                                                                                                                                                                                           |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Image upload            | Multi-file upload to Supabase Storage with validation                                                                                                                                                                                                             |
| AI conversion           | Gemini (Nano Banana) primary + Replicate fallback, conversion orchestrator, retry logic                                                                                                                                                                           |
| Free tier & credits     | Before conversion: check free then paid credits; deduct free first, then paid; credits never apply to book price; use atomic updates for deductions                                                                              |
| Saved conversions       | Every completed conversion inserts into saved_conversions; user_id, original/outline paths                                                                                                                                                                        |
| One-off convert page    | Single-image upload → convert → save to library → download/print / "Add to Book"                                                                                                                                                                                  |
| Buy credits             | Stripe Checkout: single (1–49 quantity at $0.99 each), 50-pack ($24.99), or 100-pack ($39.99); webhook adds to `user_profiles.paid_credits` based on total quantity purchased                                                                                       |
| My Saved Pages          | List/grid of saved_conversions; download, delete, "Add to Book"                                                                                                                                                                                                   |
| Balance & free count UI | Display on dashboard and convert page                                                                                                                                                                                                                             |

**Deliverable:** Users can use free conversions, add funds, convert one-off, and manage saved pages.

### Phase 3: Book Creation (Week 5-6)

| Task                         | Details                                                                                                               |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Book editor (dedicated page) | Add pages by upload (triggers conversion, uses free/balance, saves to library) or by selecting from saved conversions |
| Page grid                    | Thumbnail grid, drag-and-drop reorder, remove, replace (upload or saved)                                              |
| pages.saved_conversion_id    | When adding from library, link page to saved_conversion; no new conversion                                            |
| Cover upload                 | Separate cover upload flow                                                                                            |
| Auto-save                    | Book state persisted on every change                                                                                  |
| Price calculation            | Live book price (Lulu + markup); conversions for this book included — no separate conversion charge                   |

**Deliverable:** Users can build a book from new uploads or saved conversions; conversions in book are free at checkout.

### Phase 4: Preview & Checkout (Weeks 7-8)

| Task               | Details                                                   |
| ------------------ | --------------------------------------------------------- |
| Book preview       | Page-by-page preview component                            |
| Shipping form      | Address form with validation                              |
| Stripe integration | Checkout Session creation, redirect flow, webhook handler |
| Order creation     | Database order record on successful payment               |

**Deliverable:** Users can preview their book and pay for it.

### Phase 5: Fulfillment & Polish (Weeks 9-11)

| Task                | Details                                                                                      |
| ------------------- | -------------------------------------------------------------------------------------------- |
| PDF generation      | Interior PDF assembly (all outline pages at 300 DPI), cover PDF with correct Lulu dimensions |
| Lulu integration    | Print-Job creation, status polling/webhooks, tracking                                        |
| Email notifications | Order confirmation, shipping notification via Resend                                         |
| Order tracking      | Status display on dashboard and order detail page                                            |
| Error handling      | Graceful handling of AI failures, PDF errors, Lulu rejections                                |
| Legal pages         | Terms of Service, Privacy Policy, FAQ                                                        |

**Deliverable:** End-to-end flow — upload to physical book delivery.

### Phase 6: Launch Prep (Week 12-13)

| Task        | Details                                                   |
| ----------- | --------------------------------------------------------- |
| Testing     | End-to-end testing with Lulu sandbox, Stripe test mode    |
| Performance | Image optimization, loading states, error boundaries      |
| Analytics   | Vercel Analytics, basic conversion funnel tracking        |
| Monitoring  | Sentry error tracking, uptime monitoring                  |
| SEO         | Meta tags, OpenGraph images, structured data              |
| Launch      | Switch to production Lulu & Stripe keys, deploy, announce |

**Deliverable:** Production-ready app.

---

## 13. Open Questions & Future Enhancements

### Open Questions

| Question                                                          | Impact                                                                | Decision Needed By |
| ----------------------------------------------------------------- | --------------------------------------------------------------------- | ------------------ |
| Should we offer landscape format (9" x 7") in addition to square? | Adds complexity to PDF generation and cover dimensions                | Phase 2            |
| Do we need NSFW/content moderation on uploaded images?            | Legal/brand risk vs. cost of moderation API                           | Phase 4            |
| Should Lulu print cost be fetched in real-time or cached?         | Real-time is accurate but adds latency; caching may show stale prices | Phase 2            |
| International shipping — which countries to support at launch?    | Lulu ships globally but costs vary significantly                      | Phase 3            |
| Should we pre-generate a back cover or let Lulu use a blank?      | Design decision; blank is simpler for MVP                             | Phase 2            |
| Offer custom credit amounts or only the current options?          | UX; current plan: 1–49 (quantity), 50-pack, 100-pack                  | Phase 2            |
| Refund policy for unused credits?                                 | Terms should state whether balance is refundable                      | Phase 4            |

### Future Enhancements (Post-MVP)

| Enhancement               | Description                                                                                     | Priority |
| ------------------------- | ----------------------------------------------------------------------------------------------- | -------- |
| **Page captions**         | Let users add a title or caption to each coloring page                                          | High     |
| **Multiple book sizes**   | Offer landscape (9x7), letter (8.5x11) in addition to square                                    | High     |
| **Difficulty levels**     | AI generates "easy" (fewer details) vs. "detailed" outlines                                     | Medium   |
| **Text-to-coloring-page** | Type a description ("a dragon flying over a castle") and AI generates a coloring page from text | Medium   |
| **Dedication page**       | Add a personal dedication page ("For Emma, with love from Grandma")                             | Medium   |
| **Gift flow**             | Ship to a different address with a gift message                                                 | Medium   |
| **Bulk/classroom orders** | Discount pricing for 5+ copies of the same book                                                 | Medium   |
| **Subscription**          | Monthly coloring book subscription (user uploads X photos/month)                                | Low      |
| **Mobile app**            | Native iOS/Android app for easier photo selection from camera roll                              | Low      |
| **Social sharing**        | Share a preview of your book on social media                                                    | Low      |
| **Template pages**        | Pre-made coloring pages (borders, patterns) users can mix in with their photos                  | Low      |
| **Collaborative books**   | Multiple users contribute pages to a shared book                                                | Low      |

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

# Image conversion: Gemini primary, Replicate fallback (at least one required)
GEMINI_API_KEY=...
REPLICATE_API_TOKEN=r8_...

# OpenAI (optional second fallback; reserved for future use)
# OPENAI_API_KEY=sk-...

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
