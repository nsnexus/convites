import { sb, json, limpo, modeloPublico, CAMPOS_MODELO } from '../../_lib/sb.js';

// GET /api/especial/:token -> dados do pedido especial para o cliente montar o convite
export async function onRequestGet({ params, env }) {
  const db = sb(env);
  const [p] = await db.select('pedidos_especiais', `token=eq.${limpo(params.token, /[^a-z0-9]/g)}&select=id,cliente_nome,cliente_whatsapp,descricao,valor_centavos,modelo_id,status&limit=1`);
  if (!p || p.status === 'cancelado') return json({ erro: 'Pedido não encontrado.' }, 404);
  if (['pago', 'concluido'].includes(p.status)) return json({ erro: 'Este pedido já foi concluído.' }, 410);
  let modelo = null;
  if (p.modelo_id) { const [m] = await db.select('modelos', `id=eq.${p.modelo_id}&select=${CAMPOS_MODELO}`); if (m) modelo = modeloPublico(m); }
  return json({ cliente_nome: p.cliente_nome, cliente_whatsapp: p.cliente_whatsapp, descricao: p.descricao, valor_centavos: p.valor_centavos, modelo });
}
