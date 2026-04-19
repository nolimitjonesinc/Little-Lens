# LittleLens

Voice-first developmental observation capture for preschool teachers. Built for **Maple Tree Academy** (West Los Angeles).

This repo is a **monorepo** containing two apps:

| Folder | App | Stack | Purpose |
|---|---|---|---|
| `/` (root) | **Mobile** | React Native, Expo SDK 54, Expo Router, NativeWind | The real product teachers use on iPhone/iPad |
| `/web` | **Web pitch demo** | Next.js 16, React 19, Tailwind v4 | Pitch-ready URL demo, no install needed |

## What the App Does

- **Quick Capture**: Tap a child's name → speak → pause → auto-saves the note. Return to name tiles ready for the next child.
- **Handwritten Scan**: Snap a photo of your clipboard page → Claude Vision reads the handwriting → batch review → save all notes for the right children.
- **AI tagging**: Every note gets auto-tagged with developmental domains (Cognitive, Fine Motor, Social-Emotional, etc.).
- **AI-drafted reports**: Generate a warm, parent-ready developmental report from accumulated observations.
- **Class roster**: Sugar Maples, Maple Leafs 1/2/3, Big Leaves, TK.
- **Privacy-first**: No child photos in UI by default — initials only.

## Running the Mobile App

```bash
# Install deps
npm install

# Set up env
cp .env.example .env.local
# Add your Supabase URL + anon key

# Start the dev server for development builds
npx expo start --dev-client
```

Open the installed LittleLens dev-build app on your phone (or Expo Go without native-only features).

## Running the Web Demo

```bash
cd web
npm install
cp .env.example .env.local
# Add your ANTHROPIC_API_KEY
npm run dev
# Open http://localhost:3000
```

## Backend

Supabase provides:
- Auth (teachers)
- Database (`ll_teachers`, `ll_children`, `ll_observations`)
- Edge functions:
  - `tag-observation` — cleans + domain-tags one voice note
  - `generate-report` — writes a parent-facing narrative
  - `scan-observations` — parses handwritten page via Claude Vision

Edge functions live in `supabase/functions/`. Deploy with:

```bash
supabase functions deploy tag-observation
supabase functions deploy generate-report
supabase functions deploy scan-observations
```

All edge functions read `ANTHROPIC_API_KEY` from Supabase secrets.

## Design Tokens

- Amber `#f0a038` — primary
- Sage `#8fb186` — secondary
- Background `#faf7f2` — warm off-white

## Project Structure (Mobile root)

```
app/
  (auth)/             # Login, signup
  (app)/
    dashboard.tsx     # Class picker + child grid + Quick Capture CTA
    quick-capture.tsx # Name tiles grid (the fast-capture flow)
    quick-capture/[childId].tsx  # Mic with silence detection + auto-save
    scan.tsx          # Camera entry for handwritten notes
    scan/review.tsx   # Batch review of parsed notes
    child/[id].tsx    # Child profile + observation timeline
    capture.tsx       # Legacy deep-capture flow (still works)
    observation/review.tsx
    report/[childId].tsx
components/
  NameTile.tsx, ClassPicker.tsx, ChildCard.tsx, DomainTag.tsx, MicButton.tsx
lib/
  api.ts, supabase.ts, speechSafe.ts, seed-data.ts, types.ts, theme.ts, utils.ts
supabase/
  functions/
    tag-observation/
    generate-report/
    scan-observations/
web/
  # Next.js pitch demo — self-contained, see web/README.md
```
