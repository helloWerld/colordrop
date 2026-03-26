# Plan: Clerk Components & Auth Pages — Use globals.css Theme (Primary, Secondary, Accent)

## Goal

Update Clerk components and auth pages so they use the ColorDrop design system from `src/app/globals.css`: **primary** (#23a4ef blue), **secondary** (purple), **accent** (yellow), plus background, foreground, borders, and radius — with a single source of truth and optional dark mode support.

---

## Current State

- **globals.css** defines CSS variables for light and dark:
  - `--primary`, `--primary-foreground`, `--secondary`, `--secondary-foreground`, `--accent`, `--accent-foreground`
  - `--background`, `--foreground`, `--muted`, `--muted-foreground`, `--border`, `--input`, `--ring`, `--radius`
- **Auth pages** (`sign-in`, `sign-up`) use hardcoded Clerk `appearance.variables`:
  - `colorPrimary: "hsl(0, 100%, 71%)"` (red/pink — not from design system)
  - `colorBackground: "hsl(40, 100%, 97%)"`, `borderRadius: "0.75rem"`
- **ClerkProvider** in `src/app/layout.tsx` has no `appearance` prop (no global Clerk theme).
- **DashboardLogoutButton** is a custom button using Tailwind (`text-muted-foreground`, `hover:text-foreground`); no Clerk UI, already on-brand.

---

## Clerk Theme Mapping

Clerk’s `appearance.variables` do not expose “secondary” or “accent” as named variables. Map design tokens as follows:

| Design token (globals.css) | Clerk variable           | Purpose                          |
|----------------------------|--------------------------|----------------------------------|
| `--primary`                | `colorPrimary`           | Buttons, links, focus            |
| `--primary-foreground`     | `colorPrimaryForeground` | Text on primary                  |
| `--background`             | `colorBackground`        | Card/container background       |
| `--foreground`             | `colorForeground`        | Main text                        |
| `--muted-foreground`       | `colorMutedForeground`   | Secondary text                   |
| `--muted`                  | `colorMuted`             | Muted backgrounds                |
| `--border`                 | `colorBorder`            | Borders                          |
| `--input`                  | `colorInput`             | Input backgrounds                |
| `--ring`                   | `colorRing`              | Focus ring                       |
| `--radius`                 | `borderRadius`           | Component radius                 |

**Secondary / accent:** Use only where Clerk allows (e.g. custom `elements` with Tailwind classes like `text-accent` or `bg-secondary` for specific elements), or leave for future custom components.

---

## Implementation Steps

### 1. Centralize Clerk theme in `ClerkProvider` (layout)

**File:** `src/app/layout.tsx`

- Add an `appearance` prop to `ClerkProvider` that uses **CSS variables** so Clerk reads from `globals.css` and respects light/dark.
- Use the standard space-separated HSL form already in `:root` / `.dark`: e.g. `colorPrimary: 'hsl(var(--primary))'` (Tailwind/globals use `--primary: 202 86% 54%`, so `hsl(var(--primary))` resolves correctly in supporting browsers).

**Suggested snippet:**

```tsx
<ClerkProvider
  publishableKey={clerkPubKey}
  appearance={{
    variables: {
      colorPrimary: "hsl(var(--primary))",
      colorPrimaryForeground: "hsl(var(--primary-foreground))",
      colorBackground: "hsl(var(--background))",
      colorForeground: "hsl(var(--foreground))",
      colorMutedForeground: "hsl(var(--muted-foreground))",
      colorMuted: "hsl(var(--muted))",
      colorBorder: "hsl(var(--border))",
      colorInput: "hsl(var(--input))",
      colorRing: "hsl(var(--ring))",
      borderRadius: "var(--radius)",
    },
  }}
>
  {children}
</ClerkProvider>
```

- **Optional:** Extract this object to a shared module (e.g. `src/lib/clerk-theme.ts`) and import it in the layout so auth pages can reuse or extend it.

**Note:** Clerk’s docs recommend direct color values for broader browser support; using `hsl(var(--primary))` relies on modern CSS. If you need to support very old browsers, you can instead pass a theme object that uses the same numeric values as globals (e.g. from a small constants file) and avoid CSS variables in Clerk.

---

### 2. Simplify auth pages to rely on global theme

**Files:**

- `src/app/(auth)/sign-in/[[...sign-in]]/page.tsx`
- `src/app/(auth)/sign-up/[[...sign-up]]/page.tsx`

- **Remove** local `variables` that duplicate the theme (e.g. `colorPrimary`, `colorBackground`, `borderRadius`), so the global `ClerkProvider` theme applies.
- **Keep** only layout/structure and any page-specific overrides:
  - `elements.rootBox`, `elements.card` (and optionally other `elements` for spacing/shadow/border that don’t affect colors).
- Optionally add `elements` overrides that use Tailwind semantic classes for **secondary** or **accent** on specific parts (e.g. a “Terms” link with `text-accent` or a divider using `border-secondary`) if desired; otherwise leave as-is.

Result: auth pages stay minimal and consistent with the rest of the app, with primary/secondary/accent coming from globals via the provider.

---

### 3. Optional: shared Clerk appearance module

**File:** `src/lib/clerk-theme.ts` (or `src/lib/clerk-appearance.ts`)

- Export a single `clerkAppearance` (or `clerkThemeVariables`) object that:
  - Uses the same CSS variable references as above (`hsl(var(--primary))`, etc.).
  - Can be imported in both `layout.tsx` (for `ClerkProvider`) and in auth pages if they need to extend (e.g. add `signIn.elements` or `signUp.variables`) without duplicating variable names.
- This keeps one place that defines how globals map to Clerk and makes future tweaks (e.g. adding `colorSuccess` from `--accent`) easy.

---

### 4. DashboardLogoutButton and other custom auth UI

- **DashboardLogoutButton** already uses Tailwind semantic colors; no change required.
- If you add more custom auth-related UI (e.g. “Sign out” in a dropdown), use `text-primary`, `hover:bg-accent`, etc., so they stay aligned with globals.

---

### 5. Dark mode

- If the app toggles dark mode via a class on `<html>` (e.g. `class="dark"`), the same CSS variables under `.dark` in `globals.css` will automatically drive Clerk’s theme when using `hsl(var(--primary))` etc., so no extra Clerk config is needed for dark mode.

---

## Files to touch (summary)

| File | Action |
|------|--------|
| `src/app/layout.tsx` | Add `appearance={{ variables: { ... } }}` to `ClerkProvider` (optionally from shared module). |
| `src/app/(auth)/sign-in/[[...sign-in]]/page.tsx` | Remove duplicate `variables`; keep `elements` for layout only. |
| `src/app/(auth)/sign-up/[[...sign-up]]/page.tsx` | Same as sign-in. |
| `src/lib/clerk-theme.ts` (optional) | New file: export shared Clerk variables / appearance for provider and pages. |

---

## Testing

- Open `/sign-in` and `/sign-up` and confirm:
  - Primary buttons/links use the blue primary from globals.
  - Card background, text, borders, and inputs match the rest of the app (background, foreground, border, input).
  - Radius matches `--radius`.
- If you use dark mode, toggle it and confirm auth pages follow `.dark` variables.
- Run in a target browser to confirm `hsl(var(--primary))` works; if you need older support, switch to a constants-based theme object as noted above.

---

## Rollback

- Revert layout to `ClerkProvider` without `appearance`.
- Restore the previous hardcoded `variables` on the sign-in and sign-up pages.

This plan keeps primary, secondary, and accent defined only in `globals.css`, uses primary (and related tokens) in Clerk via CSS variables, and leaves room to use secondary/accent in custom `elements` or future components.
