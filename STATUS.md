# Little Lens — Status
_Auto-updated by Status Brain on every push. Last change: Add Status Brain workflow (2026-07-20)._

**Status:** In progress  
**What it is:** Voice-first developmental observation app for preschool teachers to capture and report on children's learning moments.  
**Stack:** React Native + Expo SDK 54, Next.js 16 (web demo), Supabase (auth + DB + Edge Functions), Claude Vision (handwriting parsing), Anthropic API (observation tagging + report generation), NativeWind (styling).

## What works right now
- **Quick Capture flow** — tap child name → speak observation → auto-saves to Supabase (mobile + web)
- **Handwritten scan** — photograph clipboard page → Claude Vision reads handwriting → batch review UI → save to correct children
- **Dashboard** — class picker, child grid with observation counts, quick access to capture
- **Auth** — teacher login/signup via Supabase
- **AI observation tagging** — automatically assigns developmental domains (Cognitive, Fine Motor, Social-Emotional, etc.) to notes
- **AI report generation** — creates warm, parent-ready narrative from accumulated observations
- **Child profiles** — per-child observation history and report view
- **Responsive web demo** — full feature parity via Next.js for pitch/demo without install
- **Mobile-ready UI** — Expo Router navigation, NativeWind/Tailwind styling, voice recording with mic button
- **Seed data** — demo class rosters (Sugar Maples, Maple Leafs, Big Leaves, TK) for testing
- **Photo storage** — local photo handling for scans (Expo Image Picker)

## Recent changes (newest first)
- 2026-07-20 — Added Status Brain workflow and script for auto-updating project status
- 2026-04-18 — Added photo capture to Quick Capture flow; added web pitch demo to monorepo with env examples
- 2026-04-18 — Rebranded to "Maple Tree Academy" and added Quick Capture, Scan, and core observation UI screens
- 2026-04-12 — Initial commit with auth, dashboard skeleton, and Supabase integration

## Reusable parts (for other projects)
- **Speech Recognition Integration** — voice capture with pause detection and safe-mode fallback — `lib/speechSafe.ts`
- **Observation Helpers** — domain tagging logic and observation parsing — `lib/observationHelpers.ts`
- **Photo Storage Utility** — local file handling for image-based workflows — `lib/photoStorage.ts`
- **Supabase Setup** — auth + real-time DB client initialization — `lib/supabase.ts`
- **Theme + Design Tokens** — Amber, Sage, warm off-white color system — `lib/theme.ts`
- **Seed Data Generator** — realistic test data for classrooms and children — `lib/seed-data.ts`

## Not done / next
- **Push to production** — currently dev-build only; no TestFlight or App Store submission yet
- **Offline sync** — observations work only when connected; local queue needed for field use
- **Photo uploads** — handwritten scan images not yet persisted to Supabase storage
- **Export/CSV** — no bulk export for teacher record-keeping
- **Family portal** — parents cannot yet view their child's reports
- **Admin dashboard** — no teacher account management or school-wide analytics
- **E2E tests** — no test suite for capture/report flows
- **Accessibility audit** — voice-first feature untested with screen readers on mobile
- **Env validation** — no startup check that Supabase secrets + API keys are present
