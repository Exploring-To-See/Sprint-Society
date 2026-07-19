# Mobile Build Guide — Android (APK) + iOS (Xcode)

The client ships as a **Capacitor 8** native app from the same codebase and the
same `main` branch that runs the web app on Vercel. Nothing about the web
deployment changes: the native apps are thin shells around the built SPA that
talk to the **same Vercel API and the same Supabase (Postgres) database**.

```
┌─────────────┐   ┌─────────────┐   ┌──────────────┐
│  Web (PWA)  │   │ Android APK │   │  iOS (Xcode) │
│   Vercel    │   │  Capacitor  │   │  Capacitor   │
└──────┬──────┘   └──────┬──────┘   └──────┬───────┘
       │  same-origin    │ https           │ https
       ▼                 ▼                 ▼
        https://app.sprintsociety.in/api  (Vercel serverless)
                         │
                         ▼
              Supabase Postgres (DATABASE_URL)
```

## How the native builds find the backend

- Web build: `VITE_API_URL` unset → same-origin `/api` (unchanged).
- Native build: `client/src/lib/backend.ts` detects Capacitor and uses
  `VITE_API_URL` if baked in at build time, otherwise it falls back to
  `https://app.sprintsociety.in/api` (see `client/src/lib/native.ts`).
- WebSockets stay **off** (`VITE_ENABLE_WS` unset) — the client polls over
  REST, which works against the serverless backend from web and native alike.
- CORS: `server/src/app.ts` allows the Capacitor WebView origins
  (`https://localhost`, `http://localhost`, `capacitor://localhost`) in
  addition to `CLIENT_URL`.

## Android (APK)

### Prerequisites
- Android Studio (SDK 34+) — or just the Android SDK + JDK 21 for CLI builds
- Node 20+

### Build
```bash
# from the repo root
npm run android:sync    # builds the client and syncs it into client/android
npm run android:open    # opens the project in Android Studio
# or produce a debug APK directly:
npm run android:apk     # → client/android/app/build/outputs/apk/debug/app-debug.apk
```

For a **release** APK/AAB: in Android Studio use Build → Generate Signed
Bundle/APK with your keystore (never commit the keystore).

### Permissions (Android)
`client/android/app/src/main/AndroidManifest.xml` declares:
- `INTERNET`
- `ACCESS_COARSE_LOCATION` + `ACCESS_FINE_LOCATION` — the system location
  popup is requested **at runtime** the first time GPS is used (run tracker
  start, Events → Nearby), via `@capacitor/geolocation`.

Camera / microphone are **not** declared because no current feature captures
from them (profile photos use the system file picker, which needs no
permission). When such a feature ships, add `android.permission.CAMERA` /
`RECORD_AUDIO` here and the runtime request in code.

## iOS (Xcode)

The `client/ios/` project is committed and ready. iOS builds require a Mac
with Xcode 15+.

### Build
```bash
# on the Mac, from the repo root
npm install             # once
npm run ios:sync        # builds the client and syncs it into client/ios
npm run ios:open        # opens App.xcworkspace/project in Xcode
```
In Xcode: set your Team under Signing & Capabilities, pick a device, Run.
For TestFlight/App Store: Product → Archive.

### Permissions (iOS)
`client/ios/App/App/Info.plist` already contains the usage-description strings
iOS requires (the app crashes without them when the API is touched):
- `NSLocationWhenInUseUsageDescription` — GPS run tracking
- `NSLocationAlwaysAndWhenInUseUsageDescription` — tracking with screen off
- `NSCameraUsageDescription`, `NSPhotoLibraryUsageDescription`,
  `NSPhotoLibraryAddUsageDescription` — profile photos / share cards
- `NSMicrophoneUsageDescription` — future voice interactions

The actual permission popups appear only when the feature is first used.

## What is native-aware in the client

| Piece | File | Behavior |
|-------|------|----------|
| Platform detection | `client/src/lib/native.ts` | `isNative` + default API origin |
| API base | `client/src/lib/backend.ts` | absolute origin inside the shells |
| GPS | `client/src/lib/geolocation.ts` | Capacitor Geolocation on native (system permission popups), `navigator.geolocation` on web |
| Back button / status bar / splash | `client/src/hooks/useNativeApp.ts` | Android back navigates the SPA, dark status bar, splash hide |
| Voice coach | `client/src/lib/coach/voice.ts` | Web Speech synthesis — works in Android WebView + iOS WKWebView |

## Signup / login in the native apps

Email+password and phone login work unchanged (JWT stored in localStorage,
sent as a Bearer header — no cookies, so no cross-origin cookie issues).

**Google Sign-In caveat:** the web Google Identity Services button can be
blocked inside embedded WebViews by Google's policy. If it misbehaves in the
shipped app, the fix is the Capacitor Social Login plugin (native Google
sheet) posting the same `credential` to `POST /api/auth/google` — the backend
needs no change. Email/password always works meanwhile.

## Testing checklist (device)

- [ ] Fresh install → signup with email → dashboard loads (data from Supabase)
- [ ] Login/logout, kill app, reopen → still logged in
- [ ] Run tracker → START → **system location popup appears** → route draws on the map in real time
- [ ] Voice coach: brief spoken at start, cues during the run, recap after saving
- [ ] Events → Nearby → location popup (if not already granted)
- [ ] Android hardware back navigates back, minimizes from dashboard
- [ ] Save run → appears in history; check the same account on the web app shows it too (same DB)
