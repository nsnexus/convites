import { json, um, limpo, modeloPublico, CAMPOS_MODELO } from '../../_lib/util.js';

// GET /api/convites/:slug  -> dados públicos do convite + modelo (inclusive exclusivo)
export async function onRequestGet({ params, env }) {
  const c = await um(env, 'SELECT slug, modelo, status, homenageado, idade, titulo, data, hora, local, endereco, recado, presentes, foto_url, ajuste, musica_url FROM convites WHERE slug = ?', limpo(params.slug));
  if (!c) return json({ erro: 'não encontrado' }, 404);
  const liberado = ['pago', 'publicado'].includes(c.status) || env.LIBERAR_SEM_PAGAMENTO === '1';
  if (!liberado) return json({ erro: 'aguardando pagamento' }, 402);
  delete c.status;
  c.presentes = JSON.parse(c.presentes); c.ajuste = JSON.parse(c.ajuste);
  const m = await um(env, `SELECT ${CAMPOS_MODELO} FROM modelos WHERE id = ?`, c.modelo);
  c.modelo_dados = m ? modeloPublico(m) : null;
  return json(c, 200, { 'cache-control': 'public, max-age=30' });
}
