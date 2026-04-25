# Amazing Trip

Personal travel planning app built with React, Vite, Tailwind CSS, React Router, Zustand, and lucide-react.

## Development

```bash
npm install
npm run dev
```

## Google Login Setup

1. Create a Firebase project.
2. In Firebase Authentication, enable Google as a sign-in provider.
3. Create a web app in Firebase and copy the config values.
4. Copy `.env.example` to `.env.local`.
5. Paste your Firebase web config into `.env.local`.

Firebase keys for a web app are not passwords, but `.env.local` should stay local because each developer or deployment can use a different project.

## Firestore Sharing Setup

1. In Firebase Console, open Firestore Database.
2. Create a database.
3. Start in production mode.
4. Choose a nearby region.
5. Deploy rules from this repo:

```bash
firebase deploy --only firestore:rules
```

Trips are stored in the `trips` collection. A signed-in user can see a trip when their Google email is listed in `memberEmails`.

## PWA / Mobile Install

This app includes a web app manifest, icon, and service worker. After deploying to Firebase Hosting, friends can open the hosted URL on mobile and install it:

- Android Chrome: menu → Add to Home screen / Install app
- iPhone Safari: Share → Add to Home Screen

Deploy to Firebase Hosting:

```bash
npm run deploy
```

After deploy, add the hosting domain to Firebase Authentication → Settings → Authorized domains.

## Build

```bash
npm run build
```
