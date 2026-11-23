import { json } from '../_lib/util.js';
import { lerConfig } from '../_lib/config.js';

// GET /api/config -> dados públicos do negócio (WhatsApp de suporte)
export async function onRequestGet({ env }) {
  const c = await lerConfig(env);
  return json({ whatsapp: c.whatsapp }, 200, { 'cache-control': 'public, max-age=60' });
}
