import { json, um } from '../../_lib/util.js';

// GET /api/pedido/:id -> situação do pedido, usada na página /obrigado depois do checkout
export async function onRequestGet({ params, env }) {
  const c = await um(env, 'SELECT slug, status, homenageado, cliente_email FROM convites WHERE id = ?', String(params.id).replace(/[^a-f0-9-]/g, ''));
  if (!c) return json({ erro: 'Pedido não encontrado.' }, 404);
  const pago = ['pago', 'publicado'].includes(c.status);
  const [u, d] = c.cliente_email.split('@');
  return json({ pago, status: c.status, homenageado: c.homenageado, slug: pago ? c.slug : null, email: `${u.slice(0, 2)}***@${d}` }, 200, { 'cache-control': 'no-store' });
}
