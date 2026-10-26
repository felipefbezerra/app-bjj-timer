import makeQr from 'qrcode-generator';

import { blockSeconds, BLOCK_NAME, clockTime, hmParts, planSeconds, planStats, repeatLabel, type Block, type BlockKind, type From, type Plan } from './plano';
import { fmtClock } from './sequence';
import { BELTS } from './theme';

// Folha A4 do plano para imprimir ou mandar em PDF, com um QR code que importa o plano no app.

const COL: Record<BlockKind, string> = { aquecimento: '#b8960a', drills: '#2f6fd6', posicao: '#7c4ddb', combates: '#2f7a0e', calma: '#7a7e85' };
const WD = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MON = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function qrSvg(text: string, size = 104) {
  const qr = makeQr(0, 'M');
  qr.addData(text);
  qr.make();
  const n = qr.getModuleCount(), q = 2, cell = size / (n + q * 2);
  let d = '';
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (qr.isDark(r, c)) d += `M${((c + q) * cell).toFixed(2)} ${((r + q) * cell).toFixed(2)}h${cell.toFixed(2)}v${cell.toFixed(2)}h-${cell.toFixed(2)}z`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><rect width="100%" height="100%" fill="#fff"/><path d="${d}" fill="#111"/></svg>`;
}

function details(b: Block) {
  switch (b.kind) {
    case 'aquecimento': case 'calma': return esc(b.note || '—');
    case 'drills': return b.items.map(x => `${esc(x.name)} · ${x.reps} × ${fmtClock(x.dur)}`).join('<br>') + (b.rest ? `<br><span class="soft">Troca de ${fmtClock(b.rest)} entre repetições</span>` : '');
    case 'posicao': return `${b.rounds} ${b.rounds === 1 ? 'volta' : 'voltas'} × ${fmtClock(b.work)} · descanso ${fmtClock(b.rest)} · ${b.order === 'rand' ? 'sorteadas' : 'em ordem'}`
      + (b.themes.length ? `<br>${esc(b.themes.join(', '))}` : '');
    case 'combates': return `${b.rounds} ${b.rounds === 1 ? 'combate' : 'combates'} × ${fmtClock(b.work)} · descanso ${fmtClock(b.rest)}`;
  }
}

export function planHtml(p: Plan, link: string, from?: From, now = new Date()) {
  const [tn, tu] = hmParts(planSeconds(p));
  const st = planStats(p);
  const day = p.weekday === null ? 'Sem dia' : `${WD[p.weekday]} · ${clockTime(p.time)}`;
  const belt = from ? BELTS[from.belt] : null;
  const total = p.blocks.reduce((a, b) => a + blockSeconds(b), 0) || 1;
  const rows = p.blocks.map((b, i) => `
      <tr>
        <td class="n"><span style="background:${COL[b.kind]}">${i + 1}</span></td>
        <td class="b">${BLOCK_NAME[b.kind]}</td>
        <td class="d">${details(b)}</td>
        <td class="t">${fmtClock(blockSeconds(b))}</td>
        <td class="f"><i></i></td>
      </tr>`).join('');
  const bar = p.blocks.map(b => `<span style="flex:${blockSeconds(b) / total};background:${COL[b.kind]}"></span>`).join('');
  const chip = belt ? `<span class="belt" style="background:${belt.color}"><span style="background:${belt.tip}"></span></span>` : '';
  return `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(p.name)}</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;500;600;700&family=Oswald:wght@500;600&display=swap">
