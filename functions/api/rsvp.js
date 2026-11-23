import { json, um, rodar, uuid, limpo } from '../_lib/util.js';

// POST /api/rsvp  {slug, nome, vai, qtd, presente, recado}
export async function onRequestPost({ request, env }) {
  let b; try { b = await request.json(); } catch { return json({ erro: 'inválido' }, 400); }
  const nome = String(b.nome || '').trim().slice(0, 80);
  if (!nome) return json({ erro: 'Falta o nome.' }, 400);
  const c = await um(env, 'SELECT id FROM convites WHERE slug = ?', limpo(b.slug));
  if (!c) return json({ erro: 'Convite não encontrado.' }, 404);
  await rodar(env, 'INSERT INTO confirmacoes (id, convite_id, nome, vai, pessoas, presente, recado) VALUES (?,?,?,?,?,?,?)',
    uuid(), c.id, nome, b.vai ? 1 : 0, b.vai ? Math.min(20, Math.max(1, +b.qtd || 1)) : 0,
    b.presente ? String(b.presente).slice(0, 120) : null, b.recado ? String(b.recado).slice(0, 300) : null);
  return json({ ok: true });
}
