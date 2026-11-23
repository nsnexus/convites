import { json, rodar, agora } from '../../_lib/util.js';
import { lerConfig, normalizarWhatsapp } from '../../_lib/config.js';

export async function onRequestGet({ env }) { return json(await lerConfig(env)); }

export async function onRequestPatch({ request, env }) {
  const b = await request.json().catch(() => ({}));
  if (b.whatsapp !== undefined) {
    const n = normalizarWhatsapp(b.whatsapp);
    if (n === null) return json({ erro: 'Número inválido. Use DDD + número, ex.: (94) 99111-2222.' }, 400);
    await rodar(env, `INSERT INTO configuracoes (chave, valor, atualizado_em) VALUES ('whatsapp', ?, ?)
      ON CONFLICT(chave) DO UPDATE SET valor = excluded.valor, atualizado_em = excluded.atualizado_em`, n, agora());
  }
  return json(await lerConfig(env));
}
