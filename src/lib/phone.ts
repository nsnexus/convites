/**
 * Normalização de telefone brasileiro para E.164 (+55DDDNNNNNNNNN).
 * Usada na deduplicação de convidados (ver plano §3.4).
 */
export function normalizeBrazilPhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return null;

  // já com DDI 55
  if (digits.length === 12 || digits.length === 13) {
    if (digits.startsWith("55")) return `+${digits}`;
  }
  // DDD + número (10 ou 11 dígitos)
  if (digits.length === 10 || digits.length === 11) {
    return `+55${digits}`;
  }
  return null;
}

/** Link de compartilhamento direto pelo WhatsApp — sem API, sem custo. */
export function buildWhatsAppShareLink(phoneE164: string | null, message: string): string {
  const text = encodeURIComponent(message);
  if (!phoneE164) return `https://wa.me/?text=${text}`;
  const digitsOnly = phoneE164.replace(/\D/g, "");
  return `https://wa.me/${digitsOnly}?text=${text}`;
}
