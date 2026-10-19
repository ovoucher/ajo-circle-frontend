# Ajo Circle: web app

React + Vite + TypeScript front end for **Ajo Circle**, collateral-backed rotating savings circles (ajo, susu, chama) on Stellar. Connects to the Freighter wallet. **Testnet only. Unaudited.**

This repo is self-contained. It depends on two services only through their public interfaces:

| Dependency | How | What for |
|---|---|---|
| Ajo Circle API | HTTP, `VITE_API_URL` | `GET /api/config` (contract id, token id, RPC URL, passphrase), circle list/detail/history, `POST /api/transactions/verify` after a confirmed tx |
| Ajo Circle contract (Soroban) | Stellar RPC + the user's wallet | create / join / pay / settle / claim, built and simulated in the browser, signed in Freighter |

## Features

Landing page and onboarding, circle list and detail (on-chain state clearly separated from history), create form with human-readable validation, Freighter connect/disconnect with a visible Testnet badge, and a transaction flow that **simulates before asking for a signature, shows what will happen, and reports "Confirmed" only after the network does**. Loading, empty, error and success states; responsive and keyboard accessible.

## Run

Prereqs: Node >= 22, the [Freighter](https://www.freighter.app/) extension set to **Testnet** with a funded account (free test XLM: https://lab.stellar.org/account/create), and a running Ajo Circle API.

```bash
npm ci
cp .env.example .env.local     # VITE_API_URL=http://localhost:8787
npm run dev                    # http://localhost:5173
```
If the API is unreachable the app shows an error with a Retry button instead of a broken page.

## Develop and test

```bash
npm run lint && npm test && npm run build
```
Last run: 25 tests passed (validation, transaction state machine, wallet connect/disconnect, config load/error, status rendering), tsc and eslint clean, production build succeeds, `npm audit --omit=dev`: 0 vulnerabilities. Coverage not measured.

**Not tested automatically:** a real Freighter session. Wallet and RPC are mocked in tests, so try the full flow by hand on Testnet.

## Contract interface it relies on (ABI v0.1)

Method names and argument order for `create_circle, join, cancel, contribute, settle_round, claim`, and contract error codes 3, 6-9, 11-15, which `src/lib/tx.ts` (`friendlyError`) maps to readable messages. If the contract's ABI changes, update those two places.

## Docs

[Architecture](docs/ARCHITECTURE.md) · [Security](docs/SECURITY.md)

## Contributing / License

Small, tested PRs welcome. MIT, see [LICENSE](LICENSE).
