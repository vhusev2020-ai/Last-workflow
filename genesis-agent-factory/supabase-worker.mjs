const base = process.env.SUPABASE_URL?.replace(/\/$/, "");
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!base || !key) throw new Error("Missing Supabase worker configuration");

async function request(path, body) {
  const response = await fetch(`${base}/rest/v1/rpc/${path}`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`Supabase ${path} failed (${response.status}): ${text.slice(0,500)}`);
  return text ? JSON.parse(text) : null;
}

let claimed = await request("genesis_claim_task", { p_lease_seconds: 120 });
let task = Array.isArray(claimed) ? claimed[0] : claimed;

// Keep the service visibly alive: when the queue is empty, enqueue and run
// one bounded health check. This creates a durable heartbeat in Supabase.
if (!task) {
  await request("genesis_enqueue_task", {
    p_task_type: "health-check",
    p_payload: { source: "scheduled-worker-heartbeat" },
    p_max_attempts: 3
  });
  claimed = await request("genesis_claim_task", { p_lease_seconds: 120 });
  task = Array.isArray(claimed) ? claimed[0] : claimed;
}
if (!task) {
  console.log("No ready Genesis tasks; heartbeat enqueue did not yield a claim.");
  process.exit(0);
}

let success = true;
let result;
let error = null;
try {
  const payload = task.payload ?? {};
  switch (task.task_type) {
    case "echo":
      result = { echoed: payload.message ?? null, processed_at: new Date().toISOString() };
      break;
    case "health-check":
      result = { status: "ok", worker: "genesis-background-worker", checked_at: new Date().toISOString() };
      break;
    default:
      throw new Error("Task type is not allowlisted");
  }
} catch (e) {
  success = false;
  error = String(e?.message ?? e);
}

const finished = await request("genesis_finish_task", {
  p_task_id: task.id,
  p_lease_token: task.lease_token,
  p_success: success,
  p_result: success ? result : null,
  p_error: error
});
if (finished !== true) throw new Error("Task lease was lost before completion was recorded");
if (!success) throw new Error(error);
console.log(`Completed Genesis task ${task.id} (${task.task_type}).`);
