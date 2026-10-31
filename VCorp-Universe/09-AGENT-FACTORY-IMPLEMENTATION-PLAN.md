# 09 — AGENT FACTORY IMPLEMENTATION PLAN

## Delivery approach
Build in small, reversible stages. Prefer free tools and existing infrastructure. Do not deploy new production behavior or connect external services without explicit approval.

## Stage 0 — Preserve and map
- Identify the canonical VCorp Universe repository and current Genesis components.
- Keep existing projects intact.
- Work on a dedicated branch.
- Record current deployment, data storage, and access boundaries.
- Never place secrets or private project data in this public repository.

## Stage 1 — Registry and policy core
- Implement the agent record format from 08-AGENT-REGISTRY-SCHEMA.json.
- Add versioning, status transitions, parent-child relationships, and audit events.
- Enforce permission intersection server-side.
- Add global pause and per-agent pause.
- Default all newly created agents to draft, zero spending, and no external actions.

## Stage 2 — Task and orchestration core
- Persist objectives, tasks, dependencies, owners, deadlines, and evidence.
- Add idempotency keys, bounded retries, timeout handling, and task state transitions.
- Separate task assignment, execution, and verification.
- Require evidence before marking a task complete.

## Stage 3 — Agent Factory workflow
- Capability-gap analysis.
- Agent design templates.
- Approval and build pipeline.
- Isolated evaluation harness.
- Independent quality/governance gates.
- Versioned activation and rollback.

## Stage 4 — Optimal route and recognition
- Record alternative routes and trade-offs.
- Compare estimates with actual results.
- Store quality, efficiency, risk, collaboration, and professionalism evidence.
- Recognition starts advisory-only; no automatic money, access, promotion, or authority changes.

## Stage 5 — Operations and integrations
- Health checks, monitoring, backups, restore tests, and incident log.
- Connect project-specific tools only with scoped approval.
- Verify every integration and deployment independently.
- Maintain export/import paths to avoid lock-in.

## Release gates
A stage is not complete until its acceptance tests pass and evidence is recorded. A deployment marked READY is not proof of browser behavior or end-to-end operation. Production activation requires explicit founder approval.

## First acceptance tests
1. A draft agent can be created from a valid template.
2. Invalid or over-limit agent definitions are rejected.
3. Child permissions cannot exceed parent permissions.
4. Human-reserved actions cannot be approved by agents.
5. A paused agent cannot receive new work.
6. Agent creation stops at configured depth/count limits.
7. A task cannot become complete without verification evidence.
8. Every state transition produces an audit event.
9. Recognition cannot change permissions or spend money.
10. A backup can be restored into a test environment.
