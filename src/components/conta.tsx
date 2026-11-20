import { useState } from 'react';
import { ActivityIndicator, Pressable, TextInput, View } from 'react-native';

import { Nuvem, useConta, type Resultado } from '@/lib/nuvem';
import { F, useC } from '@/lib/theme';
import { Sheet } from './sheet';
import { Label, PrimaryButton, Txt } from './ui';

type Modo = 'entrar' | 'criar' | 'esqueci' | 'excluir';

const emailOk = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());
export const SENHA_MIN = 8;

function quando(t: number) {
  const m = Math.round((Date.now() - t) / 60000);
  if (m < 1) return 'agora';
  if (m < 60) return `há ${m} min`;
  const h = Math.round(m / 60);
  return h < 24 ? `há ${h} h` : `há ${Math.round(h / 24)} dias`;
}

// Linha da aba Treinos com o estado da conta.
export function ContaLinha({ onPress }: { onPress: () => void }) {
  const C = useC();
  const conta = useConta();
  const sub = !conta.email ? 'Entre para guardar seus treinos na nuvem'
    : conta.status === 'sincronizando' ? 'Sincronizando...'
    : conta.status === 'offline' ? 'Sem internet · sincroniza quando voltar'
    : conta.status === 'erro' ? 'Não sincronizou · toque para tentar de novo'
    : `Sincronizado ${quando(conta.ultima)}`;
  return (
    <Pressable accessibilityRole="button" onPress={onPress}
      style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12, padding: 18, borderRadius: 16, backgroundColor: C.panel }}>
      <View style={{ flex: 1, gap: 2 }}>
        {conta.email ? <Txt f="semi" size={20} numberOfLines={1}>{conta.email}</Txt> : <Txt f="semi" size={20} caps>Conta</Txt>}
        <Txt f="med" size={14} color={conta.status === 'erro' ? C.rest : C.muted} caps numberOfLines={2}>{sub}</Txt>
      </View>
      <Txt size={24} color={C.muted}>›</Txt>
    </Pressable>
  );
}

export function Campo({ label, value, onChange, senha, nova, onSubmit }: { label: string; value: string; onChange: (v: string) => void; senha?: boolean; nova?: boolean; onSubmit?: () => void }) {
  const C = useC();
  return (
    <View style={{ gap: 6 }}>
      <Label size={13}>{label}</Label>
      <TextInput value={value} onChangeText={onChange} onSubmitEditing={onSubmit} placeholderTextColor={C.muted}
        autoCapitalize="none" autoCorrect={false} spellCheck={false}
        {...(senha
          ? { secureTextEntry: true, textContentType: nova ? 'newPassword' : 'password', autoComplete: nova ? 'new-password' : 'current-password', placeholder: nova ? `Pelo menos ${SENHA_MIN} caracteres` : 'Sua senha' } as const
          : { keyboardType: 'email-address', textContentType: 'emailAddress', autoComplete: 'email', placeholder: 'voce@email.com', inputMode: 'email' } as const)}
        style={{ fontFamily: F.med, fontSize: 20, color: C.fg, backgroundColor: C.ground, borderRadius: 12, borderWidth: 1, borderColor: C.line, paddingHorizontal: 12, paddingVertical: 10 }} />
    </View>
  );
}

function Aviso({ texto, erro }: { texto: string; erro?: boolean }) {
  const C = useC();
  return (
    <View style={{ padding: 12, borderRadius: 12, backgroundColor: erro ? 'rgba(220,70,60,.14)' : C.ground, borderWidth: 1, borderColor: erro ? C.rest : C.line }}>
      <Txt f="reg" size={16} color={erro ? C.fg : C.soft}>{texto}</Txt>
    </View>
  );
}

function Link({ texto, onPress }: { texto: string; onPress: () => void }) {
  const C = useC();
  return (
    <Pressable accessibilityRole="button" onPress={onPress} hitSlop={8} style={{ paddingVertical: 6, alignSelf: 'center' }}>
      <Txt f="semi" size={16} color={C.soft} style={{ textDecorationLine: 'underline' }}>{texto}</Txt>
    </Pressable>
  );
}

