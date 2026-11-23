import { json, todos, rodar, atualizar, aleatorio, limpo, uuid, emailValido } from '../../_lib/util.js';

const ST = ['aberto', 'aguardando_pagamento', 'pago', 'concluido', 'cancelado'];
const centavos = (v) => Math.round(Number(String(v).replace(/[^\d,.-]/g, '').replace(/\.(?=\d{3}(\D|$))/g, '').replace(',', '.')) * 100);

export async function onRequestGet({ env }) {
  return json(await todos(env, 'SELECT * FROM pedidos_especiais ORDER BY criado_em DESC LIMIT 200'));
}
export async function onRequestPost({ request, env }) {
  const b = await request.json();
  const cliente_nome = String(b.cliente_nome || '').trim().slice(0, 80), descricao = String(b.descricao || '').trim().slice(0, 1000);
  const valor = centavos(b.valor), email = String(b.cliente_email || '').trim().toLowerCase();
  if (!cliente_nome || !descricao) return json({ erro: 'Preencha cliente e descrição.' }, 400);
  if (!(valor >= 0)) return json({ erro: 'Valor inválido.' }, 400);
  if (email && !emailValido(email)) return json({ erro: 'Confira o e-mail do cliente.' }, 400);
  const id = uuid(), token = aleatorio(12);
  await rodar(env, `INSERT INTO pedidos_especiais (id, token, cliente_nome, cliente_whatsapp, cliente_email, descricao, valor_centavos, modelo_id, observacoes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, id, token, cliente_nome, String(b.cliente_whatsapp || '').replace(/\D/g, '') || null, email || null,
    descricao, valor, b.modelo_id ? limpo(b.modelo_id) : null, b.observacoes ? String(b.observacoes).slice(0, 1000) : null);
  return json({ id, token });
}
export async function onRequestPatch({ request, env }) {
  const b = await request.json(), c = {};
  if (b.status != null) { if (!ST.includes(b.status)) return json({ erro: 'Status inválido.' }, 400); c.status = b.status; }
  if (b.modelo_id !== undefined) c.modelo_id = b.modelo_id ? limpo(b.modelo_id) : null;
  if (b.valor != null) c.valor_centavos = centavos(b.valor);
  if (b.descricao != null) c.descricao = String(b.descricao).slice(0, 1000);
  if (b.observacoes != null) c.observacoes = String(b.observacoes).slice(0, 1000);
  await atualizar(env, 'pedidos_especiais', c, 'id = ?', String(b.id).replace(/[^a-f0-9-]/g, ''));
  return json({ ok: true });
}
