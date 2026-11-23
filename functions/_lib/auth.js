// Sessões em cookie assinado com HMAC (admin e cliente). Precisa do segredo SEGREDO.
const enc = new TextEncoder();
async function assinar(env, texto) {
  if (!env.SEGREDO) throw new Error('Defina o segredo SEGREDO nas variáveis do projeto.');
  const k = await crypto.subtle.importKey('raw', enc.encode(env.SEGREDO), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const s = await crypto.subtle.sign('HMAC', k, enc.encode(texto));
  return btoa(String.fromCharCode(...new Uint8Array(s))).replace(/[+/=]/g, c => ({ '+': '-', '/': '_', '=': '' }[c]));
}
export async function hash(env, texto) { return assinar(env, `h:${texto}`); }

export async function criarCookie(env, nome, valor, dias) {
  const exp = Date.now() + dias * 864e5, corpo = `${valor}.${exp}`;
  return `${nome}=${corpo}.${await assinar(env, `${nome}:${corpo}`)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${dias * 86400}`;
}
export const apagarCookie = (nome) => `${nome}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;

// devolve o valor guardado no cookie, ou null se ausente/expirado/adulterado
export async function lerCookie(request, env, nome) {
  const m = (request.headers.get('cookie') || '').match(new RegExp(`(?:^|;\\s*)${nome}=([\\w-]+)\\.(\\d+)\\.([\\w-]+)`));
  if (!m || +m[2] < Date.now()) return null;
  return (await assinar(env, `${nome}:${m[1]}.${m[2]}`)) === m[3] ? m[1] : null;
}

// comparação em tempo constante
export function iguais(a, b) {
  if (!b) return false;
  const x = enc.encode(String(a)), y = enc.encode(String(b));
  let d = x.length ^ y.length;
  for (let i = 0; i < Math.max(x.length, y.length); i++) d |= (x[i] || 0) ^ (y[i] || 0);
  return d === 0;
}
