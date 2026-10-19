import { useCallback, useState } from "react";
import { runContractCall, type Call, type TxState } from "../lib/tx";
import { api } from "../services/api";
import { useRuntimeConfig } from "../context/RuntimeConfig";

export function useTx(address: string | null, sign: (xdr: string, a: string) => Promise<string>, onDone?: () => void) {
  const cfg = useRuntimeConfig();
  const [state, setState] = useState<TxState>({ phase: "idle" });
  const run = useCallback(
    async (call: Call) => {
      if (!address) return setState({ phase: "failed", message: "Connect your wallet first." });
      const ok = await runContractCall(address, call, setState, { sign, onVerified: api.verifyTx }, cfg);
      if (ok) onDone?.();
    },
    [address, sign, onDone, cfg],
  );
  const reset = useCallback(() => setState({ phase: "idle" }), []);
  return { state, run, reset, busy: ["preparing", "awaiting-signature", "submitted"].includes(state.phase) };
}
