import test from "node:test";
import assert from "node:assert/strict";
import {mkdtemp,rm} from "node:fs/promises";
import {join} from "node:path";
import {tmpdir} from "node:os";
import {TaskStore} from "./task-store.mjs";
test("queue persists tasks and records completion",async()=>{const dir=await mkdtemp(join(tmpdir(),"genesis-"));try{const s=new TaskStore(join(dir,"tasks.json"));const t=await s.enqueue({type:"echo",payload:{message:"hello"}});const claimed=await s.claim("test-worker");assert.equal(claimed.id,t.id);await s.complete(t.id,{ok:true});assert.equal((await s.list())[0].status,"completed");assert.equal((await s.audit()).length,3);}finally{await rm(dir,{recursive:true,force:true});}});
test("failed tasks retry until attempt limit",async()=>{const dir=await mkdtemp(join(tmpdir(),"genesis-"));try{const s=new TaskStore(join(dir,"tasks.json"),{maxAttempts:2});await s.enqueue({type:"bad"});let t=await s.claim();t=await s.fail(t.id,"temporary");assert.equal(t.status,"queued");t=await s.claim();t=await s.fail(t.id,"again");assert.equal(t.status,"failed");}finally{await rm(dir,{recursive:true,force:true});}});
test("expired worker leases are reclaimed",async()=>{const dir=await mkdtemp(join(tmpdir(),"genesis-"));try{let ms=1000;const s=new TaskStore(join(dir,"tasks.json"),{clock:()=>new Date(ms).toISOString(),leaseMs:100,maxAttempts:2});await s.enqueue({type:"echo"});const first=await s.claim("one");ms+=101;const second=await s.claim("two");assert.equal(second.id,first.id);assert.equal(second.attempts,2);}finally{await rm(dir,{recursive:true,force:true});}});
