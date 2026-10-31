// Genesis Agent Factory — deterministic registry/policy core.
// This module is a local, dependency-free foundation, not a hosted autonomous runtime.
export const STATUS = Object.freeze(["draft","testing","approved","active","paused","retired"]);
export const LEVEL = Object.freeze(["L0","L1","L2","L3","L4-human-reserved"]);
const DEFAULT_LIMITS = Object.freeze({max_child_agents:3,max_depth:2,max_concurrent_tasks:5,max_runtime_minutes:30,spend_limit_usd:0,external_actions_allowed:false});
const RESERVED = new Set(["spend_money","legal_commitment","send_external_message","publish_sensitive_data","change_account_security","grant_human_reserved_authority"]);
const now = () => new Date().toISOString();
const clone = x => structuredClone(x);
export class PolicyError extends Error { constructor(message){super(message);this.name="PolicyError";} }
export function createRegistry({clock=now}={}) {
  const agents=new Map(), events=[];
  const event=(type,agentId,details={})=>events.push({at:clock(),type,agent_id:agentId,details:clone(details)});
  function get(id){const a=agents.get(id);if(!a)throw new PolicyError("Unknown agent: "+id);return clone(a);}
  function lineage(parentId){const chain=[];let id=parentId;while(id){const a=agents.get(id);if(!a)throw new PolicyError("Parent agent not found.");chain.push(a);id=a.parent_agent_id;if(chain.length>5)throw new PolicyError("Parent cycle or depth limit.");}return chain;}
  function create(input,{createdBy="human-founder",approvedBy=null}={}) {
    if(!input||!/^([a-z0-9][a-z0-9-]{2,63})$/.test(input.id||""))throw new PolicyError("Agent id must be 3–64 lowercase letters, numbers, or hyphens.");
    if(agents.has(input.id))throw new PolicyError("Agent id already exists.");
    if(!input.name||!input.mission||!input.project_id)throw new PolicyError("Name, mission, and project are required.");
    const parent=input.parent_agent_id?agents.get(input.parent_agent_id):null;
    if(input.parent_agent_id&&!parent)throw new PolicyError("Parent agent not found.");
    if(parent){
      if(parent.status!=="active")throw new PolicyError("Only an active parent may create a child.");
      const chain=lineage(parent.id), depth=chain.length;
      if(depth>DEFAULT_LIMITS.max_depth)throw new PolicyError("Maximum agent depth reached.");
      if([...agents.values()].filter(a=>a.parent_agent_id===parent.id&&a.status!=="retired").length>=parent.limits.max_child_agents)throw new PolicyError("Parent child-agent limit reached.");
    }
    const requested=new Set(input.permissions||[]);
    if([...requested].some(p=>RESERVED.has(p)))throw new PolicyError("Human-reserved permission requested.");
    const allowed=parent?new Set(parent.permissions):requested;
    const permissions=[...requested].filter(p=>allowed.has(p));
    if(permissions.length!==requested.size)throw new PolicyError("Child permissions cannot exceed parent permissions.");
    const limits={...DEFAULT_LIMITS,...(parent?parent.limits:{}),...(input.limits||{})};
    if(parent)for(const k of Object.keys(limits))if(typeof limits[k]==="number"&&limits[k]>parent.limits[k])throw new PolicyError("Child limit cannot exceed parent limit: "+k);
    if(limits.spend_limit_usd!==0||limits.external_actions_allowed!==false)throw new PolicyError("Default factory policy prohibits spending and external actions.");
    const agent={id:input.id,name:input.name,version:input.version||"0.1.0",status:"draft",parent_agent_id:input.parent_agent_id||null,project_id:input.project_id,mission:input.mission,authority_level:input.authority_level||"L1",permissions,denied_actions:[...new Set([...(input.denied_actions||[]),...RESERVED])],limits,acceptance_criteria:input.acceptance_criteria||[],verification_method:input.verification_method||"Independent human or quality-agent review",created_at:clock(),created_by:createdBy,approved_by:null};
    if(!LEVEL.includes(agent.authority_level)||agent.authority_level==="L4-human-reserved")throw new PolicyError("Invalid agent authority level.");
    agents.set(agent.id,agent);event("agent.created",agent.id,{status:"draft",parent_agent_id:agent.parent_agent_id});
    return get(agent.id);
  }
  function transition(id,next,{actor="human-founder",evidence=null}={}) {
    const a=agents.get(id);if(!a)throw new PolicyError("Unknown agent: "+id);
    const allowed={draft:["testing","retired"],testing:["draft","approved","retired"],approved:["active","paused","retired"],active:["paused","retired"],paused:["active","retired"],retired:[]};
    if(!allowed[a.status]?.includes(next))throw new PolicyError("Invalid status transition: "+a.status+" → "+next);
    if(next==="approved"||next==="active")if(actor!=="human-founder")throw new PolicyError("Human approval is required.");
    if(next==="approved"&&!evidence)throw new PolicyError("Approval requires test evidence.");
    const previous=a.status;a.status=next;if(next==="approved"||next==="active")a.approved_by=actor;
    event("agent.status_changed",id,{from:previous,to:next,actor,evidence:!!evidence});return get(id);
  }
  function can(id,permission){const a=agents.get(id);return !!a&&a.status==="active"&&a.permissions.includes(permission)&&!RESERVED.has(permission);}
  function pause(id,{actor="human-founder",reason="Safety pause"}={}){const a=agents.get(id);if(!a)throw new PolicyError("Unknown agent.");if(!["active","approved","testing","draft"].includes(a.status))return get(id);a.status="paused";event("agent.paused",id,{actor,reason});return get(id);}
  return Object.freeze({create,get,transition,can,pause,list:()=>[...agents.values()].map(clone),audit:()=>clone(events)});
}
