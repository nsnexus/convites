import { json, um, todos, limpo } from '../_lib/util.js';

// GET /api/painel?c=slug&k=token  -> confirmações (link direto, sem login)
export async function onRequestGet({ request, env }) {
  const u = new URL(request.url), slug = limpo(u.searchParams.get('c')), k = limpo(u.searchParams.get('k'), /[^a-z0-9]/g);
  if (!slug || !k) return json({ erro: 'Link incompleto.' }, 400);
  const c = await um(env, 'SELECT id, slug, homenageado, titulo, data, hora, local, status FROM convites WHERE slug = ? AND token_painel = ?', slug, k);
  if (!c) return json({ erro: 'Link do painel inválido.' }, 404);
  const lista = (await todos(env, 'SELECT nome, vai, pessoas, adultos, criancas, presente, recado, criado_em FROM confirmacoes WHERE convite_id = ? ORDER BY criado_em DESC', c.id)).map(x => ({ ...x, vai: !!x.vai }));
  delete c.id;
  return json({ convite: c, confirmacoes: lista });
}
