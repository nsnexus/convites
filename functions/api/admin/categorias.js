import { sb, json, limpo } from '../../_lib/sb.js';

export async function onRequestGet({ env }) {
  return json(await sb(env).select('categorias', 'select=*&order=ordem,nome'));
}
export async function onRequestPost({ request, env }) {
  const b = await request.json();
  const nome = String(b.nome || '').trim().slice(0, 40);
  if (!nome) return json({ erro: 'Dê um nome à categoria.' }, 400);
  const id = limpo(nome.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, '-')).slice(0, 30) || 'categoria';
  const db = sb(env);
  const [ultima] = await db.select('categorias', 'select=ordem&order=ordem.desc&limit=1');
  if ((await db.select('categorias', `id=eq.${id}&select=id`)).length) return json({ erro: 'Já existe uma categoria com esse nome.' }, 409);
  return json(await db.insert('categorias', { id, nome, ordem: (ultima?.ordem ?? 0) + 1 }));
}
export async function onRequestPatch({ request, env }) {
  const b = await request.json(); const campos = {};
  if (b.nome != null) campos.nome = String(b.nome).trim().slice(0, 40);
  if (b.ordem != null) campos.ordem = +b.ordem | 0;
  if (b.ativa != null) campos.ativa = !!b.ativa;
  return json(await sb(env).update('categorias', `id=eq.${limpo(b.id)}`, campos));
}
export async function onRequestDelete({ request, env }) {
  const id = limpo(new URL(request.url).searchParams.get('id'));
  const db = sb(env);
  const usados = await db.select('modelos', `categoria_id=eq.${id}&select=id&limit=1`);
  if (usados.length) return json({ erro: 'Mova ou apague os modelos desta categoria antes.' }, 409);
  await db.remove('categorias', `id=eq.${id}`);
  return json({ ok: true });
}
