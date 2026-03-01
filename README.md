# VibeLoop (React + Firebase)

VibeLoop is a client-only React app built for easy deployment on Firebase Hosting's free tier.

The previous Next.js + Prisma backend flow has been replaced with Firebase services:
- Firebase Auth for login/register
- Cloud Firestore for direct messages, public/private posts, comments, and reactions
- Firebase Hosting for SPA deployment

## Stack

- React 19 + TypeScript
- Vite 7
- React Router
- Tailwind CSS + custom theme CSS
- Firebase Auth + Firestore

## Routes

- `/` home
- `/login`
- `/register`
- `/public` (public Soap Box entries)
- `/dashboard`
- `/dashboard/create-message`
- `/dashboard/create-entry`

## Local setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env` from `.env.example` and fill Firebase web config values:

```env
VITE_FIREBASE_API_KEY="..."
VITE_FIREBASE_AUTH_DOMAIN="..."
VITE_FIREBASE_PROJECT_ID="..."
VITE_FIREBASE_STORAGE_BUCKET="..."
VITE_FIREBASE_MESSAGING_SENDER_ID="..."
VITE_FIREBASE_APP_ID="..."
VITE_USE_FIREBASE_EMULATORS="false"
```

3. Start dev server:

```bash
npm run dev
```

4. Build:

```bash
npm run build
```

## Firebase project setup

If starting from scratch on a free plan:

1. Create/select project:

```bash
firebase use <project-id>
```

2. Create a Web App and get config:

```bash
firebase apps:create WEB omega-web
firebase apps:sdkconfig WEB <app-id>
```

3. Enable Email/Password provider in Firebase Console:
- Authentication -> Sign-in method -> Email/Password -> Enable

4. Deploy Firestore rules and indexes:

```bash
firebase deploy --only firestore:rules,firestore:indexes
```

5. Deploy Hosting:

```bash
npm run build
firebase deploy --only hosting
```

## Firestore collections

- `users/{uid}`
  - `name`, `email`, timestamps
- `messages/{id}`
  - `authorId`, `authorName`, `title`, `content|videoUrl`, `recipientIds`, `recipientNames`, `recipientEmails`, timestamps
- `entries/{id}`
  - `authorId`, `authorName`, `title`, `content|videoUrl`, `type`, `isPublic`, `entryInterval`, `nextEntryDate`, timestamps
- `entryComments/{id}`
  - `entryId`, `authorId`, `authorName`, `content`, timestamps
- `entryReactions/{entryId_userId}`
  - `entryId`, `userId`, `userName`, `reactionType` (`love|facts|wow|support`), timestamps

## Security config

- Firestore rules: `firestore.rules`
- Firestore indexes: `firestore.indexes.json`

Deploy them with Firebase CLI before using the app in production.
