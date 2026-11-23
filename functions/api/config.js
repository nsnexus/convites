import { json } from '../_lib/util.js';
import { lerConfig, lerPrecos } from '../_lib/config.js';

// GET /api/config -> dados públicos do negócio (WhatsApp de suporte)
export async function onRequestGet({ env }) {
  const c = await lerConfig(env), p = await lerPrecos(env);
  return json({ whatsapp: c.whatsapp, precoConvite: p.convite, precoMusica: p.musica, precoCasamento: p.casamento }, 200, { 'cache-control': 'public, max-age=60' });
}
