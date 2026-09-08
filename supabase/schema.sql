create type app_role as enum ('ADMIN', 'REVIEWER', 'SUPER_ADMIN');
create type commission_status as enum ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'PDF_GENERATED');

create table profiles (
  id uuid primary key references auth.users(id),
  full_name text not null,
  role app_role not null default 'ADMIN',
  created_at timestamptz not null default now()
);

create table agents (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  active boolean not null default true,
  withholding_tax_rate numeric(8,6) not null default 0,
  gst_rate numeric(8,6) not null default 0.15,
  residential_agent_split numeric(8,6) not null,
  residential_company_split numeric(8,6) not null,
  commercial_lease_agent_split numeric(8,6) not null default 0.5,
  commercial_lease_company_split numeric(8,6) not null default 0.5,
  constraint residential_split_balanced check (residential_agent_split + residential_company_split = 1),
  constraint commercial_split_balanced check (commercial_lease_agent_split + commercial_lease_company_split = 1)
);

create table system_settings (
  id boolean primary key default true,
  franchise_fee_rate numeric(8,6) not null default 0.08,
  default_gst_rate numeric(8,6) not null default 0.15,
  updated_at timestamptz not null default now(),
  constraint singleton_settings check (id)
);

create table commissions (
  id uuid primary key default gen_random_uuid(),
  calculation_number text not null unique,
  status commission_status not null default 'DRAFT',
  property_address text not null,
  sale_price_cents bigint not null,
  settlement_date date,
  calculation_date date not null default current_date,
  listing_percentage numeric(8,6) not null,
  selling_percentage numeric(8,6) not null,
  notes text,
  prepared_by uuid references profiles(id),
  reviewed_by uuid references profiles(id),
  approved_by uuid references profiles(id),
  approved_at timestamptz,
  financial_snapshot jsonb not null default '{}'::jsonb,
  result_snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint transaction_split_balanced check (listing_percentage + selling_percentage = 1)
);

create table commission_gross_items (
  id uuid primary key default gen_random_uuid(),
  commission_id uuid not null references commissions(id) on delete cascade,
  description text not null,
  base_amount_cents bigint not null,
  percentage numeric(8,6) not null,
  calculated_amount_cents bigint not null,
  display_order int not null default 0
);

create table commission_adjustments (
  id uuid primary key default gen_random_uuid(),
  commission_id uuid not null references commissions(id) on delete cascade,
  section text not null check (section in ('PLUS', 'DISCOUNT', 'OFFICE_DEDUCTION', 'OTHER_PAYMENT', 'OUR_OFFICE_PLUS', 'OUR_OFFICE_MINUS')),
  description text not null,
  base_amount_cents bigint,
  percentage numeric(8,6),
  amount_cents bigint not null,
  display_order int not null default 0
);

create table commission_referrals (
  id uuid primary key default gen_random_uuid(),
  commission_id uuid not null references commissions(id) on delete cascade,
  recipient text not null,
  base_amount_cents bigint not null,
  percentage numeric(8,6) not null,
  amount_cents bigint not null
);

create table commission_conjunction_adjustments (
  id uuid primary key default gen_random_uuid(),
  commission_id uuid not null references commissions(id) on delete cascade,
  conjunction_office_name text,
  conjunction_percentage numeric(8,6) not null default 0,
  section text not null check (section in ('PLUS', 'MINUS')),
  description text not null,
  amount_cents bigint not null
);

create table commission_participants (
  id uuid primary key default gen_random_uuid(),
  commission_id uuid not null references commissions(id) on delete cascade,
  role text not null check (role in ('LISTING', 'SELLING')),
  agent_id uuid references agents(id),
  team_share_percentage numeric(8,6) not null,
  settings_snapshot jsonb not null
);

create table commission_agent_payments (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references commission_participants(id) on delete cascade,
  commission_before_tax_cents bigint not null,
  gst_cents bigint not null,
  withholding_tax_cents bigint not null,
  payment_including_gst_cents bigint not null,
  net_payment_cents bigint not null
);

create table commission_agent_deductions (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references commission_participants(id) on delete cascade,
  description text not null,
  amount_cents bigint not null
);

create table commission_agent_refunds (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references commission_participants(id) on delete cascade,
  description text not null,
  base_amount_cents bigint,
  gst_rate numeric(8,6),
  gst_amount_cents bigint,
  final_amount_cents bigint not null
);

create table commission_evidence (
  id uuid primary key default gen_random_uuid(),
  commission_id uuid not null references commissions(id) on delete cascade,
  file_url text not null,
  file_name text not null,
  file_type text not null check (file_type in ('image/jpeg', 'image/png', 'image/webp')),
  display_order int not null,
  evidence_type text not null,
  uploaded_by uuid references profiles(id),
  uploaded_at timestamptz not null default now(),
  constraint evidence_order_limit check (display_order between 1 and 10)
);

create table commission_approvals (
  id uuid primary key default gen_random_uuid(),
  commission_id uuid not null references commissions(id) on delete cascade,
  reviewer_id uuid references profiles(id),
  decision text not null check (decision in ('APPROVED', 'REJECTED')),
  comments text,
  created_at timestamptz not null default now()
);

create table commission_versions (
  id uuid primary key default gen_random_uuid(),
  original_commission_id uuid not null references commissions(id),
  revised_commission_id uuid not null references commissions(id),
  reason text,
  created_at timestamptz not null default now()
);

create table audit_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id),
  event text not null,
  calculation_id uuid references commissions(id),
  changes jsonb,
  created_at timestamptz not null default now()
);

create or replace function prevent_approved_financial_edits()
returns trigger language plpgsql as $$
begin
  if old.status in ('APPROVED', 'PDF_GENERATED') and (
    old.sale_price_cents is distinct from new.sale_price_cents or
    old.listing_percentage is distinct from new.listing_percentage or
    old.selling_percentage is distinct from new.selling_percentage or
    old.financial_snapshot is distinct from new.financial_snapshot or
    old.result_snapshot is distinct from new.result_snapshot
  ) then
    raise exception 'Approved commission financial data is immutable. Create a revised version.';
  end if;
  return new;
end;
$$;

create trigger commissions_immutable_after_approval
before update on commissions
for each row execute function prevent_approved_financial_edits();
