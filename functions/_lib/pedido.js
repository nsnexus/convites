import { um, rodar, agora, origem } from './util.js';
import { enviarEmail, moldeEmail, esc } from './email.js';

// Marca o convite como pago e manda o e-mail com os links (uma vez só).
// Chamado pelo webhook do gateway e pelo admin ("Pago").
export async function confirmarPagamento(env, request, conviteId) {
  const c = await um(env, 'SELECT * FROM convites WHERE id = ?', conviteId);
  if (!c) return null;
  if (c.status === 'aguardando_pagamento' || c.status === 'cancelado') {
    await rodar(env, "UPDATE convites SET status = 'pago', pago_em = ? WHERE id = ?", agora(), c.id);
    if (c.pedido_especial_id) await rodar(env, "UPDATE pedidos_especiais SET status = 'pago' WHERE id = ?", c.pedido_especial_id);
  }
  if (!c.email_enviado_em) {
    try {
      await enviarEmailConvitePronto(env, request, c);
      await rodar(env, 'UPDATE convites SET email_enviado_em = ? WHERE id = ?', agora(), c.id);
    } catch (e) { console.error('e-mail do convite falhou', e); }
  }
  return c;
}

export async function enviarEmailConvitePronto(env, request, c) {
  const base = origem(request, env);
  const link = `${base}/c/${c.slug}`, conta = `${base}/conta`;
  const nome = esc(c.cliente_nome.split(' ')[0]);
  return enviarEmail(env, {
    para: c.cliente_email,
    assunto: `Seu convite está pronto: ${c.titulo || c.homenageado}`,
    html: moldeEmail({
      titulo: 'Seu convite está pronto',
      paragrafos: [`Oi, ${nome}! O pagamento foi confirmado e o convite de <strong>${esc(c.homenageado)}</strong> já está no ar.`,
        `É só copiar o link abaixo e mandar para os convidados:<br><a href="${link}" style="color:#E8336D">${link}</a>`,
        `Para ver quem confirmou presença ou corrigir alguma informação, entre em <a href="${conta}" style="color:#E8336D">Meus convites</a> com este e-mail.`],
      botao: { url: link, texto: 'Abrir meu convite' },
      rodape: 'Você recebeu este e-mail porque fez um pedido na NS Convites.',
    }),
    texto: `Seu convite está pronto!\n\nLink para os convidados: ${link}\n\nMeus convites (confirmações e edição): ${conta}`,
  });
}
