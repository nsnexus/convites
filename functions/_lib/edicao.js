import { atualizar } from './util.js';
import { limparPersonalizacao } from './personalizacao.js';

// Campos que o dono pode corrigir depois de criar o convite (antes ou depois de pagar).
const EDITAVEIS = { homenageado: 80, idade: 3, titulo: 120, data: 10, hora: 5, local: 120, endereco: 200, recado: 400 };
const OPCIONAIS = new Set(['idade', 'titulo', 'recado']);

export async function editarConvite(env, b, onde, ...params) {
  const c = {};
  for (const [k, max] of Object.entries(EDITAVEIS)) {
    if (b[k] == null) continue;
    const v = String(b[k]).trim().slice(0, max);
    if (!v && !OPCIONAIS.has(k)) return { erro: `O campo ${k} não pode ficar vazio.` };
    c[k] = v || null;
  }
  if (c.data && !/^\d{4}-\d{2}-\d{2}$/.test(c.data)) return { erro: 'Data inválida.' };
  if (c.hora && !/^\d{2}:\d{2}$/.test(c.hora)) return { erro: 'Horário inválido.' };
  if (b.personalizacao) { const p = limparPersonalizacao(b.personalizacao); c.personalizacao = JSON.stringify(p); c.presentes = JSON.stringify(p.blocos.presentes.itens); }
  if (b.ajuste) c.ajuste = JSON.stringify({ zoom: Math.min(3, Math.max(1, +b.ajuste.zoom || 1)), x: Math.min(1, Math.max(0, +b.ajuste.x || .5)), y: Math.min(1, Math.max(0, +b.ajuste.y || .5)) });
  const r = await atualizar(env, 'convites', c, onde, ...params);
  if (!r?.meta?.changes) return { erro: 'Convite não encontrado.', status: 404 };
  return { ok: true };
}
