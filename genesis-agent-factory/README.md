# Genesis Agent Factory — Background Runtime Prototype

Dependency-free Node.js 20+ prototype with a file-backed task queue and one-task worker. The queue persists between invocations and recovers abandoned tasks through expiring leases.

## Run locally
```sh
node --test genesis-agent-factory/*.test.mjs
GENESIS_TASK_STORE=./.genesis-data/tasks.json node genesis-agent-factory/queue.mjs add echo '{"message":"Genesis is awake"}'
GENESIS_TASK_STORE=./.genesis-data/tasks.json node genesis-agent-factory/worker.mjs
GENESIS_TASK_STORE=./.genesis-data/tasks.json node genesis-agent-factory/queue.mjs list
```

Supported task types are deliberately limited to `echo` and `health-check`. No arbitrary code execution, model calls, shell commands, network actions, spending, or external communications are enabled.

## Background scheduling
The GitHub Actions workflow runs automated tests on changes. A scheduled workflow can invoke a worker, but GitHub-hosted runner storage is ephemeral; it is not a durable database or an always-on worker. For real unattended execution, connect a private persistent database and authenticated API, then run the worker on a host with durable storage or a managed queue. Do not put private task data in this public repository.

## Limitations
- File-backed store is suitable for local/single-process prototype use, not concurrent multi-instance production.
- Use Postgres transactions/row locks or a managed queue before multiple workers.
- Authentication and server-enforced permissions are not implemented here.
- Agent registry remains an in-memory prototype.
- No live autonomous agents or production deployment are created by this package.
