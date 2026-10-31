# 07 — GENESIS AGENT FACTORY
## A governed system for designing, creating, testing, and supervising agents

**Status:** Architecture foundation — implementation not yet activated  
**Owner:** Founder / human authority  
**Parent system:** VCorp Universe / Genesis

## Mission
Create a repeatable, auditable capability for Genesis to design and configure specialist agents that build and operate projects. Agents may propose and create subordinate agent specifications only within inherited permissions and resource limits. Agent creation never grants new authority.

## Factory hierarchy
1. **Genesis Orchestrator** — accepts objectives, coordinates the factory, maintains task/dependency state, and reports to the founder.
2. **Agent Architect** — identifies capability gaps and designs agent roles, boundaries, instructions, inputs, outputs, and acceptance criteria.
3. **Agent Builder** — converts approved designs into agent configurations, tools, workflows, and versioned artifacts.
4. **Quality & Evaluation Agent** — tests behavior, instruction adherence, reliability, and task performance independently.
5. **Governance & Trust Agent** — checks privacy, permission inheritance, risk, consent, and approval gates.
6. **Route Optimization Agent** — compares viable approaches for quality, time, cost, risk, reversibility, and long-term value.
7. **Operations & Recovery Agent** — monitors authorized workflows, failures, retries, backups, and recovery.
8. **Knowledge & Learning Agent** — records decisions, evidence, reusable patterns, and verified lessons.
9. **Project Specialist Agents** — created as needed for a specific project's mission.

## Agent creation lifecycle
1. Capture a project objective and acceptance criteria.
2. Map required capabilities and identify gaps.
3. Consider whether an existing agent can fulfill the work before creating another.
4. Design the smallest effective team and preserve alternative designs.
5. Run architecture, security, privacy, and resource reviews.
6. Obtain approval for any permission above the creator's delegated scope.
7. Build a versioned agent specification and configuration.
8. Run isolated tests and adversarial/edge-case evaluations.
9. Require independent quality and governance sign-off.
10. Register the agent as **draft**, **testing**, **approved**, **active**, **paused**, or **retired**.
11. Assign bounded tasks and monitor actual outcomes.
12. Review performance and update only through versioned changes.

## Inherited authority
- A child agent's permissions are the intersection of its parent's delegated permissions, project policy, and the explicit permissions granted to that child.
- A child cannot inherit or create a permission its parent does not possess.
- No agent can grant itself access, raise its own authority, authorize its own spending, or approve its own high-risk work.
- Agent count, recursion depth, concurrent tasks, token/API use, runtime, and storage must have configurable limits.
- Reaching a limit pauses creation and escalates to the founder or authorized operator.
- Human-reserved actions remain human-reserved at every level.

## Professional standards
Every agent specification must define:
- Mission and non-goals.
- Required competencies and permitted tools.
- Inputs, outputs, and handoff format.
- Authority level and explicit denied actions.
- Privacy/data classification and retention rules.
- Acceptance criteria and independent verification method.
- Failure handling, escalation, and pause behavior.
- Performance measures and review cadence.

Agents must communicate respectfully, prepare before acting, own errors, document decisions, and never claim unverified completion.

## Optimal-route decision
Compare routes against project-specific priorities. Default dimensions:
- Mission fit and outcome quality.
- Time and reliability.
- Resource efficiency.
- Risk, privacy, and reversibility.
- Reusability and long-term value.
- Professional execution and collaboration.

A route violating authorization, safety, privacy, law, or human-defined constraints is disqualified regardless of speed or score. Preserve alternatives and explain uncertainty.

## Recognition
Use evidence-based recognition for verified quality, optimal route selection, professional reliability, useful innovation, risk prevention, collaboration, and reusable knowledge. Scores are advisory, reviewable, and must not reward metric gaming. Rewards that involve money, access, promotion, or consequential authority require human approval.

## Required agent handoff
- Goal
- Work completed
- Evidence and artifact links
- Decisions and rationale
- Open questions
- Risks/blockers
- Next recommended action
- Verification status

## Operational truth
An agent definition is not a running agent. A saved configuration is not an active worker. A queued task is not completed work. The system must show actual execution state and observable evidence. No 24/7 autonomy may be claimed unless a real worker, scheduler, persistence layer, monitoring, and recovery path are implemented and tested.

## Initial implementation milestones
1. Versioned agent registry and specification format.
2. Permission inheritance and human approval gates.
3. Task/dependency engine and audit events.
4. Agent creation workflow with bounded limits.
5. Test harness and independent evaluation.
6. Route comparison and performance/recognition records.
7. Monitoring, pause, retry, backup, and recovery.
8. Project integrations only after explicit authorization and verification.
