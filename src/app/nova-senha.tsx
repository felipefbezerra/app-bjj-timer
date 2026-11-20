import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, View } from 'react-native';

import { Campo, SENHA_MIN } from '@/components/conta';
import { Panel, PrimaryButton, Screen, Txt } from '@/components/ui';
import { Nuvem, useConta } from '@/lib/nuvem';
import { useC } from '@/lib/theme';

// Aberta pelo link "trocar senha" do e-mail (o Supabase volta para cá com a sessão no endereço).
export default function NovaSenha() {
  const C = useC();
  const conta = useConta();
  const [senha, setSenha] = useState('');
  const [msg, setMsg] = useState<{ texto: string; erro?: boolean } | null>(null);
  const [ok, setOk] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  // Link vencido ou já usado: o Supabase volta com o erro no endereço.
  const [falhou, setFalhou] = useState(() => Platform.OS === 'web' && typeof location !== 'undefined' && /error_description/.test(location.hash));
  useEffect(() => {
    if (conta.recuperacao || falhou) return;
    const id = setTimeout(() => setFalhou(true), 8000);
    return () => clearTimeout(id);
  }, [conta.recuperacao, falhou]);

  const salvar = async () => {
    if (senha.length < SENHA_MIN) { setMsg({ texto: `A senha precisa ter pelo menos ${SENHA_MIN} caracteres.`, erro: true }); return; }
    setOcupado(true);
    const r = await Nuvem.novaSenha(senha);
    setOcupado(false);
    if (r.ok) setOk(true); else setMsg({ texto: r.erro, erro: true });
  };

  return (
    <Screen>
      <View style={{ padding: 20, gap: 16, width: '100%', maxWidth: 520, alignSelf: 'center' }}>
        <Txt f="title" size={30} caps>Nova senha</Txt>
        {ok ? <>
          <Panel style={{ borderRadius: 16, padding: 16 }}><Txt f="reg" size={17}>Senha trocada. Você já está dentro da conta neste aparelho; nos outros, entre com a senha nova.</Txt></Panel>
          <PrimaryButton label="Abrir o app" height={56} onPress={() => router.replace('/')} />
        </> : conta.recuperacao ? <>
          <Campo label="Senha nova" value={senha} onChange={setSenha} senha nova onSubmit={salvar} />
          {msg && <Txt f="reg" size={16} color={msg.erro ? C.rest : C.soft}>{msg.texto}</Txt>}
          {ocupado ? <ActivityIndicator color={C.fg} /> : <PrimaryButton label="Salvar senha" height={56} onPress={salvar} />}
        </> : falhou ? <>
          <Panel style={{ borderRadius: 16, padding: 16 }}><Txt f="reg" size={17}>Esse link venceu ou já foi usado. Peça outro em Treinos › Conta › Esqueci a senha.</Txt></Panel>
          <PrimaryButton label="Abrir o app" height={56} onPress={() => router.replace('/treinos')} />
        </> : <ActivityIndicator color={C.fg} />}
      </View>
    </Screen>
  );
}
