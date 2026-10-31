import {TaskStore} from "./task-store.mjs";
const [command,type,...rest]=process.argv.slice(2);
const store=new TaskStore(process.env.GENESIS_TASK_STORE||"./.genesis-data/tasks.json");
if(command==="add"){const payload=rest.length?JSON.parse(rest.join(" ")):{};console.log(JSON.stringify(await store.enqueue({type,payload}),null,2));}
else if(command==="list")console.log(JSON.stringify(await store.list(),null,2));
else if(command==="audit")console.log(JSON.stringify(await store.audit(),null,2));
else {console.error("Usage: node queue.mjs add <echo|health-check> '{\"message\":\"hello\"}' | list | audit");process.exitCode=2;}
