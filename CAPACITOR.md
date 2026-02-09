# Capacitor — Mobile Readiness Notes

This project is designed for easy conversion to Android/iOS apps via Capacitor.

## What's already Capacitor-ready

- SPA with client-side routing (no SSR)
- `viewport-fit=cover` in index.html for safe area support
- Mobile-first responsive layouts
- No server-side dependencies — Supabase client runs in the browser
- Environment variables via `import.meta.env` (works with Capacitor)

## Steps to add Capacitor

```bash
npm install @capacitor/core @capacitor/cli
npx cap init "Sales.pk" "pk.sales.app" --web-dir dist

# Add platforms
npx cap add android
npx cap add ios

# Build and sync
npm run build
npx cap sync

# Open native IDE
npx cap open android
npx cap open ios
```

## Things to handle when adding Capacitor

1. **Safe area insets** — Add `env(safe-area-inset-*)` padding to Navbar and bottom elements
2. **Deep links** — Configure URL scheme if needed
3. **Status bar** — Use `@capacitor/status-bar` plugin to style the status bar
4. **Splash screen** — Use `@capacitor/splash-screen` for app launch screen
5. **Network check** — Optionally use `@capacitor/network` for offline detection
