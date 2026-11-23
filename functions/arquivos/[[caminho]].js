// GET /arquivos/<chave>  -> entrega arquivo do R2 (com suporte a Range, necessário para vídeo)
export async function onRequestGet({ request, env, params }) {
  const chave = [].concat(params.caminho || []).join('/');
  if (!chave || chave.includes('..')) return new Response('Não encontrado', { status: 404 });
  const obj = await env.ARQUIVOS.get(chave, { range: request.headers, onlyIf: request.headers });
  if (!obj) return new Response('Não encontrado', { status: 404 });
  const h = new Headers();
  obj.writeHttpMetadata(h);
  h.set('etag', obj.httpEtag);
  h.set('accept-ranges', 'bytes');
  h.set('access-control-allow-origin', '*');
  if (!h.has('cache-control')) h.set('cache-control', 'public, max-age=31536000, immutable');
  if (!('body' in obj)) return new Response(null, { status: 304, headers: h });
  if (obj.range && request.headers.has('range')) {
    const { offset = 0, length = obj.size - offset } = obj.range;
    h.set('content-range', `bytes ${offset}-${offset + length - 1}/${obj.size}`);
    h.set('content-length', String(length));
    return new Response(obj.body, { status: 206, headers: h });
  }
  h.set('content-length', String(obj.size));
  return new Response(obj.body, { headers: h });
}
