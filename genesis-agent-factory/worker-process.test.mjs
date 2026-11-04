import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { TaskStore } from "./task-store.mjs";

const worker = fileURLToPath(new URL("./worker.mjs", import.meta.url));
const run = file => spawnSync(process.execPath, [worker], {
  env: { ...process.env, GENESIS_TASK_STORE: file, GENESIS_WORKER_ID: "process-test" },
  encoding: "utf8", timeout: 10000
});

test("worker process completes one persisted task with an ordered audit trail", async () => {
  const dir = await mkdtemp(join(tmpdir(), "genesis-process-"));
  try {
    const file = join(dir, "tasks.json");
    const store = new TaskStore(file);
    const first = await store.enqueue({ type: "echo", payload: { message: "smoke-test" } });
    const second = await store.enqueue({ type: "health-check" });
    const outcome = run(file);
    assert.equal(outcome.status, 0, outcome.stderr);
    assert.deepEqual(JSON.parse(outcome.stdout), {
      status: "completed", task_id: first.id, result: { message: "smoke-test" }
    });
    const reopened = new TaskStore(file);
    const tasks = await reopened.list();
    assert.equal(tasks.find(t => t.id === first.id).status, "completed");
    assert.equal(tasks.find(t => t.id === second.id).status, "queued");
    assert.deepEqual((await reopened.audit()).filter(e => e.task_id === first.id).map(e => e.type),
      ["task.queued", "task.claimed", "task.completed"]);
  } finally { await rm(dir, { recursive: true, force: true }); }
});

test("worker process rejects unsupported tasks and records failure", async () => {
  const dir = await mkdtemp(join(tmpdir(), "genesis-process-"));
  try {
    const file = join(dir, "tasks.json");
    const store = new TaskStore(file);
    const task = await store.enqueue({ type: "unsupported-action", maxAttempts: 1 });
    const outcome = run(file);
    assert.equal(outcome.status, 1);
    const reopened = new TaskStore(file);
    const saved = (await reopened.list()).find(t => t.id === task.id);
    assert.equal(saved.status, "failed");
    assert.equal(saved.result, null);
    assert.match(saved.error, /Unsupported task type/);
    assert.deepEqual((await reopened.audit()).map(e => e.type),
      ["task.queued", "task.claimed", "task.failed"]);
  } finally { await rm(dir, { recursive: true, force: true }); }
});
