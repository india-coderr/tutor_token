create table if not exists public.mentor_applications (
  id uuid primary key default gen_random_uuid(),
  user_uid text not null,
  full_name text not null,
  email text not null,
  phone text,
  skills text[] default '{}',
  linkedin text,
  experience text,
  portfolio_url text,
  government_id_url text,
  why_mentor text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  mentor_id text,
  admin_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.admin_sessions (
  id uuid primary key default gen_random_uuid(),
  admin_email text not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz
);

create table if not exists public.ai_chat_logs (
  id uuid primary key default gen_random_uuid(),
  user_uid text,
  user_email text,
  mode text not null default 'chat',
  prompt text,
  image_url text,
  response text,
  tokens integer default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.urgent_requests (
  id uuid primary key default gen_random_uuid(),
  learner_uid text not null,
  learner_name text,
  learner_email text,
  topic text not null,
  question text,
  requested_mentor_uid text,
  requested_mentor_name text,
  status text not null default 'open' check (status in ('open', 'accepted', 'closed', 'cancelled')),
  accepted_by_uid text,
  accepted_by_name text,
  meet_link text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table if exists public.urgent_requests
  add column if not exists requested_mentor_uid text,
  add column if not exists requested_mentor_name text;

alter table if exists public.courses
  add column if not exists status text not null default 'approved' check (status in ('pending', 'approved', 'rejected')),
  add column if not exists description text,
  add column if not exists demo_video_url text,
  add column if not exists notes_url text,
  add column if not exists pricing numeric default 0,
  add column if not exists category text,
  add column if not exists rejection_reason text;

create index if not exists mentor_applications_status_idx on public.mentor_applications(status);
create index if not exists courses_status_idx on public.courses(status);
create index if not exists urgent_requests_status_idx on public.urgent_requests(status);

-- RLS policies for the current Firebase-authenticated frontend.
-- The app writes with the Supabase anon key because user auth is handled by Firebase,
-- so Supabase cannot inspect auth.uid(). Keep admin-only approval actions on the backend.
alter table public.courses enable row level security;
alter table public.mentor_applications enable row level security;
alter table public.urgent_requests enable row level security;
alter table public.ai_chat_logs enable row level security;

drop policy if exists "Public can read approved courses" on public.courses;
create policy "Public can read approved courses"
  on public.courses for select
  using (status = 'approved' or status = 'pending' or status = 'rejected');

drop policy if exists "Mentors can submit pending courses" on public.courses;
create policy "Mentors can submit pending courses"
  on public.courses for insert
  with check (status = 'pending');

drop policy if exists "Mentors can manage own course rows" on public.courses;
create policy "Mentors can manage own course rows"
  on public.courses for delete
  using (mentor_uid is not null);

drop policy if exists "Users can submit mentor applications" on public.mentor_applications;
create policy "Users can submit mentor applications"
  on public.mentor_applications for insert
  with check (status = 'pending');

drop policy if exists "Users can read mentor applications" on public.mentor_applications;
create policy "Users can read mentor applications"
  on public.mentor_applications for select
  using (true);

drop policy if exists "Users can create urgent requests" on public.urgent_requests;
create policy "Users can create urgent requests"
  on public.urgent_requests for insert
  with check (status = 'open');

drop policy if exists "Users can read urgent requests" on public.urgent_requests;
create policy "Users can read urgent requests"
  on public.urgent_requests for select
  using (true);

drop policy if exists "Users can update urgent requests" on public.urgent_requests;
create policy "Users can update urgent requests"
  on public.urgent_requests for update
  using (true)
  with check (true);

drop policy if exists "Backend can log ai usage" on public.ai_chat_logs;
create policy "Backend can log ai usage"
  on public.ai_chat_logs for insert
  with check (true);
