"use client";

import { useSyncExternalStore } from "react";
import { WalletButton } from "@/components/WalletButton";
import { SwapCard } from "@/components/SwapCard";
import { StealthCard } from "@/components/StealthCard";
import { VaultCard } from "@/components/VaultCard";
import { PayCard } from "@/components/PayCard";

const tabs = [
  { id: "swap", label: "Mask Swap" },
  { id: "receive", label: "Ghost Receive" },
  { id: "pay", label: "Private Pay" },
  { id: "vault", label: "Blue Chip Vault" },
] as const;

type Tab = (typeof tabs)[number]["id"];
const DEFAULT_TAB: Tab = "receive";

function isTab(v: string): v is Tab {
  return tabs.some((t) => t.id === v);
}

/** Tab lives in the URL hash so /app#swap is linkable and survives reloads. */
function subscribeHash(cb: () => void) {
  window.addEventListener("hashchange", cb);
  return () => window.removeEventListener("hashchange", cb);
}
function readHash() {
  return window.location.hash.replace(/^#/, "");
}

export function Dashboard() {
  const hash = useSyncExternalStore(subscribeHash, readHash, () => "");
  const tab: Tab = isTab(hash) ? hash : DEFAULT_TAB;

  function select(id: Tab) {
    if (id === tab) return;
    window.history.pushState(null, "", `#${id}`);
    window.dispatchEvent(new HashChangeEvent("hashchange"));
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex gap-1 rounded-xl border border-line bg-ink-2 p-1" role="tablist">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => select(t.id)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                tab === t.id ? "bg-ink-3 text-paper" : "text-fog hover:text-paper"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <WalletButton />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div>
          {tab === "swap" && <SwapCard />}
          {tab === "receive" && <StealthCard />}
          {tab === "pay" && <PayCard />}
          {tab === "vault" && <VaultCard />}
        </div>
        <aside className="card p-5 h-fit text-sm">
          <h3 className="font-semibold">What is hidden, what is not</h3>
          <ul className="mt-3 space-y-2 text-fog">
            <li>Hidden: the link between your identity and a receiving address.</li>
            <li>Hidden: your order from public order books and mempools as a visible swap.</li>
            <li>Not hidden: on-chain settlement itself. The chain is public by nature.</li>
            <li>Not hidden: the venue filling an order sees the deposit and the receiving address.</li>
          </ul>
          <p className="mt-4 text-xs text-fog/70">No account. No email. No KYC. Keys stay on your device.</p>
        </aside>
      </div>
    </div>
  );
}
