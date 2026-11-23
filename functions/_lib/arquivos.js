// Arquivos (fotos dos clientes, vídeos e capas dos modelos) no Cloudflare R2.
// Binding "ARQUIVOS" configurado no wrangler.toml / painel da Cloudflare.
// Se ARQUIVOS_URL estiver definido (domínio próprio ligado ao bucket), as URLs apontam para ele;
// senão, são servidos pelo próprio site em /arquivos/...
export const urlArquivo = (env, chave) => env.ARQUIVOS_URL ? `${env.ARQUIVOS_URL.replace(/\/$/, '')}/${chave}` : `/arquivos/${chave}`;
export const ehNossoArquivo = (env, url) => String(url).startsWith(urlArquivo(env, ''));

export async function salvarArquivo(env, chave, corpo, tipo) {
  await env.ARQUIVOS.put(chave, corpo, { httpMetadata: { contentType: tipo, cacheControl: 'public, max-age=31536000, immutable' } });
  return urlArquivo(env, chave);
}
