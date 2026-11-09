-- Primeira versão do banco na nuvem (Supabase/Postgres).
-- O app continua salvando no aparelho primeiro; estas tabelas guardam a cópia de cada conta
-- para backup e para sincronizar entre aparelhos. Só Postgres padrão, para migrar fácil depois.
-- Cada linha guarda o objeto do app como jsonb, com a chave que permite juntar dados de dois aparelhos.

-- Perfil e ajustes (faixa, graus, meta, som, tema...). Uma linha por conta; vale a edição mais nova.
create table public.perfil (
  user_id uuid primary key references auth.users (id) on delete cascade,
  dados jsonb not null,
  atualizado timestamptz not null default now()
);

-- Treinos feitos. A chave é o início do treino (ms), então treinos de dois aparelhos se somam.
create table public.treinos (
  user_id uuid not null references auth.users (id) on delete cascade,
  t bigint not null,
  dados jsonb not null,
  apagado boolean not null default false,
  atualizado timestamptz not null default now(),
  primary key (user_id, t)
);

-- Planos de treino. A chave é o id do plano; "apagado" leva a exclusão para os outros aparelhos.
create table public.planos (
  user_id uuid not null references auth.users (id) on delete cascade,
  id text not null,
  dados jsonb not null,
  apagado boolean not null default false,
  atualizado timestamptz not null default now(),
  primary key (user_id, id)
);

-- Cada pessoa só lê e escreve as próprias linhas.
alter table public.perfil enable row level security;
alter table public.treinos enable row level security;
alter table public.planos enable row level security;

create policy "dono" on public.perfil for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "dono" on public.treinos for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "dono" on public.planos for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Para buscar só o que mudou desde a última sincronização.
create index treinos_atualizado on public.treinos (user_id, atualizado);
create index planos_atualizado on public.planos (user_id, atualizado);
