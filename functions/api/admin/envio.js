import { sb, json, aleatorio } from '../../_lib/sb.js';

// Gera links para o navegador mandar o vídeo e a capa direto ao Supabase Storage
export async function onRequestPost({ request, env }) {
  const { tipoVideo } = await request.json().catch(() => ({}));
  const id = aleatorio(8), db = sb(env);
  const ext = tipoVideo === 'video/webm' ? 'webm' : tipoVideo === 'video/quicktime' ? 'mov' : 'mp4';
  const video = await db.linkEnvio('modelos', `${id}/video.${ext}`);
  const capa = await db.linkEnvio('modelos', `${id}/capa.jpg`);
  return json({ id, video, capa });
}
