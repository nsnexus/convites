import { sb, json } from '../_lib/sb.js';

// POST /api/rsvp  {slug, nome, vai, qtd, presente, recado}
export async function onRequestPost({ request, env }) {
  let b; try { b = await request.json(); } catch { return json({ erro: 'inválido' }, 400); }
  const nome = String(b.nome || '').trim().slice(0, 80);
  if (!nome) return json({ erro: 'Falta o nome.' }, 400);
  const db = sb(env);
  const [c] = await db.select('convites', `slug=eq.${String(b.slug).replace(/[^a-z0-9-]/g, '')}&select=id&limit=1`);
  if (!c) return json({ erro: 'Convite não encontrado.' }, 404);
  await db.insert('confirmacoes', {
    convite_id: c.id, nome, vai: !!b.vai, pessoas: b.vai ? Math.min(20, Math.max(1, +b.qtd || 1)) : 0,
    presente: b.presente ? String(b.presente).slice(0, 120) : null, recado: b.recado ? String(b.recado).slice(0, 300) : null,
  });
  return json({ ok: true });
}
