import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Share } from 'react-native';

// Celular: o link vai pela folha de compartilhar do sistema (WhatsApp, Telegram...);
// PDF e arquivo são gravados com o nome do plano e compartilhados como anexo.

export async function shareLink(message: string, _url: string): Promise<'shared' | 'copied' | 'none'> {
  const r = await Share.share({ message });
  return r.action === Share.dismissedAction ? 'none' : 'shared';
}

function named(name: string) {
  const f = new File(Paths.cache, name);
  if (f.exists) f.delete();
  return f;
}

export async function sharePdf(html: string, name: string, title: string) {
  const { uri } = await Print.printToFileAsync({ html, width: 595, height: 842 });
  const out = named(name);
  new File(uri).moveSync(out);
  await Sharing.shareAsync(out.uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf', dialogTitle: title });
}

export async function shareFile(text: string, name: string, title: string) {
  const out = named(name);
  out.create();
  out.write(text);
  await Sharing.shareAsync(out.uri, { mimeType: 'application/json', UTI: 'public.json', dialogTitle: title });
}

export async function pickPlanFile(): Promise<string | null> {
  const r = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });
  if (r.canceled || !r.assets[0]) return null;
  return new File(r.assets[0].uri).text();
}
