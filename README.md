# ITSINDA RYACU — v0.6 (work in progress)

## Added in this version
- Mutuelle de Santé savings planning: household label, target amount, due date, weekly/monthly savings plan.
- Record savings entries and see target progress, remaining amount, due-date countdown, and history.
- Supabase migration with owner-scoped Row Level Security.
- Added Vite/React project configuration files that were missing from the supplied ZIP.

## Important limitations
- This is a savings-planning and tracking feature, not an official Mutuelle payment integration.
- Entries are user-recorded and marked as `recorded`; they are not independently verified payments.
- Before handling real funds, implement a trusted treasurer confirmation process, immutable audit logs, backups, access testing, and approved payment-provider integration.
- Apply `supabase/migration_mutuelle_savings_v04.sql` in the Supabase SQL Editor after reviewing it.
- Existing `supabase/schema.sql` should only be run in a new project or after careful review.

## Run locally
1. Install Node.js LTS.
2. Run `npm install`.
3. Copy `.env.example` to `.env.local` and add your Supabase URL and publishable/anon key.
4. Apply the SQL schema and the Mutuelle migration in Supabase.
5. Run `npm run dev`.

## Deploy
Push the project to a private GitHub repository, import it into Vercel, configure the two environment variables, and deploy. Connect a domain after testing.

## v0.5 work in progress: SMS OTP, penalties, and trial metadata

This archive adds the first UI/database implementation for:

- Phone-number sign-in with one-time SMS codes (OTP).
- A legacy email/password sign-in path so existing email-based users are not immediately locked out.
- Group-specific penalty rules (fixed, daily, weekly, or manually set amount), approval, penalty records, and a database audit log.
- Three-month trial metadata for each newly created group, with initial Pro price display (RWF 3,000 / 5,000 per month).

### Required setup before testing

1. Configure `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `.env.local` using the project's public/publishable key. Never put a `service_role` or `sb_secret` key in the frontend.
2. In Supabase Authentication, enable Phone and configure an SMS provider with valid credentials and adequate balance. The OTP UI will not send SMS until this is configured.
3. Review and run `supabase/migration_v05_penalties_trial.sql` in the Supabase SQL Editor. Back up important data first and read the SQL before applying it.
4. Test with a test phone number and test group before using real member data.

### Important limits that remain

- National ID verification is **not connected**. The app intentionally does not collect or store the raw national ID number. To verify that a phone number matches an ID, an approved identity-verification service or a properly authorized manual workflow is still required.
- The Pro subscription screen and 3-month trial dates are metadata only. No payment provider, Mobile Money transaction, webhook, or server-side payment verification is connected yet. Do not charge customers or restrict access based on these UI values alone.
- The current penalty records identify the member by a typed display name; linking them to a verified member directory is a later step. A marked “paid” record is a manual record only, not confirmation from a bank or Mobile Money provider.
- Penalty approvers are assigned using their Supabase user UUID. A friendlier member/role management workflow remains to be built.
- The build could not be fully run in this environment because npm dependencies could not be downloaded. TypeScript/TSX syntax transpilation succeeded, but a full dependency-aware build and live Supabase test are still required.


## v0.6 work in progress: member ledger, announcements and group end date

This version adds:
- Member directory per group (name, phone, join date and expected monthly contribution).
- Per-member contribution entries with a separate confirmation status. Only confirmed entries count toward the paid total.
- Member-by-member summary: expected total (monthly due multiplied by calendar months since joining), confirmed paid, pending recorded payments and remaining amount. This is a simple estimate; groups with irregular schedules must adjust their rules.
- Planned group end date and a reminder-days setting. The app displays countdowns, but scheduled automatic reminders are not enabled yet.
- Group announcements saved in the database and a Supabase Edge Function to send the announcement to active members via Twilio SMS.

### Required setup for v0.6
1. Back up your database and review `supabase/migration_v06_members_announcements.sql`, then apply it in Supabase SQL Editor. Do not rerun `schema.sql` on your existing project.
2. Deploy `supabase/functions/send-group-announcement/index.ts` as the Edge Function `send-group-announcement`.
3. Set function secrets: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, and `TWILIO_FROM_NUMBER`. Never put the service-role key or Twilio token in frontend `.env` or share them in chat.
4. Test with a small test group and numbers you control before sending to all members. SMS charges may apply. The function reports messages accepted by Twilio; that is not necessarily proof of delivery to the handset.
5. Only the account that created the group can currently manage the directory and send group announcements. Committee/member roles and member self-service linking still need a dedicated workflow.

### Important limits
- The migration adds a member directory separate from Supabase Authentication; it does not automatically create member login accounts or link phone numbers to identity-verified accounts.
- Expected contributions are estimated from monthly dues and calendar months since joining; they do not model pauses, partial periods, waivers, or group-specific schedules.
- The planned end-date reminder is stored and countdown is shown, but automated scheduled SMS reminders require a scheduled Edge Function/cron job, which is not included yet.
- Build and live Supabase/Twilio tests must be completed before production use.
