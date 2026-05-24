-- Mychael Mueller Logic OS Foundation
-- Additive Supabase/Postgres migration: brand -> concept -> store -> logic -> playbook -> memory -> training -> runtime.

create table if not exists public.operator_brands (
  id serial primary key,
  operator_id integer not null references public.operator_users(id) on delete cascade,
  name text not null,
  slug text not null,
  status text not null default 'active',
  brand_voice jsonb not null default '{}'::jsonb,
  brand_promise text,
  target_audience text,
  positioning text,
  visual_identity jsonb not null default '{}'::jsonb,
  strategy_notes text,
  created_at timestamp without time zone not null default now(),
  updated_at timestamp without time zone not null default now(),
  constraint operator_brands_operator_slug_unique unique (operator_id, slug)
);

create table if not exists public.operator_concepts (
  id serial primary key,
  operator_id integer not null references public.operator_users(id) on delete cascade,
  brand_id integer not null references public.operator_brands(id) on delete cascade,
  name text not null,
  slug text not null,
  status text not null default 'active',
  service_model text,
  menu_thesis text,
  pricing_strategy text,
  operating_model text,
  customer_promise text,
  constraints jsonb not null default '{}'::jsonb,
  created_at timestamp without time zone not null default now(),
  updated_at timestamp without time zone not null default now(),
  constraint operator_concepts_operator_slug_unique unique (operator_id, slug)
);

create table if not exists public.operator_store_profiles (
  id serial primary key,
  operator_id integer not null references public.operator_users(id) on delete cascade,
  location_id integer not null references public.operator_locations(id) on delete cascade,
  brand_id integer not null references public.operator_brands(id) on delete restrict,
  concept_id integer not null references public.operator_concepts(id) on delete restrict,
  store_name text,
  local_market text,
  opening_date date,
  status text not null default 'active',
  hours_profile jsonb not null default '{}'::jsonb,
  store_scorecard jsonb not null default '{}'::jsonb,
  local_constraints jsonb not null default '{}'::jsonb,
  created_at timestamp without time zone not null default now(),
  updated_at timestamp without time zone not null default now(),
  constraint operator_store_profiles_location_unique unique (location_id)
);

create table if not exists public.mm_logic_principles (
  id serial primary key,
  operator_id integer not null references public.operator_users(id) on delete cascade,
  scope_type text not null default 'operator',
  scope_id integer,
  principle text not null,
  rationale text,
  priority integer not null default 50,
  confidence numeric(5,2) not null default 0.80,
  source_type text,
  source_ref text,
  tags jsonb not null default '[]'::jsonb,
  active boolean not null default true,
  created_at timestamp without time zone not null default now(),
  updated_at timestamp without time zone not null default now()
);

create table if not exists public.mm_decision_rules (
  id serial primary key,
  operator_id integer not null references public.operator_users(id) on delete cascade,
  principle_id integer references public.mm_logic_principles(id) on delete set null,
  scope_type text not null default 'operator',
  scope_id integer,
  trigger_name text not null,
  trigger_condition jsonb not null default '{}'::jsonb,
  decision_action text not null,
  escalation_path text,
  severity text not null default 'medium',
  automation_level text not null default 'recommend',
  do_not_do text,
  success_metric text,
  active boolean not null default true,
  created_at timestamp without time zone not null default now(),
  updated_at timestamp without time zone not null default now()
);

create table if not exists public.mm_playbooks (
  id serial primary key,
  operator_id integer not null references public.operator_users(id) on delete cascade,
  brand_id integer references public.operator_brands(id) on delete set null,
  concept_id integer references public.operator_concepts(id) on delete set null,
  store_profile_id integer references public.operator_store_profiles(id) on delete set null,
  rule_id integer references public.mm_decision_rules(id) on delete set null,
  name text not null,
  category text not null default 'operations',
  objective text,
  when_to_use text,
  owner_role text,
  status text not null default 'draft',
  version integer not null default 1,
  created_at timestamp without time zone not null default now(),
  updated_at timestamp without time zone not null default now()
);

create table if not exists public.mm_playbook_steps (
  id serial primary key,
  operator_id integer not null references public.operator_users(id) on delete cascade,
  playbook_id integer not null references public.mm_playbooks(id) on delete cascade,
  step_order integer not null,
  instruction text not null,
  evidence_required text,
  automation_hint text,
  expected_output text,
  created_at timestamp without time zone not null default now(),
  constraint mm_playbook_steps_order_unique unique (playbook_id, step_order)
);

create table if not exists public.mm_memory_atoms (
  id serial primary key,
  operator_id integer not null references public.operator_users(id) on delete cascade,
  brand_id integer references public.operator_brands(id) on delete set null,
  concept_id integer references public.operator_concepts(id) on delete set null,
  store_profile_id integer references public.operator_store_profiles(id) on delete set null,
  source_table text,
  source_record_id text,
  memory_type text not null default 'lesson',
  title text not null,
  content text not null,
  confidence numeric(5,2) not null default 0.80,
  importance integer not null default 50,
  embedding_source text,
  tags jsonb not null default '[]'::jsonb,
  valid_from timestamp without time zone not null default now(),
  valid_until timestamp without time zone,
  archived boolean not null default false,
  created_at timestamp without time zone not null default now(),
  updated_at timestamp without time zone not null default now()
);

