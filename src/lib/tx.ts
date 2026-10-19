import { Contract, TransactionBuilder, nativeToScVal, rpc, xdr, Address } from "@stellar/stellar-sdk";
import type { RuntimeConfig } from "./config";

export type TxState =
  | { phase: "idle" }
  | { phase: "preparing" }
  | { phase: "awaiting-signature"; preview: string }
  | { phase: "submitted"; hash: string }
  | { phase: "confirmed"; hash: string }
  | { phase: "failed"; message: string; hash?: string };

export interface TxDeps {
  server: Pick<rpc.Server, "getAccount" | "prepareTransaction" | "sendTransaction" | "getTransaction">;
  sign: (xdr: string, address: string) => Promise<string>;
  onVerified?: (hash: string) => void | Promise<void>;
  sleep?: (ms: number) => Promise<void>;
}

export interface Call {
  method: string;
  args: xdr.ScVal[];
  /** Human-readable description shown to the user before they are asked to sign. */
  preview: string;
}

export const u32 = (n: number) => nativeToScVal(n, { type: "u32" });
export const i128 = (n: bigint) => nativeToScVal(n, { type: "i128" });
export const u64 = (n: number) => nativeToScVal(n, { type: "u64" });
export const addr = (a: string) => new Address(a).toScVal();
export const addrVec = (a: string[]) => xdr.ScVal.scvVec(a.map(addr));


/**
 * Build -> simulate/assemble -> ask wallet to sign -> submit -> poll until the network reports
 * a final status. "confirmed" is only emitted after RPC reports SUCCESS for the transaction.
 */
export async function runContractCall(
  source: string,
  call: Call,
  set: (s: TxState) => void,
  deps: Partial<TxDeps> & Pick<TxDeps, "sign">,
  cfg: Pick<RuntimeConfig, "contractId" | "networkPassphrase" | "rpcUrl">,
): Promise<boolean> {
  const server = deps.server ?? new rpc.Server(cfg.rpcUrl);
  const sleep = deps.sleep ?? ((ms) => new Promise((r) => setTimeout(r, ms)));
  let hash: string | undefined;
  try {
    set({ phase: "preparing" });
    const account = await server.getAccount(source);
    const built = new TransactionBuilder(account, { fee: "100000", networkPassphrase: cfg.networkPassphrase })
      .addOperation(new Contract(cfg.contractId).call(call.method, ...call.args))
      .setTimeout(120)
      .build();
    // Simulation fails here (before any signature) if the contract would reject the call.
    const prepared = await server.prepareTransaction(built);
    set({ phase: "awaiting-signature", preview: call.preview });
    const signedXdr = await deps.sign(prepared.toXDR(), source);
    const signed = TransactionBuilder.fromXDR(signedXdr, cfg.networkPassphrase);
    const sent = await server.sendTransaction(signed);
    if (sent.status === "ERROR") throw new Error("The network rejected the transaction.");
    hash = sent.hash;
    set({ phase: "submitted", hash });
    for (let i = 0; i < 40; i++) {
      const res = await server.getTransaction(hash);
      if (res.status === rpc.Api.GetTransactionStatus.SUCCESS) {
        set({ phase: "confirmed", hash });
        try { await deps.onVerified?.(hash); } catch { /* indexing is best-effort; chain state is already final */ }
        return true;
      }
      if (res.status === rpc.Api.GetTransactionStatus.FAILED) throw new Error("The transaction was included but failed on-chain.");
      await sleep(1500);
    }
    throw new Error("Timed out waiting for confirmation. Check the explorer before retrying.");
  } catch (e) {
    set({ phase: "failed", message: friendlyError(e), hash });
    return false;
  }
}

const CONTRACT_ERRORS: Record<string, string> = {
  "3": "Invalid amount.", "6": "This address is not a member of the circle.", "7": "You already joined this circle.",
  "8": "This circle has already started or ended.", "9": "This circle is not active.", "11": "This round has not opened yet.",
  "12": "You already paid this round.", "13": "The recipient does not pay in their own round.",
  "14": "This round cannot be settled yet: someone has not paid and the deadline plus grace has not passed.",
  "15": "Nothing to claim.",
};

export function friendlyError(e: unknown): string {
  const msg = e instanceof Error ? e.message : String(e);
  const code = /Error\(Contract, #(\d+)\)/.exec(msg)?.[1];
  if (code && CONTRACT_ERRORS[code]) return CONTRACT_ERRORS[code];
  if (/declined|rejected|denied/i.test(msg)) return "You declined the request in your wallet.";
  if (/insufficient|balance|underfunded/i.test(msg)) return "Your balance is too low for this action.";
  return msg;
}