// Folha de conta: entrar, criar conta, esqueci a senha e, já dentro, sincronizar, sair e excluir.
export function ContaSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const C = useC();
  const conta = useConta();
  const [modo, setModo] = useState<Modo>('entrar');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [msg, setMsg] = useState<{ texto: string; erro?: boolean } | null>(null);
  const [ocupado, setOcupado] = useState(false);

  const ir = (m: Modo) => { setModo(m); setMsg(null); setSenha(''); };
  const fechar = () => { ir('entrar'); onClose(); };

  const rodar = async (fn: () => Promise<Resultado>, depois?: () => void) => {
    if (ocupado) return;
    setOcupado(true); setMsg(null);
    const r = await fn();
    setOcupado(false);
    if (!r.ok) setMsg({ texto: r.erro, erro: true });
    else { if (r.aviso) setMsg({ texto: r.aviso }); setSenha(''); depois?.(); }
  };

  const validar = (precisaSenha: boolean, nova?: boolean) => {
    if (!emailOk(email)) { setMsg({ texto: 'Confira o e-mail digitado.', erro: true }); return false; }
    if (precisaSenha && nova && senha.length < SENHA_MIN) { setMsg({ texto: `A senha precisa ter pelo menos ${SENHA_MIN} caracteres.`, erro: true }); return false; }
    if (precisaSenha && !senha) { setMsg({ texto: 'Digite sua senha.', erro: true }); return false; }
    return true;
  };

  const entrar = () => { if (validar(true)) rodar(() => Nuvem.entrar(email, senha)); };
  const criar = () => { if (validar(true, true)) rodar(() => Nuvem.criarConta(email, senha), () => setModo('entrar')); };
  const esqueci = () => { if (validar(false)) rodar(() => Nuvem.esqueciSenha(email)); };

  const botao = (label: string, onPress: () => void) => ocupado
    ? <View style={{ height: 56, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={C.fg} /></View>
    : <PrimaryButton label={label} height={56} onPress={onPress} />;

  // Já dentro da conta.
  if (conta.email) {
    const excluir = modo === 'excluir';
    return (
      <Sheet open={open} title="Sua conta" onClose={fechar} actions={<PrimaryButton label="Pronto" height={52} onPress={fechar} />}>
        <View style={{ gap: 4 }}>
          <Label size={13}>Conectado como</Label>
          <Txt f="semi" size={20}>{conta.email}</Txt>
        </View>
        <Txt f="reg" size={16} color={C.soft}>Seus treinos, planos e perfil ficam guardados na nuvem e aparecem em qualquer aparelho em que você entrar com este e-mail. Sem internet, o app segue normal e sincroniza depois.</Txt>
        {msg && <Aviso texto={msg.texto} erro={msg.erro} />}
        {!excluir && !msg && conta.status === 'erro' && conta.erro && <Aviso erro texto={`Não sincronizou. ${conta.erro}`} />}
        {!excluir && <>
          {conta.status === 'sincronizando'
            ? <View style={{ height: 52, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={C.fg} /></View>
            : <PrimaryButton label="Sincronizar agora" height={52} light={false} onPress={() => Nuvem.sincronizar()} />}
          <PrimaryButton label="Sair da conta" height={52} light={false} onPress={() => { Nuvem.sair(); ir('entrar'); }} />
          <Txt f="reg" size={14} color={C.muted}>Ao sair, os dados continuam neste aparelho.</Txt>
          <Link texto="Excluir minha conta" onPress={() => ir('excluir')} />
        </>}
        {excluir && <>
          <Aviso erro texto="Excluir a conta apaga da nuvem todos os seus treinos, planos e perfil, e não dá para desfazer. Neste aparelho os dados continuam." />
          {botao('Excluir conta para sempre', () => rodar(() => Nuvem.excluirConta(), () => { setModo('entrar'); setMsg({ texto: 'Conta excluída. Os dados continuam neste aparelho.' }); }))}
          <Link texto="Cancelar" onPress={() => ir('entrar')} />
        </>}
      </Sheet>
    );
  }

  const titulo = modo === 'criar' ? 'Criar conta' : modo === 'esqueci' ? 'Esqueci a senha' : 'Entrar';
  return (
    <Sheet open={open} title={titulo} onClose={fechar}>
      {modo !== 'esqueci' && <Txt f="reg" size={16} color={C.soft}>Com uma conta, seus treinos, planos e perfil ficam guardados na nuvem e aparecem em qualquer aparelho. O que já está neste aparelho vai junto.</Txt>}
      {modo === 'esqueci' && <Txt f="reg" size={16} color={C.soft}>Digite o e-mail da sua conta. Mandamos um link para você criar uma senha nova.</Txt>}
      <Campo label="E-mail" value={email} onChange={setEmail} />
      {modo !== 'esqueci' && <Campo label="Senha" value={senha} onChange={setSenha} senha nova={modo === 'criar'} onSubmit={modo === 'criar' ? criar : entrar} />}
      {msg && <Aviso texto={msg.texto} erro={msg.erro} />}
      {modo === 'entrar' && <>
        {botao('Entrar', entrar)}
        <Link texto="Esqueci a senha" onPress={() => ir('esqueci')} />
        <Link texto="Não tenho conta · Criar conta" onPress={() => ir('criar')} />
      </>}
      {modo === 'criar' && <>
        {botao('Criar conta', criar)}
        <Link texto="Já tenho conta · Entrar" onPress={() => ir('entrar')} />
      </>}
      {modo === 'esqueci' && <>
        {botao('Enviar link', esqueci)}
        <Link texto="Voltar para Entrar" onPress={() => ir('entrar')} />
      </>}
    </Sheet>
  );
}
