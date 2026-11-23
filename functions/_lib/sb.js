// Acesso ao Supabase via REST usando a service role (só no servidor).
export function sb(env) {
  const base = env.SUPABASE_URL, key = env.SUPABASE_SERVICE_ROLE_KEY;
  const h = { apikey: key, Authorization: `Bearer ${key}` };
  const falha = async (o, r) => { throw new Error(`${o}: ${r.status} ${await r.text()}`); };
  return {
    base,
    async select(tabela, query) {
      const r = await fetch(`${base}/rest/v1/${tabela}?${query}`, { headers: h });
      if (!r.ok) await falha(`select ${tabela}`, r);
      return r.json();
    },
    async insert(tabela, linha) {
      const r = await fetch(`${base}/rest/v1/${tabela}`, { method: 'POST', headers: { ...h, 'content-type': 'application/json', Prefer: 'return=representation' }, body: JSON.stringify(linha) });
      if (!r.ok) await falha(`insert ${tabela}`, r);
      return (await r.json())[0];
    },
    async update(tabela, query, campos) {
      const r = await fetch(`${base}/rest/v1/${tabela}?${query}`, { method: 'PATCH', headers: { ...h, 'content-type': 'application/json', Prefer: 'return=representation' }, body: JSON.stringify(campos) });
      if (!r.ok) await falha(`update ${tabela}`, r);
      return r.json();
    },
    async remove(tabela, query) {
      const r = await fetch(`${base}/rest/v1/${tabela}?${query}`, { method: 'DELETE', headers: h });
      if (!r.ok) await falha(`delete ${tabela}`, r);
    },
    async upload(bucket, caminho, corpo, tipo) {
      const r = await fetch(`${base}/storage/v1/object/${bucket}/${caminho}`, { method: 'POST', headers: { ...h, 'content-type': tipo, 'x-upsert': 'true' }, body: corpo });
      if (!r.ok) await falha('upload', r);
      return `${base}/storage/v1/object/public/${bucket}/${caminho}`;
    },
    // Link para o navegador enviar um arquivo grande direto ao Storage
    async linkEnvio(bucket, caminho) {
      const r = await fetch(`${base}/storage/v1/object/upload/sign/${bucket}/${caminho}`, { method: 'POST', headers: { ...h, 'content-type': 'application/json' }, body: '{}' });
      if (!r.ok) await falha('link de envio', r);
      const j = await r.json();
      return { envio: `${base}/storage/v1${j.url}`, publico: `${base}/storage/v1/object/public/${bucket}/${caminho}` };
    },
  };
}

export const json = (dados, status = 200, extra = {}) => new Response(JSON.stringify(dados), { status, headers: { 'content-type': 'application/json; charset=utf-8', ...extra } });
export const aleatorio = (n) => [...crypto.getRandomValues(new Uint8Array(n))].map(b => 'abcdefghjkmnpqrstuvwxyz23456789'[b % 31]).join('');
export const limpo = (s, re = /[^a-z0-9-]/g) => String(s ?? '').toLowerCase().replace(re, '');

// Formato que o site usa para um modelo
export const modeloPublico = (m) => ({
  id: m.id, nome: m.nome, categoria: m.categoria_id, video: m.video_url, poster: m.poster_url, fps: m.fps,
  inicio: m.inicio, forma: m.forma, mascara: m.mascara_url, chave: m.chave, quadros: m.quadros,
});
export const CAMPOS_MODELO = 'id,nome,categoria_id,video_url,poster_url,fps,inicio,forma,mascara_url,chave,quadros';
