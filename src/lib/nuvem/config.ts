// Projeto do Supabase. A URL e a chave "anon" são públicas por natureza: vão dentro do app e só
// dão acesso ao que as regras do banco (row level security) deixam cada conta ver.
// Podem vir de variáveis de ambiente (EXPO_PUBLIC_...) ou ficar escritas aqui.
export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
export const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

// Sem projeto configurado, o app segue só no aparelho e a parte de conta fica escondida.
export const NUVEM_LIGADA = !!(SUPABASE_URL && SUPABASE_ANON_KEY);

// Onde a sessão de login fica guardada no aparelho.
export const CHAVE_SESSAO = 'bjj.auth';
