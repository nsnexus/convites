import { sb, json } from '../../_lib/sb.js';

const ST = ['aguardando_pagamento', 'pago', 'publicado', 'cancelado'];
export async function onRequestGet({ request, env }) {
  const st = new URL(request.url).searchParams.get('status');
  const filtro = ST.includes(st) ? `&status=eq.${st}` : '';
  return json(await sb(env).select('convites', `select=id,slug,modelo,status,tipo,homenageado,data,cliente_nome,cliente_whatsapp,valor_centavos,musica,token_painel,criado_em,pago_em${filtro}&order=criado_em.desc&limit=200`));
}
export async function onRequestPatch({ request, env }) {
  const b = await request.json();
  if (!ST.includes(b.status)) return json({ erro: 'Status inválido.' }, 400);
  const id = String(b.id).replace(/[^a-f0-9-]/g, '');
  const c = { status: b.status }; if (b.status === 'pago') c.pago_em = new Date().toISOString();
  if (b.musica_url !== undefined) c.musica_url = b.musica_url || null;
  const [linha] = await sb(env).update('convites', `id=eq.${id}`, c);
  if (linha?.pedido_especial_id && b.status === 'pago') await sb(env).update('pedidos_especiais', `id=eq.${linha.pedido_especial_id}`, { status: 'pago' });
  return json(linha);
}
