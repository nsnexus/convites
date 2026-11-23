import { json, rodar, agora } from '../../_lib/util.js';
import { lerConfig, normalizarWhatsapp, centavos } from '../../_lib/config.js';

const salvar = (env, chave, valor) => rodar(env, `INSERT INTO configuracoes (chave, valor, atualizado_em) VALUES (?, ?, ?)
  ON CONFLICT(chave) DO UPDATE SET valor = excluded.valor, atualizado_em = excluded.atualizado_em`, chave, String(valor), agora());

export async function onRequestGet({ env }) { return json(await lerConfig(env)); }

export async function onRequestPatch({ request, env }) {
  const b = await request.json().catch(() => ({}));
  if (b.whatsapp !== undefined) {
    const n = normalizarWhatsapp(b.whatsapp);
    if (n === null) return json({ erro: 'Número inválido. Use DDD + número, ex.: (94) 99111-2222.' }, 400);
    await salvar(env, 'whatsapp', n);
  }
  if (b.preco_convite !== undefined) {
    const c = centavos(b.preco_convite);
    if (c === null || c < 100 || c > 100000) return json({ erro: 'Preço do convite inválido (entre R$ 1,00 e R$ 1.000,00).' }, 400);
    await salvar(env, 'preco_convite', c);
  }
  if (b.preco_musica !== undefined) {
    const c = centavos(b.preco_musica);
    if (c === null || c < 0 || c > 100000) return json({ erro: 'Preço da música inválido (entre R$ 0,00 e R$ 1.000,00).' }, 400);
    await salvar(env, 'preco_musica', c);
  }
  return json(await lerConfig(env));
}
