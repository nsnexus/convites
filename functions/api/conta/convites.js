import { json, todos, um, limpo } from '../../_lib/util.js';
import { editarConvite } from '../../_lib/edicao.js';

// GET /api/conta/convites            -> convites do cliente com totais
// GET /api/conta/convites?slug=...   -> um convite com a lista de confirmações
// PATCH /api/conta/convites {slug, ...campos}  -> corrige data, local etc.
export async function onRequestGet({ request, env, data }) {
  const slug = limpo(new URL(request.url).searchParams.get('slug'));
  const cli = await um(env, 'SELECT nome, email FROM clientes WHERE id = ?', data.clienteId);
  if (!slug) {
    const lista = await todos(env, `SELECT c.slug, c.status, c.homenageado, c.titulo, c.data, c.hora, c.local, c.modelo, m.poster_url AS poster,
        (SELECT COALESCE(SUM(pessoas),0) FROM confirmacoes f WHERE f.convite_id = c.id AND f.vai = 1) AS confirmados,
        c.valor_centavos, c.id AS pedido_id,
        (SELECT COUNT(*) FROM confirmacoes f WHERE f.convite_id = c.id) AS respostas
      FROM convites c LEFT JOIN modelos m ON m.id = c.modelo WHERE c.cliente_id = ? ORDER BY c.criado_em DESC`, data.clienteId);
    return json({ cliente: cli, convites: lista });
  }
  const c = await um(env, 'SELECT id, slug, status, homenageado, idade, titulo, data, hora, local, endereco, recado, personalizacao, valor_centavos FROM convites WHERE slug = ? AND cliente_id = ?', slug, data.clienteId);
  if (!c) return json({ erro: 'Convite não encontrado.' }, 404);
  const conf = (await todos(env, 'SELECT nome, vai, pessoas, adultos, criancas, presente, recado, restricoes, criado_em FROM confirmacoes WHERE convite_id = ? ORDER BY criado_em DESC', c.id)).map(x => ({ ...x, vai: !!x.vai }));
  c.pedido_id = c.id; delete c.id; c.personalizacao = JSON.parse(c.personalizacao || '{}');
  return json({ cliente: cli, convite: c, confirmacoes: conf });
}

export async function onRequestPatch({ request, env, data }) {
  const b = await request.json();
  const r = await editarConvite(env, b, 'slug = ? AND cliente_id = ?', limpo(b.slug), data.clienteId);
  return r.erro ? json({ erro: r.erro }, r.status || 400) : json({ ok: true });
}
