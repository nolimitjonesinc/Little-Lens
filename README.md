# LittleLens Mobile - Phase 1

A React Native mobile app for preschool teachers to capture voice observations and generate developmental reports.

## Tech Stack

- Expo SDK 54
- Expo Router (file-based routing)
- React Native 0.81.5
- NativeWind 4.x (Tailwind CSS for React Native)
- TypeScript

## Getting Started

```bash
# Install dependencies (already done)
npm install

# Start the development server
npx expo start

# Run on iOS simulator
npx expo start --ios

# Run on Android emulator
npx expo start --android
```

## Project Structure

```
app/
  _layout.tsx              # Root layout with Expo Router
  index.tsx                # Redirects to dashboard
  (app)/
    _layout.tsx            # App layout
    dashboard.tsx          # Main screen - children grid
    child/[id].tsx         # Child profile with observations
    capture.tsx            # Voice capture (mock)
    observation/review.tsx # Review & confirm observation
    report/[childId].tsx   # Generated report view

components/
  ChildCard.tsx            # Child card for dashboard
  DomainTag.tsx            # Colored domain tag chip
  ObservationItem.tsx      # Single observation display
  MicButton.tsx            # Animated mic button

lib/
  types.ts                 # TypeScript type definitions
  theme.ts                 # Design tokens and domain colors
  seed-data.ts             # Mock children and observations
  utils.ts                 # Helper functions
```

## Features (Phase 1)

- Dashboard with children grid
- Child profiles showing observations
- Mock voice capture with animation
- Observation review screen
- Report generation view
- All data uses seed data (no backend yet)

## Design Tokens

- Amber: #f0a038 (primary actions)
- Sage: #8fb186 (secondary actions)
- Background: #faf7f2 (warm off-white)
- Card: #ffffff
- Border: #e8e0d5

## Next Steps (Phase 2)

- Integrate Supabase for data persistence
- Real voice recording with Expo Audio
- Claude API for transcription and tagging
- Edit observations before saving
- PDF export for reports
