-- Create tables
create table public.profiles (
  id uuid references auth.users not null primary key,
  username text,
  avatar_url text,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

create table public.events (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  title text not null,
  invite_code text unique not null,
  created_by uuid references public.profiles(id) not null
);

create table public.participants (
  id uuid default gen_random_uuid() primary key,
  event_id uuid references public.events(id) on delete cascade not null,
  user_id uuid references public.profiles(id) not null,
  role text default 'member', -- 'admin', 'member'
  joined_at timestamp with time zone default timezone('utc'::text, now()),
  unique(event_id, user_id)
);

create table public.shopping_items (
  id uuid default gen_random_uuid() primary key,
  event_id uuid references public.events(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  item_name text not null,
  quantity text,
  claimed_by uuid references public.profiles(id),
  is_bought boolean default false
);

create table public.expenses (
  id uuid default gen_random_uuid() primary key,
  event_id uuid references public.events(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  payer_id uuid references public.profiles(id) not null,
  amount numeric not null,
  description text not null
);

create table public.expense_splits (
  id uuid default gen_random_uuid() primary key,
  expense_id uuid references public.expenses(id) on delete cascade not null,
  debtor_id uuid references public.profiles(id) not null,
  share_amount numeric not null
);

-- RLS Policies
alter table public.profiles enable row level security;
alter table public.events enable row level security;
alter table public.participants enable row level security;
alter table public.shopping_items enable row level security;
alter table public.expenses enable row level security;
alter table public.expense_splits enable row level security;

-- Profiles: everyone can read, user can update own
create policy "Public profiles are viewable by everyone." on public.profiles for select using (true);
create policy "Users can insert their own profile." on public.profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile." on public.profiles for update using (auth.uid() = id);

-- Events: Viewable if created by user OR user is a participant
-- Note: This is a bit complex for a simple setup, simplifying for initial version:
-- Users can see events they created or are participants of.
create policy "View events" on public.events for select using (
  auth.uid() = created_by or 
  exists (select 1 from public.participants where event_id = public.events.id and user_id = auth.uid())
);
create policy "Create events" on public.events for insert with check (auth.uid() = created_by);

-- Participants: Viewable if in the event
create policy "View participants" on public.participants for select using (
  exists (
    select 1 from public.participants p 
    where p.event_id = public.participants.event_id and p.user_id = auth.uid()
  ) or 
  exists (select 1 from public.events where id = public.participants.event_id and created_by = auth.uid())
);
-- Allow joining via code (simplified for now, usually needs a function to verify code)
create policy "Join event" on public.participants for insert with check (auth.uid() = user_id);

-- Shopping Items
create policy "View shopping items" on public.shopping_items for select using (
  exists (select 1 from public.participants where event_id = public.shopping_items.event_id and user_id = auth.uid())
);
create policy "Add shopping items" on public.shopping_items for insert with check (
  exists (select 1 from public.participants where event_id = public.shopping_items.event_id and user_id = auth.uid())
);
create policy "Update shopping items" on public.shopping_items for update using (
  exists (select 1 from public.participants where event_id = public.shopping_items.event_id and user_id = auth.uid())
);

-- Expenses & Splits
create policy "View expenses" on public.expenses for select using (
  exists (select 1 from public.participants where event_id = public.expenses.event_id and user_id = auth.uid())
);
create policy "Add expenses" on public.expenses for insert with check (
  exists (select 1 from public.participants where event_id = public.expenses.event_id and user_id = auth.uid())
);

create policy "View splits" on public.expense_splits for select using (
  exists (
    select 1 from public.expenses e
    join public.participants p on p.event_id = e.event_id
    where e.id = public.expense_splits.expense_id and p.user_id = auth.uid()
  )
);
create policy "Add splits" on public.expense_splits for insert with check (
  exists (
    select 1 from public.expenses e
    join public.participants p on p.event_id = e.event_id
    where e.id = public.expense_splits.expense_id and p.user_id = auth.uid()
  )
);

-- Helper function to handle new user signup
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.profiles (id, username, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
