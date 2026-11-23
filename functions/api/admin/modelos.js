import { json, todos, um, rodar, atualizar, limpo, aleatorio, bool } from '../../_lib/util.js';
import { ehNossoArquivo } from '../../_lib/arquivos.js';

const validarQuadros = (q) => Array.isArray(q) && q.length > 0 && q.length < 2000 &&
  q.every(r => Array.isArray(r) && r.length === 4 && r.every(n => typeof n === 'number' && n >= -0.1 && n <= 1.1));

export async function onRequestGet({ env }) {
  const ms = await todos(env, 'SELECT id, nome, categoria_id, video_url, poster_url, inicio, forma, tipo, ativo, exclusivo, ordem, criado_em FROM modelos ORDER BY ordem, criado_em');
  return json(ms.map(m => ({ ...m, ativo: !!m.ativo, exclusivo: !!m.exclusivo })));
}

// Cria um modelo depois que o navegador enviou vídeo e capa e calculou a moldura
export async function onRequestPost({ request, env }) {
  const b = await request.json();
  const nome = String(b.nome || '').trim().slice(0, 60);
  if (!nome) return json({ erro: 'Dê um nome ao modelo.' }, 400);
  if (!validarQuadros(b.quadros)) return json({ erro: 'Moldura inválida. Refaça a detecção.' }, 400);
  if (!ehNossoArquivo(env, b.video_url) || !ehNossoArquivo(env, b.poster_url)) return json({ erro: 'Arquivos inválidos.' }, 400);
  const id = limpo(b.id) || aleatorio(8);
  const ult = await um(env, 'SELECT MAX(ordem) AS o FROM modelos');
  const tipo = b.tipo === 'selo' ? 'selo' : 'foto';
  await rodar(env, `INSERT INTO modelos (id, nome, categoria_id, video_url, poster_url, fps, inicio, forma, chave, quadros, exclusivo, ativo, ordem, tipo)
    VALUES (?, ?, ?, ?, ?, 24, ?, ?, ?, ?, ?, 1, ?, ?)`,
    id, nome, b.categoria_id ? limpo(b.categoria_id) : null, b.video_url, b.poster_url, Math.max(0, b.inicio | 0),
    b.forma === 'circulo' ? 'circulo' : 'retangulo', bool(b.chave !== false), JSON.stringify(b.quadros), bool(b.exclusivo), (ult?.o ?? 0) + 1, tipo);
  return json({ id });
}

export async function onRequestPatch({ request, env }) {
  const b = await request.json(), c = {};
  if (b.nome != null) c.nome = String(b.nome).trim().slice(0, 60);
  if (b.categoria_id !== undefined) c.categoria_id = b.categoria_id ? limpo(b.categoria_id) : null;
  for (const k of ['ativo', 'exclusivo', 'chave']) if (b[k] != null) c[k] = bool(b[k]);
  if (b.ordem != null) c.ordem = b.ordem | 0;
  if (b.quadros) { if (!validarQuadros(b.quadros)) return json({ erro: 'Moldura inválida.' }, 400); c.quadros = JSON.stringify(b.quadros); c.inicio = Math.max(0, b.inicio | 0); }
  await atualizar(env, 'modelos', c, 'id = ?', limpo(b.id));
  return json({ ok: true });
}

export async function onRequestDelete({ request, env }) {
  const id = limpo(new URL(request.url).searchParams.get('id'));
  // Modelo já usado em convite não é apagado (quebraria o convite): só sai da vitrine.
  if (await um(env, 'SELECT id FROM convites WHERE modelo = ? LIMIT 1', id)) { await rodar(env, 'UPDATE modelos SET ativo = 0 WHERE id = ?', id); return json({ ok: true, desativado: true }); }
  const m = await um(env, 'SELECT video_url, poster_url FROM modelos WHERE id = ?', id);
  await rodar(env, 'UPDATE pedidos_especiais SET modelo_id = NULL WHERE modelo_id = ?', id);
  await rodar(env, 'DELETE FROM modelos WHERE id = ?', id);
  // apaga os arquivos do R2 se foram enviados pelo admin
  if (m) await env.ARQUIVOS.delete([m.video_url, m.poster_url].filter(u => ehNossoArquivo(env, u)).map(u => u.slice(u.indexOf('modelos/'))));
  return json({ ok: true });
}
