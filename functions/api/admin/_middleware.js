import { lerCookie } from '../../_lib/auth.js';
import { json } from '../../_lib/util.js';

// Tudo em /api/admin/* exige login, menos o próprio login.
export async function onRequest({ request, env, next }) {
  if (new URL(request.url).pathname === '/api/admin/login') return next();
  if ((await lerCookie(request, env, 'nsadm')) !== 'admin') return json({ erro: 'Faça login.' }, 401);
  try { return await next(); }
  catch (e) { console.error(e); return json({ erro: e.message }, 500); }
}
