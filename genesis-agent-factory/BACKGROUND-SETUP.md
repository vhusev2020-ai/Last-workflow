# Genesis background runtime setup

This branch now contains a durable Supabase queue migration and a bounded GitHub Actions worker. It is **not active** until the project owner completes the private setup below.

## 1. Create the database
1. Create a Supabase project on the free tier if its limits fit your use.
2. Open **SQL Editor** in Supabase.
3. Open and copy the complete contents of `supabase/migrations/202610310001_genesis_task_queue.sql` from this repository.
4. Run it in the SQL Editor. It creates the task/event tables and two service-role-only RPC functions. Row-level security is enabled; browser/anonymous roles receive no table or function access.

## 2. Configure GitHub privately
In the repository settings:
- **Settings → Secrets and variables → Actions → Secrets**: add `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.
- **Settings → Secrets and variables → Actions → Variables**: add `GENESIS_BACKGROUND_ENABLED` with value `true`.

Never paste the service-role key into chat, commit it, or put it in browser code. If it is exposed, rotate it in Supabase immediately.

## 3. Enable and verify
1. Ensure GitHub Actions is enabled for the repository.
2. Open **Actions → Genesis Background Worker** and use **Run workflow** after configuration.
3. A scheduled run is attempted every 15 minutes; GitHub scheduling is best-effort and not real-time.
4. The worker processes at most one task per run and supports only `echo` and `health-check`.

## Security and limits
- The service-role credential exists only in the GitHub Actions worker environment.
- The SQL queue uses row locking and lease tokens to prevent two workers from completing the same claimed task.
- Expired leases are returned to the queue, subject to retry limits.
- Do not add arbitrary shell/code execution, spending, external communications, account changes, or sensitive-data workflows without a separate security design and explicit owner authorization.
- This prototype does not yet provide a user-facing task submission API, authentication for operators, or a production monitoring dashboard.
