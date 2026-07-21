-- Supabase schema for the e-commerce app.
-- Run this once in the Supabase SQL editor (Dashboard > SQL Editor).

-- ============================================================
-- PRODUCTS
-- ============================================================
create table if not exists public.products (
  id              uuid primary key default gen_random_uuid(),
  brand           text not null,
  name            text not null,
  description     text,
  category        text,
  price           numeric(10,2) not null default 0,   -- base / default price
  discount        numeric(4,3)  not null default 0,   -- 0..1 (0.10 = 10%)
  storage_options jsonb         not null default '[]', -- ["128GB","256GB"]
  storage_pricing jsonb         not null default '{}', -- {"128GB":799,...}
  images          jsonb         not null default '[]', -- ["https://..."]
  stock           integer       not null default 0,
  is_active       boolean       not null default true,
  created_at      timestamptz   not null default now()
);

-- ============================================================
-- ORDERS
-- ============================================================
create table if not exists public.orders (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid references auth.users(id) on delete set null,
  status           text not null default 'paid',   -- paid|pending|failed|cancelled|shipped|delivered
  payment_method   text,                            -- stripe|paypal|visa|mastercard
  payment_ref      text,                            -- PaymentIntent id / PayPal payment id
  currency         text not null default 'USD',
  subtotal         numeric(10,2) not null default 0,
  shipping         numeric(10,2) not null default 0,
  tax              numeric(10,2) not null default 0,
  total            numeric(10,2) not null default 0,
  shipping_address jsonb,
  created_at       timestamptz not null default now()
);

create table if not exists public.order_items (
  id           uuid primary key default gen_random_uuid(),
  order_id     uuid not null references public.orders(id) on delete cascade,
  product_id   uuid references public.products(id) on delete set null,
  name         text not null,
  storage      text,
  unit_price   numeric(10,2) not null,
  quantity     integer not null default 1,
  image        text
);

create index if not exists idx_orders_user on public.orders(user_id);
create index if not exists idx_order_items_order on public.order_items(order_id);

-- ============================================================
-- ATOMIC STOCK DECREMENT (prevents overselling)
-- ============================================================
create or replace function public.decrement_stock(p_product_id uuid, p_qty integer)
returns void
language plpgsql
as $$
begin
  update public.products
     set stock = greatest(stock - p_qty, 0)
   where id = p_product_id;
end;
$$;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.products    enable row level security;
alter table public.orders      enable row level security;
alter table public.order_items enable row level security;

-- Products: anyone can read active products (writes go through service role / admin).
drop policy if exists "products_read" on public.products;
create policy "products_read" on public.products
  for select using (is_active = true);

-- Orders: a user can see and create only their own orders.
drop policy if exists "orders_select_own" on public.orders;
create policy "orders_select_own" on public.orders
  for select using (auth.uid() = user_id);

drop policy if exists "orders_insert_own" on public.orders;
create policy "orders_insert_own" on public.orders
  for insert with check (auth.uid() = user_id);

-- Order items: accessible only when the parent order belongs to the user.
drop policy if exists "order_items_select_own" on public.order_items;
create policy "order_items_select_own" on public.order_items
  for select using (
    exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid())
  );

drop policy if exists "order_items_insert_own" on public.order_items;
create policy "order_items_insert_own" on public.order_items
  for insert with check (
    exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid())
  );

-- ============================================================
-- OPTIONAL: seed a couple of demo products so you can test the DB catalog.
-- ============================================================
-- insert into public.products (brand,name,description,category,price,storage_options,storage_pricing,images,stock)
-- values
--  ('Apple','iPhone 15','The newest iPhone.','Phones',899,'["256GB","512GB"]','{"256GB":899,"512GB":999}','["https://your-cdn/iphone15.png"]',25),
--  ('Samsung','Galaxy S23','Flagship Android.','Phones',799,'["128GB","256GB"]','{"128GB":799,"256GB":899}','["https://your-cdn/s23.png"]',30);
