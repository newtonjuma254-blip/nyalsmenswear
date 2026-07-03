
-- Roles
create type public.app_role as enum ('admin');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique(user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create policy "users read own roles" on public.user_roles for select to authenticated using (auth.uid() = user_id);

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists(select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

-- Auto-promote seed admin on signup
create or replace function public.handle_new_user_admin()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if new.email = 'newtonjuma254@gmail.com' then
    insert into public.user_roles(user_id, role) values (new.id, 'admin')
    on conflict do nothing;
  end if;
  return new;
end;
$$;

create trigger on_auth_user_created_admin
after insert on auth.users
for each row execute function public.handle_new_user_admin();

-- Products
create table public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  sku text not null unique,
  name text not null,
  category text not null,
  price numeric(10,2) not null,
  price_was numeric(10,2),
  description text,
  material text,
  sizes text[] not null default '{}',
  images text[] not null default '{}',
  in_stock boolean not null default true,
  badge text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.products to anon, authenticated;
grant insert, update, delete on public.products to authenticated;
grant all on public.products to service_role;
alter table public.products enable row level security;

create policy "products public read" on public.products for select to anon, authenticated using (true);
create policy "admins insert products" on public.products for insert to authenticated with check (public.has_role(auth.uid(), 'admin'));
create policy "admins update products" on public.products for update to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create policy "admins delete products" on public.products for delete to authenticated using (public.has_role(auth.uid(), 'admin'));

create or replace function public.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

create trigger products_touch_updated_at before update on public.products
for each row execute function public.touch_updated_at();
