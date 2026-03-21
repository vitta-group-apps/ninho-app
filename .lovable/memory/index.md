# Memory: index.md
Updated: now

Ninho PWA — Design system, brand tokens, font decisions, routing, and key constraints.

## Brand Colors (HSL vars in index.css)
- --ninho-sand: 37 30% 96% → #F7F5F2 — page background
- --ninho-brown: 16 14% 30% → #5A4A42 — text & elements
- --ninho-sage: 152 15% 55% → #7A9A8B — CTAs, active tabs, accents
- --ninho-mauve: 270 12% 52% → #8A7A92 — splash screen, primary brand color
- Auth/onboarding headers: #806e84 (--mv7, slightly darker mauve)

## Brand Assets
- src/assets/simbolo-ninho.png — official white symbol (transparent bg)
- src/assets/logo-ninho.png — official white wordmark
- src/assets/onboarding-hero.jpg — hero photo for Welcome slides
- SplashScreen uses simbolo-ninho.png with pulse animation

## Typography
- Headings/Brand: Quicksand (Google Font) — font-quicksand
- Body/UI: Nunito (Google Font) — font-nunito
- NEVER use Inter, Poppins, or system-ui directly

## Shape Rules
- FORBIDDEN: sharp corners (rounded-none, rounded-sm)
- Default: rounded-2xl (cards), rounded-3xl (modals/sheets), rounded-full (pills/FAB)

## Routing
- / → Home (auth required)
- /onboarding → WelcomePage (2-slide hero photo)
- /onboarding/auth → AuthPage (email+password ONLY, no name; OTP inline)
- /onboarding/nome → NomePage (step 1 of 3, saves profiles.full_name)
- /onboarding/family → FamilyPage (step 2 of 3, creates family)
- /onboarding/child → ChildPage (step 3 of 3, marks onboarding_complete=true)
- /reset-password → ResetPasswordPage (public)
- Splash: 2.4s new user / 1s returning user
- Auth flow: Splash → Welcome → Auth → OTP → Nome → Family → Child → Home

## Auth Model
- useAuth() returns: user, session, profile, loading, isFirstTime, isLoggedIn
- isLoggedIn = session + full_name + onboarding_complete=true → goes to /home
- isFirstTime = session but onboarding incomplete → goes to /onboarding/nome
- profiles table has: full_name, onboarding_complete (boolean default false)
- Auto-trigger on auth.users insert creates profiles row

## Architecture
- AppShell wraps all authenticated routes — contains BottomNav
- SplashScreen: duration prop (2400ms new / 1000ms returning)
- useAuth() hook — reads Supabase session + profiles table
- AuthPage: NO name field (name collected on NomePage after OTP)
- vaccineSchedule.ts — full SUS 2026 calendar

## Design DO NOTs
- No purple gradients on white
- No hardcoded hex in app components (auth/onboarding uses #806e84 by design)
- No direct color classes (text-white, bg-black) — use semantic tokens in app
- Onboarding/auth headers: fundo #806e84 with border-radius 0 0 28px 28px
