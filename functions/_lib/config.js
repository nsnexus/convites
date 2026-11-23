import { todos } from './util.js';

// Configurações editáveis no admin. Valores padrão enquanto nada foi salvo.
export const PADRAO = { whatsapp: '', preco_convite: '3990', preco_musica: '1000', preco_casamento: '5990' };

export async function lerConfig(env) {
  try {
    const linhas = await todos(env, 'SELECT chave, valor FROM configuracoes');
    return { ...PADRAO, ...Object.fromEntries(linhas.map(l => [l.chave, l.valor])) };
  } catch { return { ...PADRAO }; } // tabela ainda não criada (admin cria no primeiro login)
}

// Preços em centavos (vêm como texto da tabela)
export async function lerPrecos(env) {
  const c = await lerConfig(env);
  return { convite: parseInt(c.preco_convite, 10) || 3990, musica: parseInt(c.preco_musica, 10) || 0, casamento: parseInt(c.preco_casamento, 10) || 5990 };
}

// "39,90", "39.90", "R$ 1.299,90" -> centavos; null se inválido
export function centavos(v) {
  const s = String(v ?? '').replace(/[^\d,.]/g, '');
  if (!s) return null;
  const milhar = /^\d{1,3}(\.\d{3})+$/.test(s); // "1.299" = mil duzentos e noventa e nove
  const n = Number(s.includes(',') || milhar ? s.replace(/\./g, '').replace(',', '.') : s);
  return Number.isFinite(n) ? Math.round(n * 100) : null;
}

// Aceita (94) 99111-2222, +55 94 99111-2222 etc. Devolve só dígitos com 55 na frente.
export function normalizarWhatsapp(v) {
  let d = String(v || '').replace(/\D/g, '');
  if (!d) return '';
  if (d.length === 10 || d.length === 11) d = '55' + d;
  return /^55\d{10,11}$/.test(d) ? d : null;
}
