import { json, um, rodar, emailValido } from '../../_lib/util.js';
import { hash } from '../../_lib/auth.js';
import { enviarEmail, moldeEmail } from '../../_lib/email.js';

// POST /api/conta/codigo {email} -> manda um código de 6 dígitos para entrar em "Meus convites"
export async function onRequestPost({ request, env }) {
  const { email: e } = await request.json().catch(() => ({}));
  const email = String(e || '').trim().toLowerCase();
  if (!emailValido(email)) return json({ erro: 'Confira o e-mail.' }, 400);
  const resposta = json({ ok: true }); // mesma resposta exista ou não a conta (não revela quem é cliente)
  const cli = await um(env, 'SELECT id FROM clientes WHERE email = ?', email);
  if (!cli) return resposta;
  const ant = await um(env, 'SELECT criado FROM codigos_login WHERE email = ?', email);
  if (ant && Date.now() - ant.criado < 60e3) return json({ erro: 'Espere um minuto para pedir outro código.' }, 429);
  const codigo = String(crypto.getRandomValues(new Uint32Array(1))[0] % 1e6).padStart(6, '0');
  await rodar(env, `INSERT INTO codigos_login (email, codigo_hash, expira, tentativas, criado) VALUES (?, ?, ?, 0, ?)
    ON CONFLICT(email) DO UPDATE SET codigo_hash = excluded.codigo_hash, expira = excluded.expira, tentativas = 0, criado = excluded.criado`,
    email, await hash(env, `${email}:${codigo}`), Date.now() + 10 * 60e3, Date.now());
  await enviarEmail(env, {
    para: email, assunto: `Seu código de acesso: ${codigo}`,
    html: moldeEmail({ titulo: `Seu código: ${codigo}`, paragrafos: ['Use este código para entrar em Meus convites. Ele vale por 10 minutos.'], rodape: 'Se não foi você que pediu, pode ignorar este e-mail.' }),
    texto: `Seu código de acesso à NS Convites: ${codigo} (vale por 10 minutos)`,
  });
  return resposta;
}
