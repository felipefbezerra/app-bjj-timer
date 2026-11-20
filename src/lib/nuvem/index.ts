// Conta e sincronização com o Supabase. O app continua guardando tudo no aparelho primeiro;
// com a conta ligada, as mudanças sobem para a nuvem e as de outros aparelhos descem.
// Todo acesso ao Supabase passa por esta pasta, para facilitar trocar de serviço no futuro.
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { SupabaseClient } from '@supabase/supabase-js';
import { useSyncExternalStore } from 'react';
import { AppState, Platform } from 'react-native';

import { SITE } from '../compartilhar';
import { CHAVE_SESSAO, NUVEM_LIGADA } from './config';
import { enviado, mesclar, NADA_PENDENTE, paraEnviar, tudoPendente, type Dados, type LinhaPerfil, type LinhaPlano, type LinhaTreino, type Pendente } from './mesclar';

export type StatusConta = 'fora' | 'sincronizando' | 'ok' | 'offline' | 'erro';
export type EstadoConta = {
  email: string | null;
  status: StatusConta;
  // Hora da última sincronização completa.
  ultima: number;
  // Chegou pelo link de trocar senha do e-mail.
  recuperacao: boolean;
  // Motivo da última falha da sincronização (status 'erro').
  erro: string | null;
};

// Ligação com o store.tsx: ler o estado atual e aplicar uma mudança vinda da nuvem.
export type Ponte<D extends Dados> = { ler: () => D; aplicar: (d: D) => void };

type Sync = { user: string | null; email: string | null; desde: string | null; pend: Pendente; perfilEm: number; ultima: number };
const CHAVE_SYNC = 'bjj.sync.v1';
const VAZIO: Sync = { user: null, email: null, desde: null, pend: NADA_PENDENTE, perfilEm: 0, ultima: 0 };

let sync: Sync = VAZIO;
let ponte: Ponte<Dados> | null = null;
let estado: EstadoConta = { email: null, status: 'fora', ultima: 0, recuperacao: false, erro: null };
const ouvintes = new Set<() => void>();

function mudarEstado(patch: Partial<EstadoConta>) {
  estado = { ...estado, ...patch };
  ouvintes.forEach(f => f());
}
function salvarSync() { AsyncStorage.setItem(CHAVE_SYNC, JSON.stringify(sync)).catch(() => {}); }

export function useConta() {
  return useSyncExternalStore(f => { ouvintes.add(f); return () => { ouvintes.delete(f); }; }, () => estado, () => estado);
}

// O cliente do Supabase só é baixado quando a conta é usada.
let clienteP: Promise<SupabaseClient> | null = null;
function cliente() {
  if (!clienteP) {
    clienteP = import('./cliente').then(m => {
      const c = m.criarCliente();
      c.auth.onAuthStateChange((ev, sessao) => {
        if (ev === 'PASSWORD_RECOVERY') mudarEstado({ recuperacao: true });
        // Entrou pelo link de confirmação do e-mail (versão web).
        if (ev === 'SIGNED_IN' && sessao && sessao.user.id !== sync.user) setTimeout(() => { associar(sessao.user.id, sessao.user.email ?? null); sincronizar(); }, 0);
      });
      return c;
    });
  }
  return clienteP;
}

