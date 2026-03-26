/**
 * Clerk appearance variables wired to globals.css design tokens.
 * Used by ClerkProvider so Sign In/Sign Up and other Clerk UI follow the app theme.
 */
export const clerkThemeVariables = {
  colorPrimary: "hsl(var(--primary))",
  colorPrimaryForeground: "hsl(var(--primary-foreground))",
  colorBackground: "hsl(var(--background))",
  colorForeground: "hsl(var(--foreground))",
  colorMuted: "hsl(var(--muted))",
  colorMutedForeground: "hsl(var(--muted-foreground))",
  colorBorder: "hsl(var(--foreground))",
  colorInput: "hsl(var(--input))",
  colorRing: "hsl(var(--ring))",
  borderRadius: "var(--radius)",
} as const;
