# Phase 2 Implementation Plan

## Overview
Phase 2 adds real functionality: voice recording, database persistence, AI transcription/tagging, and PDF export.

## Prerequisites
- Supabase project (create at supabase.com)
- Claude API key (from Anthropic)
- Apple Developer account (for iOS voice permissions)

---

## 1. Supabase Setup

### Database Tables

**teachers**
- id (uuid, primary key)
- email (text, unique)
- name (text)
- school_name (text)
- created_at (timestamp)

**children**
- id (uuid, primary key)
- teacher_id (uuid, foreign key → teachers.id)
- first_name (text)
- last_name (text)
- date_of_birth (date)
- photo (text, emoji or URL)
- created_at (timestamp)

**observations**
- id (uuid, primary key)
- child_id (uuid, foreign key → children.id)
- raw_transcript (text)
- cleaned_observation (text)
- tags (text[], array)
- confirmed (boolean)
- created_at (timestamp)

**reports**
- id (uuid, primary key)
- child_id (uuid, foreign key → children.id)
- period_start (date)
- period_end (date)
- domain_summaries (jsonb)
- overall_narrative (text)
- generated_at (timestamp)

### Row Level Security (RLS)
- Enable RLS on all tables
- Teachers can only see their own children/observations/reports
- Policy: `teacher_id = auth.uid()` for children table
- Policy: `child.teacher_id = auth.uid()` for observations/reports (via join)

### Environment Variables
```bash
EXPO_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ... (server-side only)
CLAUDE_API_KEY=sk-ant-... (server-side only)
```

---

## 2. Authentication

### Install Dependencies
```bash
npx expo install @supabase/supabase-js @react-native-async-storage/async-storage
```

### Create Auth Context
- `lib/supabase.ts` - Supabase client
- `context/AuthContext.tsx` - Auth state provider
- `app/(auth)/login.tsx` - Login screen
- `app/(auth)/signup.tsx` - Sign up screen
- Update `app/_layout.tsx` to check auth state

### Flow
- Unauthenticated → Show login
- Authenticated → Show dashboard
- Store session in AsyncStorage

---

## 3. Real Voice Recording

### Install Dependencies
```bash
npx expo install expo-av
```

### Update Capture Screen
- Request microphone permissions
- Replace mock timer with real audio recording
- `expo-av` Recording API:
  - `Audio.Recording.createAsync()`
  - `recording.startAsync()`
  - `recording.stopAndUnloadAsync()`
  - Get URI of recorded audio file

### Add Permissions (app.json)
```json
{
  "expo": {
    "ios": {
      "infoPlist": {
        "NSMicrophoneUsageDescription": "LittleLens needs microphone access to record observations"
      }
    },
    "android": {
      "permissions": ["RECORD_AUDIO"]
    }
  }
}
```

---

## 4. AI Transcription & Tagging

### Create API Route (Backend)
Option A: Supabase Edge Function
- Create `supabase/functions/process-observation/index.ts`
- Upload audio to Supabase Storage
- Send audio to Claude API for transcription
- Send transcript to Claude API for tagging (use prompt with domain list)
- Return: `{ transcript, cleanedObservation, tags }`

Option B: Next.js API Route (if adding web backend)
- `/api/process-observation` POST endpoint
- Same flow as above

### Update Review Screen
- After recording, upload audio file
- Call API to process
- Show loading state
- Display real transcription + AI tags
- Allow editing before saving

### Prompt Template for Tagging
```
You are helping a preschool teacher tag observations with developmental domains.

Observation: "{transcript}"

Available domains:
- Cognitive Development
- Fine Motor Skills
- Gross Motor Skills
- Social-Emotional
- Language & Communication
- Creative Expression
- Self-Care & Independence
- Problem Solving

Return 2-4 relevant domains as JSON: ["domain1", "domain2", ...]
```

---

## 5. Edit Observations

### Update Review Screen
- Make transcription editable (TextInput)
- Allow removing/adding tags (toggle buttons)
- Save button validates and creates DB record

### UI Components
- `<EditableObservation />` - TextInput wrapper
- `<TagSelector />` - Checkboxes for all domains
- "Confirm & Save" → Calls Supabase insert

---

## 6. Data Persistence