// Erros do Supabase em português.
function mensagem(e: unknown): string {
  const err = e as { code?: string; message?: string; status?: number; name?: string };
  const code = err?.code ?? '';
  const msg = err?.message ?? '';
  if (code === 'invalid_credentials' || /invalid login credentials/i.test(msg)) return 'E-mail ou senha incorretos.';
  if (code === 'email_not_confirmed' || /email not confirmed/i.test(msg)) return 'Confirme seu e-mail pelo link que enviamos antes de entrar.';
  if (code === 'user_already_exists' || /already registered/i.test(msg)) return 'Já existe uma conta com esse e-mail. Toque em Entrar.';
  if (code === 'weak_password' || /password should be/i.test(msg)) return 'Senha fraca. Use pelo menos 8 caracteres, com letras e números.';
  if (code === 'same_password') return 'A nova senha precisa ser diferente da atual.';
  if (code === 'validation_failed' || /invalid format|unable to validate email/i.test(msg)) return 'Confira o e-mail digitado.';
  if (code.startsWith('over_') || err?.status === 429) return 'Muitas tentativas. Espere alguns minutos e tente de novo.';
  if (err?.name === 'AuthRetryableFetchError' || /fetch|network/i.test(msg)) return 'Sem internet agora. Tente de novo quando tiver sinal.';
  return 'Não deu certo agora. Tente de novo em instantes.';
}
// Por que a sincronização falhou, para mostrar na folha da conta.
function motivoSync(e: unknown): string {
  const err = e as { code?: string; message?: string; status?: number };
  const code = err?.code ?? '';
  const msg = err?.message ?? '';
  if (code === '42501' || /permission denied/i.test(msg)) return 'O banco recusou o acesso às tabelas. Falta liberar a permissão no Supabase (supabase/migrations/0002_permissoes.sql).';
  if (code === 'PGRST205' || code === '42P01' || /could not find the table|does not exist/i.test(msg)) return 'As tabelas não existem no Supabase. Rode o supabase/migrations/0001_inicial.sql.';
  if (code === 'PGRST301' || code === 'PGRST303' || err?.status === 401 || /jwt/i.test(msg)) return 'Sua sessão expirou. Saia da conta e entre de novo.';
  return msg ? `Erro do servidor: ${msg}${code ? ` (${code})` : ''}` : 'Erro desconhecido do servidor.';
}

export type Resultado = { ok: true; aviso?: string } | { ok: false; erro: string };

function associar(user: string, email: string | null) {
  // Primeira vez desta conta neste aparelho: tudo o que já está aqui vai para a conta.
  if (sync.user !== user) sync = { ...VAZIO, user, email, pend: ponte ? tudoPendente(ponte.ler()) : NADA_PENDENTE };
  else sync = { ...sync, email };
  salvarSync();
  mudarEstado({ email, status: 'sincronizando', erro: null });
}

function esquecer() {
  sync = VAZIO;
  salvarSync();
  mudarEstado({ email: null, status: 'fora', ultima: 0, recuperacao: false, erro: null });
}

// ---------- Sincronização ----------

let rodando = false, denovo = false, timer: ReturnType<typeof setTimeout> | null = null;

function agendar(ms = 3000) {
  if (!sync.user) return;
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => { timer = null; sincronizar(); }, ms);
}

async function puxar<T>(c: SupabaseClient, tabela: string, colunas: string, user: string, desde: string) {
  const out: T[] = [];
  for (let de = 0; ; de += 1000) {
    const { data, error } = await c.from(tabela).select(colunas).eq('user_id', user).gt('atualizado', desde).order('atualizado').range(de, de + 999);
    if (error) throw error;
    out.push(...(data as T[]));
    if (data.length < 1000) return out;
  }
}

async function enviar(c: SupabaseClient, tabela: string, linhas: object[], conflito: string) {
  let max = '';
  for (let i = 0; i < linhas.length; i += 500) {
    const { data, error } = await c.from(tabela).upsert(linhas.slice(i, i + 500), { onConflict: conflito }).select('atualizado');
    if (error) throw error;
    for (const r of data as { atualizado: string }[]) if (r.atualizado > max) max = r.atualizado;
  }
  return max;
}

