// Ajuste aqui os dados do negócio
export const CONFIG = {
  whatsapp: '5500000000000',          // número com DDI+DDD, só dígitos
  precoConvite: 3990,                 // em centavos
  precoMusica: 1000,
  // URL do checkout da NSMusic. O pedido é criado antes e o id vai no fim da URL.
  // Configure o gateway para voltar para https://SEU-DOMINIO/obrigado?pedido=<id>
  // e para chamar o webhook /api/pagamento/webhook quando o pagamento for aprovado.
  checkoutUrl: '',                    // ex.: 'https://pay.seudominio.com/checkout?produto=convite&ref='
};
export const zap = (txt) => `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(txt)}`;
export const reais = (c) => (c / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
