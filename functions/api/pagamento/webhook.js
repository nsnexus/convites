import { json } from '../../_lib/util.js';
import { iguais } from '../../_lib/auth.js';
import { confirmarPagamento } from '../../_lib/pedido.js';

// POST /api/pagamento/webhook
// Ponto de integração com o gateway/checkout da NSMusic.
// Ajuste a leitura do corpo ao formato que o seu gateway envia.
// Espera: header "x-webhook-secret" igual a WEBHOOK_SECRET e no corpo { referencia: <id do convite>, status: "pago" }
export async function onRequestPost({ request, env }) {
  if (!iguais(request.headers.get('x-webhook-secret') || '', env.WEBHOOK_SECRET)) return json({ erro: 'não autorizado' }, 401);
  const b = await request.json().catch(() => ({}));
  const id = String(b.referencia || '').replace(/[^a-f0-9-]/g, '');
  if (!id) return json({ erro: 'sem referência' }, 400);
  if (b.status !== 'pago') return json({ ok: true, ignorado: true });
  const c = await confirmarPagamento(env, request, id);
  if (!c) return json({ erro: 'pedido não encontrado' }, 404);
  return json({ ok: true, slug: c.slug });
}
