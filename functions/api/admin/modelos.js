import { sb, json, limpo, aleatorio } from '../../_lib/sb.js';
import { ehNossoArquivo } from '../../_lib/arquivos.js';

const validarQuadros = (q) => Array.isArray(q) && q.length > 0 && q.length < 2000 &&
  q.every(r => Array.isArray(r) && r.length === 4 && r.every(n => typeof n === 'number' && n >= -0.1 && n <= 1.1));

export async function onRequestGet({ env }) {
  return json(await sb(env).select('modelos', 'select=id,nome,categoria_id,video_url,poster_url,inicio,forma,ativo,exclusivo,ordem,criado_em&order=ordem,criado_em'));
}

// Cria um modelo depois que o navegador enviou vídeo e capa e calculou a moldura
export async function onRequestPost({ request, env }) {
  const b = await request.json();
  const nome = String(b.nome || '').trim().slice(0, 60);
  if (!nome) return json({ erro: 'Dê um nome ao modelo.' }, 400);
  if (!validarQuadros(b.quadros)) return json({ erro: 'Moldura inválida. Refaça a detecção.' }, 400);
  const db = sb(env);
  if (!ehNossoArquivo(env, b.video_url) || !ehNossoArquivo(env, b.poster_url)) return json({ erro: 'Arquivos inválidos.' }, 400);
  const linha = await db.insert('modelos', {
    id: limpo(b.id) || aleatorio(8), nome, categoria_id: b.categoria_id ? limpo(b.categoria_id) : null,
    video_url: b.video_url, poster_url: b.poster_url, fps: 24, inicio: Math.max(0, b.inicio | 0),
    forma: b.forma === 'circulo' ? 'circulo' : 'retangulo', chave: b.chave !== false,
    quadros: b.quadros, exclusivo: !!b.exclusivo, ativo: true, ordem: Date.now() / 1000 | 0,
  });
  return json({ id: linha.id });
}

export async function onRequestPatch({ request, env }) {
  const b = await request.json(); const c = {};
  if (b.nome != null) c.nome = String(b.nome).trim().slice(0, 60);
  if (b.categoria_id !== undefined) c.categoria_id = b.categoria_id ? limpo(b.categoria_id) : null;
  for (const k of ['ativo', 'exclusivo', 'chave']) if (b[k] != null) c[k] = !!b[k];
  if (b.ordem != null) c.ordem = b.ordem | 0;
  if (b.forma) c.forma = ['retangulo', 'circulo', 'mascara'].includes(b.forma) ? b.forma : 'retangulo';
  if (b.quadros) { if (!validarQuadros(b.quadros)) return json({ erro: 'Moldura inválida.' }, 400); c.quadros = b.quadros; c.inicio = Math.max(0, b.inicio | 0); }
  return json(await sb(env).update('modelos', `id=eq.${limpo(b.id)}`, c));
}

export async function onRequestDelete({ request, env }) {
  const id = limpo(new URL(request.url).searchParams.get('id'));
  const db = sb(env);
  const usado = await db.select('convites', `modelo=eq.${id}&select=id&limit=1`);
  // Modelo já usado em convite não é apagado (quebraria o convite): só sai da vitrine.
  if (usado.length) { await db.update('modelos', `id=eq.${id}`, { ativo: false }); return json({ ok: true, desativado: true }); }
  await db.remove('modelos', `id=eq.${id}`);
  return json({ ok: true });
}
