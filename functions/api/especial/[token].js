import { json, um, limpo, modeloPublico, CAMPOS_MODELO } from '../../_lib/util.js';

// GET /api/especial/:token -> dados do pedido especial para o cliente montar o convite
export async function onRequestGet({ params, env }) {
  const p = await um(env, 'SELECT cliente_nome, cliente_whatsapp, cliente_email, descricao, valor_centavos, modelo_id, status FROM pedidos_especiais WHERE token = ?', limpo(params.token, /[^a-z0-9]/g));
  if (!p || p.status === 'cancelado') return json({ erro: 'Pedido não encontrado.' }, 404);
  if (['pago', 'concluido'].includes(p.status)) return json({ erro: 'Este pedido já foi concluído.' }, 410);
  const m = p.modelo_id ? await um(env, `SELECT ${CAMPOS_MODELO} FROM modelos WHERE id = ?`, p.modelo_id) : null;
  return json({ cliente_nome: p.cliente_nome, cliente_whatsapp: p.cliente_whatsapp, cliente_email: p.cliente_email, descricao: p.descricao, valor_centavos: p.valor_centavos, modelo: m ? modeloPublico(m) : null });
}
