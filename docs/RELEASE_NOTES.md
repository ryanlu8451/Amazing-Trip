# Amazing Trip Release Notes

本文件是正式版本功能紀錄。未來新增功能、修正 bug、QA 結果或部署版本，請在此文件最上方新增版本段落。

## 1.0.0 - QA Test Release

Release date: 2026-04-28  
Test URL: https://amazing-trip-f5732.web.app

### QA Hotfix - Firebase Auth Domain

- Fixed Google sign-in initialization when the deployed app is served from `amazing-trip-f5732.web.app`.
- Normalized Firebase Auth config so Firebase Hosting production domains use the current serving domain, matching Firebase's redirect sign-in guidance for `web.app`.
- Switched Google sign-in initiation to popup mode on all supported browsers to avoid mobile redirect failures caused by third-party storage restrictions.
- Reverted Auth initialization to Firebase's official SDK config domain (`amazing-trip-f5732.firebaseapp.com`) for popup sign-in stability.
- Added temporary QA diagnostics that surface the raw Firebase Auth error details in the login screen and console.
- Updated the Content Security Policy to allow Firebase Auth iframe/connect traffic from both Firebase app and hosting domains.
- Added Google Auth popup helper sources to the Content Security Policy, including `apis.google.com`, `accounts.google.com`, and `www.gstatic.com`.
- Expanded Google Auth helper CSP sources to include Google API, Google, and gstatic wildcard subdomains used by popup/redirect flows.
- Added a redirect fallback when the Google popup helper cannot start, so supported browsers can continue sign-in through a full-page Firebase redirect flow instead of stopping at `auth/internal-error`.
- Updated production Firebase Auth domain selection so `amazing-trip-f5732.web.app` uses the same `web.app` domain for the app and auth helper, matching Firebase redirect best practices for browsers that block third-party storage.
- Bumped the service worker cache again so devices refresh the auth-domain fix during QA.
- Relaxed frame protection from `DENY` / `frame-ancestors 'none'` to same-origin framing so Firebase Auth's hidden helper iframe can initialize.
- Added a clearer fallback message for `auth/internal-error` during Google sign-in.
- Bumped the service worker cache name so installed PWAs pick up the auth fix cleanly.

### Release Goal

此版本作為 Amazing Trip 第一個完整 QA 測試版本。產品目標是達到 app-like PWA 測試品質，但本階段不實際提交 App Store / Google Play。

### Core Features

- Google sign-in with Firebase Authentication.
- Firebase Hosting deployment.
- Firestore trip sync with owner/editor/viewer roles.
- Trip creation, editing, hiding, completion, and deletion.
- Timeline daily schedule management.
- Flight booking management.
- Hotel / Airbnb / lodging management.
- Budget planning, allocation, actual spending, and imported spending review.
- Trip Settings for solo/group mode, member roles, invite link sharing, native share sheet, and clipboard fallback.
- `/invite/:tripId` deep link support.
- English and Traditional Chinese UI.
- PWA manifest, app icons, service worker, and mobile install guidance.

### Import Features

- Flights text/PDF import with platform-aware parsing.
- Hotels text/PDF import with Airbnb, Agoda, and Booking.com parsing.
- Local browser PDF parsing; booking content is not sent to third-party parsing services.
- Import auto-fill requires user review before saving.
- Flights / Hotels optional details auto-expand after import for easier review.

### UX / Polish

- First-run onboarding flow.
- Product guide available from Settings.
- App-store-like mobile install instructions on Login and Settings.
- Route-level code splitting.
- Firestore rules role-value validation.
- Flights / Hotels / Budget long forms simplified into required and optional sections.
- Sticky save footer for Flights / Hotels / Budget form modals.

### Validation Completed

- `npm run lint`
- `npm run build`
- `npx firebase deploy --only firestore:rules --dry-run`
- Firebase Hosting deploy to the existing QA URL.

### Known Remaining QA

- iPhone Safari Add to Home Screen.
- Android Chrome Install app.
- Installed PWA Google login behavior.
- Owner/editor/viewer multi-account regression.
- Invite link regression on mobile browsers.
- Mobile form input QA for Flights / Hotels / Budget.

### Next Version Editing Rule

For future work:

1. Add a new version section above `1.0.0`.
2. Include date, test/prod URL, changed features, bug fixes, validation commands, and remaining QA.
3. Update `package.json` version when the change should be treated as a new released build.
