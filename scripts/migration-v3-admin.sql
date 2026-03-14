-- ============================================
-- Бартерия v3: Блокировка + глобальный баланс
-- Выполнить в Supabase SQL Editor
-- ============================================

alter table users add column if not exists is_blocked boolean default false;
alter table users add column if not exists balance_b integer default 0;
