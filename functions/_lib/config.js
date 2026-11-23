import { todos } from './util.js';

// Configurações editáveis no admin. Valores padrão enquanto nada foi salvo.
export const PADRAO = { whatsapp: '' };

export async function lerConfig(env) {
  try {
    const linhas = await todos(env, 'SELECT chave, valor FROM configuracoes');
    return { ...PADRAO, ...Object.fromEntries(linhas.map(l => [l.chave, l.valor])) };
  } catch { return { ...PADRAO }; } // tabela ainda não criada (admin cria no primeiro login)
}

// Aceita (94) 99111-2222, +55 94 99111-2222 etc. Devolve só dígitos com 55 na frente.
export function normalizarWhatsapp(v) {
  let d = String(v || '').replace(/\D/g, '');
  if (!d) return '';
  if (d.length === 10 || d.length === 11) d = '55' + d;
  return /^55\d{10,11}$/.test(d) ? d : null;
}
