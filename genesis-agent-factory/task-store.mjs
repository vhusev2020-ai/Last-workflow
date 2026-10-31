// File-backed task queue for the Genesis background worker prototype.
// Use a private writable data directory in deployment; never commit runtime data.
import {readFile,writeFile,rename,mkdir} from "node:fs/promises";
import {dirname} from "node:path";
import {randomUUID} from "node:crypto";
const iso=()=>new Date().toISOString();
export class TaskStore {
  constructor(file,{clock=iso,leaseMs=5*60_000,maxAttempts=3}={}){this.file=file;this.clock=clock;this.leaseMs=leaseMs;this.maxAttempts=maxAttempts;this.lock=Promise.resolve();}
  async #locked(fn){const prior=this.lock;let release;this.lock=new Promise(r=>release=r);await prior;try{return await fn();}finally{release();}}
  async #read(){try{return JSON.parse(await readFile(this.file,"utf8"));}catch(e){if(e.code==="ENOENT")return {version:1,tasks:[],events:[]};throw e;}}
  async #write(db){await mkdir(dirname(this.file),{recursive:true});const tmp=this.file+"."+randomUUID()+".tmp";await writeFile(tmp,JSON.stringify(db,null,2),{mode:0o600});await rename(tmp,this.file);}
  async enqueue({type="general",payload={},createdBy="operator",maxAttempts=this.maxAttempts}){return this.#locked(async()=>{const db=await this.#read(),task={id:randomUUID(),type,payload,status:"queued",attempts:0,max_attempts:maxAttempts,created_at:this.clock(),updated_at:this.clock(),lease:null,result:null,error:null,created_by:createdBy};db.tasks.push(task);db.events.push({at:this.clock(),type:"task.queued",task_id:task.id});await this.#write(db);return structuredClone(task);});}
  async claim(workerId="worker"){return this.#locked(async()=>{const db=await this.#read(),now=Date.parse(this.clock());for(const t of db.tasks){if(t.status==="running"&&t.lease&&Date.parse(t.lease.expires_at)<=now){t.status=t.attempts>=t.max_attempts?"failed":"queued";t.lease=null;t.error="Worker lease expired";db.events.push({at:this.clock(),type:"task.lease_expired",task_id:t.id});}}
    const t=db.tasks.find(x=>x.status==="queued");if(!t){await this.#write(db);return null;}t.status="running";t.attempts++;t.updated_at=this.clock();t.lease={worker_id:workerId,expires_at:new Date(now+this.leaseMs).toISOString()};db.events.push({at:this.clock(),type:"task.claimed",task_id:t.id,worker_id:workerId,attempt:t.attempts});await this.#write(db);return structuredClone(t);});}
  async complete(id,result){return this.#finish(id,"completed",{result});}
  async fail(id,error){return this.#locked(async()=>{const db=await this.#read(),t=db.tasks.find(x=>x.id===id);if(!t||t.status!=="running")throw Error("Task is not running.");t.status=t.attempts>=t.max_attempts?"failed":"queued";t.error=String(error);t.lease=null;t.updated_at=this.clock();db.events.push({at:this.clock(),type:"task.failed",task_id:id,status:t.status});await this.#write(db);return structuredClone(t);});}
  async #finish(id,status,{result}){return this.#locked(async()=>{const db=await this.#read(),t=db.tasks.find(x=>x.id===id);if(!t||t.status!=="running")throw Error("Task is not running.");t.status=status;t.result=result??null;t.lease=null;t.updated_at=this.clock();db.events.push({at:this.clock(),type:"task.completed",task_id:id});await this.#write(db);return structuredClone(t);});}
  async list(){return this.#locked(async()=>structuredClone((await this.#read()).tasks));}
  async audit(){return this.#locked(async()=>structuredClone((await this.#read()).events));}
}
