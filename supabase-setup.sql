-- ============================================================
-- PS5 下载站 · Supabase 初始化脚本
-- 用法：Supabase 控制台 → SQL Editor → 粘贴全部 → Run
-- 跑完去 Database → Functions 确认 check_access 存在
-- ============================================================

create extension if not exists pgcrypto;

-- ---------- 1. 访问密码（只存哈希，源码里看不到明文）----------
create table if not exists access_codes (
  id        bigserial primary key,
  label     text not null default '主密码',
  hash      text not null,
  created_at timestamptz not null default now()
);

-- 关键：开 RLS 且不建任何策略 = anon 读不到这表，只有下面的函数能查
alter table access_codes enable row level security;

-- 设置你的密码（把 换成你的新密码，建议 10 位以上，别用原来的 520439）
-- 想改密码就重跑这一句
insert into access_codes (label, hash)
values ('主密码', crypt('换成你的新密码', gen_salt('bf')));

-- 校验函数：前端只拿到 true/false，拿不到哈希
create or replace function check_access(p text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  return exists (select 1 from access_codes where hash = crypt(p, hash));
end;
$$;

revoke all on function check_access(text) from public;
grant execute on function check_access(text) to anon;

-- ---------- 2. 评论 ----------
create table if not exists comments (
  id         uuid primary key default gen_random_uuid(),
  name       text not null check (char_length(name) between 1 and 20),
  body       text not null check (char_length(body) between 1 and 500),
  created_at timestamptz not null default now()
);

alter table comments enable row level security;
drop policy if exists "anyone can read comments" on comments;
drop policy if exists "anyone can add comment" on comments;
create policy "anyone can read comments" on comments for select using (true);
create policy "anyone can add comment"    on comments for insert with check (true);

-- ---------- 3. 好评（1–5 星）----------
create table if not exists ratings (
  id         bigserial primary key,
  stars      smallint not null check (stars between 1 and 5),
  created_at timestamptz not null default now()
);

alter table ratings enable row level security;
drop policy if exists "anyone can read ratings" on ratings;
drop policy if exists "anyone can rate"          on ratings;
create policy "anyone can read ratings" on ratings for select using (true);
create policy "anyone can rate"          on ratings for insert with check (true);

-- 汇总视图：只暴露平均分和总数
create or replace view rating_summary as
  select count(*)::int as total, coalesce(round(avg(stars)::numeric, 1), 0) as avg_stars
  from ratings;

grant select on rating_summary to anon;
