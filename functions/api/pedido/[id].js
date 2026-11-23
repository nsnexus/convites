import { json, um, rodar, agora } from '../../_lib/util.js';
import { statusPix, gatewayConfigurado } from '../../_lib/gateway.js';
import { confirmarPagamento } from '../../_lib/pedido.js';

// GET /api/pedido/:id -> situação do pedido (a página de pagamento consulta a cada poucos segundos).
// Se o webhook atrasar, confere direto no gateway (no máximo a cada 8 s).
export async function onRequestGet({ request, params, env }) {
  const id = String(params.id).replace(/[^a-f0-9-]/g, '');
  let c = await um(env, 'SELECT slug, status, homenageado, cliente_email, valor_centavos, pix_txid, pix_verificado_em FROM convites WHERE id = ?', id);
  if (!c) return json({ erro: 'Pedido não encontrado.' }, 404);
  let pago = ['pago', 'publicado'].includes(c.status);
  if (!pago && c.pix_txid && gatewayConfigurado(env) && (!c.pix_verificado_em || Date.now() - Date.parse(c.pix_verificado_em) > 8000)) {
    await rodar(env, 'UPDATE convites SET pix_verificado_em = ? WHERE id = ?', agora(), id);
    try {
      const s = await statusPix(env, c.pix_txid);
      if (s.status === 'PAID' && Math.round(Number(s.paidAmount ?? s.amount) * 100) >= c.valor_centavos) {
        await confirmarPagamento(env, request, id); pago = true;
      }
    } catch (e) { console.warn('consulta pix', e.message); }
  }
  const [u, d] = c.cliente_email.split('@');
  return json({ pago, status: pago ? 'pago' : c.status, homenageado: c.homenageado, valor_centavos: c.valor_centavos, slug: pago ? c.slug : null, email: `${u.slice(0, 2)}***@${d}` }, 200, { 'cache-control': 'no-store' });
}
