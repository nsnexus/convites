import { json, um } from '../../_lib/util.js';
import { iguais } from '../../_lib/auth.js';
import { confirmarPagamento } from '../../_lib/pedido.js';

// POST /api/pagamento/webhook
// Chamado pelo NSNexus Pay quando o Pix é pago:
//   headers X-Gateway-Signature / X-Gateway-Secret = WEBHOOK_SECRET (enviado na criação da cobrança)
//   corpo { event: 'payment.approved', externalOrderId, txid, amount, status: 'PAID', paidAt }
// Também aceita o formato manual { referencia, status: 'pago' } com header x-webhook-secret.
export async function onRequestPost({ request, env }) {
  const h = request.headers;
  const assinatura = h.get('x-gateway-signature') || h.get('x-gateway-secret') || h.get('x-webhook-secret') || '';
  if (!iguais(assinatura, env.WEBHOOK_SECRET)) return json({ erro: 'não autorizado' }, 401);
  const b = await request.json().catch(() => ({}));
  const id = String(b.externalOrderId || b.referencia || '').replace(/[^a-f0-9-]/g, '');
  if (!id) return json({ erro: 'sem referência' }, 400);
  const aprovado = (b.event === 'payment.approved' && b.status === 'PAID') || b.status === 'pago';
  if (!aprovado) return json({ ok: true, ignorado: true });
  const c = await um(env, 'SELECT valor_centavos FROM convites WHERE id = ?', id);
  if (!c) return json({ erro: 'pedido não encontrado' }, 404);
  if (b.amount != null && Math.round(Number(b.amount) * 100) < c.valor_centavos) {
    console.error(`valor pago menor que o pedido ${id}: ${b.amount}`);
    return json({ erro: 'valor pago menor que o do pedido' }, 409);
  }
  const r = await confirmarPagamento(env, request, id);
  return json({ ok: true, slug: r?.slug });
}
