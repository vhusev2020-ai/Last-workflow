# Genesis Agent Factory — Registry Prototype

Dependency-free JavaScript foundation for agent records, bounded child creation, status transitions, inherited permissions, pause behavior, and audit events.

## Requirements
Node.js 18+ (uses built-in modules and `structuredClone`).

## Run tests
```sh
node --test genesis-agent-factory/registry.test.mjs
```

## Important limitations
- In-memory only: records disappear when the process exits.
- No authentication, database, API server, worker, scheduler, model connection, or live agent execution.
- Founder approval is represented by an explicit actor argument for prototype testing; production must derive identity from authenticated server-side sessions, never client-supplied strings.
- The registry intentionally defaults to zero spending and no external actions.
- This is not production security. Do not expose it as an internet-facing permission service until persistent storage, authentication, server-side authorization, audit durability, and security tests exist.
