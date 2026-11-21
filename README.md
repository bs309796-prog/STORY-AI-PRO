# STORY AI PRO — starter project

A responsive dark purple/blue React + Vite starter for a Hindi AI story-video SaaS.

## What works now
- Responsive dashboard and navigation
- Supabase email/password sign-in UI when configured
- Story idea form with genre and duration
- Gemini-powered Hindi story generation through a Supabase Edge Function (after setup)
- Local browser project saving and TXT script download
- Supabase SQL schema with per-user Row Level Security

## Important: not a finished production SaaS
Characters, image generation/editing, Hindi voice generation, video rendering/export, payments, subscription billing, admin analytics, credit metering, moderation, and production security review are not implemented yet. The Characters, Voice Studio and Video Maker pages are clearly marked as coming next. Preview mode uses sample demo text, not real AI. No public website is deployed by this package.

## Run locally
1. Install Node.js 20+.
2. In this folder run `npm install` then `npm run dev`.
3. To enable real accounts, create a Supabase project and copy `.env.example` to `.env`; fill in the project URL and anon key. Never put a service-role key or Gemini key in frontend `.env`.
4. Run `supabase/schema.sql` in the Supabase SQL editor.
5. Deploy the `generate-story` Edge Function and set `GEMINI_API_KEY` as a server-side function secret. Set Supabase project secrets as required by Supabase deployment docs.
6. Set the Supabase Auth site URL and allowed redirect URLs to your eventual hosted domain.

## Before charging customers
Add server-enforced credit accounting, payment provider webhooks, subscription state validation, rate limits, audit logs, privacy policy, terms, deletion/export flows, and test all authorization rules. Never trust credit totals or payment status sent by the browser.
