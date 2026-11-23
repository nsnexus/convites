import { json, um, rodar, uuid, limpo } from '../_lib/util.js';

// POST /api/rsvp  {slug, nome, vai, adultos, criancas, presente, recado}
export async function onRequestPost({ request, env }) {
  let b; try { b = await request.json(); } catch { return json({ erro: 'inválido' }, 400); }
  const nome = String(b.nome || '').trim().slice(0, 80);
  if (!nome) return json({ erro: 'Escreva seu nome.' }, 400);
  const c = await um(env, 'SELECT id, status, data, personalizacao FROM convites WHERE slug = ?', limpo(b.slug));
  if (!c) return json({ erro: 'Convite não encontrado.' }, 404);
  if (!['pago', 'publicado'].includes(c.status) && env.LIBERAR_SEM_PAGAMENTO !== '1') return json({ erro: 'Este convite ainda não foi liberado.' }, 403);
  const r = JSON.parse(c.personalizacao || '{}').blocos?.rsvp || {};
  if (r.ativo === false) return json({ erro: 'Este convite não recebe confirmações.' }, 403);
  const hoje = new Date(Date.now() - 3 * 3600e3).toISOString().slice(0, 10); // horário de Brasília
  if (r.prazo && hoje > r.prazo) return json({ erro: 'O prazo para confirmar presença já terminou.' }, 403);
  let adultos = 0, criancas = 0;
  if (b.vai) {
    adultos = Math.max(1, parseInt(b.adultos, 10) || 1);
    criancas = r.criancas === false ? 0 : Math.max(0, parseInt(b.criancas, 10) || 0);
    const limite = r.limite || 10;
    if (adultos + criancas > limite) return json({ erro: `Cada confirmação pode ter no máximo ${limite} ${limite > 1 ? 'pessoas' : 'pessoa'}.` }, 400);
  }
  await rodar(env, 'INSERT INTO confirmacoes (id, convite_id, nome, vai, pessoas, adultos, criancas, presente, recado) VALUES (?,?,?,?,?,?,?,?,?)',
    uuid(), c.id, nome, b.vai ? 1 : 0, adultos + criancas, adultos, criancas,
    b.vai && b.presente ? String(b.presente).slice(0, 120) : null, b.recado ? String(b.recado).slice(0, 300) : null);
  return json({ ok: true });
}
