import { sb, json, aleatorio, limpo } from '../../_lib/sb.js';

const PRECO = 3990, PRECO_MUSICA = 1000;
const txt = (fd, k, max = 200) => (fd.get(k) || '').toString().trim().slice(0, max);

// POST /api/convites  (multipart: campos do formulário + foto)
// Com "pedido" (token de pedido especial): usa o valor e o modelo combinados, sem adicionais.
export async function onRequestPost({ request, env }) {
  let fd;
  try { fd = await request.formData(); } catch { return json({ erro: 'Formulário inválido.' }, 400); }
  const foto = fd.get('foto');
  const obrig = { homenageado: 'nome de quem faz a festa', data: 'data', hora: 'horário', local: 'local', endereco: 'endereço', cliente: 'seu nome', whatsapp: 'WhatsApp' };
  for (const [k, nome] of Object.entries(obrig)) if (!txt(fd, k)) return json({ erro: `Falta preencher: ${nome}.` }, 400);
  if (!(foto instanceof File) || foto.size === 0) return json({ erro: 'Envie a foto.' }, 400);
  if (foto.size > 6 * 1024 * 1024) return json({ erro: 'A foto passou de 6 MB.' }, 400);

  const db = sb(env);
  let modelo = limpo(txt(fd, 'modelo', 20));
  let especial = null;
  const token = limpo(txt(fd, 'pedido', 20), /[^a-z0-9]/g);
  if (token) {
    [especial] = await db.select('pedidos_especiais', `token=eq.${token}&select=id,valor_centavos,modelo_id,status&limit=1`);
    if (!especial || ['pago', 'concluido', 'cancelado'].includes(especial.status)) return json({ erro: 'Este pedido especial não está mais aberto.' }, 400);
    if (especial.modelo_id) modelo = especial.modelo_id;
  }
  // modelo precisa existir; exclusivo só vale se for o do pedido especial
  const [m] = await db.select('modelos', `id=eq.${modelo}&select=id,ativo,exclusivo&limit=1`);
  if (!m || (m.exclusivo && especial?.modelo_id !== m.id) || (!m.ativo && !especial)) return json({ erro: 'Modelo inválido.' }, 400);

  let ajuste = { zoom: 1, x: .5, y: .5 };
  try { const a = JSON.parse(txt(fd, 'ajuste', 200)); ajuste = { zoom: Math.min(3, Math.max(1, +a.zoom || 1)), x: Math.min(1, Math.max(0, +a.x)), y: Math.min(1, Math.max(0, +a.y)) }; } catch {}

  const base = txt(fd, 'homenageado', 40).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'convite';
  const slug = `${base}-${aleatorio(5)}`;
  const musica = !especial && txt(fd, 'musica', 20) === 'personalizada' ? 'personalizada' : 'modelo';
  try {
    const foto_url = await db.upload('fotos', `${slug}/${Date.now()}.jpg`, await foto.arrayBuffer(), foto.type || 'image/jpeg');
    const linha = await db.insert('convites', {
      slug, modelo, status: 'aguardando_pagamento', tipo: especial ? 'especial' : 'padrao', pedido_especial_id: especial?.id ?? null,
      homenageado: txt(fd, 'homenageado', 80), idade: txt(fd, 'idade', 3) || null, titulo: txt(fd, 'titulo', 120) || null,
      data: txt(fd, 'data', 10), hora: txt(fd, 'hora', 5), local: txt(fd, 'local', 120), endereco: txt(fd, 'endereco', 200),
      recado: txt(fd, 'recado', 400) || null,
      presentes: txt(fd, 'presentes', 1000).split('\n').map(s => s.trim()).filter(Boolean).slice(0, 30),
      foto_url, ajuste, musica,
      cliente_nome: txt(fd, 'cliente', 80), cliente_whatsapp: txt(fd, 'whatsapp', 20).replace(/\D/g, ''), cliente_email: txt(fd, 'email', 120) || null,
      valor_centavos: especial ? especial.valor_centavos : PRECO + (musica === 'personalizada' ? PRECO_MUSICA : 0),
      token_painel: aleatorio(24),
    });
    if (especial) await db.update('pedidos_especiais', `id=eq.${especial.id}`, { status: 'aguardando_pagamento' });
    return json({ id: linha.id, slug: linha.slug, valor_centavos: linha.valor_centavos });
  } catch (e) {
    console.error(e);
    return json({ erro: 'Não foi possível salvar o pedido.' }, 500);
  }
}
