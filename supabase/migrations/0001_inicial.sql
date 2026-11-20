-- Primeira versão do banco na nuvem (Supabase/Postgres).
-- O app continua salvando no aparelho primeiro; estas tabelas guardam a cópia de cada conta
-- para backup e para sincronizar entre aparelhos. Só Postgres padrão, para migrar fácil depois.
-- Cada linha guarda o objeto do app como jsonb, com a chave que permite juntar dados de dois aparelhos.

-- Perfil e ajustes (faixa, graus, meta, som, tema...). Uma linha por conta; vale a edição mais nova
-- (dados->>'em', a hora da edição no aparelho).
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

-- "atualizado" é sempre a hora do servidor, para cada aparelho buscar só o que mudou.
create function public.marcar_atualizado() returns trigger language plpgsql as $$
begin
  new.atualizado := now();
  return new;
end $$;
create trigger perfil_atualizado before insert or update on public.perfil for each row execute function public.marcar_atualizado();
create trigger treinos_atualizado before insert or update on public.treinos for each row execute function public.marcar_atualizado();
create trigger planos_atualizado before insert or update on public.planos for each row execute function public.marcar_atualizado();

-- Cada pessoa só lê e escreve as próprias linhas.
alter table public.perfil enable row level security;
alter table public.treinos enable row level security;
alter table public.planos enable row level security;

create policy "dono" on public.perfil for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "dono" on public.treinos for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "dono" on public.planos for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index treinos_desde on public.treinos (user_id, atualizado);
create index planos_desde on public.planos (user_id, atualizado);

-- Excluir a conta pelo próprio app (exigência da App Store e do Google Play).
-- Apaga o usuário; perfil, treinos e planos vão junto pelo "on delete cascade".
create function public.excluir_conta() returns void
language sql security definer set search_path = '' as $$
  delete from auth.users where id = auth.uid();
$$;
revoke execute on function public.excluir_conta() from public, anon;
grant execute on function public.excluir_conta() to authenticated;
