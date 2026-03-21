-- SUPABASE MIGRATION SCRIPT
-- RUN THIS IN THE SUPABASE SQL EDITOR

-- 1. Enable UUID Extension
create extension if not exists "uuid-ossp";

-- 2. CREATE cashbook TABLE
-- Used for Kwitansi and Invoice auto-sync
create table if not exists public.cashbook (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    type text not null check (type in ('income', 'expense')),
    amount numeric not null default 0,
    category text,
    description text,
    date date not null default current_date,
    reference_type text,
    created_at timestamptz default now()
);

-- 3. CREATE receipts TABLE
-- Used for Tanda Terima
create table if not exists public.receipts (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    doc_number text not null,
    client_name text,
    total_amount numeric default 0,
    data jsonb default '{}'::jsonb,
    created_at timestamptz default now()
);

-- 4. CREATE quotations TABLE
-- Used for Penawaran Harga
create table if not exists public.quotations (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    doc_number text not null,
    client_name text,
    total_amount numeric default 0,
    status text default 'Sent',
    data jsonb default '{}'::jsonb,
    created_at timestamptz default now()
);

-- 5. CREATE purchase_orders TABLE
-- Used for Purchase Order
create table if not exists public.purchase_orders (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    doc_number text not null,
    client_name text,
    total_amount numeric default 0,
    data jsonb default '{}'::jsonb,
    created_at timestamptz default now()
);

-- 6. ENABLE RLS
alter table public.cashbook enable row level security;
alter table public.receipts enable row level security;
alter table public.quotations enable row level security;
alter table public.purchase_orders enable row level security;

-- 7. CREATE RLS POLICIES
-- Only allow users to see/edit their own data
create policy "Users can only access their own cashbook" on public.cashbook for all using (auth.uid() = user_id);
create policy "Users can only access their own receipts" on public.receipts for all using (auth.uid() = user_id);
create policy "Users can only access their own quotations" on public.quotations for all using (auth.uid() = user_id);
create policy "Users can only access their own purchase_orders" on public.purchase_orders for all using (auth.uid() = user_id);

-- 8. CREATE kasir_transactions TABLE
create table if not exists public.kasir_transactions (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    receipt_number text not null,
    subtotal numeric not null default 0,
    discount_type text,
    discount_value numeric default 0,
    discount_amount numeric default 0,
    tax_amount numeric default 0,
    tax_percent numeric default 0,
    total numeric not null default 0,
    payment_method text,
    amount_paid numeric default 0,
    change_amount numeric default 0,
    kasir_name text,
    store_name text,
    notes text,
    customer_phone text,
    employee_id uuid,
    employee_name text,
    member_id uuid,
    points_earned integer default 0,
    points_redeemed integer default 0,
    created_at timestamptz default now()
);

alter table public.kasir_transactions enable row level security;
create policy "Users can only access their own transactions" on public.kasir_transactions for all using (auth.uid() = user_id);
