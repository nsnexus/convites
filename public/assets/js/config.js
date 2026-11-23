// Ajuste aqui os dados do negócio
export const CONFIG = {
  whatsapp: '',                       // vem do admin (Configurações); preenchido por carregarConfig()
  precoConvite: 3990,                 // em centavos
  precoMusica: 1000,
  // Checkout externo (opcional). Vazio = Pix pelo NSNexus Pay na página /obrigado.
  checkoutUrl: '',
};
export const zap = (txt) => `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(txt)}`;
export const reais = (c) => (c / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

// Busca o WhatsApp de suporte salvo no admin
let carregando;
export function carregarConfig() {
  carregando ||= fetch('/api/config').then(r => r.ok ? r.json() : {}).catch(() => ({})).then(c => {
    if (c.whatsapp) CONFIG.whatsapp = c.whatsapp;
    if (c.precoConvite) CONFIG.precoConvite = c.precoConvite;
    if (c.precoMusica != null) CONFIG.precoMusica = c.precoMusica;
    return CONFIG;
  });
  return carregando;
}

// Liga links de suporte: elementos com data-zap="mensagem". Some com eles se não houver número.
export async function ligarSuporte(raiz = document) {
  await carregarConfig();
  raiz.querySelectorAll('[data-zap]').forEach(a => {
    if (!CONFIG.whatsapp) { a.hidden = true; return; }
    a.href = zap(a.dataset.zap); a.target = '_blank'; a.rel = 'noopener'; a.hidden = false;
  });
}

// Preenche textos de preço: data-preco="convite" ou "musica" (este com "+" na frente)
export async function ligarPrecos(raiz = document) {
  await carregarConfig();
  raiz.querySelectorAll('[data-preco]').forEach(e => {
    e.textContent = e.dataset.preco === 'musica' ? `+ ${reais(CONFIG.precoMusica)}` : reais(CONFIG.precoConvite);
  });
}
