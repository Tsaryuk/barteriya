-- ============================================
-- Бартерия v2: Новая схема сертификатов
-- Выполнить в Supabase SQL Editor
-- ============================================

-- 1. Обновляем users: добавляем phone, photo_url
alter table users add column if not exists phone text;
alter table users add column if not exists photo_url text;

-- 2. Обновляем games: билет и банк
alter table games add column if not exists ticket_price_rub numeric default 7000;
alter table games add column if not exists bank_open boolean default false;

-- 3. Обновляем game_participants: check-in
alter table game_participants add column if not exists checked_in boolean default false;
alter table game_participants add column if not exists checked_in_at timestamptz;
alter table game_participants add column if not exists paid boolean default false;
alter table game_participants add column if not exists paid_at timestamptz;

-- 4. Роли: добавляем manager
-- (role уже есть: user, organizer, admin — меняем organizer на manager)
-- Оставляем совместимость, просто используем: user, manager, admin

-- 5. Сертификаты (предложения участника) — полная переделка
-- Удаляем старую таблицу если мешает
-- drop table if exists certificates cascade;

-- Шаблоны сертификатов (услуги, которые участник предлагает)
create table if not exists services (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references users(id) not null,
  title text not null,
  description text,
  price_b integer not null,
  original_price_rub numeric, -- реальная цена услуги в рублях
  quantity integer, -- null = безлимит
  expires_days integer default 365, -- срок годности после покупки
  is_active boolean default true,
  created_at timestamptz default now()
);

-- Какие услуги выставлены на конкретную игру
create table if not exists game_services (
  id uuid primary key default gen_random_uuid(),
  game_id uuid references games(id) not null,
  service_id uuid references services(id) not null,
  quantity_remaining integer, -- null = безлимит, уменьшается при покупке
  is_active boolean default true,
  unique(game_id, service_id)
);

-- Купленные сертификаты (экземпляры у покупателя)
create table if not exists purchased_certificates (
  id uuid primary key default gen_random_uuid(),
  service_id uuid references services(id) not null,
  game_service_id uuid references game_services(id),
  game_id uuid references games(id) not null,
  buyer_id uuid references users(id) not null,
  seller_id uuid references users(id) not null,
  amount_b integer not null,
  transaction_id uuid references transactions(id),
  status text default 'active', -- active, redeemed, expired
  redeemed_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz default now()
);

-- Отзывы
create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  purchase_id uuid references purchased_certificates(id) not null,
  author_id uuid references users(id) not null,
  target_id uuid references users(id) not null,
  rating integer check (rating between 1 and 5),
  text text,
  created_at timestamptz default now(),
  unique(purchase_id, author_id)
);

-- 6. RLS
alter table services enable row level security;
alter table game_services enable row level security;
alter table purchased_certificates enable row level security;
alter table reviews enable row level security;

create policy "Service role full access" on services for all using (true);
create policy "Service role full access" on game_services for all using (true);
create policy "Service role full access" on purchased_certificates for all using (true);
create policy "Service role full access" on reviews for all using (true);

-- 7. Realtime
alter publication supabase_realtime add table services;
alter publication supabase_realtime add table game_services;
alter publication supabase_realtime add table purchased_certificates;
alter publication supabase_realtime add table reviews;

-- 8. Индексы
create index if not exists idx_services_owner on services(owner_id);
create index if not exists idx_game_services_game on game_services(game_id);
create index if not exists idx_game_services_service on game_services(service_id);
create index if not exists idx_purchased_certs_buyer on purchased_certificates(buyer_id);
create index if not exists idx_purchased_certs_seller on purchased_certificates(seller_id);
create index if not exists idx_purchased_certs_game on purchased_certificates(game_id);
create index if not exists idx_reviews_target on reviews(target_id);
