import { shortAddress } from "../lib/format";

interface Props { address: string | null; connecting: boolean; error: string | null; onConnect: () => void; onDisconnect: () => void }

export function Header({ address, connecting, error, onConnect, onDisconnect }: Props) {
  return (
    <header className="header">
      <a href="#/" className="brand">Ajo Circle</a>
      <nav aria-label="Main">
        <a href="#/circles">Circles</a>
        <a href="#/create">Create</a>
      </nav>
      <span className="badge" title="This app only talks to Stellar Testnet">Testnet</span>
      {address ? (
        <span className="wallet">
          <code title={address}>{shortAddress(address)}</code>
          <button onClick={onDisconnect}>Disconnect</button>
        </span>
      ) : (
        <button className="primary" onClick={onConnect} disabled={connecting}>{connecting ? "Connecting…" : "Connect Freighter"}</button>
      )}
      {error && <p role="alert" className="error wallet-error">{error}</p>}
    </header>
  );
}
