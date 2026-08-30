-- Evidence intake foundation (Phase 1)
-- Additive Neon/Postgres tables. tenant_id + store_id on every operational row.
-- Money columns are numeric(18,2). Audit log is append-only via trigger.
-- Raw document identity is immutable via trigger.
--
-- RLS HOOK (NOT ENABLED):
--   create function public.evidence_intake_tenant_id() ... current_setting('app.tenant_id', true)
--   policies would use tenant_id = public.evidence_intake_tenant_id()
-- Blocker: Neon HTTP Drizzle client has no session GUC; operator HMAC cookie is
-- not a Postgres JWT. ENABLE/FORCE RLS now would be owner-bypass or deny-all.
-- See src/lib/evidenceIntake/types.ts EVIDENCE_INTAKE_RLS_BLOCKER.

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null,
  store_id text not null,
  filename text not null,
  mime_type text not null,
  content_sha256 text not null,
  raw_object_pointer text not null,
  intake_kind text not null,
  evidence_state text not null,
  status text not null,
  injection_suspected boolean not null default false,
  timezone text,
  business_day_cutoff text,
  period_start text,
  period_end text,
  money_basis text,
  errors jsonb not null default '[]'::jsonb,
  created_at timestamp without time zone not null default now(),
  constraint documents_tenant_store_id_unique unique (tenant_id, store_id, id),
  constraint documents_tenant_store_sha256_unique unique (tenant_id, store_id, content_sha256),
  constraint documents_content_sha256_check check (content_sha256 ~ '^[0-9a-f]{64}$'),
  constraint documents_evidence_state_check check (evidence_state in (
    'Verified', 'Reconciled', 'Partial', 'Estimated', 'Unverified', 'Missing Evidence'
  )),
  constraint documents_status_check check (status in ('captured', 'rejected', 'partial')),
  constraint documents_intake_kind_check check (intake_kind in (
    'invoice', 'pos-close', 'marketplace-statement', 'photo-receipt', 'unclassified'
  )),
  constraint documents_mime_type_check check (mime_type in (
    'application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/heic', 'image/heif', 'unsupported'
  ))
);

create index if not exists documents_tenant_store_created_idx
  on public.documents (tenant_id, store_id, created_at);

create table if not exists public.document_pages (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null,
  store_id text not null,
  document_id uuid not null,
  page_index integer not null,
  width numeric(12, 2),
  height numeric(12, 2),
  rotation_degrees integer not null default 0,
  extracted_text text not null default '',
  extraction_path text not null,
  quality_flags jsonb not null default '[]'::jsonb,
  status text not null,
  injection_suspected boolean not null default false,
  errors jsonb not null default '[]'::jsonb,
  created_at timestamp without time zone not null default now(),
  constraint document_pages_document_page_unique unique (document_id, page_index),
  constraint document_pages_document_scope_fk
    foreign key (tenant_id, store_id, document_id)
    references public.documents (tenant_id, store_id, id)
    on delete restrict,
  constraint document_pages_page_index_check check (page_index >= 0),
  constraint document_pages_extraction_path_check check (extraction_path in ('native-pdf', 'ocr-fallback', 'unavailable')),
  constraint document_pages_status_check check (status in ('accepted', 'rejected')),
  constraint document_pages_width_check check (width is null or width >= 0),
  constraint document_pages_height_check check (height is null or height >= 0)
);

create index if not exists document_pages_tenant_store_idx
  on public.document_pages (tenant_id, store_id, document_id);

create table if not exists public.extracted_fields (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null,
  store_id text not null,
  document_id uuid not null,
  page_index integer not null,
  line_index integer,
  field_key text not null,
  raw_value text,
  typed_value jsonb not null,
  typed_money numeric(18, 2),
  confidence numeric(5, 4) not null,
  bbox_x numeric(12, 4),
  bbox_y numeric(12, 4),
  bbox_width numeric(12, 4),
  bbox_height numeric(12, 4),
  bbox_unit text,
  evidence_state text not null,
  injection_suspected boolean not null default false,
  errors jsonb not null default '[]'::jsonb,
  created_at timestamp without time zone not null default now(),
  constraint extracted_fields_document_scope_fk
    foreign key (tenant_id, store_id, document_id)
    references public.documents (tenant_id, store_id, id)
    on delete restrict,
  constraint extracted_fields_page_index_check check (page_index >= 0),
  constraint extracted_fields_line_index_check check (line_index is null or line_index >= 0),
  constraint extracted_fields_confidence_check check (confidence >= 0 and confidence <= 1),
  constraint extracted_fields_bbox_check check (
    (bbox_width is null and bbox_height is null) or (bbox_width >= 0 and bbox_height >= 0)
  ),
  constraint extracted_fields_evidence_state_check check (evidence_state in (
    'Verified', 'Reconciled', 'Partial', 'Estimated', 'Unverified', 'Missing Evidence'
  )),
  constraint extracted_fields_bbox_unit_check check (
    bbox_unit is null or bbox_unit in ('pdf-pt', 'px', 'normalized')
  )
);

