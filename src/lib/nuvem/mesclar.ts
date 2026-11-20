// Regras para juntar os dados do aparelho com os da conta. Sem acesso a rede: dá para testar sozinho.
// - Perfil e ajustes: vale a edição mais nova (hora da edição no aparelho).
// - Treinos: a chave é o início do treino; os de cada aparelho se somam, e a exclusão vale para todos.
// - Planos: vale a versão com "updated" mais novo; a exclusão também viaja.
import type { Plan } from '../plano';
import type { Session } from '../store';

// Campos que viajam no perfil. Os do silencioso do iPhone ficam só no aparelho.
export const CAMPOS_PERFIL = ['profile', 'weeklyGoal', 'sound', 'theme', 'preset', 'custom', 'circuito', 'circuitoPreset', 'positions'] as const;
export type CampoPerfil = (typeof CAMPOS_PERFIL)[number];

export type Dados = { history: Session[]; plans: Plan[] } & Record<CampoPerfil, unknown>;

// O que mudou no aparelho e ainda não subiu.
export type Pendente = {
  // Conta as edições do perfil ainda não enviadas (0 = nada).
  perfil: number;
  treinos: number[];
  planos: string[];
  treinosApagados: number[];
  planosApagados: string[];
};

export const NADA_PENDENTE: Pendente = { perfil: 0, treinos: [], planos: [], treinosApagados: [], planosApagados: [] };

export type LinhaPerfil = { dados: Record<string, unknown> & { em: number }; atualizado: string };
export type LinhaTreino = { t: number; dados: Session | Record<string, never>; apagado: boolean; atualizado: string };
export type LinhaPlano = { id: string; dados: Plan | { updated: number }; apagado: boolean; atualizado: string };

export type Remoto = { perfil: LinhaPerfil | null; treinos: LinhaTreino[]; planos: LinhaPlano[] };

// Junta o que veio da conta no que está no aparelho. "perfilEm" é a hora da versão local do perfil.
export function mesclar<D extends Dados>(local: D, remoto: Remoto, pend: Pendente, perfilEm: number) {
  let dados: D = local;
  const p: Pendente = { ...pend, treinos: [...pend.treinos], planos: [...pend.planos], treinosApagados: [...pend.treinosApagados], planosApagados: [...pend.planosApagados] };
  let em = perfilEm;

  const rp = remoto.perfil;
  if (rp && rp.dados.em > perfilEm) {
    const patch: Partial<D> = {};
    for (const k of CAMPOS_PERFIL) if (k in rp.dados) (patch as Record<string, unknown>)[k] = rp.dados[k];
    dados = { ...dados, ...patch };
    em = rp.dados.em;
    p.perfil = 0;
  }

  if (remoto.treinos.length) {
    const hist = new Map(dados.history.map(h => [h.t, h]));
    for (const r of remoto.treinos) {
      if (r.apagado) { hist.delete(r.t); p.treinos = p.treinos.filter(t => t !== r.t); }
      else if (!hist.has(r.t) && !p.treinosApagados.includes(r.t)) hist.set(r.t, r.dados as Session);
    }
    dados = { ...dados, history: [...hist.values()].sort((a, b) => a.t - b.t).slice(-1000) };
  }

  if (remoto.planos.length) {
    const planos = new Map(dados.plans.map(x => [x.id, x]));
    for (const r of remoto.planos) {
      const cur = planos.get(r.id);
      const quando = r.dados.updated ?? 0;
      if (r.apagado) {
        if (cur && cur.updated <= quando) { planos.delete(r.id); p.planos = p.planos.filter(id => id !== r.id); }
      } else if (!cur) {
        if (!p.planosApagados.includes(r.id)) planos.set(r.id, r.dados as Plan);
      } else if (quando > cur.updated) {
        planos.set(r.id, r.dados as Plan);
        p.planos = p.planos.filter(id => id !== r.id);
      }
    }
    // Mantém a ordem do aparelho e põe os planos novos no fim.
    const ordem = dados.plans.map(x => x.id).filter(id => planos.has(id));
    for (const id of planos.keys()) if (!ordem.includes(id)) ordem.push(id);
    dados = { ...dados, plans: ordem.map(id => planos.get(id)!) };
  }

  return { dados, pend: p, perfilEm: em };
}

// O que precisa subir para a conta.
export function paraEnviar(local: Dados, pend: Pendente, perfilEm: number, agora: number) {
  const perfil = pend.perfil ? { ...Object.fromEntries(CAMPOS_PERFIL.map(k => [k, local[k]])), em: perfilEm } : null;
  const hist = new Map(local.history.map(h => [h.t, h]));
  const treinos = [
    ...pend.treinos.filter(t => hist.has(t)).map(t => ({ t, dados: hist.get(t)!, apagado: false })),
    ...pend.treinosApagados.map(t => ({ t, dados: {}, apagado: true })),
  ];
  const planosMap = new Map(local.plans.map(x => [x.id, x]));
  const planos = [
    ...pend.planos.filter(id => planosMap.has(id)).map(id => ({ id, dados: planosMap.get(id)!, apagado: false })),
    ...pend.planosApagados.map(id => ({ id, dados: { updated: agora }, apagado: true })),
  ];
  return { perfil, treinos, planos };
}

// Tira da fila o que já subiu, mantendo o que mudou enquanto enviava
// (um perfil editado de novo ou um plano salvo de novo, com outra versão).
export function enviado(pend: Pendente, foi: Pendente, planosEnviados: Map<string, number>, planosAgora: Plan[]): Pendente {
  const agora = new Map(planosAgora.map(x => [x.id, x.updated]));
  return {
    perfil: pend.perfil === foi.perfil ? 0 : pend.perfil,
    treinos: pend.treinos.filter(t => !foi.treinos.includes(t)),
    planos: pend.planos.filter(id => !(planosEnviados.has(id) && planosEnviados.get(id) === agora.get(id))),
    treinosApagados: pend.treinosApagados.filter(t => !foi.treinosApagados.includes(t)),
    planosApagados: pend.planosApagados.filter(id => !foi.planosApagados.includes(id)),
  };
}

// Primeira vez de uma conta neste aparelho: tudo o que já está aqui vai para a conta.
// O perfil local entra como o mais antigo, para não apagar o perfil de uma conta que já existe.
export function tudoPendente(local: Dados): Pendente {
  return { perfil: 1, treinos: local.history.map(h => h.t), planos: local.plans.map(x => x.id), treinosApagados: [], planosApagados: [] };
}
