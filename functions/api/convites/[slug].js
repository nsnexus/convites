import { json, um, todos, limpo, modeloPublico, CAMPOS_MODELO } from '../../_lib/util.js';
import { editarConvite } from '../../_lib/edicao.js';
import { iguais } from '../../_lib/auth.js';

// GET /api/convites/:slug  -> dados públicos do convite + modelo + personalização.
// Antes do pagamento devolve em modo prévia (sem confirmação de presença).
export async function onRequestGet({ params, env }) {
  const c = await um(env, `SELECT id, slug, modelo, status, homenageado, idade, titulo, data, hora, local, endereco, recado, foto_url, ajuste, musica_url,
    personalizacao, valor_centavos FROM convites WHERE slug = ?`, limpo(params.slug));
  if (!c || c.status === 'cancelado') return json({ erro: 'não encontrado' }, 404);
  const liberado = ['pago', 'publicado'].includes(c.status) || env.LIBERAR_SEM_PAGAMENTO === '1';
  c.previa = !liberado;
  if (liberado) { delete c.id; delete c.valor_centavos; }
  delete c.status;
  c.ajuste = JSON.parse(c.ajuste); c.personalizacao = JSON.parse(c.personalizacao || '{}');
  const m = await um(env, `SELECT ${CAMPOS_MODELO} FROM modelos WHERE id = ?`, c.modelo);
  c.modelo_dados = m ? modeloPublico(m) : null;
  // quantas vezes cada presente já foi escolhido (para o convidado evitar repetir)
  if (liberado && c.personalizacao?.blocos?.presentes?.ativo) {
    const conv = await um(env, 'SELECT id FROM convites WHERE slug = ?', c.slug);
    c.presentes_escolhidos = Object.fromEntries((await todos(env, 'SELECT presente, COUNT(*) n FROM confirmacoes WHERE convite_id = ? AND vai = 1 AND presente IS NOT NULL GROUP BY presente', conv.id)).map(r => [r.presente, r.n]));
  }
  return json(c, 200, { 'cache-control': 'no-store' });
}

// PATCH /api/convites/:slug  (header x-token = token de edição recebido ao criar o pedido)
export async function onRequestPatch({ request, params, env }) {
  const slug = limpo(params.slug), token = String(request.headers.get('x-token') || '');
  const c = await um(env, 'SELECT token_painel FROM convites WHERE slug = ?', slug);
  if (!c || !token || !iguais(token, c.token_painel)) return json({ erro: 'Sem permissão para editar este convite. Entre em Meus convites.' }, 403);
  const r = await editarConvite(env, await request.json(), 'slug = ?', slug);
  return r.erro ? json({ erro: r.erro }, r.status || 400) : json({ ok: true });
}
