// Envio de e-mail pelo Resend (https://resend.com). Precisa de RESEND_API_KEY e EMAIL_REMETENTE.
// Sem a chave (ambiente de teste), só registra no log.
export async function enviarEmail(env, { para, assunto, html, texto }) {
  if (!env.RESEND_API_KEY) { console.log(`[e-mail não enviado: falta RESEND_API_KEY] para=${para} assunto=${assunto}\n${texto || ''}`); return { simulado: true }; }
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'content-type': 'application/json' },
    body: JSON.stringify({ from: env.EMAIL_REMETENTE || 'NS Convites <convites@exemplo.com>', to: [para], subject: assunto, html, text: texto }),
  });
  if (!r.ok) throw new Error(`Resend ${r.status}: ${await r.text()}`);
  return r.json();
}

const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
// Molde simples, legível em qualquer cliente de e-mail
export function moldeEmail({ titulo, paragrafos = [], botao, rodape }) {
  const html = `<!doctype html><html><body style="margin:0;background:#FBF8FF;font-family:Arial,Helvetica,sans-serif;color:#26122E">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px">
<table role="presentation" width="100%" style="max-width:520px;background:#ffffff;border-radius:20px" cellpadding="0" cellspacing="0"><tr><td style="padding:32px">
<p style="margin:0 0 24px;font-size:18px;font-weight:bold">ns<span style="color:#E8336D">.</span>convites</p>
<h1 style="margin:0 0 16px;font-size:24px;line-height:1.2">${esc(titulo)}</h1>
${paragrafos.map(p => `<p style="margin:0 0 14px;font-size:16px;line-height:1.5;color:#5A4763">${p}</p>`).join('')}
${botao ? `<p style="margin:24px 0"><a href="${esc(botao.url)}" style="display:inline-block;background:#E8336D;color:#ffffff;text-decoration:none;font-weight:bold;padding:14px 24px;border-radius:999px">${esc(botao.texto)}</a></p>` : ''}
${rodape ? `<p style="margin:24px 0 0;font-size:13px;color:#8A7A92">${rodape}</p>` : ''}
</td></tr></table></td></tr></table></body></html>`;
  return html;
}
export { esc };
