import { explorerTx } from "../lib/config";
import type { TxState } from "../lib/tx";

export function TxStatus({ state, onDismiss }: { state: TxState; onDismiss: () => void }) {
  if (state.phase === "idle") return null;
  const link = "hash" in state && state.hash ? (
    <a href={explorerTx(state.hash)} target="_blank" rel="noreferrer">View on Stellar Expert</a>
  ) : null;
  return (
    <div role="status" aria-live="polite" className={`tx tx-${state.phase}`}>
      {state.phase === "preparing" && <p>Preparing transaction and simulating on Testnet…</p>}
      {state.phase === "awaiting-signature" && (
        <>
          <p><strong>Confirm in your wallet:</strong> {state.preview}</p>
        </>
      )}
      {state.phase === "submitted" && <p>Submitted. Waiting for the network to confirm… {link}</p>}
      {state.phase === "confirmed" && <p>✅ Confirmed on-chain. {link}</p>}
      {state.phase === "failed" && <p role="alert">❌ {state.message} {link}</p>}
      {(state.phase === "confirmed" || state.phase === "failed") && <button onClick={onDismiss}>Dismiss</button>}
    </div>
  );
}
