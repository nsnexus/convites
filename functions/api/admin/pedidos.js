import { json, todos, um, rodar, atualizar } from '../../_lib/util.js';
import { confirmarPagamento, enviarEmailConvitePronto } from '../../_lib/pedido.js';

const ST = ['aguardando_pagamento', 'pago', 'publicado', 'cancelado'];
export async function onRequestGet({ request, env }) {
  const st = new URL(request.url).searchParams.get('status');
  const campos = 'id, slug, modelo, status, tipo, homenageado, data, cliente_nome, cliente_whatsapp, cliente_email, valor_centavos, musica, musica_url, token_painel, criado_em, pago_em, email_enviado_em';
  return json(ST.includes(st)
    ? await todos(env, `SELECT ${campos} FROM convites WHERE status = ? ORDER BY criado_em DESC LIMIT 200`, st)
    : await todos(env, `SELECT ${campos} FROM convites ORDER BY criado_em DESC LIMIT 200`));
}
export async function onRequestPatch({ request, env }) {
  const b = await request.json(), id = String(b.id).replace(/[^a-f0-9-]/g, '');
  if (b.musica_url !== undefined) await rodar(env, 'UPDATE convites SET musica_url = ? WHERE id = ?', b.musica_url ? String(b.musica_url).slice(0, 500) : null, id);
  if (b.reenviarEmail) {
    const c = await um(env, 'SELECT * FROM convites WHERE id = ?', id);
    await enviarEmailConvitePronto(env, request, c);
    await rodar(env, 'UPDATE convites SET email_enviado_em = ? WHERE id = ?', new Date().toISOString(), id);
    return json({ ok: true });
  }
  if (b.status) {
    if (!ST.includes(b.status)) return json({ erro: 'Status inválido.' }, 400);
    if (b.status === 'pago') await confirmarPagamento(env, request, id);   // também manda o e-mail
    else await atualizar(env, 'convites', { status: b.status }, 'id = ?', id);
  }
  return json({ ok: true });
}
