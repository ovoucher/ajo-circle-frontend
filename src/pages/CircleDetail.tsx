import { useCallback, useEffect, useState } from "react";
import { api } from "../services/api";
import type { CircleEvent, CircleRecord } from "../types";
import { addr, u32 } from "../lib/tx";
import { fromStroops } from "../lib/validation";
import { explorerContract, explorerTx } from "../lib/config";
import { useRuntimeConfig } from "../context/RuntimeConfig";
import { formatDuration, formatTime, shortAddress } from "../lib/format";
import { useTx } from "../hooks/useTx";
import { TxStatus } from "../components/TxStatus";

interface Props { id: number; address: string | null; sign: (xdr: string, a: string) => Promise<string> }

export function CircleDetail({ id, address, sign }: Props) {
  const config = useRuntimeConfig();
  const [circle, setCircle] = useState<CircleRecord | null>(null);
  const [events, setEvents] = useState<CircleEvent[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    api.circle(id).then(setCircle).catch((e: Error) => setError(e.message));
    api.events(id).then((r) => setEvents(r.events)).catch(() => setEvents([]));
  }, [id]);
  useEffect(load, [load]);

  const tx = useTx(address, sign, () => setTimeout(load, 1500));
  const idArg = u32(id);

  if (error) return <main><p role="alert" className="error">Could not load circle #{id}: {error}</p></main>;
  if (!circle) return <main><p>Loading circle from the contract…</p></main>;

  const c = circle.onChain;
  const isMember = !!address && c.members.includes(address);
  const recipient = c.state === "Active" ? c.members[c.round] : undefined;
  const payer = isMember && c.state === "Active" && address !== recipient;
  const deadline = c.startTime + (c.round + 1) * c.period;
  const call = (method: string, preview: string, extra: boolean) => () =>
    tx.run({ method, args: extra ? [idArg, addr(address!)] : [idArg], preview });
  const amount = `${fromStroops(c.contribution)} ${config.tokenSymbol}`;

  return (
    <main>
      <h1>{circle.offChain?.name ?? `Circle #${id}`} <span className={`pill ${c.state.toLowerCase()}`}>{c.state}</span></h1>
      {circle.offChain?.description && <p>{circle.offChain.description}</p>}
      <section aria-label="On-chain facts">
        <h2>On-chain state</h2>
        <dl>
          <dt>Contribution</dt><dd>{amount} per round (recipient does not pay)</dd>
          <dt>Round length</dt><dd>{formatDuration(c.period)}, grace {formatDuration(c.grace)}</dd>
          <dt>Deposit per member</dt><dd>{fromStroops(BigInt(c.contribution) * BigInt(c.members.length - 1))} {config.tokenSymbol}</dd>
          <dt>Joined</dt><dd>{c.joined} / {c.members.length}</dd>
          {c.state === "Active" && (<>
            <dt>Current round</dt><dd>{c.round + 1} of {c.members.length}: {c.paid} of {c.members.length - 1} paid</dd>
            <dt>Deadline</dt><dd>{formatTime(deadline)} (+ {formatDuration(c.grace)} grace)</dd>
            <dt>Recipient</dt><dd><code>{recipient}</code></dd>
          </>)}
          <dt>Contract</dt><dd><a href={explorerContract(config.contractId)} target="_blank" rel="noreferrer">{shortAddress(config.contractId)}</a></dd>
        </dl>
        <h3>Members (payout order)</h3>
        <ol>{c.members.map((m) => <li key={m}><code>{m}</code>{m === address ? " (you)" : ""}</li>)}</ol>
      </section>

      <section aria-label="Actions">
        <h2>Actions</h2>
        {!address && <p role="note">Connect your wallet to take part.</p>}
        {address && !isMember && <p role="note">This wallet is not a member of this circle.</p>}
        <div className="actions">
          {isMember && c.state === "Forming" && (
            <button className="primary" disabled={tx.busy} onClick={call("join", `Lock a deposit of ${fromStroops(BigInt(c.contribution) * BigInt(c.members.length - 1))} ${config.tokenSymbol} and join circle #${id}.`, true)}>Join and lock deposit</button>
          )}
          {address === c.organizer && c.state === "Forming" && (
            <button disabled={tx.busy} onClick={call("cancel", `Cancel circle #${id}. Members who joined can claim their deposits back.`, false)}>Cancel circle</button>
          )}
          {payer && <button className="primary" disabled={tx.busy} onClick={call("contribute", `Pay ${amount} into round ${c.round + 1} of circle #${id}.`, true)}>Pay this round</button>}
          {c.state === "Active" && (
            <button disabled={tx.busy} onClick={call("settle_round", `Settle round ${c.round + 1}. Unpaid members lose ${amount} of their deposit.`, false)}>Settle round</button>
          )}
          {isMember && c.state !== "Forming" && (
            <button disabled={tx.busy} onClick={call("claim", `Withdraw everything credited to you in circle #${id}.`, true)}>Claim funds</button>
          )}
        </div>
        <TxStatus state={tx.state} onDismiss={tx.reset} />
      </section>

      <section aria-label="History">
        <h2>History</h2>
        <p className="muted">Indexed from contract events by the backend.</p>
        {events.length === 0 ? <p>No events indexed yet.</p> : (
          <ul className="events">
            {events.map((e) => (
              <li key={e.id}><code>{e.type}</code> <a href={explorerTx(e.txHash)} target="_blank" rel="noreferrer">tx</a></li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
