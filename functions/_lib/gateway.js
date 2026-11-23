// Cliente do NSNexus Pay (gateway Pix centralizado na NSMusic).
// Precisa de NSNEXUS_GATEWAY_API_KEY (a mesma GATEWAY_API_KEY configurada no projeto da NSMusic).
const base = env => (env.NSNEXUS_GATEWAY_URL || 'https://nsmusic.ia.br').replace(/\/$/, '');
export const gatewayConfigurado = env => !!env.NSNEXUS_GATEWAY_API_KEY;

async function chamar(env, metodo, caminho, corpo) {
  const r = await fetch(`${base(env)}/api/gateway/v1${caminho}`, {
    method: metodo,
    headers: { 'content-type': 'application/json', 'x-gateway-api-key': env.NSNEXUS_GATEWAY_API_KEY },
    body: corpo ? JSON.stringify(corpo) : undefined,
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`Gateway ${r.status}: ${j.error || 'erro desconhecido'}`);
  return j;
}

// Cria a cobrança Pix. O gateway avisa em webhookUrl quando for paga.
export function criarPix(env, { pedidoId, centavos, descricao, webhookUrl, pagador }) {
  return chamar(env, 'POST', '/charges', {
    appId: 'ns-convites', externalOrderId: pedidoId, amount: Math.round(centavos) / 100,
    description: descricao.slice(0, 140), webhookUrl, webhookSecret: env.WEBHOOK_SECRET, payer: pagador,
  });
}

export const statusPix = (env, txid) => chamar(env, 'GET', `/charges/${encodeURIComponent(txid)}`);
