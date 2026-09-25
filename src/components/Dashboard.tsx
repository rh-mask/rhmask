"use client";

import { useSyncExternalStore } from "react";
import { WalletButton } from "@/components/WalletButton";
import { SwapCard } from "@/components/SwapCard";
import { StealthCard } from "@/components/StealthCard";
import { VaultCard } from "@/components/VaultCard";
import { PayCard } from "@/components/PayCard";
import { GhostIcon, QrIcon, SwapIcon, VaultIcon } from "@/components/Icons";
import { ROBINHOOD_CHAIN_ID } from "@/lib/chain";

const tabs = [
  { id: "swap", label: "Mask Swap", icon: SwapIcon, anim: "loop-flip" },
  { id: "receive", label: "Ghost Receive", icon: GhostIcon, anim: "loop-float" },
  { id: "pay", label: "Private Pay", icon: QrIcon, anim: "loop-pulse" },
  { id: "vault", label: "Blue Chip Vault", icon: VaultIcon, anim: "loop-spin" },
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
      <p className="text-sm text-fog">
        <span className="text-mask">guest@rhmask</span>:<span className="text-aqua">~/app</span>$ rhmask {tab}
        <span className="cursor" aria-hidden="true" />
      </p>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap border border-line-2" role="tablist">
          {tabs.map((t, i) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => select(t.id)}
              className={`flex items-center gap-2 border-r border-line-2 px-3.5 py-2 text-sm font-bold last:border-r-0 transition-colors ${
                tab === t.id ? "bg-mask text-black" : "text-fog hover:bg-ink-3 hover:text-paper"
              }`}
            >
              {/* Only the active tab's icon loops, so the row stays calm. */}
              <span className={tab === t.id ? t.anim : undefined}>
                <t.icon className="h-4 w-4" />
              </span>
              <span className="opacity-60">{i + 1}:</span> {t.label}
            </button>
          ))}
        </div>
        <WalletButton />
      </div>
      <p className="spinner mt-3 text-xs text-fog"> robinhood chain · {ROBINHOOD_CHAIN_ID} · keys stay in this tab</p>

      {/* The hidden/not-hidden disclosure used to sit beside this as a sidebar.
          It lives on the landing page and in the docs instead: repeating it on
          every tab of the app made the working surface narrower for nothing. */}
      <div className="mt-8">
        {tab === "swap" && <SwapCard />}
        {tab === "receive" && <StealthCard />}
        {tab === "pay" && <PayCard />}
        {tab === "vault" && <VaultCard />}
      </div>
    </div>
  );
}
