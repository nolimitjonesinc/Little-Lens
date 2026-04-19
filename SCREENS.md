# Screen-by-Screen Guide

## 1. Dashboard (`/dashboard`)

**Header:**
- "LittleLens" in amber
- Teacher name + school name in sage
- "Spring Observations • Feb – Apr 2025"

**Content:**
- "Your Class" heading
- "6 children • X observations captured"
- Grid of 6 child cards (single column on mobile)

**Each Child Card Shows:**
- Child emoji + name (e.g., "🧒 Maya Chen")
- Age + DOB
- Observation count in amber box
- Progress bar (if < 5 observations) OR "✓ Report ready" badge
- Arrow indicator

**Tap Action:** Navigate to child profile

---

## 2. Child Profile (`/child/[id]`)

**Header:**
- Back arrow
- Child name + emoji (large)
- Age

**Buttons:**
- "Add Observation" (amber, prominent)
- "Generate Report" (sage, only if 5+ observations)

**Observations List:**
- Shows all observations, newest first
- Each observation:
  - Cleaned text
  - Date
  - Colored domain tags below

**Empty State:**
- "No observations yet. Tap 'Add Observation' to get started."

---

## 3. Voice Capture (`/capture`)

**Full Screen (dark background - #1f2937)**

**Status Text:**
- Before: "Ready to Record" + "Tap the mic to start recording"
- During: "Listening..." + "Speak clearly about what you observed"

**Center:**
- Large circular amber button (128x128)
- Mic icon (or stop icon when recording)
- Pulsing animation when recording

**Flow:**
- Tap mic → Recording starts
- After 3 seconds → Auto-navigate to review

---

## 4. Observation Review (`/observation/review`)

**Header:**
- Back arrow
- "Review Observation" heading

**Sections:**

1. **Transcription**
   - White card with border
   - Shows mock transcribed text

2. **Developmental Domains (AI-tagged)**
   - Colored tag chips
   - Mock tags: "Problem Solving", "Fine Motor Skills", "Cognitive Development"

3. **Helper Text**
   - Amber info box
   - "Review the transcription and tags. In Phase 2, you'll be able to edit these before saving."

4. **Confirm Button**
   - "Confirm & Save" (amber)
   - Navigates back to dashboard

---

## 5. Report View (`/report/[childId]`)

**Header:**
- Back arrow
- "[Child's Name]'s Report"
- "Based on X observations"

**Sections:**

1. **Report Period**
   - Amber box
   - "February – April 2025"

2. **Developmental Domains Covered**
   - All unique tags from observations
   - Displayed as colored chips

3. **Summary & Recommendations**
   - White card with border
   - Mock narrative text about child's development
   - Covers multiple domains
   - Ends with recommendations

4. **Export Button**
   - "Share / Export" with icon (sage)
   - Shows alert: "Export feature coming in Phase 2!"

---

## Color Reference

**Primary Colors:**
- Amber: #f0a038 (buttons, headings, accents)
- Sage: #8fb186 (secondary actions, info text)
- Background: #faf7f2 (warm off-white)

**Domain Colors:**
- Cognitive: Blue (#3b82f6)
- Language: Purple (#8b5cf6)
- Social-Emotional: Pink (#ec4899)
- Fine Motor: Orange (#f97316)
- Gross Motor: Green (#22c55e)
- Self-Care: Teal (#14b8a6)
- Creative: Yellow (#eab308)

**Neutral:**
- Text: #2d2d2d (dark gray)
- Card: #ffffff (white)
- Border: #e8e0d5 (warm gray)
- Sage text: #6b7280 (medium gray)

---

## Navigation Hierarchy

```
Root
├── Dashboard (default)
│   └── Child Profile
│       ├── Capture
│       │   └── Review
│       │       └── (back to Dashboard)
│       └── Report
└── (back to Dashboard from anywhere)
```

---

## Seed Data Preview

**Children:**
1. Maya Chen (Age 3) - 6 observations
2. Liam Murphy (Age 3) - 2 observations
3. Emma Rodriguez (Age 3) - 2 observations
4. Noah Kim (Age 3) - 1 observation
5. Sophie Anderson (Age 3) - 1 observation
6. James Thompson (Age 3) - 1 observation

**Note:** Only Maya has 5+ observations, so only Maya shows "Report ready" badge.
