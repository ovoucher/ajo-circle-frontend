import { useCallback, useState } from "react";
import type { Wallet } from "../services/wallet";

export function useWallet(wallet: Wallet, networkPassphrase: string) {
  const [address, setAddress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);

  const connect = useCallback(async () => {
    setConnecting(true);
    setError(null);
    try {
      setAddress(await wallet.connect(networkPassphrase));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not connect wallet.");
    } finally {
      setConnecting(false);
    }
  }, [wallet, networkPassphrase]);

  const disconnect = useCallback(() => {
    setAddress(null);
    setError(null);
  }, []);

  return { address, error, connecting, connect, disconnect };
}
