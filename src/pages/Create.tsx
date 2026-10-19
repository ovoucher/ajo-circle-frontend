import { useState } from "react";
import { validateCreate, fromStroops, type CreateInput } from "../lib/validation";
import { addr, addrVec, i128, u64 } from "../lib/tx";
import { useRuntimeConfig } from "../context/RuntimeConfig";
import { useTx } from "../hooks/useTx";
import { TxStatus } from "../components/TxStatus";

interface Props { address: string | null; sign: (xdr: string, a: string) => Promise<string> }

export function Create({ address, sign }: Props) {
  const config = useRuntimeConfig();
  const [form, setForm] = useState<CreateInput>({ members: address ?? "", amount: "10", periodHours: "168", graceHours: "24" });
  const [submitted, setSubmitted] = useState(false);
  const tx = useTx(address, sign);
  const result = validateCreate(form);
  const errors = submitted && !result.ok ? result.errors : {};
  const set = (k: keyof CreateInput) => (e: { target: { value: string } }) => setForm({ ...form, [k]: e.target.value });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (!result.ok || !address) return;
    const v = result.value;
    const n = v.members.length;
    void tx.run({
      method: "create_circle",
      args: [addr(address), addr(config.tokenContractId), addrVec(v.members), i128(v.contribution), u64(v.periodSeconds), u64(v.graceSeconds)],
      preview: `Create a ${n}-member circle: ${fromStroops(v.contribution)} ${config.tokenSymbol} per round. Each member will later lock ${fromStroops(v.contribution * BigInt(n - 1))} ${config.tokenSymbol} as a deposit.`,
    });
  };

  return (
    <main>
      <h1>Create a circle</h1>
      {!address && <p role="note">Connect your wallet to create a circle.</p>}
      <form onSubmit={submit} noValidate>
        <label>Members, in payout order (one Stellar address per line)
          <textarea rows={5} value={form.members} onChange={set("members")} aria-invalid={!!errors.members} aria-describedby="e-members" />
        </label>
        <p id="e-members" className="error" role={errors.members ? "alert" : undefined}>{errors.members}</p>
        <label>Contribution per round ({config.tokenSymbol})
          <input inputMode="decimal" value={form.amount} onChange={set("amount")} aria-invalid={!!errors.amount} />
        </label>
        <p className="error" role={errors.amount ? "alert" : undefined}>{errors.amount}</p>
        <label>Round length (hours)
          <input inputMode="decimal" value={form.periodHours} onChange={set("periodHours")} aria-invalid={!!errors.periodHours} />
        </label>
        <p className="error" role={errors.periodHours ? "alert" : undefined}>{errors.periodHours}</p>
        <label>Grace period before defaults are slashed (hours)
          <input inputMode="decimal" value={form.graceHours} onChange={set("graceHours")} aria-invalid={!!errors.graceHours} />
        </label>
        <p className="error" role={errors.graceHours ? "alert" : undefined}>{errors.graceHours}</p>
        <button className="primary" type="submit" disabled={!address || tx.busy}>Create circle</button>
      </form>
      <TxStatus state={tx.state} onDismiss={tx.reset} />
      {tx.state.phase === "confirmed" && <p><a href="#/circles">See it in the circle list</a></p>}
    </main>
  );
}
