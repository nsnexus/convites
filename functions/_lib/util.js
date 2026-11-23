// Utilidades comuns: respostas, ids, banco D1.
export const json = (dados, status = 200, extra = {}) => new Response(JSON.stringify(dados), { status, headers: { 'content-type': 'application/json; charset=utf-8', ...extra } });
export const aleatorio = (n) => [...crypto.getRandomValues(new Uint8Array(n))].map(b => 'abcdefghjkmnpqrstuvwxyz23456789'[b % 31]).join('');
export const uuid = () => crypto.randomUUID();
export const agora = () => new Date().toISOString();
export const limpo = (s, re = /[^a-z0-9-]/g) => String(s ?? '').toLowerCase().replace(re, '');
export const emailValido = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(e || ''));

// D1
export const todos = async (env, sql, ...p) => (await env.DB.prepare(sql).bind(...p).all()).results;
export const um = (env, sql, ...p) => env.DB.prepare(sql).bind(...p).first();
export const rodar = (env, sql, ...p) => env.DB.prepare(sql).bind(...p).run();

// UPDATE com só os campos informados: atualizar(env, 'tabela', {campo: valor}, 'id = ?', id)
export function atualizar(env, tabela, campos, onde, ...p) {
  const ks = Object.keys(campos); if (!ks.length) return null;
  return rodar(env, `UPDATE ${tabela} SET ${ks.map(k => `${k} = ?`).join(', ')} WHERE ${onde}`, ...ks.map(k => campos[k]), ...p);
}
export const bool = (v) => (v ? 1 : 0);

export const CAMPOS_MODELO = 'id, nome, categoria_id, video_url, poster_url, fps, inicio, forma, mascara_url, chave, quadros, tipo';
// Formato que o site usa para um modelo
export const modeloPublico = (m) => ({
  id: m.id, nome: m.nome, categoria: m.categoria_id, video: m.video_url, poster: m.poster_url, fps: m.fps,
  inicio: m.inicio, forma: m.forma, mascara: m.mascara_url, chave: !!m.chave, quadros: JSON.parse(m.quadros), tipo: m.tipo || 'foto',
});
export const origem = (request, env) => env.SITE_URL || new URL(request.url).origin;
