// Projeto do Supabase, lido das variáveis de ambiente: no computador, do arquivo .env (fora do git,
// veja .env.example); na Vercel e no EAS, das variáveis configuradas lá. Nunca escrever as chaves aqui.
// A chave "anon" acaba dentro do app publicado (é feita para isso); quem protege os dados são as
// regras do banco (row level security). A chave service_role nunca entra no app.
export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
export const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

// Sem projeto configurado, o app segue só no aparelho e a parte de conta fica escondida.
export const NUVEM_LIGADA = !!(SUPABASE_URL && SUPABASE_ANON_KEY);

// Onde a sessão de login fica guardada no aparelho.
export const CHAVE_SESSAO = 'bjj.auth';
