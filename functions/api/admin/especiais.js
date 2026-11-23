import { sb, json, aleatorio, limpo } from '../../_lib/sb.js';

const ST = ['aberto', 'aguardando_pagamento', 'pago', 'concluido', 'cancelado'];
export async function onRequestGet({ env }) {
  return json(await sb(env).select('pedidos_especiais', 'select=*&order=criado_em.desc&limit=200'));
}
export async function onRequestPost({ request, env }) {
  const b = await request.json();
  const cliente_nome = String(b.cliente_nome || '').trim().slice(0, 80), descricao = String(b.descricao || '').trim().slice(0, 1000);
  const valor = Math.round(Number(String(b.valor).replace(/\./g, '').replace(',', '.')) * 100);
  if (!cliente_nome || !descricao) return json({ erro: 'Preencha cliente e descrição.' }, 400);
  if (!(valor >= 0)) return json({ erro: 'Valor inválido.' }, 400);
  return json(await sb(env).insert('pedidos_especiais', {
    token: aleatorio(12), cliente_nome, descricao, valor_centavos: valor,
    cliente_whatsapp: String(b.cliente_whatsapp || '').replace(/\D/g, '') || null,
    modelo_id: b.modelo_id ? limpo(b.modelo_id) : null, observacoes: b.observacoes ? String(b.observacoes).slice(0, 1000) : null,
  }));
}
export async function onRequestPatch({ request, env }) {
  const b = await request.json(); const c = {};
  if (b.status != null) { if (!ST.includes(b.status)) return json({ erro: 'Status inválido.' }, 400); c.status = b.status; }
  if (b.modelo_id !== undefined) c.modelo_id = b.modelo_id ? limpo(b.modelo_id) : null;
  if (b.valor != null) c.valor_centavos = Math.round(Number(String(b.valor).replace(/\./g, '').replace(',', '.')) * 100);
  if (b.descricao != null) c.descricao = String(b.descricao).slice(0, 1000);
  if (b.observacoes != null) c.observacoes = String(b.observacoes).slice(0, 1000);
  return json(await sb(env).update('pedidos_especiais', `id=eq.${String(b.id).replace(/[^a-f0-9-]/g, '')}`, c));
}