export async function sincronizar(): Promise<void> {
  if (!NUVEM_LIGADA || !sync.user || !ponte) return;
  if (rodando) { denovo = true; return; }
  rodando = true;
  mudarEstado({ status: 'sincronizando' });
  try {
    const c = await cliente();
    const { data: { session } } = await c.auth.getSession();
    if (!session) { esquecer(); return; }
    const user = session.user.id;
    if (user !== sync.user) associar(user, session.user.email ?? null);

    // 1. Desce o que mudou desde a última vez (com 1 minuto de folga; juntar de novo não estraga nada).
    const desde = sync.desde ? new Date(Date.parse(sync.desde) - 60_000).toISOString() : '1970-01-01T00:00:00Z';
    const [perfil, treinos, planos] = await Promise.all([
      c.from('perfil').select('dados, atualizado').eq('user_id', user).maybeSingle(),
      puxar<LinhaTreino>(c, 'treinos', 't, dados, apagado, atualizado', user, desde),
      puxar<LinhaPlano>(c, 'planos', 'id, dados, apagado, atualizado', user, desde),
    ]);
    if (perfil.error) throw perfil.error;
    let maxVisto = [perfil.data as LinhaPerfil | null, ...treinos, ...planos].reduce((m, r) => (r && r.atualizado > m ? r.atualizado : m), sync.desde ?? '');

    const antes = ponte.ler();
    const m = mesclar(antes, { perfil: perfil.data as LinhaPerfil | null, treinos, planos }, sync.pend, sync.perfilEm);
    sync = { ...sync, pend: m.pend, perfilEm: m.perfilEm };
    if (m.dados !== antes) ponte.aplicar(m.dados);

    // 2. Sobe o que mudou aqui.
    const foi = sync.pend;
    if (foi.perfil && !sync.perfilEm) sync.perfilEm = Date.now();
    const local = ponte.ler();
    const env = paraEnviar(local, foi, sync.perfilEm, Date.now());
    const versoes = new Map(env.planos.filter(p => !p.apagado).map(p => [p.id, (p.dados as { updated: number }).updated]));
    const tempos = await Promise.all([
      env.perfil ? enviar(c, 'perfil', [{ user_id: user, dados: env.perfil }], 'user_id') : '',
      env.treinos.length ? enviar(c, 'treinos', env.treinos.map(r => ({ user_id: user, ...r })), 'user_id,t') : '',
      env.planos.length ? enviar(c, 'planos', env.planos.map(r => ({ user_id: user, ...r })), 'user_id,id') : '',
    ]);
    for (const t of tempos) if (t > maxVisto) maxVisto = t;

    sync = { ...sync, pend: enviado(sync.pend, foi, versoes, ponte.ler().plans), desde: maxVisto || sync.desde, ultima: Date.now() };
    salvarSync();
    mudarEstado({ status: 'ok', ultima: sync.ultima, email: sync.email, erro: null });
  } catch (e) {
    const off = /fetch|network/i.test((e as Error)?.message ?? '') || (e as { name?: string })?.name === 'AuthRetryableFetchError';
    if (!off) console.warn('[nuvem] sincronização falhou', e);
    mudarEstado({ status: off ? 'offline' : 'erro', erro: off ? null : motivoSync(e) });
    salvarSync();
  } finally {
    rodando = false;
    if (denovo) { denovo = false; agendar(500); }
  }
}

// ---------- API usada pelo app ----------

