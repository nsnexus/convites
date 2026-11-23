import { sb, json, limpo, modeloPublico, CAMPOS_MODELO } from '../../_lib/sb.js';

// GET /api/convites/:slug  -> dados públicos do convite + modelo (inclusive exclusivo)
export async function onRequestGet({ params, env }) {
  const db = sb(env);
  const campos = 'slug,modelo,status,homenageado,idade,titulo,data,hora,local,endereco,recado,presentes,foto_url,ajuste,musica_url';
  const [c] = await db.select('convites', `slug=eq.${limpo(params.slug)}&select=${campos}&limit=1`);
  if (!c) return json({ erro: 'não encontrado' }, 404);
  const liberado = ['pago', 'publicado'].includes(c.status) || env.LIBERAR_SEM_PAGAMENTO === '1';
  if (!liberado) return json({ erro: 'aguardando pagamento' }, 402);
  delete c.status;
  const [m] = await db.select('modelos', `id=eq.${c.modelo}&select=${CAMPOS_MODELO}`);
  c.modelo_dados = m ? modeloPublico(m) : null;
  return json(c, 200, { 'cache-control': 'public, max-age=60' });
}
