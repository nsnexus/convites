import { sb, json } from '../_lib/sb.js';

// GET /api/painel?c=slug&k=token  -> confirmações do convite (só para quem tem o token)
export async function onRequestGet({ request, env }) {
  const u = new URL(request.url), slug = (u.searchParams.get('c') || '').replace(/[^a-z0-9-]/g, ''), k = (u.searchParams.get('k') || '').replace(/[^a-z0-9]/g, '');
  if (!slug || !k) return json({ erro: 'Link incompleto.' }, 400);
  const db = sb(env);
  const [c] = await db.select('convites', `slug=eq.${slug}&token_painel=eq.${k}&select=id,slug,homenageado,titulo,data,hora,local,status&limit=1`);
  if (!c) return json({ erro: 'Link do painel inválido.' }, 404);
  const lista = await db.select('confirmacoes', `convite_id=eq.${c.id}&select=nome,vai,pessoas,presente,recado,criado_em&order=criado_em.desc`);
  return json({ convite: c, confirmacoes: lista });
}