### Replace Seed Data
- `lib/useChildren.ts` - Hook that fetches from Supabase
- `lib/useObservations.ts` - Hook that fetches from Supabase
- Update all screens to use real data from hooks
- Handle loading/error states

### Real-time Updates (Optional)
- Use Supabase realtime subscriptions
- Auto-refresh observations when new ones are added

---

## 7. Report Generation

### Generate Report Flow
- Fetch all observations for child
- Send to Claude API with prompt:
  - Child name, age, observation period
  - All observation texts
  - Request: Domain summaries + overall narrative
- Parse response and save to `reports` table
- Display in Report screen

### Prompt Template for Reports
```
You are writing a developmental report for a preschool child.

Child: {firstName}, Age {age}
Period: {startDate} to {endDate}
Observations ({count}):
{observations.map(o => `- ${o.cleanedObservation}`).join('\n')}

Generate:
1. Domain summaries (2-3 sentences each for domains present)
2. Overall narrative (4-5 paragraphs covering growth, strengths, recommendations)

Use warm, professional tone appropriate for parents.
```

---

## 8. PDF Export

### Install Dependencies
```bash
npx expo install expo-print expo-sharing
```

### Export Button Implementation
- Use `expo-print` to generate PDF from HTML
- Template the report as HTML with inline CSS
- `expo-sharing` to share/save PDF
- Filename: `{childName}-report-{date}.pdf`

### HTML Template
```tsx
const htmlContent = `
  <html>
    <head>
      <style>
        body { font-family: Arial; padding: 40px; }
        h1 { color: #f0a038; }
        .domain { margin: 20px 0; }
      </style>
    </head>
    <body>
      <h1>${child.firstName}'s Developmental Report</h1>
      <p>Period: ${formatDate(report.periodStart)} – ${formatDate(report.periodEnd)}</p>
      ${report.overallNarrative}
    </body>
  </html>
`;
```

---

## 9. Migration Strategy

### Step-by-Step
1. Set up Supabase project + tables
2. Add authentication (keep seed data as fallback)
3. Replace seed data with real DB queries (one screen at a time)
4. Add voice recording (keep mock as fallback during dev)
5. Integrate Claude API for transcription
6. Integrate Claude API for tagging
7. Add edit functionality
8. Add report generation
9. Add PDF export
10. Remove all seed data and fallbacks

### Environment-Aware Code
```tsx
const USE_MOCK_DATA = __DEV__ && !process.env.EXPO_PUBLIC_SUPABASE_URL;

if (USE_MOCK_DATA) {
  return SEED_CHILDREN;
} else {
  return await supabase.from('children').select('*');
}
```

---

## 10. Testing Checklist

- [ ] Sign up new teacher
- [ ] Log in / log out
- [ ] Add a child
- [ ] Record an observation
- [ ] Verify transcription is accurate
- [ ] Verify tags are relevant
- [ ] Edit observation before saving
- [ ] View observation in child profile
- [ ] Generate report (5+ observations)
- [ ] Export report as PDF
- [ ] Share PDF via iOS share sheet
- [ ] Verify RLS (can't see other teachers' data)

---

## Estimated Effort

**Supabase Setup:** 2 hours
**Authentication:** 3 hours
**Voice Recording:** 2 hours
**Claude API Integration:** 4 hours
**Edit Functionality:** 2 hours
**Data Migration:** 3 hours
**Report Generation:** 3 hours
**PDF Export:** 2 hours
**Testing & Polish:** 4 hours

**Total:** ~25 hours

---

## Security Notes

- NEVER expose service role key in client code
- All Claude API calls must go through backend (Edge Function or Next.js API)
- Audio files should be uploaded to Supabase Storage (not sent directly to client)
- Enable RLS on all tables before going live
- Use `anon` key in client, `service_role` key only in server functions

---

## Cost Estimates (Monthly)

**Supabase Free Tier:**
- 500MB database
- 1GB file storage
- 2GB bandwidth
- Should cover ~50 teachers with light usage

**Claude API:**
- Transcription: ~$0.01 per observation (Haiku)
- Tagging: ~$0.005 per observation (Haiku)
- Report: ~$0.03 per report (Sonnet)
- 100 observations/month = ~$2
- 20 reports/month = ~$0.60

**Total:** ~$3/month at 100 obs/20 reports scale