create index if not exists extracted_fields_tenant_store_doc_idx
  on public.extracted_fields (tenant_id, store_id, document_id);
create index if not exists extracted_fields_document_key_idx
  on public.extracted_fields (document_id, field_key);

create table if not exists public.agent_runs (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null,
  store_id text not null,
  document_id uuid,
  agent_name text not null,
  status text not null,
  input_hash text not null,
  output_summary jsonb not null default '{}'::jsonb,
  error_text text,
  started_at timestamp without time zone not null default now(),
  finished_at timestamp without time zone,
  constraint agent_runs_document_scope_fk
    foreign key (tenant_id, store_id, document_id)
    references public.documents (tenant_id, store_id, id)
    on delete restrict,
  constraint agent_runs_status_check check (status in ('succeeded', 'partial', 'failed')),
  constraint agent_runs_agent_name_check check (agent_name in ('intake-classifier', 'quality-gate', 'source-collector'))
);

create index if not exists agent_runs_tenant_store_started_idx
  on public.agent_runs (tenant_id, store_id, started_at);

create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null,
  store_id text not null,
  event_type text not null,
  entity_type text not null,
  entity_id text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamp without time zone not null default now()
);

create index if not exists audit_log_tenant_store_created_idx
  on public.audit_log (tenant_id, store_id, created_at);

create or replace function public.evidence_audit_log_append_only()
returns trigger
language plpgsql
as $$
begin
  raise exception 'audit_log is append-only';
end;
$$;

drop trigger if exists audit_log_no_update on public.audit_log;
create trigger audit_log_no_update
  before update on public.audit_log
  for each row execute procedure public.evidence_audit_log_append_only();

drop trigger if exists audit_log_no_delete on public.audit_log;
create trigger audit_log_no_delete
  before delete on public.audit_log
  for each row execute procedure public.evidence_audit_log_append_only();

revoke update, delete on public.audit_log from public;

create or replace function public.documents_raw_identity_immutable()
returns trigger
language plpgsql
as $$
begin
  if new.tenant_id is distinct from old.tenant_id
    or new.store_id is distinct from old.store_id
    or new.content_sha256 is distinct from old.content_sha256
    or new.raw_object_pointer is distinct from old.raw_object_pointer
    or new.mime_type is distinct from old.mime_type then
    raise exception 'documents raw identity is immutable';
  end if;
  return new;
end;
$$;

drop trigger if exists documents_raw_identity_immutable on public.documents;
create trigger documents_raw_identity_immutable
  before update on public.documents
  for each row execute procedure public.documents_raw_identity_immutable();

create or replace function public.evidence_intake_tenant_id()
returns text
language sql
stable
as $$
  select nullif(current_setting('app.tenant_id', true), '');
$$;

comment on function public.evidence_intake_tenant_id() is
  'Phase-2 RLS hook. Next.js Neon HTTP + HMAC operator sessions do not SET app.tenant_id. Do not ENABLE ROW LEVEL SECURITY until a per-transaction tenant GUC is wired.';

comment on table public.documents is 'Canonical intake row per tenant/store/content hash. Raw identity is immutable. Period and money_basis are explicit nulls unless supplied.';
comment on table public.document_pages is 'Page-level native/OCR text, quality flags, and retained rejection errors.';
comment on table public.extracted_fields is 'Every extracted field with raw, typed numeric money, source confidence, coordinates, evidence state.';
comment on table public.agent_runs is 'Intake agent runs (classifier/quality-gate/source-collector). No LLM money writes.';
comment on table public.audit_log is 'Append-only evidence/rule audit trail. Updates and deletes are blocked.';
