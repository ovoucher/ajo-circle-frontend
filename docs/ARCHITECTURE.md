# Frontend architecture

```
src/
  lib/        config (API_URL, RuntimeConfig type), tx (transaction flow), validation, format
  services/   api (backend client), wallet (Freighter adapter behind a Wallet interface)
  context/    RuntimeConfig provider: values fetched from GET /api/config at startup
  hooks/      useWallet, useTx
  components/ Header, TxStatus
  pages/      Landing, Circles, Create, CircleDetail (hash routing)
  tests/      vitest + Testing Library
```

## Startup
`App` loads `/api/config` once. Until it succeeds nothing else renders (loading, then an error + Retry). The result goes into `RuntimeConfigProvider`, so pages never read contract ids or passphrases from build-time constants. The only build-time setting is `VITE_API_URL`.

## Transaction flow (`lib/tx.ts: runContractCall`)
`idle -> preparing -> awaiting-signature -> submitted -> confirmed | failed`
1. Load the account from RPC and build the contract call.
2. `prepareTransaction` simulates it; contract rejections surface here, before any signature, as friendly errors.
3. Show the preview, ask Freighter to sign (passphrase from the backend config; Freighter's network is checked on connect).
4. `sendTransaction`, then poll `getTransaction` until `SUCCESS` or `FAILED` (or time out). `confirmed` is emitted only on `SUCCESS`.
5. Fire-and-forget `POST /api/transactions/verify` so the backend indexes it; a backend failure does not change the already-final result. The page then reloads state from the backend, which reads the contract.

All dependencies (RPC server, signer, verify hook, sleep) are injected, which is how the tests cover every state without a network.

## Trade-offs
- The backend is a startup dependency (for config). In return the app needs one setting and cannot drift out of sync with the backend's contract id.
- State shown on screen comes from the backend's contract reads; transactions go straight from the browser to RPC, not through the backend.
