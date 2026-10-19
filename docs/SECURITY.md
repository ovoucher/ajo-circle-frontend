# Frontend security

**Unaudited, Testnet only.**

| Concern | Handling |
|---|---|
| Secrets | The app has none. It never sees a seed or secret key; signing happens inside Freighter. `VITE_API_URL` is public by design |
| Wrong network | Connect fails unless Freighter reports the passphrase served by the backend (Testnet); a Testnet badge is always visible |
| Blind signing | The transaction is simulated and described in plain language before the wallet prompt |
| False success | "Confirmed" is shown only after RPC reports `SUCCESS`; timeouts say to check the explorer rather than guess |
| Untrusted backend data | The backend only supplies public ids and read-only state; contract rules are enforced on-chain regardless of what the UI shows. A malicious backend could send a wrong contract id, so users should check the contract link in the circle page and the wallet's transaction details |
| XSS | React escapes output; no `dangerouslySetInnerHTML`; user text (names) is rendered as text |
| Dependencies | lockfile committed, `npm audit --omit=dev` in CI |

## Known limitations
- Backend-served config is trusted for the contract id and token id (see above).
- Tested with a mocked wallet only.
- No CSP or hosting headers are set; add them at the host.
