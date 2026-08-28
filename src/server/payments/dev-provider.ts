import "server-only";
import { randomUUID } from "node:crypto";
import type { ChargeMethod, CreateChargeInput, CreateChargeResult, PaymentProvider } from "./provider";

/**
 * Provedor de desenvolvimento: nunca cobra ninguém de verdade. Gera um
 * "copia e cola" Pix de mentira e um chargeId — a confirmação vem de um
 * clique manual em /api/dev/simulate-payment (ver rota), passando pelo
 * MESMO caminho de confirmação que um webhook real do Pagar.me usaria
 * (src/server/payments/confirm-order.ts). É isso que torna a troca pelo
 * gateway real (fase 2, ver plano §07) uma questão de implementar
 * PagarmeProvider, não de reescrever o fluxo.
 */
export class DevPaymentProvider implements PaymentProvider {
  readonly name = "dev";

  async createCharge(input: CreateChargeInput): Promise<CreateChargeResult> {
    const chargeId = `dev_${randomUUID()}`;
    if (input.method === "pix") {
      return {
        chargeId,
        pix: {
          copyPaste: fakePixCopyPaste(input.orderId, input.amountCents),
          expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        },
      };
    }
    return { chargeId };
  }
}

function fakePixCopyPaste(orderId: string, amountCents: number): string {
  // Formato ilustrativo (não é um payload EMV real) — só para preencher a
  // tela de checkout no ambiente de desenvolvimento.
  return `00020126DEV-PIX-NAO-REAL5204000053039865406${(amountCents / 100).toFixed(2)}5802BR5913NSConvites Dev6009SAOPAULO62070503${orderId.slice(0, 6)}6304DEV0`;
}

export function selectProvider(method: ChargeMethod): PaymentProvider {
  // Quando PAGARME_API_KEY existir, trocar aqui para PagarmeProvider
  // (ver src/server/payments/pagarme-provider.ts). method fica disponível
  // já agora para quando o provedor real precisar rotear por meio de pagamento.
  void method;
  return new DevPaymentProvider();
}
