-- ============================================
-- Бартерия v3: Блокировка пользователей
-- Выполнить в Supabase SQL Editor
-- ============================================

alter table users add column if not exists is_blocked boolean default false;
