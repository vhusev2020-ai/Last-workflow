-- Genesis durable task queue. Service-role only; never expose service credentials to clients.
create extension if not exists pgcrypto;

create table if not exists public.genesis_tasks (
  id uuid primary key default gen_random_uuid(),
  task_type text not null check (task_type in ('echo','health-check')),
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'queued' check (status in ('queued','running','completed','failed')),
  attempts integer not null default 0 check (attempts >= 0),
  max_attempts integer not null default 3 check (max_attempts between 1 and 10),
  available_at timestamptz not null default now(),
  lease_until timestamptz,
  lease_token uuid,
  result jsonb,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists genesis_tasks_ready_idx
  on public.genesis_tasks (available_at, created_at)
  where status = 'queued';
create index if not exists genesis_tasks_expired_idx
  on public.genesis_tasks (lease_until)
  where status = 'running';

create table if not exists public.genesis_task_events (
  id bigint generated always as identity primary key,
  task_id uuid references public.genesis_tasks(id) on delete cascade,
  event_type text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.genesis_tasks enable row level security;
alter table public.genesis_task_events enable row level security;
revoke all on public.genesis_tasks, public.genesis_task_events from anon, authenticated;
grant all on public.genesis_tasks, public.genesis_task_events to service_role;

create or replace function public.genesis_claim_task(p_lease_seconds integer default 120)
returns setof public.genesis_tasks
language plpgsql
security definer
set search_path = public
as $$
declare
  picked public.genesis_tasks;
begin
  if p_lease_seconds < 30 or p_lease_seconds > 900 then
    raise exception 'lease duration out of range';
  end if;

  update public.genesis_tasks
     set status = case when attempts >= max_attempts then 'failed' else 'queued' end,
         lease_until = null, lease_token = null, updated_at = now(),
         last_error = coalesce(last_error, 'Worker lease expired')
   where status = 'running' and lease_until < now();

  select * into picked
    from public.genesis_tasks
   where status = 'queued' and available_at <= now()
     and attempts < max_attempts
   order by created_at
   for update skip locked
   limit 1;

  if not found then return; end if;

  update public.genesis_tasks
     set status = 'running', attempts = attempts + 1,
         lease_until = now() + make_interval(secs => p_lease_seconds),
         lease_token = gen_random_uuid(), updated_at = now()
   where id = picked.id
   returning * into picked;

  insert into public.genesis_task_events(task_id,event_type,details)
  values (picked.id,'claimed',jsonb_build_object('attempt',picked.attempts));
  return next picked;
end;
$$;

create or replace function public.genesis_finish_task(
  p_task_id uuid, p_lease_token uuid, p_success boolean,
  p_result jsonb default null, p_error text default null
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare changed integer;
begin
  update public.genesis_tasks
     set status = case when p_success then 'completed'
                       when attempts >= max_attempts then 'failed'
                       else 'queued' end,
         result = case when p_success then p_result else result end,
         last_error = case when p_success then null else left(coalesce(p_error,'Task failed'),1000) end,
         available_at = case when p_success then available_at else now() + interval '1 minute' end,
         lease_until = null, lease_token = null, updated_at = now()
   where id = p_task_id and status = 'running' and lease_token = p_lease_token;
  get diagnostics changed = row_count;
  if changed = 1 then
    insert into public.genesis_task_events(task_id,event_type,details)
    values (p_task_id,case when p_success then 'completed' else 'attempt_failed' end,
            jsonb_build_object('error',left(coalesce(p_error,''),1000)));
    return true;
  end if;
  return false;
end;
$$;

revoke all on function public.genesis_claim_task(integer) from public, anon, authenticated;
revoke all on function public.genesis_finish_task(uuid,uuid,boolean,jsonb,text) from public, anon, authenticated;
grant execute on function public.genesis_claim_task(integer) to service_role;
grant execute on function public.genesis_finish_task(uuid,uuid,boolean,jsonb,text) to service_role;

-- Controlled enqueue endpoint for the two allowlisted task types.
create or replace function public.genesis_enqueue_task(
  p_task_type text, p_payload jsonb default '{}'::jsonb, p_max_attempts integer default 3
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare new_id uuid;
begin
  if p_task_type not in ('echo','health-check') then
    raise exception 'task type is not allowlisted';
  end if;
  if p_max_attempts < 1 or p_max_attempts > 10 then
    raise exception 'max attempts out of range';
  end if;
  insert into public.genesis_tasks(task_type,payload,max_attempts)
  values (p_task_type,coalesce(p_payload,'{}'::jsonb),p_max_attempts)
  returning id into new_id;
  insert into public.genesis_task_events(task_id,event_type,details)
  values (new_id,'queued',jsonb_build_object('task_type',p_task_type));
  return new_id;
end;
$$;

revoke all on function public.genesis_enqueue_task(text,jsonb,integer) from public, anon, authenticated;
grant execute on function public.genesis_enqueue_task(text,jsonb,integer) to service_role;
