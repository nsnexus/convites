import { criarCookie, apagarCookie, iguais } from '../../_lib/auth.js';
import { json } from '../../_lib/util.js';

export async function onRequestPost({ request, env }) {
  const { senha } = await request.json().catch(() => ({}));
  if (!iguais(senha || '', env.ADMIN_SENHA)) { await new Promise(r => setTimeout(r, 800)); return json({ erro: 'Senha incorreta.' }, 401); }
  return json({ ok: true }, 200, { 'set-cookie': await criarCookie(env, 'nsadm', 'admin', 7) });
}
export const onRequestDelete = () => json({ ok: true }, 200, { 'set-cookie': apagarCookie('nsadm') });
