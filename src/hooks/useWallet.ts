"use client";

import { useCallback, useEffect, useState } from "react";
import { ROBINHOOD_CHAIN_ID, robinhoodChain } from "@/lib/chain";

type Eip1193 = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on?: (event: string, cb: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, cb: (...args: unknown[]) => void) => void;
};

declare global {
  interface Window {
    ethereum?: Eip1193;
  }
}

const CHAIN_HEX = `0x${ROBINHOOD_CHAIN_ID.toString(16)}`;

/** Minimal injected-wallet hook. No SDK, no telemetry, no account linkage. */
export function useWallet() {
  const [address, setAddress] = useState<`0x${string}` | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const provider = typeof window !== "undefined" ? window.ethereum : undefined;

  useEffect(() => {
    if (!provider?.on) return;
    const onAccounts = (...args: unknown[]) => {
      const accounts = args[0] as string[];
      setAddress((accounts[0] as `0x${string}`) ?? null);
    };
    const onChain = (...args: unknown[]) => setChainId(Number.parseInt(String(args[0]), 16));
    provider.on("accountsChanged", onAccounts);
    provider.on("chainChanged", onChain);
    return () => {
      provider.removeListener?.("accountsChanged", onAccounts);
      provider.removeListener?.("chainChanged", onChain);
    };
  }, [provider]);

  const connect = useCallback(async () => {
    setError(null);
    if (!provider) {
      setError("No injected wallet found. Install a browser wallet first.");
      return;
    }
    setBusy(true);
    try {
      const accounts = (await provider.request({ method: "eth_requestAccounts" })) as string[];
      setAddress((accounts[0] as `0x${string}`) ?? null);
      const hex = (await provider.request({ method: "eth_chainId" })) as string;
      setChainId(Number.parseInt(hex, 16));
    } catch (err) {
      setError(err instanceof Error ? err.message : "connection rejected");
    } finally {
      setBusy(false);
    }
  }, [provider]);

  const switchChain = useCallback(async () => {
    if (!provider) return;
    setError(null);
    try {
      await provider.request({ method: "wallet_switchEthereumChain", params: [{ chainId: CHAIN_HEX }] });
    } catch (err) {
      const code = (err as { code?: number })?.code;
      if (code === 4902) {
        await provider.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: CHAIN_HEX,
              chainName: robinhoodChain.name,
              nativeCurrency: robinhoodChain.nativeCurrency,
              rpcUrls: [robinhoodChain.rpcUrls.default.http[0]],
              blockExplorerUrls: [robinhoodChain.blockExplorers.default.url],
            },
          ],
        });
      } else {
        setError(err instanceof Error ? err.message : "switch rejected");
      }
    }
  }, [provider]);

  const disconnect = useCallback(() => {
    setAddress(null);
    setChainId(null);
  }, []);

  return {
    address,
    chainId,
    onRobinhoodChain: chainId === ROBINHOOD_CHAIN_ID,
    hasProvider: Boolean(provider),
    busy,
    error,
    connect,
    switchChain,
    disconnect,
  };
}
