import { useEffect, useState } from "react";
import { api } from "../services/api";
import type { CircleRecord } from "../types";
import { fromStroops } from "../lib/validation";
import { useRuntimeConfig } from "../context/RuntimeConfig";
import { formatDuration } from "../lib/format";

export function Circles() {
  const config = useRuntimeConfig();
  const [data, setData] = useState<CircleRecord[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    api.circles().then((r) => setData(r.circles)).catch((e: Error) => setError(e.message));
  }, []);

  return (
    <main>
      <h1>Circles</h1>
      {error && <p role="alert" className="error">Could not load circles ({error}). Is the backend running?</p>}
      {!error && data === null && <p>Loading circles from the contract…</p>}
      {data?.length === 0 && <p>No circles yet. <a href="#/create">Create the first one.</a></p>}
      <ul className="cards">
        {data?.map((c) => (
          <li key={c.id}>
            <a href={`#/circles/${c.id}`}>
              <strong>{c.offChain?.name ?? `Circle #${c.id}`}</strong>
              <span className={`pill ${c.onChain.state.toLowerCase()}`}>{c.onChain.state}</span>
              <span>{c.onChain.members.length} members · {fromStroops(c.onChain.contribution)} {config.tokenSymbol} every {formatDuration(c.onChain.period)}</span>
            </a>
          </li>
        ))}
      </ul>
    </main>
  );
}
