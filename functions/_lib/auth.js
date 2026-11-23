// Sessão do admin: cookie assinado com HMAC, válido por 7 dias.
const enc = new TextEncoder();
async function assinar(env, texto) {
  const k = await crypto.subtle.importKey('raw', enc.encode(env.ADMIN_SEGREDO || env.SUPABASE_SERVICE_ROLE_KEY), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const s = await crypto.subtle.sign('HMAC', k, enc.encode(texto));
  return btoa(String.fromCharCode(...new Uint8Array(s))).replace(/[+/=]/g, c => ({ '+': '-', '/': '_', '=': '' }[c]));
}
export async function criarSessao(env) {
  const exp = Date.now() + 7 * 864e5;
  return `nsadm=${exp}.${await assinar(env, String(exp))}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${7 * 86400}`;
}
export async function sessaoValida(request, env) {
  const m = (request.headers.get('cookie') || '').match(/(?:^|;\s*)nsadm=(\d+)\.([\w-]+)/);
  if (!m || +m[1] < Date.now()) return false;
  return (await assinar(env, m[1])) === m[2];
}
// comparação em tempo constante
export function senhaConfere(dada, certa) {
  if (!certa) return false;
  const a = enc.encode(String(dada)), b = enc.encode(String(certa));
  let d = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++) d |= (a[i] || 0) ^ (b[i] || 0);
  return d === 0;
}
