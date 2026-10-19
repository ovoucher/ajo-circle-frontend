/** The only build-time setting: where the Ajo Circle API lives. Everything else comes from GET /api/config. */
export const API_URL: string = import.meta.env.VITE_API_URL ?? "http://localhost:8787";

/** Chain settings served by the backend at startup. */
export interface RuntimeConfig {
  network: "testnet";
  rpcUrl: string;
  networkPassphrase: string;
  contractId: string;
  tokenContractId: string;
  tokenSymbol: string;
}

export const explorerTx = (hash: string) => `https://stellar.expert/explorer/testnet/tx/${hash}`;
export const explorerContract = (id: string) => `https://stellar.expert/explorer/testnet/contract/${id}`;
