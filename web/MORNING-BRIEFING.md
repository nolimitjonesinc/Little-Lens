# Morning Briefing — What Got Built Overnight

**Short version:** LittleLens web pitch demo is now a real working Quick Capture tool for Maple Tree Academy. Voice-first capture with Embers-style silence detection, handwritten page scanner with Claude Vision, batch review, AI-tagged domains, printable AI-drafted reports, PWA-ready. Zero new dependencies beyond the Anthropic SDK.

---

## Run It

```bash
cd /Users/dannyjonesphotography/Desktop/LittleLens
npm run dev
```

Open http://localhost:3000 — auto-redirects to `/dashboard`.

For AI features (tagging, scan, reports), add your Anthropic key:

```bash
cp .env.example .env.local
# edit .env.local and paste your ANTHROPIC_API_KEY
```

**Without an API key**, the app still runs. Voice capture works. Scan will show a friendly error. Reports fall back to a template. Dashboard and timeline work fully with seed data.

---

## What Changed

### New Features
- **Quick Capture mode** (`/quick-capture`) — name tiles grid per class, tap a name, record, auto-save, return. The flow you drew up.
- **Silence-detection mic** (`components/MicOrb.tsx`) — Embers iOS pattern ported to Web Speech API. Speaks → pauses → 3-2-1 countdown → auto-saves. Speak again and the countdown cancels.
- **Handwritten page scanner** (`/scan`) — in-browser camera (or file upload) → Claude Vision parses names and notes → batch review screen → confirm each → Save All.
- **Class picker** — Sugar Maples, Maple Leafs 1/2/3, Big Leaves, TK. Teacher is scoped to their classes but can see all.
- **Photo privacy** — no child photos anywhere. Initials avatars on every card. `photoEnabled` flag exists on the child type so admins can enable later.
- **AI-drafted reports** (`/report/[childId]`) — Claude Sonnet writes the narrative. Cached per session. Print-to-PDF works.

### Under the hood
- Tailwind v4 theme migrated to `@theme` directive in `globals.css`
- LocalStorage-backed observation store (`lib/storage.ts`) so new captures persist across refresh in the demo
- PWA manifest + icons for install-to-homescreen on iPad
- Three API routes: `/api/tag`, `/api/scan`, `/api/report` — all server-side with `ANTHROPIC_API_KEY`
- Old `/capture` and `/observation/[id]` routes now redirect to Quick Capture (no dead code)
- Anthropic SDK wired in `lib/anthropic.ts` with proper model IDs

### Files to Look At First
- `app/dashboard/page.tsx` — new class picker + Quick Capture CTA
- `app/quick-capture/page.tsx` — name tiles grid
- `app/quick-capture/[childId]/page.tsx` — mic screen + review
- `components/MicOrb.tsx` — the silence-detection voice logic (this is the crown jewel)
- `app/scan/page.tsx` + `app/scan/review/page.tsx` — handwritten flow
- `app/api/scan/route.ts` — Claude Vision prompt for parsing handwriting

---

## 90-Second Pitch Flow

1. **Dashboard** (0–10s): "Ms. Sarah's morning view — her classes at a glance, kids who haven't been observed in a week flagged in amber."
2. **Quick Capture** (10–20s): Tap the big amber CTA. Name tiles for Maple Leafs 2. Everything is one tap away.
3. **Voice** (20–45s): Tap Maya. The mic is already listening. Say *"Maya sorted the colored blocks by shape and taught another child how to do it."* Pause. Watch the countdown. Auto-saves.
4. **Back to tiles** — ready for the next child. "That's 12 kids in 5 minutes during snack time."
5. **Scan** (45–65s): "What if a teacher already wrote on paper?" Tap Scan. Snap the clipboard. Claude parses it. Review screen shows 8 observations with names auto-matched. Save All.
6. **Report** (65–90s): Tap a child with 5+ notes. AI narrative. Print to PDF. Done.

---

## What's Not Built (Intentionally)

- **Supabase/auth** — demo uses seed data + localStorage. Fine for pitch, obvious next step for production.
- **Real photo attachment on observations** — camera is wired for scan but not yet for attaching a photo to a voice note. ~1 hour to add.
- **Offline mode** — observations persist to localStorage, but API calls need network. Service worker not yet added.
- **Director/admin view** — Teacher-only view. Add after pitch if they ask for it.
- **Parent portal** — not in scope for this iteration.

---

## Known Issues / Things to Test

- **Web Speech API** works best in Chrome/Edge. Safari desktop is spotty; iOS Safari works on the `standalone` PWA but may prompt for mic per session.
- **Demo the mic in Chrome** for the pitch. That's your reliable path.
- **Camera/scan** needs HTTPS on real devices — localhost is fine for dev. For pitch off a laptop, localhost is fine.
- **Without API key**, scan fails visibly (friendly error). Tag falls back to keyword-matching (still reasonable). Report falls back to template.

---

## Next Steps After Pitch

In order of ROI:

1. **Deploy to Vercel** — 5 min. Real URL for people to play with.
2. **Wire real `ANTHROPIC_API_KEY`** on Vercel — instant AI. Budget ~$3/mo for a real classroom.
3. **Add photo attachment to Quick Capture** — teachers will ask for this once they see scan working.
4. **Supabase for persistence** — kill localStorage, add auth, gate to Maple Tree teachers.
5. **Port silence detection to the Expo iOS app** — this is the production form factor for classrooms.
6. **Wall-mounted iPad test** — install the PWA on Maple Tree's iPad, let a teacher actually use it for a day.

---

## Task List Status

All 8 build tasks completed. See `TaskList` if you want the rundown.

---

**Where we are:** Pitch-ready web demo with the full Quick Capture + Scan + Report flow. Build passes. No type errors. Needs your Anthropic API key to light up the AI. Sleep well — morning you gets to play with it.
