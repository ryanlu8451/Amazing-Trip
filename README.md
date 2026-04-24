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

## Build

```bash
npm run build
```
