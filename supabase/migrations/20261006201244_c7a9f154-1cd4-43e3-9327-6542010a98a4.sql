create type public.app_role as enum ('admin','buyer','seller');

create table public.profiles (id uuid primary key, email text, name text, bio text, avatar_url text, blocked boolean not null default false, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table public.user_roles (id uuid primary key default gen_random_uuid(), user_id uuid not null, role public.app_role not null, created_at timestamptz not null default now(), unique(user_id, role));
grant select on public.user_roles to authenticated; grant all on public.user_roles to service_role;
grant select on public.profiles to authenticated; grant update (name, bio, avatar_url) on public.profiles to authenticated; grant all on public.profiles to service_role;
alter table public.profiles enable row level security; alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role) returns boolean language sql stable security definer set search_path = public as $$ select exists (select 1 from public.user_roles where user_id=_user_id and role=_role) $$;

create policy "Read own roles" on public.user_roles for select to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));

alter table public.provider_agents add column owner_id uuid unique;
drop policy "Read active demo provider agents" on public.provider_agents;
grant select on public.provider_agents to anon, authenticated;
grant insert (name, description, category, skills, base_price, delivery_hours, negotiation_style, is_active, owner_id, rating, completed_jobs, quality_score, reputation_score, is_demo) on public.provider_agents to authenticated;
grant update (name, description, category, skills, base_price, delivery_hours, negotiation_style, is_active) on public.provider_agents to authenticated;
create policy "Read active sellers" on public.provider_agents for select to anon, authenticated using (is_active or owner_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "Sellers create own listing" on public.provider_agents for insert to authenticated with check (owner_id = auth.uid() and is_demo = false and public.has_role(auth.uid(),'seller'));
create policy "Sellers update own listing" on public.provider_agents for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());

insert into public.provider_agents (name, description, category, skills, rating, completed_jobs, base_price, delivery_hours, quality_score, reputation_score, negotiation_style) values
('Lumen Studio','Demo seller for product photography retouching and e-commerce imagery.','Design', array['photo retouching','product images','background removal','e-commerce'],4.7,212,70,36,86,88,'Friendly, offers bundle discounts'),
('Copyline','Demo seller for SEO blog posts, landing page copy and email sequences.','Writing', array['seo','blog posts','landing page copy','email'],4.8,341,120,48,91,90,'Precise, holds price but adds revisions');