<style>
@page { size: A4; margin: 14mm 15mm; }
* { box-sizing: border-box; }
body { margin: 0; color: #17181a; font-family: 'Barlow Condensed', 'Arial Narrow', Arial, sans-serif; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
.k { font-size: 11px; letter-spacing: .16em; text-transform: uppercase; color: #5d6066; }
.num { font-family: Oswald, 'Arial Narrow', sans-serif; }
.head { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #17181a; padding-bottom: 10px; }
h1 { margin: 2px 0 0; font-size: 36px; line-height: 1; text-transform: uppercase; }
.meta { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin: 14px 0 12px; font-size: 14px; }
.meta b { display: block; font-weight: 600; text-transform: uppercase; }
.belt { display: inline-block; position: relative; width: 40px; height: 8px; border-radius: 2px; vertical-align: middle; margin-left: 6px; border: 1px solid rgba(0,0,0,.2); }
.belt span { position: absolute; right: 5px; top: 0; bottom: 0; width: 13px; }
.bar { display: flex; gap: 3px; height: 10px; border-radius: 5px; overflow: hidden; }
.stats { display: flex; flex-wrap: wrap; gap: 6px 18px; margin: 10px 0 14px; font-size: 13px; color: #3d4045; text-transform: uppercase; letter-spacing: .08em; }
.stats b { font-family: Oswald, sans-serif; font-weight: 500; font-size: 15px; color: #17181a; }
table { width: 100%; border-collapse: collapse; }
th { font-size: 11px; letter-spacing: .14em; text-transform: uppercase; color: #5d6066; text-align: left; font-weight: 500; padding: 0 8px 6px; }
td { border-top: 1px solid #d9d6ce; padding: 9px 8px; vertical-align: top; }
tr { page-break-inside: avoid; }
td.n { width: 30px; padding-left: 0; } td.n span { display: inline-flex; width: 22px; height: 22px; border-radius: 11px; color: #fff; font-family: Oswald, sans-serif; font-size: 12px; align-items: center; justify-content: center; }
td.b { width: 130px; font-weight: 700; text-transform: uppercase; font-size: 15px; }
td.d { font-size: 13.5px; line-height: 1.35; color: #2a2c30; } .soft { color: #6b6e74; }
td.t { width: 56px; text-align: right; font-family: Oswald, sans-serif; font-size: 15px; }
td.f { width: 26px; padding-right: 0; } td.f i { display: inline-block; width: 16px; height: 16px; border: 1.5px solid #6b6e74; border-radius: 3px; }
.notes { margin-top: 14px; padding: 10px 12px; border-radius: 8px; background: #f2f0ea; font-size: 14px; line-height: 1.35; white-space: pre-wrap; }
.qr { display: flex; align-items: center; gap: 16px; margin-top: 18px; border-top: 1px solid #d9d6ce; padding-top: 14px; page-break-inside: avoid; }
.qr b { display: block; font-size: 17px; text-transform: uppercase; margin-bottom: 4px; }
.qr p { margin: 0; font-size: 13.5px; color: #3d4045; line-height: 1.35; }
.qr a { color: #2f6fd6; font-size: 11px; word-break: break-all; }
@media screen { body { max-width: 760px; margin: 0 auto; padding: 32px 24px; } }
.foot { margin-top: 12px; display: flex; justify-content: space-between; font-size: 11px; letter-spacing: .1em; text-transform: uppercase; color: #8a8d92; }
</style></head>
<body>
  <div class="head">
    <div><div class="k">Plano de treino</div><h1>${esc(p.name)}</h1></div>
    <div style="text-align:right"><div class="num" style="font-size:34px;font-weight:600;line-height:1">${tn}<span style="font-size:15px;color:#5d6066"> ${tu}</span></div><div class="k">Duração total</div></div>
  </div>
  <div class="meta">
    <div><span class="k">Dia</span><b>${day}</b></div>
    <div><span class="k">Repete</span><b>${p.weekday === null ? '—' : repeatLabel(p)}</b></div>
    <div><span class="k">Montado por</span><b>${from ? `${esc(from.name)}${chip}` : '—'}</b></div>
  </div>
  <div class="bar">${bar}</div>
  <div class="stats">
    <span><b>${st.drills}</b> drills</span><span><b>${st.fights}</b> combates</span><span><b>${Math.round(st.fight / 60)} min</b> de luta</span>
    <span>Preparar ${fmtClock(p.prep)} · troca entre blocos ${fmtClock(p.change)}</span>
  </div>
  <table>
    <thead><tr><th></th><th>Bloco</th><th>O que fazer</th><th style="text-align:right">Tempo</th><th>Feito</th></tr></thead>
    <tbody>${rows}
    </tbody>
  </table>
  ${p.notes.trim() ? `<div class="notes"><div class="k" style="margin-bottom:3px">Observações</div>${esc(p.notes.trim())}</div>` : ''}
  <div class="qr">
    ${qrSvg(link)}
    <div><b>Rodar este plano no app</b><p>Aponte a câmera do celular para o código ou abra o link abaixo. O plano entra nos seus planos com todos os tempos, e o app fala cada drill e posição.</p><a href="${esc(link)}">${esc(link.length > 90 ? `${link.slice(0, 90)}…` : link)}</a></div>
  </div>
  <div class="foot"><span>Gerado em ${now.getDate()} ${MON[now.getMonth()]} ${now.getFullYear()}</span><span>${p.blocks.length} ${p.blocks.length === 1 ? 'bloco' : 'blocos'}</span></div>
</body></html>`;
}
