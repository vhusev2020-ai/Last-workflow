// Run one queued task per invocation. Designed for scheduled/background execution.
import {TaskStore} from "./task-store.mjs";
import {randomUUID} from "node:crypto";
const file=process.env.GENESIS_TASK_STORE||"./.genesis-data/tasks.json";
const workerId=process.env.GENESIS_WORKER_ID||"worker-"+randomUUID();
const store=new TaskStore(file);
const task=await store.claim(workerId);
if(!task){console.log(JSON.stringify({status:"idle"}));process.exit(0);}
try {
  // Only explicitly supported internal task types are handled here.
  // No arbitrary shell, network, spending, account, or external-message actions.
  let result;
  if(task.type==="echo") result={message:String(task.payload?.message??"")};
  else if(task.type==="health-check") result={healthy:true,checked_at:new Date().toISOString()};
  else throw new Error("Unsupported task type: "+task.type);
  await store.complete(task.id,result);
  console.log(JSON.stringify({status:"completed",task_id:task.id,result}));
} catch(error) {
  const updated=await store.fail(task.id,error instanceof Error?error.message:String(error));
  console.error(JSON.stringify({status:updated.status,task_id:task.id,error:updated.error}));
  process.exitCode=1;
}
