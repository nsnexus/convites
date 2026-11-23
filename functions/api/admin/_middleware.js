import { sessaoValida } from '../../_lib/auth.js';
import { json } from '../../_lib/sb.js';

// Tudo em /api/admin/* exige login, menos o próprio login.
export async function onRequest({ request, env, next }) {
  const p = new URL(request.url).pathname;
  if (p === '/api/admin/login') return next();
  if (!(await sessaoValida(request, env))) return json({ erro: 'Faça login.' }, 401);
  try { return await next(); }
  catch (e) { console.error(e); return json({ erro: e.message }, 500); }
}
