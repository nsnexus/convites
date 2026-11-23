import { lerCookie } from '../../_lib/auth.js';
import { json } from '../../_lib/util.js';

// /api/conta/* exige o cliente logado, menos pedir código e entrar
export async function onRequest(ctx) {
  const p = new URL(ctx.request.url).pathname;
  if (p === '/api/conta/codigo' || p === '/api/conta/entrar') return ctx.next();
  const id = await lerCookie(ctx.request, ctx.env, 'nscli');
  if (!id) return json({ erro: 'Entre com seu e-mail.' }, 401);
  ctx.data.clienteId = id;
  return ctx.next();
}
