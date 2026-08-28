import "server-only";

/**
 * Contrato de gateway de pagamento. Trocar de provedor (dev -> Pagar.me)
 * é implementar esta interface e apontar `getPaymentProvider()` para ela —
 * nada no resto da aplicação muda. Ver plano §07.
 */
export type ChargeMethod = "pix" | "cartao";

export type CreateChargeInput = {
  orderId: string;
  amountCents: number;
  method: ChargeMethod;
  payerName: string;
  payerEmail: string | null;
};

export type CreateChargeResult = {
  chargeId: string;
  pix?: { copyPaste: string; qrCodeDataUrl?: string; expiresAt: string };
};

export interface PaymentProvider {
  readonly name: string;
  createCharge(input: CreateChargeInput): Promise<CreateChargeResult>;
}
