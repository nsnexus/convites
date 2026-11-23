import { json, todos, um, rodar, atualizar, limpo } from '../../_lib/util.js';

// GET /api/conta/convites            -> convites do cliente com totais
// GET /api/conta/convites?slug=...   -> um convite com a lista de confirmações
// PATCH /api/conta/convites {slug, ...campos}  -> corrige data, local etc.
export async function onRequestGet({ request, env, data }) {
  const slug = limpo(new URL(request.url).searchParams.get('slug'));
  const cli = await um(env, 'SELECT nome, email FROM clientes WHERE id = ?', data.clienteId);
  if (!slug) {
    const lista = await todos(env, `SELECT c.slug, c.status, c.homenageado, c.titulo, c.data, c.hora, c.local, c.modelo, m.poster_url AS poster,
        (SELECT COALESCE(SUM(pessoas),0) FROM confirmacoes f WHERE f.convite_id = c.id AND f.vai = 1) AS confirmados,
        (SELECT COUNT(*) FROM confirmacoes f WHERE f.convite_id = c.id) AS respostas
      FROM convites c LEFT JOIN modelos m ON m.id = c.modelo WHERE c.cliente_id = ? ORDER BY c.criado_em DESC`, data.clienteId);
    return json({ cliente: cli, convites: lista });
  }
  const c = await um(env, 'SELECT id, slug, status, homenageado, idade, titulo, data, hora, local, endereco, recado FROM convites WHERE slug = ? AND cliente_id = ?', slug, data.clienteId);
  if (!c) return json({ erro: 'Convite não encontrado.' }, 404);
  const conf = (await todos(env, 'SELECT nome, vai, pessoas, presente, recado, criado_em FROM confirmacoes WHERE convite_id = ? ORDER BY criado_em DESC', c.id)).map(x => ({ ...x, vai: !!x.vai }));
  delete c.id;
  return json({ cliente: cli, convite: c, confirmacoes: conf });
}

const EDITAVEIS = { titulo: 120, data: 10, hora: 5, local: 120, endereco: 200, recado: 400 };
export async function onRequestPatch({ request, env, data }) {
  const b = await request.json(), c = {};
  for (const [k, max] of Object.entries(EDITAVEIS)) if (b[k] != null) c[k] = String(b[k]).trim().slice(0, max) || (k === 'titulo' || k === 'recado' ? null : undefined);
  for (const k of Object.keys(c)) if (c[k] === undefined) return json({ erro: `O campo ${k} não pode ficar vazio.` }, 400);
  if (c.data && !/^\d{4}-\d{2}-\d{2}$/.test(c.data)) return json({ erro: 'Data inválida.' }, 400);
  const r = await atualizar(env, 'convites', c, 'slug = ? AND cliente_id = ?', limpo(b.slug), data.clienteId);
  if (!r?.meta?.changes) return json({ erro: 'Convite não encontrado.' }, 404);
  return json({ ok: true });
}
