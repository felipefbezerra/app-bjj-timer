import * as DocumentPicker from 'expo-document-picker';

// Navegador: o link usa o compartilhar do sistema quando existe (celular) ou vai para a área de
// transferência; o PDF abre a impressão (dá para "Salvar como PDF"); o arquivo é baixado.

export async function shareLink(message: string, url: string): Promise<'shared' | 'copied' | 'none'> {
  if (typeof navigator.share === 'function') {
    try { await navigator.share({ text: message }); return 'shared'; }
    catch (e) { if ((e as Error).name === 'AbortError') return 'none'; }
  }
  try { await navigator.clipboard.writeText(url); return 'copied'; } catch { return 'none'; }
}

export async function sharePdf(html: string, _name: string, _title: string) {
  const w = window.open('', '_blank');
  if (!w) throw new Error('popup');
  w.document.open();
  w.document.write(html);
  w.document.close();
  // Espera as fontes antes de abrir a impressão.
  const go = () => { w.focus(); w.print(); };
  if (w.document.fonts?.ready) w.document.fonts.ready.then(() => setTimeout(go, 150)); else setTimeout(go, 600);
}

export async function shareFile(text: string, name: string, _title: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url; a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function pickPlanFile(): Promise<string | null> {
  const r = await DocumentPicker.getDocumentAsync({ type: ['application/json', '.json', 'text/plain'] });
  if (r.canceled || !r.assets[0]) return null;
  const a = r.assets[0];
  return a.file ? a.file.text() : (await fetch(a.uri)).text();
}
