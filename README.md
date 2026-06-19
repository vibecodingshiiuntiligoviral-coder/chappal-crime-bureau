# Chappal Crime Bureau

Fake-government community desk for missing chappals. Users can anonymously file a public "Footwear FIR", browse live cases, send preset tips, generate roleplay hostage notes, mark cases as found, and download shareable poster images.

## Stack

- Next.js App Router
- React 19
- Tailwind CSS 4
- Firebase Anonymous Auth
- Firestore
- Client-side canvas poster and note downloads

## Setup

1. Copy `.env.example` to `.env.local`.
2. Fill in your Firebase web app config values.
3. Enable `Anonymous` sign-in in Firebase Authentication.
4. Create a Firestore database.
5. Deploy the included Firestore rules:

```bash
firebase deploy --only firestore:rules
```

If Firebase CLI is not set up yet:

```bash
npm install -g firebase-tools
firebase login
firebase use <your-project-id>
firebase deploy --only firestore:rules
```

## Local Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Firestore Shape

Top-level collection:

- `cases/{caseId}`

Subcollections:

- `cases/{caseId}/tips/{tipId}`
- `cases/{caseId}/reports/{reportId}`

## Safety Boundaries In V1

- No phone number field.
- No exact address field.
- No payments.
- No private chat.
- No external APIs beyond Firebase.
- No unsafe HTML injection.
- No dangerous browser permissions.
- Tips use preset buttons plus a short validated custom field.
- Reports are private moderation writes, not public accusations.

## Known Limits

- Content safety is mostly client-side plus structural Firestore rules. Without a trusted backend moderator, someone who bypasses the app UI could still try to send policy-breaking text directly to Firestore.
- Tip counts are calculated with Firestore count queries from the client, which is simpler for v1 but less efficient than a backend-maintained counter at scale.
- Reports are stored for future moderation, but there is no admin dashboard in this version.
