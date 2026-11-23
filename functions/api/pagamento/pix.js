import { json, um, rodar, agora, origem } from '../../_lib/util.js';
import { criarPix, gatewayConfigurado } from '../../_lib/gateway.js';

const VALIDADE_MS = 50 * 60e3; // a cobrança na Efí vale 1h; reaproveita por 50 min

// POST /api/pagamento/pix {pedido}  -> cobrança Pix (QR copia e cola) para liberar o convite
export async function onRequestPost({ request, env }) {
  const { pedido } = await request.json().catch(() => ({}));
  const id = String(pedido || '').replace(/[^a-f0-9-]/g, '');
  const c = await um(env, 'SELECT id, slug, status, homenageado, titulo, valor_centavos, cliente_nome, cliente_email, cliente_whatsapp, pix_txid, pix_copia_cola, pix_criado_em FROM convites WHERE id = ?', id);
  if (!c) return json({ erro: 'Pedido não encontrado.' }, 404);
  if (['pago', 'publicado'].includes(c.status)) return json({ pago: true, slug: c.slug });
  if (c.status === 'cancelado') return json({ erro: 'Este pedido foi cancelado.' }, 410);
  if (!gatewayConfigurado(env)) return json({ erro: 'O pagamento por Pix está indisponível agora. Fale com a gente pelo WhatsApp.' }, 503);

  if (c.pix_copia_cola && c.pix_criado_em && Date.now() - Date.parse(c.pix_criado_em) < VALIDADE_MS) {
    return json({ pixCopiaECola: c.pix_copia_cola, valor_centavos: c.valor_centavos, expira_em: new Date(Date.parse(c.pix_criado_em) + 60 * 60e3).toISOString() });
  }
  try {
    const p = await criarPix(env, {
      pedidoId: c.id, centavos: c.valor_centavos,
      descricao: `NS Convites - ${c.titulo || c.homenageado}`,
      webhookUrl: `${origem(request, env)}/api/pagamento/webhook`,
      pagador: { name: c.cliente_nome, email: c.cliente_email, phone: c.cliente_whatsapp },
    });
    const criado = agora();
    await rodar(env, 'UPDATE convites SET pix_txid = ?, pix_copia_cola = ?, pix_criado_em = ? WHERE id = ?', p.txid, p.pixCopiaECola, criado, c.id);
    return json({ pixCopiaECola: p.pixCopiaECola, valor_centavos: c.valor_centavos, expira_em: new Date(Date.parse(criado) + 60 * 60e3).toISOString() });
  } catch (e) {
    console.error('criar pix', e);
    return json({ erro: 'Não foi possível gerar o Pix agora. Tente de novo em instantes.' }, 502);
  }
}
