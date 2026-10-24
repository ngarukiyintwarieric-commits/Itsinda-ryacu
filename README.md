# ITSINDA RYACU — starter project

This is a working **UI prototype** for a multilingual savings-group and Mutuelle planning app. It is not yet a live financial service.

## Requirements
- Node.js 20.19+ or 22.12+
- npm
- For Android packaging: Android Studio and a supported Java/Android SDK setup

## Run locally
1. Extract the ZIP.
2. Open a terminal in the `itsinda-ryacu-starter` folder.
3. Run:
   ```bash
   npm install
   npm run dev
   ```
4. Open the local URL printed by Vite, usually `http://localhost:5173`.

## Languages
Use the language selector in the top-right corner: Kinyarwanda, English, French, and Swahili.

## Supabase setup (not connected by default)
1. Create a Supabase project.
2. Copy `.env.example` to `.env.local`.
3. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` using the project's URL and publishable key (or legacy anon key).
4. In Supabase SQL Editor, review `supabase/schema.sql` and run it in the new project.
5. Restart the Vite dev server after editing environment variables.

Never put a `service_role` or `sb_secret` key in browser code. The current UI does not yet read/write Supabase data.

## Build for web
```bash
npm run build
npm run preview
```
Upload the contents of `dist/` to a static host such as Netlify. Do not deploy until `npm run build` succeeds.

## Prepare Android project
```bash
npm run android:add
npm run android:sync
npm run android:open
```
These commands require the Android development tools. They create/open an Android wrapper around the built web app; they do not publish it to Google Play automatically.

## Not implemented yet
- Authentication and account recovery
- Real savings ledger and loan workflows
- Payment provider integrations (MTN MoMo, Airtel Money, bank)
- Official Mutuelle data lookup/payment integration
- SMS and WhatsApp messaging provider integration
- Production-grade financial audit trail, consent, security review, and regulatory checks

All displayed financial values are zero and any displayed activity is explanatory only. No real payments are made by this prototype.


## Version 0.2 — account access

This version adds a Supabase email/password sign-up and sign-in screen, session persistence, sign-out, and a profile upsert when a newly created account receives an immediate session. If email confirmation is enabled, the user must confirm their email before signing in.

Before use:
1. Copy `.env.example` to `.env.local`.
2. Set the Supabase project URL and **publishable key** (or legacy anon key) in `.env.local`.
3. Review and run `supabase/schema.sql` in the Supabase SQL Editor.
4. In Supabase Authentication settings, configure the site's allowed redirect URLs and email confirmation as appropriate.
5. Run `npm install` and `npm run build` in an environment with Node.js installed.

Security and scope:
- Never use a `service_role` or `sb_secret` key in the browser app.
- The dashboard is still a prototype and does not yet show real savings, loan balances, or Mutuelle payments.
- No actual payment is initiated or verified by this version.
- Authentication and SQL have not been validated against your live Supabase project. Review policies before production use.


## v0.3 — group lifecycle and monthly overview
- Create a group with its start date, planned monthly contribution, target amount and member count.
- Close an active group with an end date and a note.
- View a monthly overview and export a CSV summary.
- If you already ran the older schema, review and run `supabase/migration_groups_reports_v03.sql` in Supabase SQL Editor. For a new project, use the updated `supabase/schema.sql`.
- The monthly report currently summarizes group setup/status only. It is **not** a financial statement: savings, expenses, loans and repayments need a proper auditable ledger and verified payment workflow before the report can be considered complete.
- Without Supabase configured and signed in, group records exist only in the current browser session and are lost when the page is reloaded.
