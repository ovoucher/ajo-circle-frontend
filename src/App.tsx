import { useCallback, useEffect, useState } from "react";
import { Header } from "./components/Header";
import { Landing } from "./pages/Landing";
import { Circles } from "./pages/Circles";
import { Create } from "./pages/Create";
import { CircleDetail } from "./pages/CircleDetail";
import { useWallet } from "./hooks/useWallet";
import { freighter, type Wallet } from "./services/wallet";
import { api } from "./services/api";
import { API_URL, type RuntimeConfig } from "./lib/config";
import { RuntimeConfigProvider } from "./context/RuntimeConfig";

interface Props {
  wallet?: Wallet;
  /** Overridable in tests; defaults to GET /api/config on the backend. */
  loadConfig?: () => Promise<RuntimeConfig>;
}

export function App({ wallet = freighter, loadConfig = api.config }: Props) {
  const [cfg, setCfg] = useState<RuntimeConfig | null>(null);
  const [cfgError, setCfgError] = useState<string | null>(null);
  const load = useCallback(() => {
    setCfgError(null);
    loadConfig().then(setCfg).catch((e: Error) => setCfgError(e.message));
  }, [loadConfig]);
  useEffect(load, [load]);

  if (cfgError) {
    return (
      <main>
        <h1>Cannot reach the Ajo Circle API</h1>
        <p role="alert" className="error">Could not load settings from {API_URL} ({cfgError}).</p>
        <p>Start the backend, or set <code>VITE_API_URL</code> to where it runs, then retry.</p>
        <button onClick={load}>Retry</button>
      </main>
    );
  }
  if (!cfg) return <main><p>Connecting to the Ajo Circle API…</p></main>;
  return (
    <RuntimeConfigProvider value={cfg}>
      <Shell wallet={wallet} passphrase={cfg.networkPassphrase} />
    </RuntimeConfigProvider>
  );
}

function Shell({ wallet, passphrase }: { wallet: Wallet; passphrase: string }) {
  const [route, setRoute] = useState(window.location.hash || "#/");
  useEffect(() => {
    const on = () => setRoute(window.location.hash || "#/");
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);
  const w = useWallet(wallet, passphrase);
  const sign = (xdr: string, a: string) => wallet.sign(xdr, a, passphrase);

  const detail = /^#\/circles\/(\d+)$/.exec(route);
  let page;
  if (detail) page = <CircleDetail id={Number(detail[1])} address={w.address} sign={sign} />;
  else if (route === "#/circles") page = <Circles />;
  else if (route === "#/create") page = <Create address={w.address} sign={sign} />;
  else page = <Landing />;

  return (
    <>
      <Header address={w.address} connecting={w.connecting} error={w.error} onConnect={w.connect} onDisconnect={w.disconnect} />
      {page}
      <footer>Testnet only · unaudited</footer>
    </>
  );
}
