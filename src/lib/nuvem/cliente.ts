// Carregado só quando a conta é usada, para não pesar na abertura do app.
import './polyfill';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

import { CHAVE_SESSAO, SUPABASE_ANON_KEY, SUPABASE_URL } from './config';

export function criarCliente() {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      storage: AsyncStorage,
      storageKey: CHAVE_SESSAO,
      autoRefreshToken: true,
      persistSession: true,
      // No navegador, os links de confirmar e-mail e de trocar senha voltam com a sessão no endereço.
      detectSessionInUrl: Platform.OS === 'web',
      flowType: 'implicit',
    },
  });
}
