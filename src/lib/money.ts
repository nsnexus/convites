/**
 * Dinheiro sempre em centavos, inteiro — nunca ponto flutuante. Ver plano §05.
 */
export type Cents = number;

export function formatBRL(cents: Cents): string {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function toCents(reais: number): Cents {
  return Math.round(reais * 100);
}

export function sumCents(...values: Cents[]): Cents {
  return values.reduce((total, value) => total + value, 0);
}

/** Comissão da plataforma sobre uma contribuição (ver plano §07). */
export function platformFee(gross: Cents, ratePercent = 4.9): Cents {
  return Math.round(gross * (ratePercent / 100));
}