create table if not exists public.mm_training_examples (
  id serial primary key,
  operator_id integer not null references public.operator_users(id) on delete cascade,
  memory_atom_id integer references public.mm_memory_atoms(id) on delete set null,
  rule_id integer references public.mm_decision_rules(id) on delete set null,
  prompt text not null,
  ideal_response text not null,
  failure_mode text,
  evaluator_notes text,
  training_status text not null default 'candidate',
  created_at timestamp without time zone not null default now(),
  updated_at timestamp without time zone not null default now()
);

create table if not exists public.mm_os_runs (
  id serial primary key,
  operator_id integer not null references public.operator_users(id) on delete cascade,
  brand_id integer references public.operator_brands(id) on delete set null,
  concept_id integer references public.operator_concepts(id) on delete set null,
  store_profile_id integer references public.operator_store_profiles(id) on delete set null,
  run_type text not null default 'decision_support',
  input_context jsonb not null default '{}'::jsonb,
  output_summary text,
  decision_taken text,
  confidence numeric(5,2),
  source_memory_ids jsonb not null default '[]'::jsonb,
  created_at timestamp without time zone not null default now()
);

create index if not exists operator_brands_operator_idx on public.operator_brands(operator_id);
create index if not exists operator_concepts_operator_brand_idx on public.operator_concepts(operator_id, brand_id);
create index if not exists operator_store_profiles_operator_location_idx on public.operator_store_profiles(operator_id, location_id);
create index if not exists mm_logic_principles_operator_scope_idx on public.mm_logic_principles(operator_id, scope_type, scope_id);
create index if not exists mm_decision_rules_operator_scope_idx on public.mm_decision_rules(operator_id, scope_type, scope_id);
create index if not exists mm_playbooks_operator_scope_idx on public.mm_playbooks(operator_id, brand_id, concept_id, store_profile_id);
create index if not exists mm_playbook_steps_playbook_idx on public.mm_playbook_steps(playbook_id, step_order);
create index if not exists mm_memory_atoms_operator_scope_idx on public.mm_memory_atoms(operator_id, brand_id, concept_id, store_profile_id);
create index if not exists mm_memory_atoms_type_idx on public.mm_memory_atoms(operator_id, memory_type, archived);
create index if not exists mm_training_examples_operator_status_idx on public.mm_training_examples(operator_id, training_status);
create index if not exists mm_os_runs_operator_created_idx on public.mm_os_runs(operator_id, created_at desc);

alter table public.operator_brands enable row level security;
alter table public.operator_concepts enable row level security;
alter table public.operator_store_profiles enable row level security;
alter table public.mm_logic_principles enable row level security;
alter table public.mm_decision_rules enable row level security;
alter table public.mm_playbooks enable row level security;
alter table public.mm_playbook_steps enable row level security;
alter table public.mm_memory_atoms enable row level security;
alter table public.mm_training_examples enable row level security;
alter table public.mm_os_runs enable row level security;

do $$
declare
  t text;
begin
  foreach t in array array[
    'operator_brands',
    'operator_concepts',
    'operator_store_profiles',
    'mm_logic_principles',
    'mm_decision_rules',
    'mm_playbooks',
    'mm_playbook_steps',
    'mm_memory_atoms',
    'mm_training_examples',
    'mm_os_runs'
  ] loop
    execute format('drop policy if exists operator_isolation on public.%I', t);
    execute format('create policy operator_isolation on public.%I for all to authenticated using (operator_id = public.current_operator_id()) with check (operator_id = public.current_operator_id())', t);
  end loop;
end $$;

comment on table public.operator_brands is 'Logic OS brand identity containers: voice, promise, audience, positioning, and visual strategy by operator.';
comment on table public.operator_concepts is 'Logic OS concept containers: service model, menu thesis, pricing posture, and operating model inside a brand.';
comment on table public.operator_store_profiles is 'Logic OS store containers that map physical operator_locations to brand/concept identity and local scorecards.';
comment on table public.mm_logic_principles is 'Reusable Mychael Mueller operating principles and strategic beliefs, scoped by operator, brand, concept, or store.';
comment on table public.mm_decision_rules is 'Trigger-action rules that convert principles into repeatable operator decisions and AI behavior.';
comment on table public.mm_playbooks is 'Operational playbooks connected to brands, concepts, stores, and decision rules.';
comment on table public.mm_playbook_steps is 'Ordered execution steps for Logic OS playbooks.';
comment on table public.mm_memory_atoms is 'Normalized memory units containing lessons, facts, warnings, wins, failures, and source-linked business intelligence.';
comment on table public.mm_training_examples is 'Prompt/response training candidates for future Mychael Mueller custom LLM or OS behavior.';
comment on table public.mm_os_runs is 'Runtime log of Logic OS reasoning, decisions, context, confidence, and source memory lineage.';
