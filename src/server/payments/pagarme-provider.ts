import "server-only";
import { serverEnv } from "@/lib/env.server";
import type { CreateChargeInput, CreateChargeResult, PaymentProvider } from "./provider";

/**
 * Adapter real — fase 2 do plano (§07). Preencher PAGARME_API_KEY em
 * .env.local liga isto no lugar do DevPaymentProvider (ver dev-provider.ts
 * -> selectProvider). Requer conta Pagar.me com subconta/split configurados
 * (isso precisa ser feito pelo dono do negócio, com CNPJ — não é algo que
 * dá para provisionar por código).
 */
export class PagarmeProvider implements PaymentProvider {
  readonly name = "pagarme";

  async createCharge(input: CreateChargeInput): Promise<CreateChargeResult> {
    if (!serverEnv.PAGARME_API_KEY) {
      throw new Error(
        "PAGARME_API_KEY não configurada. Preencha .env.local com as credenciais da conta Pagar.me."
      );
    }

    // TODO fase 2: chamar a API do Pagar.me (POST /orders) com split para a
    // subconta do casal + comissão da plataforma, usando input.amountCents,
    // input.method, input.payerName/payerEmail. Mapear a resposta para
    // CreateChargeResult (chargeId + qr/copyPaste quando Pix).
    throw new Error(`PagarmeProvider.createCharge ainda não implementado (order ${input.orderId}).`);
  }
}
