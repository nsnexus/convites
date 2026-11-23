import { lerCookie } from '../../_lib/auth.js';
import { json, todos } from '../../_lib/util.js';

export async function onRequest(ctx) {
  const p = new URL(ctx.request.url).pathname;
  if (p === '/api/conta/entrar') return ctx.next();
  const id = await lerCookie(ctx.request, ctx.env, 'nscli');
  if (!id) return json({ erro: 'Busque pelo e-mail ou WhatsApp do pedido.' }, 401);
  let ids = [id];
  if (/^zap-55\d{10,11}$/.test(id)) {
    const numero = id.slice(4);
    ids = (await todos(ctx.env, 'SELECT id FROM clientes WHERE whatsapp IN (?, ?)', numero, numero.slice(2))).map(c => c.id);
  }
  if (!ids.length) return json({ erro: 'Nenhum convite encontrado para este contato.' }, 401);
  ctx.data.clienteId = ids[0];
  ctx.data.clienteIds = ids;
  ctx.data.contatoBusca = id.startsWith('zap-') ? id.slice(4) : '';
  const response = await ctx.next();
  const headers = new Headers(response.headers); headers.set('cache-control', 'no-store');
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}
