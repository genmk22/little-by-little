# little-by-little

A responsive, English-language check-in website for adults. Visitors choose mood tags and practical preferences, then receive a few curated activity ideas. V1 uses a local, rules-based catalog; no AI provider or media API is called.

## Run locally

1. Install Node.js 20.9 or newer and pnpm.
2. Install packages with `pnpm install`.
3. Copy `.env.example` to `.env.local` if you want to enable authentication and saved history.
4. Start the app with `pnpm dev` and open `http://localhost:3000`.

The check-in and recommendations work without Supabase credentials. Sign-in and saved history stay unavailable until Supabase is configured.

## Supabase setup

1. Create a Supabase project and copy its project URL and publishable/anon key into `.env.local` as `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
2. Run [`supabase/migrations/202610200001_mood_sessions.sql`](supabase/migrations/202610200001_mood_sessions.sql) in the Supabase SQL editor.
3. For account deletion, add the service-role key as `SUPABASE_SERVICE_ROLE_KEY`. This key is used only on the server and must never use the `NEXT_PUBLIC_` prefix.
4. In Supabase Auth URL settings, set the local site URL to `http://localhost:3000` and add `http://localhost:3000/auth/callback` as a redirect URL. Add the deployed preview's matching callback after deployment.
5. To enable Google sign-in, create OAuth credentials in Google Cloud and configure the Google provider in Supabase Auth. Use Supabase's provider callback URL in the Google OAuth client, then add the app URL and `/auth/callback` to Supabase's allowed redirects.

The database stores only a timestamp, mood tags, and selected activity IDs. Row-level security limits each account to its own saved sessions. A visitor's optional note, structured check-in answers, and safety answer are not stored. The note stays only in in-memory page state and is not included in any request.

## Routes

- `POST /api/recommendations` — accepts mood tags and structured preferences; rejects a supplied note and returns curated catalog cards.
- `GET /api/sessions` — returns the signed-in person's saved check-ins.
- `POST /api/sessions` — explicitly saves mood tags and selected activity IDs only.
- `DELETE /api/sessions/:id` — deletes one saved check-in under RLS.
- `DELETE /api/account` — deletes the signed-in account through the server-only Supabase Admin API; requires `SUPABASE_SERVICE_ROLE_KEY`.

## Safety and privacy

This site provides everyday activity ideas, not diagnosis, therapy, or emergency care. The optional note is not interpreted, so the site cannot detect risk from it. Choosing a suicide or self-harm mood tag opens a direct immediate-danger question; an answer of “yes” or “not sure” pauses activity suggestions and prioritizes human support. The urgent-support link remains in the sticky navigation and footer. If someone may act now, the page advises contacting local emergency services or going to a nearby emergency department. The global directory is [Find A Helpline](https://findahelpline.com/); its verification information is at [findahelpline.com/verification](https://findahelpline.com/verification). Check both links before each public release.

Before a public launch, review the experience and crisis-support links with appropriate safety reviewers. Use only non-sensitive sample check-ins when reviewing a preview.

## Deploy preview

Connect the public `little-by-little` GitHub repository to Vercel and use a preview deployment for review. Add Supabase values as Vercel environment variables when ready; never commit `.env.local` or service credentials. Vercel Hobby is intended for personal, non-commercial use. Supabase Free projects can pause after seven days of inactivity; these plans are suitable for a prototype, not a dependable public mental-health service.

## Future AI seam

The UI uses the `Activity` card format and calls one recommendations route. An AI provider can later be added behind that route while keeping the check-in flow stable. Any future model integration needs an explicit data-minimization and safety review; the optional note must not be silently added to model input.
