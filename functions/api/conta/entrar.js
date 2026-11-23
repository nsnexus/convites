import { json, um, emailValido } from '../../_lib/util.js';
import { criarCookie, apagarCookie } from '../../_lib/auth.js';
import { normalizarWhatsapp } from '../../_lib/config.js';

// Busca exata pelo contato informado no pedido, sem código por e-mail.
export async function onRequestPost({ request, env }) {
  const b = await request.json().catch(() => ({}));
  const contato = String(b.contato || '').trim();
  let sessao;
  if (contato.includes('@')) {
    const email = contato.toLowerCase();
    if (!emailValido(email)) return json({ erro: 'Confira o e-mail informado.' }, 400);
    const cli = await um(env, 'SELECT id FROM clientes WHERE email = ?', email);
    if (cli) sessao = cli.id;
  } else {
    const numero = normalizarWhatsapp(contato);
    if (!numero) return json({ erro: 'Informe um e-mail válido ou WhatsApp com DDD.' }, 400);
    const cli = await um(env, 'SELECT id FROM clientes WHERE whatsapp IN (?, ?) LIMIT 1', numero, numero.slice(2));
    if (cli) sessao = 'zap-' + numero;
  }
  if (!sessao) return json({ erro: 'Nenhum convite encontrado. Confira se usou o mesmo e-mail ou WhatsApp do pedido.' }, 404);
  return json({ ok: true }, 200, { 'cache-control': 'no-store', 'set-cookie': await criarCookie(env, 'nscli', sessao, 30) });
}
export const onRequestDelete = () => json({ ok: true }, 200, { 'set-cookie': apagarCookie('nscli') });
