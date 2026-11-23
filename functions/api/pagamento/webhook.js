import { sb, json } from '../../_lib/sb.js';

// POST /api/pagamento/webhook
// Ponto de integração com o gateway/checkout da NSMusic.
// Ajuste a leitura do corpo ao formato que o seu gateway envia.
// Espera: header "x-webhook-secret" igual a env.WEBHOOK_SECRET e no corpo { referencia: <id do convite>, status: "pago" }
export async function onRequestPost({ request, env }) {
  if (!env.WEBHOOK_SECRET || request.headers.get('x-webhook-secret') !== env.WEBHOOK_SECRET) return json({ erro: 'não autorizado' }, 401);
  const b = await request.json().catch(() => ({}));
  const id = String(b.referencia || '').replace(/[^a-f0-9-]/g, '');
  if (!id) return json({ erro: 'sem referência' }, 400);
  if (b.status !== 'pago') return json({ ok: true, ignorado: true });
  const db = sb(env);
  const [c] = await db.update('convites', `id=eq.${id}`, { status: 'pago', pago_em: new Date().toISOString() });
  if (c?.pedido_especial_id) await db.update('pedidos_especiais', `id=eq.${c.pedido_especial_id}`, { status: 'pago' });
  // Próximo passo: enviar o link https://SEU-DOMINIO/c/<slug> e o painel ao cliente pelo WhatsApp
  return json({ ok: true, slug: c?.slug });
}
