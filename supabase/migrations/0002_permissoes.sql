-- Libera o acesso do app (usuário logado) às tabelas.
-- Projetos novos do Supabase não fazem mais isso sozinhos para tabelas criadas pelo SQL Editor,
-- e sem esta liberação toda sincronização falha com "permission denied".
-- Continua seguro: as regras "dono" (row level security) do 0001 deixam cada pessoa ver só as próprias linhas.
-- Pode rodar mais de uma vez sem problema.
grant usage on schema public to authenticated;
grant select, insert, update, delete on public.perfil, public.treinos, public.planos to authenticated;
