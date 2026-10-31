# Genesis background runtime activation

The durable runtime needs a PostgreSQL database and a scheduled worker. This repository contains only the local prototype today; no cloud worker is active.

## Owner setup
1. Create a private Supabase project.
2. Apply the SQL migration in this directory's supabase/migrations folder.
3. Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY as private GitHub Actions secrets.
4. Add GENESIS_BACKGROUND_ENABLED=true as a GitHub Actions repository variable.
5. Enable Actions. The scheduled runner wakes every 15 minutes; scheduling is best-effort, not real-time.

Never commit service credentials or place them in browser code. Start with the fixed allowlist of echo and health-check task types. Do not enable arbitrary code execution, spending, external communications, or sensitive-data workflows.