export const Nuvem = {
  ligada: NUVEM_LIGADA,

  // Lido junto com os dados do app, antes de abrir.
  async carregar() {
    try { const raw = await AsyncStorage.getItem(CHAVE_SYNC); if (raw) sync = { ...VAZIO, ...JSON.parse(raw) }; } catch {}
    if (sync.user) estado = { ...estado, email: sync.email, status: 'ok', ultima: sync.ultima };
  },

  // Chamado pelo store.tsx quando os dados estão prontos.
  ligar<D extends Dados>(p: Ponte<D>) {
    ponte = p as unknown as Ponte<Dados>;
    if (!NUVEM_LIGADA) return;
    const voltouDoEmail = Platform.OS === 'web' && typeof location !== 'undefined' && /access_token|error_description/.test(location.hash);
    if (sync.user || voltouDoEmail) cliente().then(() => sincronizar()).catch(() => {});
    AppState.addEventListener('change', s => { if (s === 'active') agendar(500); });
  },

  // Marcações feitas pelo store.tsx a cada mudança.
  perfilMudou() { if (!sync.user) return; sync.pend = { ...sync.pend, perfil: sync.pend.perfil + 1 }; sync.perfilEm = Date.now(); salvarSync(); agendar(); },
  treinoNovo(t: number) { if (!sync.user) return; if (!sync.pend.treinos.includes(t)) sync.pend = { ...sync.pend, treinos: [...sync.pend.treinos, t] }; salvarSync(); agendar(); },
  treinoApagado(t: number) {
    if (!sync.user) return;
    sync.pend = { ...sync.pend, treinos: sync.pend.treinos.filter(x => x !== t), treinosApagados: [...sync.pend.treinosApagados, t] };
    salvarSync(); agendar();
  },
  planoSalvo(id: string) { if (!sync.user) return; if (!sync.pend.planos.includes(id)) sync.pend = { ...sync.pend, planos: [...sync.pend.planos, id] }; salvarSync(); agendar(); },
  planoApagado(id: string) {
    if (!sync.user) return;
    sync.pend = { ...sync.pend, planos: sync.pend.planos.filter(x => x !== id), planosApagados: [...sync.pend.planosApagados, id] };
    salvarSync(); agendar();
  },

  async entrar(email: string, senha: string): Promise<Resultado> {
    try {
      const c = await cliente();
      const { data, error } = await c.auth.signInWithPassword({ email: email.trim(), password: senha });
      if (error) return { ok: false, erro: mensagem(error) };
      associar(data.user.id, data.user.email ?? null);
      sincronizar();
      return { ok: true };
    } catch (e) { return { ok: false, erro: mensagem(e) }; }
  },

  async criarConta(email: string, senha: string): Promise<Resultado> {
    try {
      const c = await cliente();
      const volta = Platform.OS === 'web' && typeof location !== 'undefined' ? location.origin : SITE;
      const { data, error } = await c.auth.signUp({ email: email.trim(), password: senha, options: { emailRedirectTo: volta } });
      if (error) return { ok: false, erro: mensagem(error) };
      // Com a confirmação de e-mail ligada no Supabase, a conta só entra depois do link.
      if (!data.session) return { ok: true, aviso: `Enviamos um link de confirmação para ${email.trim()}. Abra o e-mail, toque no link e depois entre aqui com sua senha.` };
      associar(data.session.user.id, data.session.user.email ?? null);
      sincronizar();
      return { ok: true };
    } catch (e) { return { ok: false, erro: mensagem(e) }; }
  },

  async esqueciSenha(email: string): Promise<Resultado> {
    try {
      const c = await cliente();
      const { error } = await c.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${SITE}/nova-senha` });
      if (error) return { ok: false, erro: mensagem(error) };
      return { ok: true, aviso: `Se existir uma conta com ${email.trim()}, chega um e-mail com o link para criar uma senha nova.` };
    } catch (e) { return { ok: false, erro: mensagem(e) }; }
  },

  async novaSenha(senha: string): Promise<Resultado> {
    try {
      const c = await cliente();
      const { error } = await c.auth.updateUser({ password: senha });
      if (error) return { ok: false, erro: mensagem(error) };
      mudarEstado({ recuperacao: false });
      return { ok: true };
    } catch (e) { return { ok: false, erro: mensagem(e) }; }
  },

  // Sai da conta. Os dados continuam neste aparelho.
  async sair() {
    try { const c = await cliente(); await c.auth.signOut({ scope: 'local' }); } catch {}
    try { await AsyncStorage.removeItem(CHAVE_SESSAO); } catch {}
    esquecer();
  },

  // Apaga a conta e tudo dela na nuvem. Os dados continuam neste aparelho.
  async excluirConta(): Promise<Resultado> {
    try {
      const c = await cliente();
      const { error } = await c.rpc('excluir_conta');
      if (error) return { ok: false, erro: mensagem(error) };
      await Nuvem.sair();
      return { ok: true };
    } catch (e) { return { ok: false, erro: mensagem(e) }; }
  },

  sincronizar,
};