create table public.offers (id uuid primary key default gen_random_uuid(), request_id uuid not null references public.service_requests(id) on delete cascade, agent_id uuid not null references public.provider_agents(id), price numeric not null, delivery_hours integer not null, message text not null, ai_score integer not null, ai_reason text not null, score_breakdown jsonb not null default '{}', rank integer not null, status text not null default 'suggested', created_at timestamptz not null default now(), unique(request_id, agent_id));
create table public.conversations (id uuid primary key default gen_random_uuid(), request_id uuid not null unique references public.service_requests(id) on delete cascade, offer_id uuid not null references public.offers(id), buyer_id uuid not null, agent_id uuid not null references public.provider_agents(id), seller_id uuid, agreed_price numeric not null, delivery_note text, delivered_at timestamptz, confirmed_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table public.messages (id uuid primary key default gen_random_uuid(), conversation_id uuid not null references public.conversations(id) on delete cascade, sender_id uuid, sender_kind text not null check (sender_kind in ('buyer','seller','agent','system')), content text not null default '', file_url text, file_name text, created_at timestamptz not null default now());
create table public.transactions (id uuid primary key default gen_random_uuid(), request_id uuid not null references public.service_requests(id), offer_id uuid not null references public.offers(id), conversation_id uuid not null references public.conversations(id), buyer_id uuid not null, seller_id uuid, agent_id uuid not null references public.provider_agents(id), paypal_order_id text not null unique, paypal_capture_id text, amount numeric not null, platform_fee numeric not null, seller_amount numeric not null, currency text not null default 'USD', status text not null default 'pending' check (status in ('pending','held','completed','refunded')), payout_status text not null default 'not_due', held_at timestamptz, released_at timestamptz, refunded_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now());

grant select, update on public.offers to authenticated; grant all on public.offers to service_role;
grant select on public.conversations to authenticated; grant all on public.conversations to service_role;
grant select, insert on public.messages to authenticated; grant all on public.messages to service_role;
grant select on public.transactions to authenticated; grant all on public.transactions to service_role;
alter table public.offers enable row level security; alter table public.conversations enable row level security; alter table public.messages enable row level security; alter table public.transactions enable row level security;

create or replace function public.is_participant(_conv uuid, _uid uuid) returns boolean language sql stable security definer set search_path = public as $$ select exists (select 1 from public.conversations where id=_conv and (buyer_id=_uid or seller_id=_uid)) $$;
create or replace function public.owns_agent(_agent uuid, _uid uuid) returns boolean language sql stable security definer set search_path = public as $$ select exists (select 1 from public.provider_agents where id=_agent and owner_id=_uid) $$;
create or replace function public.owns_request(_req uuid, _uid uuid) returns boolean language sql stable security definer set search_path = public as $$ select exists (select 1 from public.service_requests where id=_req and buyer_id=_uid) $$;
create or replace function public.seller_on_request(_req uuid, _uid uuid) returns boolean language sql stable security definer set search_path = public as $$ select exists (select 1 from public.offers o join public.provider_agents a on a.id=o.agent_id where o.request_id=_req and a.owner_id=_uid) $$;

create policy "Read offers" on public.offers for select to authenticated using (public.owns_request(request_id, auth.uid()) or public.owns_agent(agent_id, auth.uid()) or public.has_role(auth.uid(),'admin'));
create policy "Seller adjusts own offer" on public.offers for update to authenticated using (public.owns_agent(agent_id, auth.uid())) with check (public.owns_agent(agent_id, auth.uid()));
create policy "Read conversations" on public.conversations for select to authenticated using (buyer_id=auth.uid() or seller_id=auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "Read messages" on public.messages for select to authenticated using (public.is_participant(conversation_id, auth.uid()) or public.has_role(auth.uid(),'admin'));
create policy "Send own messages" on public.messages for insert to authenticated with check (sender_id=auth.uid() and sender_kind in ('buyer','seller') and public.is_participant(conversation_id, auth.uid()) and not exists (select 1 from public.profiles p where p.id=auth.uid() and p.blocked));
create policy "Read transactions" on public.transactions for select to authenticated using (buyer_id=auth.uid() or seller_id=auth.uid() or public.has_role(auth.uid(),'admin'));

create policy "Admins read requests" on public.service_requests for select to authenticated using (public.has_role(auth.uid(),'admin') or public.seller_on_request(id, auth.uid()));
create policy "Read profiles" on public.profiles for select to authenticated using (id=auth.uid() or public.has_role(auth.uid(),'admin') or exists (select 1 from public.conversations c where (c.buyer_id=auth.uid() and c.seller_id=profiles.id) or (c.seller_id=auth.uid() and c.buyer_id=profiles.id)));
create policy "Update own profile" on public.profiles for update to authenticated using (id=auth.uid()) with check (id=auth.uid());

create or replace function public.bootstrap_account() returns void language plpgsql security definer set search_path = public as $$
declare _email text := lower(coalesce(auth.jwt()->>'email',''));
begin
  if auth.uid() is null then raise exception 'Not signed in'; end if;
  insert into public.profiles (id, email, name) values (auth.uid(), _email, split_part(_email,'@',1)) on conflict (id) do update set email = excluded.email;
  if _email = 'shomratgmm@gmail.com' then insert into public.user_roles (user_id, role) values (auth.uid(),'admin') on conflict do nothing; end if;
end $$;
create or replace function public.choose_role(_role public.app_role) returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Not signed in'; end if;
  if _role not in ('buyer','seller') then raise exception 'Invalid role'; end if;
  if exists (select 1 from public.user_roles where user_id=auth.uid() and role in ('buyer','seller')) then raise exception 'Role already chosen'; end if;
  insert into public.user_roles (user_id, role) values (auth.uid(), _role);
end $$;
revoke execute on function public.bootstrap_account() from anon; revoke execute on function public.choose_role(public.app_role) from anon;

insert into public.profiles (id, email, name) select id, lower(email), split_part(email,'@',1) from auth.users where lower(email)='shomratgmm@gmail.com' on conflict do nothing;
insert into public.user_roles (user_id, role) select id, 'admin' from auth.users where lower(email)='shomratgmm@gmail.com' on conflict do nothing;

create trigger profiles_updated before update on public.profiles for each row execute function public.set_updated_at();
create trigger conversations_updated before update on public.conversations for each row execute function public.set_updated_at();
create trigger transactions_updated before update on public.transactions for each row execute function public.set_updated_at();

create policy "Participants read chat files" on storage.objects for select to authenticated using (bucket_id='chat-files' and public.is_participant(((storage.foldername(name))[1])::uuid, auth.uid()));
create policy "Participants upload chat files" on storage.objects for insert to authenticated with check (bucket_id='chat-files' and public.is_participant(((storage.foldername(name))[1])::uuid, auth.uid()));

alter publication supabase_realtime add table public.messages, public.conversations, public.transactions;