import { json, um, rodar } from '../../_lib/util.js';
import { hash, iguais, criarCookie, apagarCookie } from '../../_lib/auth.js';

// POST /api/conta/entrar {email, codigo} -> cria a sessão do cliente
export async function onRequestPost({ request, env }) {
  const b = await request.json().catch(() => ({}));
  const email = String(b.email || '').trim().toLowerCase(), codigo = String(b.codigo || '').replace(/\D/g, '');
  const c = await um(env, 'SELECT codigo_hash, expira, tentativas FROM codigos_login WHERE email = ?', email);
  const falha = json({ erro: 'Código incorreto ou vencido. Peça outro.' }, 401);
  if (!c || c.expira < Date.now() || c.tentativas >= 5) return falha;
  if (!iguais(await hash(env, `${email}:${codigo}`), c.codigo_hash)) {
    await rodar(env, 'UPDATE codigos_login SET tentativas = tentativas + 1 WHERE email = ?', email);
    return falha;
  }
  await rodar(env, 'DELETE FROM codigos_login WHERE email = ?', email);
  const cli = await um(env, 'SELECT id FROM clientes WHERE email = ?', email);
  if (!cli) return falha;
  return json({ ok: true }, 200, { 'set-cookie': await criarCookie(env, 'nscli', cli.id, 30) });
}
export const onRequestDelete = () => json({ ok: true }, 200, { 'set-cookie': apagarCookie('nscli') });
