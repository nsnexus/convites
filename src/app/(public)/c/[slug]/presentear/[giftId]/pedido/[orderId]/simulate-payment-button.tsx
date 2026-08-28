"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function SimulatePaymentButton({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setPending(true);
    setError(null);
    try {
      const res = await fetch(`/api/dev/simulate-payment/${orderId}`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Falha ao simular pagamento.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mt-3">
      <button
        onClick={handleClick}
        disabled={pending}
        className="rounded bg-amber-900 px-3 py-1.5 text-sm text-white hover:bg-amber-950 disabled:opacity-50"
      >
        {pending ? "Confirmando…" : "Simular pagamento"}
      </button>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
