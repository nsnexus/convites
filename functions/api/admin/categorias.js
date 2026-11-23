import { json, todos, um, rodar, atualizar, limpo, bool } from '../../_lib/util.js';

export async function onRequestGet({ env }) {
  return json((await todos(env, 'SELECT * FROM categorias ORDER BY ordem, nome')).map(c => ({ ...c, ativa: !!c.ativa })));
}
export async function onRequestPost({ request, env }) {
  const b = await request.json();
  const nome = String(b.nome || '').trim().slice(0, 40);
  if (!nome) return json({ erro: 'Dê um nome à categoria.' }, 400);
  const id = limpo(nome.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, '-')).slice(0, 30) || 'categoria';
  if (await um(env, 'SELECT id FROM categorias WHERE id = ?', id)) return json({ erro: 'Já existe uma categoria com esse nome.' }, 409);
  const ult = await um(env, 'SELECT MAX(ordem) AS o FROM categorias');
  await rodar(env, 'INSERT INTO categorias (id, nome, ordem) VALUES (?, ?, ?)', id, nome, (ult?.o ?? 0) + 1);
  return json({ id, nome, ordem: (ult?.o ?? 0) + 1, ativa: true });
}
export async function onRequestPatch({ request, env }) {
  const b = await request.json(), c = {};
  if (b.nome != null) c.nome = String(b.nome).trim().slice(0, 40);
  if (b.ordem != null) c.ordem = +b.ordem | 0;
  if (b.ativa != null) c.ativa = bool(b.ativa);
  await atualizar(env, 'categorias', c, 'id = ?', limpo(b.id));
  return json({ ok: true });
}
export async function onRequestDelete({ request, env }) {
  const id = limpo(new URL(request.url).searchParams.get('id'));
  if (await um(env, 'SELECT id FROM modelos WHERE categoria_id = ? LIMIT 1', id)) return json({ erro: 'Mova ou apague os modelos desta categoria antes.' }, 409);
  await rodar(env, 'DELETE FROM categorias WHERE id = ?', id);
  return json({ ok: true });
}
