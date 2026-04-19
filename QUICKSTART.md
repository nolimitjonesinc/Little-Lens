# Quick Start Guide

## Running the App

1. Start the Expo development server:
   ```bash
   cd /Users/dannyjonesphotography/Desktop/LittleLens-Mobile
   npx expo start
   ```

2. Choose your platform:
   - Press `i` for iOS Simulator
   - Press `a` for Android Emulator
   - Scan the QR code with Expo Go app on your phone

## Testing the App Flow

1. **Dashboard** - You'll see 6 children (Maya, Liam, Emma, Noah, Sophie, James)
2. **Tap a child** - Opens their profile with existing observations
3. **Add Observation** (amber button) - Opens the capture screen
4. **Tap the mic** - Mock recording for 3 seconds, then auto-navigates to review
5. **Confirm & Save** - Returns to dashboard (no real save yet - Phase 2)
6. **Generate Report** (sage button) - Only visible if child has 5+ observations

## Phase 1 Limitations

- All data is seed data (no database)
- Voice capture is mocked (3-second timer)
- Transcription and tags are hardcoded
- Reports use mock narrative text
- Export button shows an alert (not functional)

## What Works

- Complete navigation flow
- Beautiful warm design (amber/sage color scheme)
- Responsive layout
- Animated mic button
- Domain-colored tags
- Progress indicators on child cards

## Next Phase

Phase 2 will add:
- Supabase for real data persistence
- Real voice recording with Expo Audio
- Claude API for transcription and auto-tagging
- Edit observations before saving
- PDF export for reports
