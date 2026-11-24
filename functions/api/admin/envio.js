import { json, aleatorio } from '../../_lib/util.js';
import { salvarArquivo, urlArquivo } from '../../_lib/arquivos.js';

const TIPOS = { 'video/mp4': 'mp4', 'video/quicktime': 'mov', 'video/webm': 'webm' };

// POST: reserva um id e devolve para onde mandar o vídeo e a capa
export async function onRequestPost({ request, env }) {
  const { tipoVideo } = await request.json().catch(() => ({}));
  const id = aleatorio(8), ext = TIPOS[tipoVideo] || 'mp4';
  const v = `modelos/${id}/video.${ext}`, c = `modelos/${id}/capa.jpg`;
  return json({
    id,
    video: { envio: `/api/admin/envio?chave=${encodeURIComponent(v)}`, publico: urlArquivo(env, v) },
    mascara: { envio: `/api/admin/envio?chave=${encodeURIComponent(`modelos/${id}/mascara.png`)}`, publico: urlArquivo(env, `modelos/${id}/mascara.png`) },
    capa: { envio: `/api/admin/envio?chave=${encodeURIComponent(c)}`, publico: urlArquivo(env, c) },
  });
}

// PUT ?chave=modelos/<id>/...  corpo = o arquivo
export async function onRequestPut({ request, env }) {
  const chave = new URL(request.url).searchParams.get('chave') || '';
  if (!/^modelos\/[a-z0-9]{8}\/(video\.(mp4|mov|webm)|capa\.jpg|mascara\.png)$/.test(chave)) return json({ erro: 'Destino inválido.' }, 400);
  const tam = +request.headers.get('content-length') || 0;
  if (tam > 90 * 1048576) return json({ erro: 'Arquivo grande demais (máx. 90 MB).' }, 413);
  const tipo = chave.endsWith('.jpg') ? 'image/jpeg' : chave.endsWith('.png') ? 'image/png' : (request.headers.get('content-type') || 'video/mp4');
  return json({ url: await salvarArquivo(env, chave, request.body, tipo) });
}
