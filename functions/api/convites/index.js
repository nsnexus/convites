import { json, aleatorio, limpo, um, rodar, uuid, emailValido } from '../../_lib/util.js';
import { salvarArquivo } from '../../_lib/arquivos.js';

const PRECO = 3990, PRECO_MUSICA = 1000;
const txt = (fd, k, max = 200) => (fd.get(k) || '').toString().trim().slice(0, max);

// POST /api/convites  (multipart: campos do formulário + foto)
// Com "pedido" (token de pedido especial): usa o valor e o modelo combinados, sem adicionais.
export async function onRequestPost({ request, env }) {
  let fd;
  try { fd = await request.formData(); } catch { return json({ erro: 'Formulário inválido.' }, 400); }
  const foto = fd.get('foto');
  const obrig = { homenageado: 'nome de quem faz a festa', data: 'data', hora: 'horário', local: 'local', endereco: 'endereço', cliente: 'seu nome', whatsapp: 'WhatsApp', email: 'e-mail' };
  for (const [k, nome] of Object.entries(obrig)) if (!txt(fd, k)) return json({ erro: `Falta preencher: ${nome}.` }, 400);
  const email = txt(fd, 'email', 120).toLowerCase();
  if (!emailValido(email)) return json({ erro: 'Confira o e-mail.' }, 400);
  if (!(foto instanceof File) || foto.size === 0) return json({ erro: 'Envie a foto.' }, 400);
  if (foto.size > 6 * 1048576) return json({ erro: 'A foto passou de 6 MB.' }, 400);

  let modelo = limpo(txt(fd, 'modelo', 20)), especial = null;
  const token = limpo(txt(fd, 'pedido', 20), /[^a-z0-9]/g);
  if (token) {
    especial = await um(env, 'SELECT id, valor_centavos, modelo_id, status FROM pedidos_especiais WHERE token = ?', token);
    if (!especial || ['pago', 'concluido', 'cancelado'].includes(especial.status)) return json({ erro: 'Este pedido especial não está mais aberto.' }, 400);
    if (especial.modelo_id) modelo = especial.modelo_id;
  }
  // modelo precisa existir; exclusivo só vale se for o do pedido especial
  const m = await um(env, 'SELECT id, ativo, exclusivo FROM modelos WHERE id = ?', modelo);
  if (!m || (m.exclusivo && especial?.modelo_id !== m.id) || (!m.ativo && !especial)) return json({ erro: 'Modelo inválido.' }, 400);

  let ajuste = { zoom: 1, x: .5, y: .5 };
  try { const a = JSON.parse(txt(fd, 'ajuste', 200)); ajuste = { zoom: Math.min(3, Math.max(1, +a.zoom || 1)), x: Math.min(1, Math.max(0, +a.x)), y: Math.min(1, Math.max(0, +a.y)) }; } catch {}

  const base = txt(fd, 'homenageado', 40).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'convite';
  const slug = `${base}-${aleatorio(5)}`;
  const musica = !especial && txt(fd, 'musica', 20) === 'personalizada' ? 'personalizada' : 'modelo';
  const nome = txt(fd, 'cliente', 80), whatsapp = txt(fd, 'whatsapp', 20).replace(/\D/g, '');

  // cliente: um por e-mail (é o login dele em /conta)
  let cli = await um(env, 'SELECT id FROM clientes WHERE email = ?', email);
  if (!cli) { cli = { id: uuid() }; await rodar(env, 'INSERT INTO clientes (id, email, nome, whatsapp) VALUES (?, ?, ?, ?)', cli.id, email, nome, whatsapp); }
  else await rodar(env, 'UPDATE clientes SET nome = ?, whatsapp = ? WHERE id = ?', nome, whatsapp, cli.id);

  try {
    const foto_url = await salvarArquivo(env, `fotos/${slug}/${Date.now()}.jpg`, await foto.arrayBuffer(), 'image/jpeg');
    const id = uuid(), valor = especial ? especial.valor_centavos : PRECO + (musica === 'personalizada' ? PRECO_MUSICA : 0);
    await rodar(env, `INSERT INTO convites (id, slug, cliente_id, modelo, tipo, pedido_especial_id, homenageado, idade, titulo, data, hora, local, endereco, recado, presentes,
      foto_url, ajuste, musica, cliente_nome, cliente_whatsapp, cliente_email, valor_centavos, token_painel) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      id, slug, cli.id, modelo, especial ? 'especial' : 'padrao', especial?.id ?? null,
      txt(fd, 'homenageado', 80), txt(fd, 'idade', 3) || null, txt(fd, 'titulo', 120) || null,
      txt(fd, 'data', 10), txt(fd, 'hora', 5), txt(fd, 'local', 120), txt(fd, 'endereco', 200), txt(fd, 'recado', 400) || null,
      JSON.stringify(txt(fd, 'presentes', 1000).split('\n').map(s => s.trim()).filter(Boolean).slice(0, 30)),
      foto_url, JSON.stringify(ajuste), musica, nome, whatsapp, email, valor, aleatorio(24));
    if (especial) await rodar(env, "UPDATE pedidos_especiais SET status = 'aguardando_pagamento' WHERE id = ?", especial.id);
    return json({ id, slug, valor_centavos: valor });
  } catch (e) {
    console.error(e);
    return json({ erro: 'Não foi possível salvar o pedido.' }, 500);
  }
}
