import type { Metadata } from "next";
import { PayCard } from "@/components/PayCard";
import { parsePaymentInput, type PaymentRequest } from "@/lib/payment";

export const metadata: Metadata = { title: "Pay privately" };

/**
 * /pay?to=st:eth:0x…&token=NVDA&amount=1.5&memo=…
 * Landing for a scanned payment-request QR. Parses on the server (no keys
 * involved), hands the request to the client card.
 */
export default async function PayPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) if (typeof v === "string") qs.set(k, v);
  let initial: PaymentRequest | undefined;
  let error: string | null = null;
  if (qs.has("to")) {
    try {
      initial = parsePaymentInput(qs.toString());
    } catch (err) {
      error = err instanceof Error ? err.message : "invalid payment request";
    }
  }
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Pay privately</h1>
      <p className="mt-2 text-fog">
        A one-time address is derived in your browser from the recipient&apos;s meta-address. Nobody can link it to
        them, and only they can spend from it.
      </p>
      {error && <p className="mt-4 text-sm text-warn">{error}</p>}
      <div className="mt-6">
        <PayCard mode="send" initial={initial} />
      </div>
    </div>
  );
}
