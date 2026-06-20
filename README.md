# Chappal Crime Bureau

Fake-government community desk for missing chappals. Users can anonymously file a public "Footwear FIR", browse live cases, send preset tips, generate roleplay hostage notes, mark cases as found, and download shareable poster images.

## Stack

- Next.js App Router
- React 19
- Tailwind CSS 4
- Supabase anonymous auth
- Supabase Postgres tables: `cases`, `tips`, `reports`
- Supabase Storage bucket: `case-images`
- Client-side canvas poster and note downloads

## Setup

1. Copy `.env.example` to `.env.local`.
2. Fill in `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
3. Enable anonymous sign-ins in Supabase Auth.
4. Make sure your existing Supabase SQL schema, RLS policies, and Storage policies are already applied.
5. Confirm the public storage bucket is named `case-images`.

## Local Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Supabase Shape

- `public.cases`
- `public.tips`
- `public.reports`

Storage path:

- `case-images/{userId}/{caseId}/main.webp`

## Safety Boundaries In V1

- No phone number field.
- No exact address field.
- No payments.
- No private chat.
- No external APIs beyond Supabase.
- No unsafe HTML injection.
- No dangerous browser permissions.
- Tips use preset buttons plus a short validated custom field.
- Reports are private moderation writes, not public accusations.
- Image uploads are single-image, client-validated, and compressed to WebP before upload when possible.

## Known Limits

- Content safety is mostly client-side plus your Supabase SQL and RLS policies. Without a trusted moderation backend, someone who bypasses the app UI could still try to send policy-breaking text directly to Supabase.
- Tip counts are synced from client writes for v1. If this app grows, move that counter to a database trigger or Edge Function.
- Reports are stored for future moderation, but there is no admin dashboard in this version.
