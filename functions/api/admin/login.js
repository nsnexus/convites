import { criarSessao, senhaConfere } from '../../_lib/auth.js';
import { json } from '../../_lib/sb.js';

export async function onRequestPost({ request, env }) {
  const { senha } = await request.json().catch(() => ({}));
  if (!senhaConfere(senha, env.ADMIN_SENHA)) {
    await new Promise(r => setTimeout(r, 800));
    return json({ erro: 'Senha incorreta.' }, 401);
  }
  return json({ ok: true }, 200, { 'set-cookie': await criarSessao(env) });
}
export async function onRequestDelete() {
  return json({ ok: true }, 200, { 'set-cookie': 'nsadm=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0' });
}
