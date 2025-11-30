# KruMaYung Dashboard
React + Vite dashboard that reads IoT telemetry from Firebase Realtime Database and visualizes it.

## Prerequisites
- Node 20.19+ or 22.12+ (Vite 7 requires this; an `.nvmrc` is provided for `nvm use`)
- npm (ships with Node)

## Quick start
1) Copy `.env.example` to `.env` and fill in your Firebase project values. These are used in `src/config/firebase.ts`.
2) Install dependencies: `npm install`
3) Run the dev server: `npm run dev` (open the URL printed by Vite)

## Build and preview
- Production build: `npm run build`
- Preview built assets: `npm run preview`

## Data expectations
- The dashboard currently listens to `/devices/rpi-cedt-node-01/telemetry` and `/devices/esp32-cedt-01/telemetry` in your Firebase Realtime Database. Adjust the IDs in `src/pages/SensorDashboard.tsx` or your backend to match.
