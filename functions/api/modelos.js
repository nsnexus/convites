import { json, todos, modeloPublico, CAMPOS_MODELO } from '../_lib/util.js';

// GET /api/modelos  -> categorias visíveis + modelos da vitrine
export async function onRequestGet({ env }) {
  const [cats, mods] = await Promise.all([
    todos(env, 'SELECT id, nome FROM categorias WHERE ativa = 1 ORDER BY ordem, nome'),
    todos(env, `SELECT ${CAMPOS_MODELO} FROM modelos WHERE ativo = 1 AND exclusivo = 0 ORDER BY ordem, criado_em`),
  ]);
  const comModelo = new Set(mods.map(m => m.categoria_id));
  const categorias = cats.filter(c => comModelo.has(c.id)), ids = new Set(categorias.map(c => c.id));
  return json({ categorias, modelos: mods.filter(m => ids.has(m.categoria_id)).map(modeloPublico) }, 200, { 'cache-control': 'public, max-age=60' });
}
