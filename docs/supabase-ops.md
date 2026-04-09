# Supabase Operations

## Backups

### Automatic backups (all paid plans)

Supabase includes **daily automatic backups** on paid plans. Verify status:

1. Open the [Supabase Dashboard](https://supabase.com/dashboard) for the project.
2. Navigate to **Database > Backups**.
3. Confirm daily backups are listed and the most recent is within the last 24 hours.

### Point-in-Time Recovery (PITR)

PITR allows restoring the database to any second within the retention window. It is available on the **Pro plan and above**.

1. In the Supabase Dashboard, go to **Database > Backups > Point in Time**.
2. Enable PITR if not already active.
3. Retention window depends on plan tier (typically 7 days on Pro).

### Recommended schedule

- **Before production launch:** Verify backups are enabled and run a test restore to a staging project.
- **Ongoing:** Spot-check backup status monthly. Set a calendar reminder or uptime-monitor alert if the dashboard exposes backup health via API.

## Service role key security

The `SUPABASE_SERVICE_ROLE_KEY` bypasses Row Level Security (RLS). It must **never** be exposed to client-side code.

Safeguards in this codebase:

- `src/lib/supabase.ts` imports `server-only`, which causes a build-time error if the module is bundled into a client component.
- The key is stored in a non-`NEXT_PUBLIC_` env var (`SUPABASE_SERVICE_ROLE_KEY`), so Next.js does not inline it into client bundles.
- All imports of `createServerSupabaseClient` are in API routes or server components.

### Verification checklist

- [ ] `SUPABASE_SERVICE_ROLE_KEY` does not appear in any `NEXT_PUBLIC_*` env var.
- [ ] `src/lib/supabase.ts` has `import "server-only"` as the first import.
- [ ] No client component (`"use client"`) imports from `@/lib/supabase`.
- [ ] Supabase project has RLS enabled on all tables that store user data.

## Storage buckets

Storage buckets (`originals`, `outlines`, `covers`, `pdfs`) are created via `scripts/create-storage-buckets.js`. Bucket policies should restrict public access; signed URLs are used for temporary reads.
