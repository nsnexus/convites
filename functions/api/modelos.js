import { sb, json, modeloPublico, CAMPOS_MODELO } from '../_lib/sb.js';

// GET /api/modelos  -> categorias ativas + modelos da vitrine
export async function onRequestGet({ env }) {
  const db = sb(env);
  const [cats, mods] = await Promise.all([
    db.select('categorias', 'ativa=eq.true&select=id,nome&order=ordem,nome'),
    db.select('modelos', `ativo=eq.true&exclusivo=eq.false&select=${CAMPOS_MODELO}&order=ordem,criado_em`),
  ]);
  const comModelo = new Set(mods.map(m => m.categoria_id));
  const categorias = cats.filter(c => comModelo.has(c.id));
  const ids = new Set(categorias.map(c => c.id));
  return json({ categorias, modelos: mods.filter(m => ids.has(m.categoria_id)).map(modeloPublico) }, 200, { 'cache-control': 'public, max-age=60' });
}
