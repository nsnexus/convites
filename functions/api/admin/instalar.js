import { json } from '../../_lib/util.js';
import { MIGRACOES } from '../../_lib/migracoes.js';

// POST /api/admin/instalar -> cria/atualiza as tabelas do D1 (aplica só o que falta). Seguro de chamar sempre.
export async function onRequestPost({ env }) {
  await env.DB.prepare('CREATE TABLE IF NOT EXISTS _migracoes (nome TEXT PRIMARY KEY, aplicado_em TEXT NOT NULL)').run();
  const feitas = new Set((await env.DB.prepare('SELECT nome FROM _migracoes').all()).results.map(r => r.nome));
  const aplicadas = [];
  for (const m of MIGRACOES) {
    if (feitas.has(m.nome)) continue;
    await env.DB.batch([...m.sql.map(s => env.DB.prepare(s)), env.DB.prepare('INSERT INTO _migracoes (nome, aplicado_em) VALUES (?, ?)').bind(m.nome, new Date().toISOString())]);
    aplicadas.push(m.nome);
  }
  return json({ ok: true, aplicadas });
}
